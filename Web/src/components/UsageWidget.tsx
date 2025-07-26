
import { useSubscriptionStore } from "@/store/subscriptionStore";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap } from "lucide-react";

const UsageWidget = () => {
  const { currentPlan, usageCount, getRemainingGenerations } = useSubscriptionStore();
  
  const progressPercentage = (usageCount / currentPlan.monthlyLimit) * 100;
  const remaining = getRemainingGenerations();
  
  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Zap className="w-5 h-5 text-yellow-500" />
          Usage This Month
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600">Current Plan</span>
          <span className="font-semibold text-purple-600">{currentPlan.name}</span>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Images Generated</span>
            <span className="font-medium">
              {usageCount} / {currentPlan.monthlyLimit}
            </span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>
        
        <div className="text-center">
          <p className="text-sm text-gray-600">
            {remaining > 0 ? (
              <>
                <span className="font-semibold text-green-600">{remaining}</span> generations remaining
              </>
            ) : (
              <span className="font-semibold text-red-600">Limit reached this month</span>
            )}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default UsageWidget;
