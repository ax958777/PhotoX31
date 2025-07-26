
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Images } from 'lucide-react';
import Navbar from '@/components/Navbar';
import ImageGallery from '@/components/ImageGallery';
import { useGeneratedImages } from '@/hooks/useGeneratedImages';
import { useNavigate } from 'react-router-dom';

const History = () => {
  const navigate = useNavigate();
  const { images, isLoading, deleteImage } = useGeneratedImages();

  const handleGetStarted = () => {
    navigate('/generate');
  };

  const generatedImages = images.filter(img => img.image_type === 'generated');
  const editedImages = images.filter(img => img.image_type === 'edited');

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <Navbar onGetStarted={handleGetStarted} />
      
      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
              Your AI Creations
            </h1>
            <p className="text-xl text-gray-600">
              Browse and manage all your generated and edited images
            </p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
              <span className="ml-2 text-gray-600">Loading your images...</span>
            </div>
          ) : (
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-8">
                <TabsTrigger value="all" className="flex items-center gap-2">
                  <Images className="w-4 h-4" />
                  All Images ({images.length})
                </TabsTrigger>
                <TabsTrigger value="generated">
                  Generated ({generatedImages.length})
                </TabsTrigger>
                <TabsTrigger value="edited">
                  Edited ({editedImages.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all">
                <Card>
                  <CardHeader>
                    <CardTitle>All Your AI Images</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ImageGallery images={images} onDelete={deleteImage} />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="generated">
                <Card>
                  <CardHeader>
                    <CardTitle>Generated Images</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ImageGallery images={generatedImages} onDelete={deleteImage} />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="edited">
                <Card>
                  <CardHeader>
                    <CardTitle>Edited Images</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ImageGallery images={editedImages} onDelete={deleteImage} />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </div>
  );
};

export default History;
