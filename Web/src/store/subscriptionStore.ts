import { create } from "zustand";
import { persist } from "zustand/middleware";
import { supabase } from "@/integrations/supabase/client";

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  monthlyLimit: number;
  stripePriceId?: string;
}

export interface SubscriptionState {
  currentPlan: SubscriptionPlan;
  usageCount: number;
  subscriptionStatus: "free" | "active" | "cancelled" | "past_due";
  subscriptionEnd?: string;
  isLoading: boolean;

  // Actions
  setCurrentPlan: (plan: SubscriptionPlan) => void;
  incrementUsage: () => void;
  resetUsage: () => void;
  setSubscriptionStatus: (
    status: "free" | "active" | "cancelled" | "past_due"
  ) => void;
  setSubscriptionEnd: (date?: string) => void;
  canGenerateImage: () => boolean;
  getRemainingGenerations: () => number;
  checkSubscription: (clerkToken?: string) => Promise<void>;
  createCheckoutSession: (
    priceId: string,
    planName: string,
    clerkToken: string
  ) => Promise<string>;
  openCustomerPortal: (clerkToken: string) => Promise<string>;
  setLoading: (loading: boolean) => void;
  syncWithDatabase: (userId: string) => Promise<void>;
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: "free",
    name: "Free",
    price: 0,
    monthlyLimit: 5,
  },
  {
    id: "pro",
    name: "Pro",
    price: 10,
    monthlyLimit: 25,
    stripePriceId: "price_1Rdi4uFA8pQOwelxe6JHX3a5",
  },
  {
    id: "pro_plus",
    name: "Pro Plus",
    price: 50,
    monthlyLimit: 500,
    stripePriceId: "price_1Rdi7HFA8pQOwelxB2on1D0R",
  },
];

export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set, get) => ({
      currentPlan: SUBSCRIPTION_PLANS[0], // Start with free plan
      usageCount: 0,
      subscriptionStatus: "free",
      subscriptionEnd: undefined,
      isLoading: false,

      setCurrentPlan: (plan) => set({ currentPlan: plan }),

      incrementUsage: async () => {
        const state = get();
        const newUsage = state.usageCount + 1;
        set({ usageCount: newUsage });

        // Update usage in database
        try {
          const token = localStorage.getItem("clerk-db-jwt");
          if (token) {
            console.log(JSON.parse(atob(token.split(".")[1])).sub);
            await supabase
              .from("user_subscription")
              .update({
                current_usage: newUsage,
                updated_at: new Date().toISOString(),
              })
              .eq("clerk_user_id", JSON.parse(atob(token.split(".")[1])).sub);
          }
          // Get the current user's email from Clerk
          const userEmail = await getCurrentUserEmail();
          if (!userEmail) {
            console.error("No user email found for incrementUsage");
            return;
          }

          console.log("Syncing subscription for email:", userEmail);
          await supabase
            .from("user_subscription")
            .update({
              current_usage: newUsage,
              updated_at: new Date().toISOString(),
            })
            .eq("email", userEmail);
        } catch (error) {
          console.error("Failed to update usage in database:", error);
        }
      },

      resetUsage: () => set({ usageCount: 0 }),

      setSubscriptionStatus: (status) => set({ subscriptionStatus: status }),

      setSubscriptionEnd: (date) => set({ subscriptionEnd: date }),

      setLoading: (loading) => set({ isLoading: loading }),

      canGenerateImage: () => {
        const state = get();
        return state.usageCount < state.currentPlan.monthlyLimit;
      },

      getRemainingGenerations: () => {
        const state = get();
        return Math.max(0, state.currentPlan.monthlyLimit - state.usageCount);
      },

      syncWithDatabase: async (userId: string) => {
        try {
          // Get the current user's email from Clerk
          const userEmail = await getCurrentUserEmail();
          if (!userEmail) {
            console.error("No user email found for syncing subscription");
            return;
          }

          console.log("Syncing subscription for email:", userEmail);

          // Query subscribers table using email
          const { data, error } = await supabase
            //.from('subscribers')
            .from("user_subscription")
            .select("*")
            .eq("email", userEmail)
            .single();

          if (error && error.code !== "PGRST116") {
            console.error(
              "Error fetching subscription from subscribers table:",
              error
            );
            return;
          }

          if (data) {
            console.log("Found subscription data:", data);

            // Map subscription tier to plan
            const plan =
              SUBSCRIPTION_PLANS.find(
                (p) => p.name === data.subscription_tier
              ) || SUBSCRIPTION_PLANS[0];

            // Determine subscription status
            let status: "free" | "active" | "cancelled" | "past_due" = "free";
            if (data.subscription_status === "active") {
              status = "active";
            } else if (
              data.subscription_tier &&
              data.subscription_tier !== "Free"
            ) {
              status = "cancelled";
            }

            set({
              currentPlan: plan,
              subscriptionStatus: status,
              subscriptionEnd: data.subscription_end || undefined,
            });

            // Also sync with user_subscription table to get usage data
            const { data: userSubData } = await supabase
              .from("user_subscription")
              .select("current_usage")
              .eq("clerk_user_id", userId)
              .single();

            if (userSubData) {
              set({ usageCount: userSubData.current_usage });
            }

            console.log("Subscription synced successfully:", {
              plan: plan.name,
              status,
              subscriptionEnd: data.subscription_end,
            });
          } else {
            console.log("No subscription found, setting to free plan");
            set({
              currentPlan: SUBSCRIPTION_PLANS[0], // Free plan
              subscriptionStatus: "free",
              subscriptionEnd: undefined,
            });
          }
        } catch (error) {
          console.error("Error syncing with database:", error);
        }
      },

      checkSubscription: async (clerkToken?: string) => {
        try {
          set({ isLoading: true });

          if (!clerkToken) {
            console.log("No Clerk token provided");
            return;
          }

          const { data, error } = await supabase.functions.invoke(
            "check-subscription",
            {
              headers: {
                Authorization: `Bearer ${clerkToken}`,
              },
            }
          );

          if (error) {
            console.error("Error checking subscription:", error);
            return;
          }

          if (data.subscribed && data.subscription_tier) {
            const plan = SUBSCRIPTION_PLANS.find(
              (p) => p.name === data.subscription_tier
            );
            if (plan) {
              set({
                currentPlan: plan,
                subscriptionStatus: "active",
                subscriptionEnd: data.subscription_end,
              });
              console.log("checkSubscription:", {
                plan: plan.name,
                status,
                subscriptionEnd: data.subscription_end,
              });
            }
          } else {
            set({
              currentPlan: SUBSCRIPTION_PLANS[0], // Free plan
              subscriptionStatus: "free",
              subscriptionEnd: undefined,
            });
          }
        } catch (error) {
          console.error("Error in checkSubscription:", error);
        } finally {
          set({ isLoading: false });
        }
      },

      createCheckoutSession: async (
        priceId: string,
        planName: string,
        clerkToken: string
      ) => {
        const { data, error } = await supabase.functions.invoke(
          "create-checkout",
          {
            body: { priceId, planName },
            headers: {
              Authorization: `Bearer ${clerkToken}`,
            },
          }
        );

        if (error) {
          throw new Error(error.message || "Failed to create checkout session");
        }

        return data.url;
      },

      openCustomerPortal: async (clerkToken: string) => {
        const { data, error } = await supabase.functions.invoke(
          "customer-portal",
          {
            headers: {
              Authorization: `Bearer ${clerkToken}`,
            },
          }
        );

        if (error) {
          throw new Error(error.message || "Failed to open customer portal");
        }

        return data.url;
      },
    }),
    {
      name: "subscription-storage",
    }
  )
);

// Helper function to get current user email from Clerk
async function getCurrentUserEmail(): Promise<string | null> {
  try {
    // Try to get email from window.Clerk
    if (typeof window !== "undefined" && (window as any).Clerk?.user) {
      const user = (window as any).Clerk.user;
      return (
        user.primaryEmailAddress?.emailAddress ||
        user.emailAddresses?.[0]?.emailAddress ||
        null
      );
    }

    // Fallback: try to get from localStorage or other Clerk storage
    if (typeof window !== "undefined") {
      const clerkSession = localStorage.getItem("clerk-db-jwt");
      if (clerkSession) {
        try {
          const decoded = JSON.parse(atob(clerkSession.split(".")[1]));
          return decoded.email || null;
        } catch (e) {
          console.warn("Could not decode Clerk session for email");
        }
      }
    }

    return null;
  } catch (error) {
    console.error("Error getting current user email:", error);
    return null;
  }
}
