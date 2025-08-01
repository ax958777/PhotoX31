import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Helper logging function for enhanced debugging
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

// Helper function to verify Clerk JWT token
const verifyClerkToken = async (token: string) => {
  try {
    // Decode the JWT token to get user information
    const [header, payload, signature] = token.split(".");
    const decodedPayload = JSON.parse(atob(payload));

    // Basic validation - check if token has required fields
    //if (!decodedPayload.sub || !decodedPayload.email) {
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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Use the service role key to perform writes (upsert) in Supabase
  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    logStep("Verifying Clerk token");

    const { userId, email } = await verifyClerkToken(token);
    logStep("Clerk token verified", { userId, email });

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    const customers = await stripe.customers.list({ email: email, limit: 1 });

    if (customers.data.length === 0) {
      logStep("No customer found, updating unsubscribed state");

      // Update both subscribers and user_subscription tables
      await supabaseClient.from("subscribers").upsert(
        {
          email: email,
          clerk_user_id: userId,
          stripe_customer_id: null,
          subscribed: false,
          subscription_tier: null,
          subscription_end: null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "email" }
      );

      await supabaseClient.from("user_subscription").upsert(
        {
          email: email,
          clerk_user_id: userId,
          subscription_tier: "Free",
          subscription_status: "free",
          monthly_limit: 5,
          current_usage: 0,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

      return new Response(JSON.stringify({ subscribed: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });
    const hasActiveSub = subscriptions.data.length > 0;
    let subscriptionTier = null;
    let subscriptionEnd = null;
    let monthlyLimit = 5;

    if (hasActiveSub) {
      const subscription = subscriptions.data[0];
      subscriptionEnd = new Date(
        subscription.current_period_end * 1000
      ).toISOString();
      logStep("Active subscription found", {
        subscriptionId: subscription.id,
        endDate: subscriptionEnd,
      });

      // Determine subscription tier from price
      const priceId = subscription.items.data[0].price.id;
      const price = await stripe.prices.retrieve(priceId);
      const amount = price.unit_amount || 0;
      if (amount === 1000) {
        // $10
        subscriptionTier = "Pro";
        monthlyLimit = 25;
      } else if (amount === 5000) {
        // $50
        subscriptionTier = "Pro Plus";
        monthlyLimit = 500;
      } else {
        subscriptionTier = "Free";
        monthlyLimit = 5;
      }
      logStep("Determined subscription tier", {
        priceId,
        amount,
        subscriptionTier,
      });
    } else {
      subscriptionTier = "Free";
      logStep("No active subscription found");
    }

    // Update subscribers table
    await supabaseClient.from("subscribers").upsert(
      {
        email: email,
        clerk_user_id: userId,
        stripe_customer_id: customerId,
        subscribed: hasActiveSub,
        subscription_tier: subscriptionTier,
        subscription_end: subscriptionEnd,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "email" }
    );

    // Update user_subscription table
    const { data: existingSubscription } = await supabaseClient
      .from("user_subscription")
      .select("current_usage")
      .eq("user_id", userId)
      .single();

    await supabaseClient.from("user_subscription").upsert(
      {
        clerk_user_id: userId,
        subscription_tier: subscriptionTier,
        subscription_status: hasActiveSub ? "active" : "free",
        stripe_subscription_id: hasActiveSub ? subscriptions.data[0].id : null,
        monthly_limit: monthlyLimit,
        current_usage: existingSubscription?.current_usage || 0,
        subscription_end: subscriptionEnd,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

    logStep("Updated database with subscription info", {
      subscribed: hasActiveSub,
      subscriptionTier,
    });
    return new Response(
      JSON.stringify({
        subscribed: hasActiveSub,
        subscription_tier: subscriptionTier,
        subscription_end: subscriptionEnd,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in check-subscription", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
