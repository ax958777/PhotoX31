-- Add unique constraint to email column in user_subscription table
ALTER TABLE public.user_subscription 
ADD CONSTRAINT user_subscription_email_unique UNIQUE (email);