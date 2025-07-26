
-- Create a table to store generated images
CREATE TABLE public.generated_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  prompt TEXT NOT NULL,
  image_url TEXT NOT NULL,
  image_type VARCHAR(20) NOT NULL CHECK (image_type IN ('generated', 'edited')),
  original_filename TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security (RLS) to ensure users can only see their own images
ALTER TABLE public.generated_images ENABLE ROW LEVEL SECURITY;

-- Create policies for generated_images table
CREATE POLICY "Users can view their own images" 
  ON public.generated_images 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own images" 
  ON public.generated_images 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own images" 
  ON public.generated_images 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create storage bucket for generated images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('generated-images', 'generated-images', true);

-- Create storage policies for the bucket
CREATE POLICY "Users can upload their own images" 
  ON storage.objects 
  FOR INSERT 
  WITH CHECK (bucket_id = 'generated-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own images" 
  ON storage.objects 
  FOR SELECT 
  USING (bucket_id = 'generated-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own images" 
  ON storage.objects 
  FOR DELETE 
  USING (bucket_id = 'generated-images' AND auth.uid()::text = (storage.foldername(name))[1]);
