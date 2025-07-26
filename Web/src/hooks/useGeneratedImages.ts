
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUser } from '@clerk/clerk-react';

export interface GeneratedImage {
  id: string;
  user_id: string;
  prompt: string;
  image_url: string;
  image_type: 'generated' | 'edited';
  original_filename: string | null;
  created_at: string;
}

export const useGeneratedImages = () => {
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useUser();

  const fetchImages = async () => {
    if (!user) {
      setImages([]);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('generated_images')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching images:', error);
        return;
      }

      // Type cast the data to ensure image_type is properly typed
      const typedImages: GeneratedImage[] = (data || []).map(item => ({
        ...item,
        image_type: item.image_type as 'generated' | 'edited'
      }));

      setImages(typedImages);
    } catch (error) {
      console.error('Error fetching images:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteImage = async (id: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('generated_images')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting image:', error);
        return false;
      }

      setImages(prev => prev.filter(img => img.id !== id));
      return true;
    } catch (error) {
      console.error('Error deleting image:', error);
      return false;
    }
  };

  useEffect(() => {
    fetchImages();
  }, [user]);

  return {
    images,
    isLoading,
    refetch: fetchImages,
    deleteImage
  };
};
