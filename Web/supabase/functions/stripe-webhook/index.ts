import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, stripe-signature",
};
const logStep = (step, details) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
    });
  }
  if (req.method !== "POST") {
    return new Response("Method not allowed", {
      status: 405,
    });
  }
  try {
    logStep("Webhook received");
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (!stripeKey || !webhookSecret) {
      throw new Error("Missing Stripe configuration");
    }
    const stripe = new Stripe(stripeKey, {
      apiVersion: "2023-10-16",
    });
    // Use the service role key to perform writes in Supabase
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          persistSession: false,
        },
      }
    );
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      throw new Error("Missing stripe signature");
    }
    // Verify webhook signature using async method
    let event;
    try {
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        webhookSecret
      );
      logStep("Webhook signature verified", {
        type: event.type,
      });
    } catch (err) {
      logStep("Webhook signature verification failed", {
        error: err.message,
      });
      return new Response("Webhook signature verification failed", {
        status: 400,
      });
    }
    // Handle the event
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        const userId = subscription.metadata.userId;
        console.log("userId", userId);
        await handleSubscriptionChange(
          supabaseClient,
          stripe,
          subscription,
          event.type
        );
        break;
      }
      case "invoice.payment_succeeded": {
        const invoice = event.data.object;
        if (invoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(
            invoice.subscription
          );
          const userId = invoice.metadata.userId;
          console.log("userId", userId);
          await handleSubscriptionChange(
            supabaseClient,
            stripe,
            subscription,
            "payment_succeeded"
          );
        }
        break;
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object;
        if (invoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(
            invoice.subscription
          );
          await handleSubscriptionChange(
            supabaseClient,
            stripe,
            subscription,
            "payment_failed"
          );
        }
        break;
      }
      default:
        logStep("Unhandled event type", {
          type: event.type,
        });
    }
    return new Response(
      JSON.stringify({
        received: true,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in stripe-webhook", {
      message: errorMessage,
    });
    return new Response(
      JSON.stringify({
        error: errorMessage,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
        status: 500,
      }
    );
  }
});
async function handleSubscriptionChange(
  supabaseClient,
  stripe,
  subscription,
  eventType
) {
  try {
    logStep("Processing subscription change", {
      subscriptionId: subscription.id,
      customerId: subscription.customer,
      status: subscription.status,
      eventType,
    });
    // Get customer email from Stripe
    const customer = await stripe.customers.retrieve(subscription.customer);
    if (!customer || customer.deleted) {
      throw new Error("Customer not found or deleted");
    }
    const customerEmail = customer.email;
    if (!customerEmail) {
      throw new Error("Customer email not found");
    }
    logStep("Found customer", {
      email: customerEmail,
    });
    // Find existing subscriber record first
    const { data: existingSubscriber, error: fetchError } = await supabaseClient
      .from("subscribers")
      .select("user_id")
      .eq("email", customerEmail)
      .maybeSingle();
    if (fetchError) {
      logStep("Error fetching subscriber", {
        error: fetchError,
      });
      throw new Error(`Failed to fetch subscriber: ${fetchError.message}`);
    }
    let userId = existingSubscriber?.user_id;
    // If no existing subscriber found, we need to create one
    if (!existingSubscriber) {
      logStep("No existing subscriber found, will create new one", {
        email: customerEmail,
      });
      // We'll let the upsert operation handle the creation below
    } else {
      logStep("Found existing subscriber", {
        userId,
        email: customerEmail,
      });
    }
    // Get user_Id from user_profiles
    const { data: existingUser } = await supabaseClient
      .from("user_profiles")
      .select("clerk_user_id")
      .eq("email", customerEmail)
      .maybeSingle();
    let userID = existingUser?.clerk_user_id;
    console.log(userID);
    // Determine subscription details based on event type and subscription status
    let subscriptionTier = "Free";
    let monthlyLimit = 5;
    let subscriptionStatus = "free";
    let subscriptionEnd = null;
    // Handle different event types
    switch (eventType) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "payment_succeeded":
        if (subscription.status === "active") {
          // Get the price to determine tier
          const priceId = subscription.items.data[0].price.id;
          const price = await stripe.prices.retrieve(priceId);
          const amount = price.unit_amount || 0;
          if (amount === 1000) {
            subscriptionTier = "Pro";
            monthlyLimit = 25;
          } else if (amount === 5000) {
            subscriptionTier = "Pro Plus";
            monthlyLimit = 500;
          }
          subscriptionStatus = "active";
          subscriptionEnd = new Date(
            subscription.current_period_end * 1000
          ).toISOString();
        } else if (subscription.status === "past_due") {
          subscriptionStatus = "past_due";
          // Keep existing tier for past_due status
          if (existingSubscriber) {
            const { data: existingSubscription } = await supabaseClient
              .from("user_subscription")
              .select("subscription_tier, monthly_limit")
              .eq("user_id", userId)
              .maybeSingle();
            if (existingSubscription?.data) {
              subscriptionTier = existingSubscription.data.subscription_tier;
              monthlyLimit = existingSubscription.data.monthly_limit;
            }
          }
        } else if (
          subscription.status === "canceled" ||
          subscription.status === "incomplete_expired"
        ) {
          subscriptionStatus = "cancelled";
        }
        break;
      case "customer.subscription.deleted":
        subscriptionStatus = "cancelled";
        subscriptionTier = "Free";
        monthlyLimit = 5;
        subscriptionEnd = null;
        break;
      case "payment_failed":
        subscriptionStatus = "past_due";
        // Keep existing tier and limits for failed payments
        if (existingSubscriber) {
          const { data: existingFailedSubscription } = await supabaseClient
            .from("user_subscription")
            .select("subscription_tier, monthly_limit")
            .eq("user_id", userId)
            .maybeSingle();
          if (existingFailedSubscription?.data) {
            subscriptionTier =
              existingFailedSubscription.data.subscription_tier;
            monthlyLimit = existingFailedSubscription.data.monthly_limit;
          }
        }
        break;
      default:
        logStep("Unhandled event type in subscription processing", {
          eventType,
        });
        return;
    }
    logStep("Determined subscription details", {
      subscriptionTier,
      monthlyLimit,
      subscriptionStatus,
      eventType,
    });
    // First, upsert the subscribers table (this will create or update the record)
    const { data: subscriberData, error: subscriberError } =
      await supabaseClient
        .from("subscribers")
        .upsert(
          {
            email: customerEmail,
            clerk_user_id: userID,
            stripe_customer_id: subscription.customer,
            subscribed: subscriptionStatus === "active",
            subscription_tier: subscriptionTier,
            subscription_end: subscriptionEnd,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: "email",
            ignoreDuplicates: false,
          }
        )
        .select()
        .single();
    if (subscriberError) {
      logStep("Error upserting subscriber", {
        error: subscriberError,
      });
      throw new Error(
        `Failed to upsert subscriber: ${subscriberError.message}`
      );
    }
    // Get the user_id from the subscriber record (in case it was just created)
    userId = subscriberData.user_id;
    logStep("Successfully upserted subscriber", {
      userId,
      email: customerEmail,
    });
    // Update user_subscription table - use email for lookup and updates
    const { data: existingSubscription } = await supabaseClient
      .from("user_subscription")
      .select("current_usage, user_id")
      .eq("email", customerEmail)
      .maybeSingle();
    const { error: upsertError } = await supabaseClient
      .from("user_subscription")
      .upsert(
        {
          clerk_user_id: userID,
          email: customerEmail,
          subscription_tier: subscriptionTier,
          subscription_status: subscriptionStatus,
          stripe_subscription_id: subscription.id,
          monthly_limit: monthlyLimit,
          current_usage: existingSubscription?.current_usage || 0,
          subscription_end: subscriptionEnd,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "email",
        }
      );
    if (upsertError) {
      logStep("Error upserting user subscription", {
        error: upsertError,
      });
      throw new Error(
        `Failed to update user_subscription: ${upsertError.message}`
      );
    }
    logStep("Successfully updated user_subscription", {
      email: customerEmail,
      subscriptionTier,
    });
    logStep("Successfully processed subscription change", {
      userId,
      subscriptionTier,
      eventType,
    });
  } catch (error) {
    logStep("Error handling subscription change", {
      error: error.message,
    });
    throw error;
  }
}
