
-- First drop all existing policies
DROP POLICY IF EXISTS "Users can view their own images" ON public.generated_images;
DROP POLICY IF EXISTS "Users can create their own images" ON public.generated_images;
DROP POLICY IF EXISTS "Users can delete their own images" ON public.generated_images;

-- Now drop the existing user_id column if it exists
ALTER TABLE public.generated_images DROP COLUMN IF EXISTS user_id;

-- Add user_id column as text with Clerk JWT sub claim as default
ALTER TABLE public.generated_images 
ADD COLUMN user_id text NOT NULL DEFAULT (auth.jwt()->>'sub');

-- Enable Row Level Security
ALTER TABLE public.generated_images ENABLE ROW LEVEL SECURITY;

-- Create new policies that work with Clerk user IDs
CREATE POLICY "Users can view their own images" 
  ON public.generated_images 
  FOR SELECT 
  USING ((auth.jwt()->>'sub') = user_id);

CREATE POLICY "Users can create their own images" 
  ON public.generated_images 
  FOR INSERT 
  WITH CHECK ((auth.jwt()->>'sub') = user_id);

CREATE POLICY "Users can delete their own images" 
  ON public.generated_images 
  FOR DELETE 
  USING ((auth.jwt()->>'sub') = user_id);
