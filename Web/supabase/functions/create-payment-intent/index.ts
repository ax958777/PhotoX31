import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[CREATE-PAYMENT-INTENT] ${step}${detailsStr}`);
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

    const { priceId, planName,amount } = await req.json();
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

    // Create an ephemeral key for the Customer;this allow the app to display saved payment methods and saved new ones
    //const ephemeralKey = await stripe.ephemeralKey.create(
    //  { customerId:customerId,
    //    apiVersion: "2023-10-16",
    //  }
    //);

    const intent = await stripe.paymentIntents.create({
      customer: customerId,
      amount:amount,
      currency: 'usd',
      // In the latest version of the API, specifying the `automatic_payment_methods` parameter is optional because Stripe enables its functionality by default.
       automatic_payment_methods: {enabled: true},
    });

    const stripePKey = Deno.env.get("STRIPE_SECRET_KEY");

    logStep("Checkout intent created", {
      client_secret: intent.client_secret,
      customer: customerId,
      publishableKey:stripePKey
    });

    return new Response(JSON.stringify({ client_secret: intent.client_secret,
      customer: customerId,
      publishableKey:intent.publishableKey
    }), {
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
