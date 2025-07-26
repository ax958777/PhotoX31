
import { useSubscriptionStore } from "@/store/subscriptionStore";
import { Badge } from "@/components/ui/badge";
import { Crown, Zap } from "lucide-react";

const SubscriptionBadges = () => {
  const { currentPlan, usageCount, getRemainingGenerations } = useSubscriptionStore();
  
  const remaining = getRemainingGenerations();
  const usagePercentage = (usageCount / currentPlan.monthlyLimit) * 100;
  
  return (
    <div className="flex gap-3 mb-6">
      {/* Current Plan Badge */}
      <Badge 
        variant={currentPlan.id === 'free' ? 'secondary' : 'default'}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium"
      >
        {currentPlan.id !== 'free' && <Crown className="w-4 h-4" />}
        Current Plan: {currentPlan.name}
      </Badge>
      
      {/* Usage Badge */}
      <Badge 
        variant={remaining > 0 ? 'outline' : 'destructive'}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium"
      >
        <Zap className="w-4 h-4" />
        {usageCount} / {currentPlan.monthlyLimit} used
        {remaining > 0 && (
          <span className="text-xs opacity-75">
            ({remaining} left)
          </span>
        )}
      </Badge>
      
      {/* Usage Progress Indicator */}
      <div className="flex items-center gap-2">
        <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-300 ${
              usagePercentage >= 100 
                ? 'bg-red-500' 
                : usagePercentage >= 80 
                ? 'bg-yellow-500' 
                : 'bg-green-500'
            }`}
            style={{ width: `${Math.min(usagePercentage, 100)}%` }}
          />
        </div>
        <span className="text-xs text-gray-500">
          {Math.round(usagePercentage)}%
        </span>
      </div>
    </div>
  );
};

export default SubscriptionBadges;
