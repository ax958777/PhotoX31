import { useEffect } from "react";
import { useAuth, useUser } from "@clerk/clerk-react";
import { useSubscriptionStore } from "@/store/subscriptionStore";

export const useSubscription = () => {
  const { getToken, isSignedIn } = useAuth();
  const { user } = useUser();
  const { checkSubscription, syncWithDatabase } = useSubscriptionStore();

  useEffect(() => {
    const initializeSubscription = async () => {
      if (isSignedIn && user?.id && user?.primaryEmailAddress?.emailAddress) {
        try {
          console.log(
            "Initializing subscription for user:",
            user.primaryEmailAddress.emailAddress
          );

          // First sync with our local database using email from subscribers table
          await syncWithDatabase(user.id);

          // Then check with Stripe for updates if needed
          const token = await getToken();
          if (token) {
            await checkSubscription(token);
          }
        } catch (error) {
          console.error("Error initializing subscription:", error);
        }
      }
    };

    initializeSubscription();
  }, [
    isSignedIn,
    user?.id,
    user?.primaryEmailAddress?.emailAddress,
    getToken,
    checkSubscription,
    syncWithDatabase,
  ]);

  return useSubscriptionStore();
};
