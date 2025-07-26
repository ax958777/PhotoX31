import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, svix-id, svix-timestamp, svix-signature",
};

interface ClerkUser {
  id: string;
  email_addresses: Array<{
    email_address: string;
    id: string;
  }>;
  first_name: string | null;
  last_name: string | null;
  image_url: string | null;
  username: string | null;
  created_at: number;
  updated_at: number;
}

interface ClerkWebhookEvent {
  type: string;
  data: ClerkUser;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Clerk webhook received:", req.method);

    // Initialize Supabase client with service role key for admin operations
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    if (req.method !== "POST") {
      return new Response("Method not allowed", {
        status: 405,
        headers: corsHeaders,
      });
    }

    // Parse the webhook payload
    const payload: ClerkWebhookEvent = await req.json();
    console.log("Webhook event type:", payload.type);

    // Handle different webhook events
    switch (payload.type) {
      case "user.created":
        await handleUserCreated(supabaseClient, payload.data);
        break;
      case "user.updated":
        await handleUserUpdated(supabaseClient, payload.data);
        break;
      case "user.deleted":
        await handleUserDeleted(supabaseClient, payload.data.id);
        break;
      default:
        console.log("Unhandled webhook event:", payload.type);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error processing Clerk webhook:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  }
});

async function handleUserCreated(supabase: any, user: ClerkUser) {
  console.log("Creating user profile for:", user.id);

  const primaryEmail = user.email_addresses.find(
    (email) => email.id === user.email_addresses[0]?.id
  );

  const { error } = await supabase.from("user_profiles").insert({
    clerk_user_id: user.id,
    email: primaryEmail?.email_address || null,
    first_name: user.first_name,
    last_name: user.last_name,
    username: user.username,
    avatar_url: user.image_url,
    created_at: new Date(user.created_at).toISOString(),
    updated_at: new Date(user.updated_at).toISOString(),
  });

  if (error) {
    console.error("Error creating user profile:", error);
    throw error;
  }

  // Create free subscription for new user
  const { error: subscriptionError } = await supabase
    .from("user_subscription")
    .insert({
      clerk_user_id: user.id,
      email: primaryEmail?.email_address || null,
      subscription_tier: "Free",
      subscription_status: "free",
      monthly_limit: 5,
      current_usage: 0,
    });

  if (subscriptionError) {
    console.log("Error creating free subscription", {
      error: subscriptionError,
    });
    return new Response(
      `Failed to create free subscription: ${subscriptionError.message}`,
      { status: 500 }
    );
  }

  console.log("Successfully created user and free subscription");

  console.log("User profile created successfully");
}

async function handleUserUpdated(supabase: any, user: ClerkUser) {
  console.log("Updating user profile for:", user.id);

  const primaryEmail = user.email_addresses.find(
    (email) => email.id === user.email_addresses[0]?.id
  );

  const { error } = await supabase
    .from("user_profiles")
    .update({
      email: primaryEmail?.email_address || null,
      first_name: user.first_name,
      last_name: user.last_name,
      username: user.username,
      avatar_url: user.image_url,
      updated_at: new Date(user.updated_at).toISOString(),
    })
    .eq("clerk_user_id", user.id);

  if (error) {
    console.error("Error updating user profile:", error);
    throw error;
  }

  console.log("User profile updated successfully");
}

async function handleUserDeleted(supabase: any, userId: string) {
  console.log("Deleting user profile for:", userId);

  const { error } = await supabase
    .from("user_profiles")
    .delete()
    .eq("clerk_user_id", userId);

  if (error) {
    console.error("Error deleting user profile:", error);
    throw error;
  }

  console.log("User profile deleted successfully");
}
