
-- Create user_subscription table to track subscription changes
CREATE TABLE public.user_subscription (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  subscription_tier TEXT NOT NULL,
  subscription_status TEXT NOT NULL DEFAULT 'active',
  stripe_subscription_id TEXT,
  monthly_limit INTEGER NOT NULL DEFAULT 5,
  current_usage INTEGER NOT NULL DEFAULT 0,
  subscription_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  subscription_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.user_subscription ENABLE ROW LEVEL SECURITY;

-- Create policies for user subscriptions
CREATE POLICY "Users can view their own subscription" 
  ON public.user_subscription 
  FOR SELECT 
  USING ((auth.jwt()->>'sub') = user_id);

CREATE POLICY "Users can update their own subscription" 
  ON public.user_subscription 
  FOR UPDATE 
  USING ((auth.jwt()->>'sub') = user_id);

CREATE POLICY "Users can insert their own subscription" 
  ON public.user_subscription 
  FOR INSERT 
  WITH CHECK ((auth.jwt()->>'sub') = user_id);

-- Create index for faster lookups
CREATE INDEX idx_user_subscription_user_id ON public.user_subscription(user_id);
CREATE INDEX idx_user_subscription_status ON public.user_subscription(subscription_status);

-- Create function to reset monthly usage (can be called by cron job)
CREATE OR REPLACE FUNCTION reset_monthly_usage()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.user_subscription 
  SET current_usage = 0, updated_at = now()
  WHERE subscription_status = 'active';
END;
$$;
