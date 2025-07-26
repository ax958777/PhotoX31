-- Add email column to user_subscription table
ALTER TABLE public.user_subscription 
ADD COLUMN email TEXT;

-- Create index for faster email lookups
CREATE INDEX idx_user_subscription_email ON public.user_subscription(email);