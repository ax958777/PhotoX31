import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { GoogleGenAI, Modality } from "https://esm.sh/@google/genai@1.6.0";
//import { getAuth } from 'npm:clerk/nextjs/server';
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};
// Helper function to verify Clerk JWT token
const verifyClerkToken = async (token) => {
  try {
    // Decode the JWT token to get user information
    const [header, payload, signature] = token.split(".");
    const decodedPayload = JSON.parse(atob(payload));
    console.log(decodedPayload);
    // Basic validation - check if token has required fields
    if (!decodedPayload.sub || !decodedPayload.email) {
      throw new Error("Invalid token: missing required fields");
    }
    return {
      userId: decodedPayload.sub,
      email: decodedPayload.email,
    };
  } catch (error) {
    throw new Error(`Token verification failed: ${error.message}`);
  }
};
Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
    });
  }
  try {
    console.log("Request received:", req.method);
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );
    // Get user authentication using Clerk
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    //logStep("Authorization header found");
    const token = authHeader.replace("Bearer ", "");
    //logStep("Verifying Clerk token");
    const { userId } = await verifyClerkToken(token);
    if (!userId) {
      return new Response(
        JSON.stringify({
          error: "User ID not found in JWT",
        }),
        {
          status: 400,
        }
      );
    }
    console.log("User ID from Clerk:", userId);
    if (!userId) {
      console.log("No authenticated user found");
      return new Response(
        JSON.stringify({
          error: "Authentication required",
        }),
        {
          status: 401,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }
    const { prompt, type, imageData, mimeType } = await req.json();
    if (!prompt?.trim()) {
      return new Response(
        JSON.stringify({
          error: "Prompt is required",
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }
    // Get Gemini API key from environment
    const geminiApiKey = Deno.env.get("VITE_GEMINI_API_KEY");
    if (!geminiApiKey) {
      return new Response(
        JSON.stringify({
          error: "Gemini API key not configured",
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }
    console.log(`Generating ${type} image for user: ${userId}`);
    // Initialize Gemini AI
    const ai = new GoogleGenAI({
      apiKey: geminiApiKey,
    });
    // Generate image synchronously
    const response = await generateImageSync(
      ai,
      prompt,
      type,
      imageData,
      mimeType
    );
    // Find the image part in the response
    const imagePart = response.candidates?.[0]?.content?.parts?.find(
      (part) => part.inlineData
    );
    if (!imagePart?.inlineData) {
      return new Response(
        JSON.stringify({
          error: "No image generated",
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }
    const imageBase64 = imagePart.inlineData.data;
    // Convert base64 to blob for storage
    const imageBuffer = Uint8Array.from(atob(imageBase64), (c) =>
      c.charCodeAt(0)
    );
    // Generate unique filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `${userId}/${timestamp}-${type}.png`;
    // Upload to Supabase Storage synchronously
    const { data: uploadData, error: uploadError } =
      await supabaseClient.storage
        .from("generated-images")
        .upload(filename, imageBuffer, {
          public: true,
          contentType: "image/png",
          upsert: false,
        });
    if (uploadError) {
      console.error("Upload error:", uploadError);
      return new Response(
        JSON.stringify({
          error: "Failed to upload image",
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }
    // Get public URL
    const { data: urlData } = supabaseClient.storage
      .from("generated-images")
      .getPublicUrl(filename);
    const imageUrl = urlData.publicUrl;
    // Save to database synchronously
    const { data: dbData, error: dbError } = await supabaseClient
      .from("generated_images")
      .insert([
        {
          user_id: userId,
          prompt,
          image_url: imageUrl,
          image_type: type,
          original_filename: filename,
        },
      ])
      .select()
      .single();
    if (dbError) {
      console.error("Database error:", dbError);
      return new Response(
        JSON.stringify({
          error: "Failed to save image record",
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }
    console.log(`Successfully generated and stored ${type} image`);
    return new Response(
      JSON.stringify({
        success: true,
        imageUrl,
        imageData: dbData,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error in generate-image function:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
// Synchronous image generation function
async function generateImageSync(ai, prompt, type, imageData, mimeType) {
  if (type === "edited" && imageData && mimeType) {
    // Edit existing image
    return await ai.models.generateContent({
      model: "gemini-2.0-flash-preview-image-generation",
      contents: [
        {
          parts: [
            {
              inlineData: {
                mimeType: mimeType,
                data: imageData,
              },
            },
            {
              text: `Please edit this image: ${prompt}`,
            },
          ],
        },
      ],
      config: {
        responseModalities: [Modality.TEXT, Modality.IMAGE],
      },
    });
  } else {
    // Generate new image
    return await ai.models.generateContent({
      model: "gemini-2.0-flash-preview-image-generation",
      contents: prompt,
      config: {
        responseModalities: [Modality.TEXT, Modality.IMAGE],
      },
    });
  }
}
