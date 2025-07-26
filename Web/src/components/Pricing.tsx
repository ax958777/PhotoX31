import { useState, useEffect } from "react";
import { useUser, useAuth } from '@clerk/clerk-react';
import { Button } from "@/components/ui/button";
import { Check, Crown, Zap, Loader2 } from "lucide-react";
import { useSubscriptionStore, SUBSCRIPTION_PLANS } from "@/store/subscriptionStore";
import { useToast } from "@/hooks/use-toast";

const Pricing = () => {
  const { getToken, isSignedIn } = useAuth();
  const { currentPlan, subscriptionStatus, createCheckoutSession, openCustomerPortal, syncWithDatabase } = useSubscriptionStore();
  const { toast } = useToast();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const { user } = useUser();

  // Sync subscription data when component mounts or user changes
  useEffect(() => {
    const syncSubscriptionData = async () => {
      if (user?.id) {
        try {
          await syncWithDatabase(user.id);
          console.log('Subscription data synced after page load');
        } catch (error) {
          console.error('Failed to sync subscription data:', error);
        }
      }
    };

    syncSubscriptionData();
  }, [user?.id, syncWithDatabase]);

  const handlePlanSelection = async (plan: typeof SUBSCRIPTION_PLANS[0]) => {
    if (!isSignedIn) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to subscribe to a plan.",
        variant: "destructive",
      });
      return;
    }

    if (plan.price === 0) {
      // Handle free plan selection
      toast({
        title: "Free Plan Selected",
        description: "You're already on the free plan with 5 generations per month.",
      });
      return;
    }

    if (!plan.stripePriceId) {
      toast({
        title: "Coming Soon",
        description: "This plan will be available soon!",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoadingPlan(plan.id);
      const token = await getToken();
      if (!token) {
        throw new Error("Failed to get authentication token");
      }

      const checkoutUrl = await createCheckoutSession(plan.stripePriceId, plan.name, token);
      // Open Stripe checkout in a new tab
      //window.open(checkoutUrl, '_blank');
      setTimeout(() => {
        window.open(checkoutUrl, '_top');
      })
    } catch (error) {
      console.error('Checkout error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to start checkout",
        variant: "destructive",
      });
    } finally {
      setLoadingPlan(null);
    }
  };

  const handleManageSubscription = async () => {
    if (!isSignedIn) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to manage your subscription.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoadingPlan('manage');
      const token = await getToken();
      if (!token) {
        throw new Error("Failed to get authentication token");
      }

      const portalUrl = await openCustomerPortal(token);
      window.open(portalUrl, '_blank');
    } catch (error) {
      console.error('Portal error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to open customer portal",
        variant: "destructive",
      });
    } finally {
      setLoadingPlan(null);
    }
  };

  const plans = [
    {
      id: 'free',
      name: "Free",
      price: "$0",
      period: "/month",
      description: "Perfect for trying out our AI technology",
      features: [
        "5 image generations per month",
        "5 image edits per month",
        "Standard quality output",
        "Basic cartoon styles",
        "Email support"
      ],
      cta: "Get Started",
      popular: false,
      icon: Zap,
      monthlyLimit: 5
    },
    {
      id: 'pro',
      name: "Pro",
      price: "$10",
      period: "/month",
      description: "Best for regular creators and professionals",
      features: [
        "25 image generations per month",
        "25 image edits per month",
        "High-quality output",
        "All cartoon styles",
        "Priority support",
        "Commercial license"
      ],
      cta: "Start Subscription",
      popular: true,
      icon: Crown,
      monthlyLimit: 25
    },
    {
      id: 'pro_plus',
      name: "Pro Plus",
      price: "$50",
      period: "/month",
      description: "For power users and large-scale operations",
      features: [
        "500 image generations per month",
        "500 image edits per month",
        "Ultra-high quality output",
        "All cartoon styles",
        "Custom art styles",
        "Dedicated support",
        "Commercial license"
      ],
      cta: "Start Subscription",
      popular: false,
      icon: Crown,
      monthlyLimit: 500
    }
  ];

  return (
    <section className="py-24 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Simple, Transparent
            <span className="block bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Pricing
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Choose the perfect plan for your creative needs. No hidden fees, cancel anytime.
          </p>
        </div>

        {subscriptionStatus === 'active' && (
          <div className="text-center mb-8 space-x-4">
            <Button
              onClick={handleManageSubscription}
              disabled={loadingPlan === 'manage'}
              className="bg-green-600 hover:bg-green-700"
            >
              {loadingPlan === 'manage' ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                'Manage Subscription'
              )}
            </Button>

          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, index) => {
            const isCurrentPlan = currentPlan.id === plan.id;
            const isLoading = loadingPlan === plan.id;

            return (
              <div
                key={index}
                className={`relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border ${plan.popular
                    ? 'border-purple-200 ring-2 ring-purple-500 ring-opacity-50'
                    : isCurrentPlan
                      ? 'border-green-200 ring-2 ring-green-500 ring-opacity-50'
                      : 'border-gray-200'
                  }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-2 rounded-full text-sm font-semibold">
                      Most Popular
                    </div>
                  </div>
                )}

                {isCurrentPlan && (
                  <div className="absolute -top-4 right-4">
                    <div className="bg-green-500 text-white px-4 py-2 rounded-full text-sm font-semibold">
                      Current Plan
                    </div>
                  </div>
                )}

                <div className="p-8">
                  {/* Icon */}
                  <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl mb-6">
                    <plan.icon className="w-8 h-8 text-white" />
                  </div>

                  {/* Plan Name */}
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>

                  {/* Price */}
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                    <span className="text-gray-600">{plan.period}</span>
                  </div>

                  {/* Description */}
                  <p className="text-gray-600 mb-6">{plan.description}</p>

                  {/* CTA Button */}
                  <Button
                    onClick={() => handlePlanSelection(SUBSCRIPTION_PLANS.find(p => p.id === plan.id)!)}
                    disabled={isCurrentPlan || isLoading}
                    className={`w-full py-3 rounded-xl font-semibold mb-8 ${isCurrentPlan
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : plan.popular
                          ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                      }`}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Loading...
                      </>
                    ) : isCurrentPlan ? (
                      'Current Plan'
                    ) : (
                      plan.cta
                    )}
                  </Button>

                  {/* Features */}
                  <ul className="space-y-4">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center">
                        <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Pricing;
