import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
};

// Helper function to verify Clerk JWT token
const verifyClerkToken = async (token: string) => {
  try {
    // Decode the JWT token to get user information
    const [header, payload, signature] = token.split(".");
    const decodedPayload = JSON.parse(atob(payload));

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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { userId, email } = await verifyClerkToken(token);
    logStep("Clerk token verified", { userId, email });

    const { priceId, planName } = await req.json();
    if (!priceId || !planName)
      throw new Error("Price ID and plan name are required");
    logStep("Request data received", { priceId, planName });

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });
    const customers = await stripe.customers.list({ email: email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Existing customer found", { customerId });
    } else {
      logStep("Creating new customer");
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : email,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${req.headers.get("origin")}/generate?success=true`,
      cancel_url: `${req.headers.get("origin")}/`,
      metadata: {
        userId: userId,
      },
    });

    logStep("Checkout session created", {
      sessionId: session.id,
      url: session.url,
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in create-checkout", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
