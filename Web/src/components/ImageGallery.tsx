
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Trash2, Eye } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { GeneratedImage } from '@/hooks/useGeneratedImages';

interface ImageGalleryProps {
  images: GeneratedImage[];
  onDelete?: (id: string) => Promise<boolean>;
  compact?: boolean;
}

const ImageGallery = ({ images, onDelete, compact = false }: ImageGalleryProps) => {
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);
  const { toast } = useToast();

  const downloadImage = (imageUrl: string, filename: string) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDelete = async (id: string) => {
    if (!onDelete) return;
    
    const success = await onDelete(id);
    if (success) {
      toast({
        title: "Success",
        description: "Image deleted successfully",
      });
      setSelectedImage(null);
    } else {
      toast({
        title: "Error",
        description: "Failed to delete image",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString));
  };

  if (images.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No images generated yet. Create your first AI image!</p>
      </div>
    );
  }

  return (
    <>
      <div className={`grid gap-4 ${compact ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'}`}>
        {images.slice(0, compact ? 6 : undefined).map((image) => (
          <Card key={image.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <CardContent className="p-0">
              <div className="relative group">
                <img
                  src={image.image_url}
                  alt={image.prompt}
                  className="w-full h-48 object-cover"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setSelectedImage(image)}
                      className="bg-white/90 hover:bg-white"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => downloadImage(image.image_url, `generated-image-${image.id}.png`)}
                      className="bg-white/90 hover:bg-white"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    {onDelete && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(image.id)}
                        className="bg-red-500/90 hover:bg-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
              {!compact && (
                <div className="p-4">
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">{image.prompt}</p>
                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <span className="capitalize bg-gray-100 px-2 py-1 rounded">
                      {image.image_type}
                    </span>
                    <span>{formatDate(image.created_at)}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedImage && (
        <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Generated Image</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <img
                src={selectedImage.image_url}
                alt={selectedImage.prompt}
                className="w-full max-h-96 object-contain rounded-lg"
              />
              <div className="space-y-2">
                <p><strong>Prompt:</strong> {selectedImage.prompt}</p>
                <p><strong>Type:</strong> <span className="capitalize">{selectedImage.image_type}</span></p>
                <p><strong>Created:</strong> {formatDate(selectedImage.created_at)}</p>
              </div>
              <div className="flex space-x-2">
                <Button
                  onClick={() => downloadImage(selectedImage.image_url, `generated-image-${selectedImage.id}.png`)}
                  className="flex-1"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
                {onDelete && (
                  <Button
                    variant="destructive"
                    onClick={() => handleDelete(selectedImage.id)}
                    className="flex-1"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default ImageGallery;
