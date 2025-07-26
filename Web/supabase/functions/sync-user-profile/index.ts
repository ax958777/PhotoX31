import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Helper function to verify Clerk JWT token
const verifyClerkToken = async (token: string) => {
  try {
    const [header, payload, signature] = token.split(".");
    const decodedPayload = JSON.parse(atob(payload));

    if (!decodedPayload.sub || !decodedPayload.email) {
      throw new Error("Invalid token: missing required fields");
    }

    return {
      userId: decodedPayload.sub,
      email: decodedPayload.email,
      firstName: decodedPayload.given_name,
      lastName: decodedPayload.family_name,
      username: decodedPayload.username,
      imageUrl: decodedPayload.picture,
    };
  } catch (error) {
    throw new Error(`Token verification failed: ${error.message}`);
  }
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Manual user profile sync requested");

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get user authentication using Clerk
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header provided");
    }

    const token = authHeader.replace("Bearer ", "");
    const userInfo = await verifyClerkToken(token);

    // Upsert user profile
    const { error } = await supabaseClient.from("user_profiles").upsert(
      {
        clerk_user_id: userInfo.userId,
        email: userInfo.email || null,
        first_name: userInfo.firstName || null,
        last_name: userInfo.lastName || null,
        username: userInfo.username || null,
        avatar_url: userInfo.imageUrl || null,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "clerk_user_id",
      }
    );

    if (error) {
      console.error("Error syncing user profile:", error);
      return new Response(JSON.stringify({ error: "Failed to sync profile" }), {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      });
    }

    console.log("User profile synced successfully");

    return new Response(JSON.stringify({ success: true }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error in sync-user-profile function:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  }
});
