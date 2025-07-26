import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Download, Upload, Wand2, History } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import Navbar from '@/components/Navbar';
import ImageGallery from '@/components/ImageGallery';
import SubscriptionBadges from '@/components/SubscriptionBadges';
import { useGeneratedImages } from '@/hooks/useGeneratedImages';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { supabase } from '@/integrations/supabase/client';
import { useUser, useAuth } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';

const styleOptions = [
  { value: 'none', label: 'Default' },
  { value: 'painting', label: 'Painting' },
  { value: 'photograph', label: 'Photograph' },
  { value: 'sketch', label: 'Sketch' },
  { value: 'digital-art', label: 'Digital Art' },
  { value: 'watercolor', label: 'Watercolor Painting' },
  { value: 'oil-painting', label: 'Oil Painting' },
  { value: 'pastel', label: 'Pastel Painting' },
  { value: 'charcoal', label: 'Charcoal Drawing' },
  { value: 'pencil', label: 'Pencil Drawing' },
  { value: 'ink', label: 'Ink Drawing' },
  { value: 'cartoon', label: 'Cartoon Style' },
  { value: 'anime', label: 'Anime Style' },
  { value: 'realistic', label: 'Photorealistic' },
  { value: 'abstract', label: 'Abstract Art' },
  { value: 'minimalist', label: 'Minimalist' },
  { value: 'vintage', label: 'Vintage Style' },
  { value: 'isometric', label: 'Isometric 3D' },
  { value: 'pixel-art', label: 'Pixel Art' },
  { value: 'pop-art', label: 'Pop Art' },
];

const qualityOptions = {
  general: [
    { value: 'none', label: 'Default' },
    { value: 'high-quality', label: 'High-quality' },
    { value: 'beautiful', label: 'Beautiful' },
    { value: 'stylized', label: 'Stylized' },
  ],
  photo: [
    { value: 'none', label: 'Default' },
    { value: '4k', label: '4K' },
    { value: 'hdr', label: 'HDR' },
    { value: 'studio-photo', label: 'Studio Photo' },
  ],
  art: [
    { value: 'none', label: 'Default' },
    { value: 'professional', label: 'By a professional' },
    { value: 'detailed', label: 'Detailed' },
  ],
};

const photographyOptions = {
  proximity: [
    { value: 'none', label: 'Default' },
    { value: 'close-up', label: 'Close up' },
    { value: 'far-away', label: 'Taken from far away' },
  ],
  position: [
    { value: 'none', label: 'Default' },
    { value: 'aerial', label: 'Aerial' },
    { value: 'from-below', label: 'From below' },
    { value: 'eye-level', label: 'Eye level' },
    { value: 'low-angle', label: 'Low angle' },
    { value: 'high-angle', label: 'High angle' },
  ],
  lighting: [
    { value: 'none', label: 'Default' },
    { value: 'natural', label: 'Natural' },
    { value: 'dramatic', label: 'Dramatic' },
    { value: 'warm', label: 'Warm' },
    { value: 'cold', label: 'Cold' },
    { value: 'golden-hour', label: 'Golden hour' },
    { value: 'studio', label: 'Studio lighting' },
  ],
  settings: [
    { value: 'none', label: 'Default' },
    { value: 'motion-blur', label: 'Motion blur' },
    { value: 'soft-focus', label: 'Soft focus' },
    { value: 'bokeh', label: 'Bokeh' },
    { value: 'portrait', label: 'Portrait mode' },
    { value: 'sharp-focus', label: 'Sharp focus' },
  ],
  lens: [
    { value: 'none', label: 'Default' },
    { value: '35mm', label: '35mm' },
    { value: '50mm', label: '50mm' },
    { value: 'fisheye', label: 'Fisheye' },
    { value: 'wide-angle', label: 'Wide angle' },
    { value: 'macro', label: 'Macro' },
    { value: 'telephoto', label: 'Telephoto' },
  ],
  film: [
    { value: 'none', label: 'Default' },
    { value: 'black-and-white', label: 'Black and white' },
    { value: 'polaroid', label: 'Polaroid' },
    { value: 'vintage-film', label: 'Vintage film' },
    { value: 'sepia', label: 'Sepia' },
  ],
};

const aspectRatioOptions = [
  { value: '1:1', label: 'Square (1:1)', width: 1024, height: 1024 },
  { value: '4:3', label: 'Fullscreen (4:3)', width: 1024, height: 768 },
  { value: '3:4', label: 'Portrait full screen (3:4)', width: 768, height: 1024 },
  { value: '16:9', label: 'Widescreen (16:9)', width: 1024, height: 576 },
  { value: '9:16', label: 'Portrait (9:16)', width: 576, height: 1024 },
];

const ImageGenerator = () => {
  const [prompt, setPrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('none');
  const [generatedImage, setGeneratedImage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [editPrompt, setEditPrompt] = useState('');
  const [editedImage, setEditedImage] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // Photography-specific options
  const [cameraProximity, setCameraProximity] = useState('none');
  const [cameraPosition, setCameraPosition] = useState('none');
  const [lighting, setLighting] = useState('none');
  const [cameraSettings, setCameraSettings] = useState('none');
  const [lensType, setLensType] = useState('none');
  const [filmType, setFilmType] = useState('none');

  // Quality modifiers
  const [generalQuality, setGeneralQuality] = useState('none');
  const [photoQuality, setPhotoQuality] = useState('none');
  const [artQuality, setArtQuality] = useState('none');

  // Aspect ratio
  const [aspectRatio, setAspectRatio] = useState('1:1');

  // Background options
  const [backgroundTransparent, setBackgroundTransparent] = useState(false);
  const { toast } = useToast();
  const { user } = useUser();
  const { getToken } = useAuth();
  const { images, refetch: refetchImages, deleteImage } = useGeneratedImages();
  const { canGenerateImage, incrementUsage, syncWithDatabase } = useSubscriptionStore();
  const navigate = useNavigate();

  // Sync subscription data when component mounts or user changes
  useEffect(() => {
    const syncSubscriptionData = async () => {
      if (user?.id) {
        try {
          await syncWithDatabase(user.id);
          console.log('Subscription data synced after page load');
        } catch (error) {
          console.error('Failed to sync subscription data:', error);
        }
      }
    };

    syncSubscriptionData();
  }, [user?.id, syncWithDatabase]);

  const generateImage = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Error",
        description: "Please enter a prompt to generate an image.",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Error",
        description: "Please sign in to generate images.",
        variant: "destructive",
      });
      return;
    }

    if (!canGenerateImage()) {
      toast({
        title: "Usage Limit Reached",
        description: "You've reached your monthly generation limit. Please upgrade your plan.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const token = await getToken();

      // Build the final prompt with style and photography options
      let finalPrompt = prompt;

      if (selectedStyle !== 'none') {
        const styleLabel = styleOptions.find(s => s.value === selectedStyle)?.label;
        finalPrompt = `${prompt}, in ${styleLabel} style`;

        // Add photography-specific options if photography is selected
        if (selectedStyle === 'photograph') {
          const photographyTerms = [];

          if (cameraProximity !== 'none') {
            const proximityLabel = photographyOptions.proximity.find(p => p.value === cameraProximity)?.label;
            if (proximityLabel) photographyTerms.push(proximityLabel.toLowerCase());
          }

          if (cameraPosition !== 'none') {
            const positionLabel = photographyOptions.position.find(p => p.value === cameraPosition)?.label;
            if (positionLabel) photographyTerms.push(`${positionLabel.toLowerCase()} view`);
          }

          if (lighting !== 'none') {
            const lightingLabel = photographyOptions.lighting.find(l => l.value === lighting)?.label;
            if (lightingLabel) photographyTerms.push(`${lightingLabel.toLowerCase()} lighting`);
          }

          if (cameraSettings !== 'none') {
            const settingsLabel = photographyOptions.settings.find(s => s.value === cameraSettings)?.label;
            if (settingsLabel) photographyTerms.push(settingsLabel.toLowerCase());
          }

          if (lensType !== 'none') {
            const lensLabel = photographyOptions.lens.find(l => l.value === lensType)?.label;
            if (lensLabel) photographyTerms.push(`${lensLabel.toLowerCase()} lens`);
          }

          if (filmType !== 'none') {
            const filmLabel = photographyOptions.film.find(f => f.value === filmType)?.label;
            if (filmLabel) photographyTerms.push(filmLabel.toLowerCase());
          }

          if (photographyTerms.length > 0) {
            finalPrompt = `${finalPrompt}, ${photographyTerms.join(', ')}`;
          }
        }
      }

      // Add quality modifiers
      const qualityTerms = [];

      if (generalQuality !== 'none') {
        const qualityLabel = qualityOptions.general.find(q => q.value === generalQuality)?.label;
        if (qualityLabel) qualityTerms.push(qualityLabel.toLowerCase());
      }

      if (selectedStyle === 'photograph' && photoQuality !== 'none') {
        const photoQualityLabel = qualityOptions.photo.find(q => q.value === photoQuality)?.label;
        if (photoQualityLabel) qualityTerms.push(photoQualityLabel.toLowerCase());
      }

      if ((selectedStyle === 'painting' || selectedStyle === 'digital-art' || selectedStyle === 'watercolor' ||
        selectedStyle === 'oil-painting' || selectedStyle === 'pastel' || selectedStyle === 'sketch' ||
        selectedStyle === 'charcoal' || selectedStyle === 'pencil' || selectedStyle === 'ink') && artQuality !== 'none') {
        const artQualityLabel = qualityOptions.art.find(q => q.value === artQuality)?.label;
        if (artQualityLabel) qualityTerms.push(artQualityLabel.toLowerCase());
      }

      if (qualityTerms.length > 0) {
        finalPrompt = `${finalPrompt}, ${qualityTerms.join(', ')}`;
      }

      // Add background options
      if (backgroundTransparent) {
        finalPrompt = `${finalPrompt}, transparent background, no background, isolated subject`;
      }

      // Get aspect ratio dimensions
      const selectedAspectRatio = aspectRatioOptions.find(ratio => ratio.value === aspectRatio);

      const response = await supabase.functions.invoke('generate-image', {
        body: {
          prompt: finalPrompt,
          type: 'generated',
          aspectRatio: aspectRatio,
          width: selectedAspectRatio?.width || 1024,
          height: selectedAspectRatio?.height || 1024
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to generate image');
      }

      const { imageUrl } = response.data;
      setGeneratedImage(imageUrl);

      // Increment usage count
      await incrementUsage();

      // Refresh the images list
      await refetchImages();

      toast({
        title: "Success!",
        description: "Image generated successfully with Gemini AI!",
      });
    } catch (error) {
      console.error('Error generating image:', error);
      toast({
        title: "Error",
        description: "Failed to generate image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        setUploadedImage(file);
        toast({
          title: "Image uploaded",
          description: "Ready for editing with Gemini AI!",
        });
      } else {
        toast({
          title: "Error",
          description: "Please upload a valid image file.",
          variant: "destructive",
        });
      }
    }
  };

  const editImage = async () => {
    if (!uploadedImage || !editPrompt.trim()) {
      toast({
        title: "Error",
        description: "Please upload an image and enter edit instructions.",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Error",
        description: "Please sign in to edit images.",
        variant: "destructive",
      });
      return;
    }

    if (!canGenerateImage()) {
      toast({
        title: "Usage Limit Reached",
        description: "You've reached your monthly generation limit. Please upgrade your plan.",
        variant: "destructive",
      });
      return;
    }

    setIsEditing(true);
    try {
      const token = await getToken();

      // Convert image to base64
      const imageBase64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1]); // Remove data:image/...;base64, prefix
        };
        reader.readAsDataURL(uploadedImage);
      });

      const response = await supabase.functions.invoke('generate-image', {
        body: {
          prompt: editPrompt,
          type: 'edited',
          imageData: imageBase64,
          mimeType: uploadedImage.type
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to edit image');
      }

      const { imageUrl } = response.data;
      setEditedImage(imageUrl);

      // Increment usage count
      await incrementUsage();

      // Refresh the images list
      await refetchImages();

      toast({
        title: "Success!",
        description: "Image edited successfully with Gemini AI!",
      });
    } catch (error) {
      console.error('Error editing image:', error);
      toast({
        title: "Error",
        description: "Failed to edit image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsEditing(false);
    }
  };

  const downloadImage = (imageUrl: string, filename: string) => {
    window.open(imageUrl, '_blank');
  };

  const handleGetStarted = () => {
    // Navigate to image generator or current functionality
  };

  const handleSubscribe = () => {
    // Navigate to homepage/pricing
    navigate('/#pricing');
  };

  const handleHistory = () => {
    navigate('/history');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <Navbar onGetStarted={handleGetStarted} />

      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
              AI Image Generator
            </h1>
            <p className="text-xl text-gray-600 mb-6">
              Create and edit amazing images with the power of Gemini AI
            </p>

            {/* Subscription Badges */}
            <div className="flex justify-center">
              <SubscriptionBadges />
            </div>

            {/* Show Subscription Button if !canGenerateImage */}
            {!canGenerateImage() && (
              <div className="flex justify-center">
                <Button
                  onClick={handleSubscribe}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Subscribe
                </Button>

              </div>
            )}

          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Tabs defaultValue="generate" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-8">
                  <TabsTrigger value="generate" className="flex items-center gap-2">
                    <Wand2 className="w-4 h-4" />
                    Generate Image
                  </TabsTrigger>
                  <TabsTrigger value="edit" className="flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    Edit Image
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="generate">
                  <div className="grid lg:grid-cols-2 gap-8">
                    <Card>
                      <CardHeader>
                        <CardTitle>Generate New Image with Gemini AI</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label htmlFor="prompt">Describe the image you want to create</Label>
                          <Textarea
                            id="prompt"
                            placeholder="A futuristic city with flying cars at sunset..."
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            className="min-h-[120px]"
                          />
                        </div>
                        <div>
                          <Label htmlFor="style">Art Style</Label>
                          <Select value={selectedStyle} onValueChange={setSelectedStyle}>
                            <SelectTrigger>
                              <SelectValue placeholder="Choose an art style" />
                            </SelectTrigger>
                            <SelectContent>
                              {styleOptions.map((style) => (
                                <SelectItem key={style.value} value={style.value}>
                                  {style.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Aspect Ratio */}
                        <div>
                          <Label htmlFor="aspect-ratio">Aspect Ratio</Label>
                          <Select value={aspectRatio} onValueChange={setAspectRatio}>
                            <SelectTrigger>
                              <SelectValue placeholder="Choose aspect ratio" />
                            </SelectTrigger>
                            <SelectContent>
                              {aspectRatioOptions.map((ratio) => (
                                <SelectItem key={ratio.value} value={ratio.value}>
                                  {ratio.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Photography-specific options */}
                        {selectedStyle === 'photograph' && (
                          <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                            <h4 className="font-medium text-gray-900">Photography Options</h4>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="camera-proximity">Camera Proximity</Label>
                                <Select value={cameraProximity} onValueChange={setCameraProximity}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Choose proximity" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {photographyOptions.proximity.map((option) => (
                                      <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              <div>
                                <Label htmlFor="camera-position">Camera Position</Label>
                                <Select value={cameraPosition} onValueChange={setCameraPosition}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Choose position" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {photographyOptions.position.map((option) => (
                                      <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              <div>
                                <Label htmlFor="lighting">Lighting</Label>
                                <Select value={lighting} onValueChange={setLighting}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Choose lighting" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {photographyOptions.lighting.map((option) => (
                                      <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              <div>
                                <Label htmlFor="camera-settings">Camera Settings</Label>
                                <Select value={cameraSettings} onValueChange={setCameraSettings}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Choose settings" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {photographyOptions.settings.map((option) => (
                                      <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              <div>
                                <Label htmlFor="lens-type">Lens Type</Label>
                                <Select value={lensType} onValueChange={setLensType}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Choose lens" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {photographyOptions.lens.map((option) => (
                                      <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              <div>
                                <Label htmlFor="film-type">Film Type</Label>
                                <Select value={filmType} onValueChange={setFilmType}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Choose film" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {photographyOptions.film.map((option) => (
                                      <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Quality Modifiers */}
                        <div className="space-y-4 p-4 bg-blue-50 rounded-lg">
                          <h4 className="font-medium text-gray-900">Quality Modifiers</h4>

                          <div className="grid grid-cols-1 gap-4">
                            <div>
                              <Label htmlFor="general-quality">General Quality</Label>
                              <Select value={generalQuality} onValueChange={setGeneralQuality}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Choose general quality" />
                                </SelectTrigger>
                                <SelectContent>
                                  {qualityOptions.general.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                      {option.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            {selectedStyle === 'photograph' && (
                              <div>
                                <Label htmlFor="photo-quality">Photo Quality</Label>
                                <Select value={photoQuality} onValueChange={setPhotoQuality}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Choose photo quality" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {qualityOptions.photo.map((option) => (
                                      <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            )}

                            {(selectedStyle === 'painting' || selectedStyle === 'digital-art' || selectedStyle === 'watercolor' ||
                              selectedStyle === 'oil-painting' || selectedStyle === 'pastel' || selectedStyle === 'sketch' ||
                              selectedStyle === 'charcoal' || selectedStyle === 'pencil' || selectedStyle === 'ink') && (
                                <div>
                                  <Label htmlFor="art-quality">Art Quality</Label>
                                  <Select value={artQuality} onValueChange={setArtQuality}>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Choose art quality" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {qualityOptions.art.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                          {option.label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              )}
                          </div>
                        </div>

                        {/* Background Options */}
                        <div className="space-y-4 p-4 bg-green-50 rounded-lg">
                          <h4 className="font-medium text-gray-900">Background Options</h4>
                          <div className="flex items-center justify-between">
                            <Label htmlFor="transparent-background" className="text-sm font-medium">
                              Transparent Background
                            </Label>
                            <Switch
                              id="transparent-background"
                              checked={backgroundTransparent}
                              onCheckedChange={setBackgroundTransparent}
                            />
                          </div>
                          {backgroundTransparent && (
                            <p className="text-xs text-gray-600">
                              The background will be removed/made transparent
                            </p>
                          )}
                        </div>

                        <Button
                          onClick={generateImage}
                          disabled={isGenerating || !canGenerateImage()}
                          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                        >
                          {isGenerating ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Generating with Gemini...
                            </>
                          ) : (
                            <>
                              <Wand2 className="mr-2 h-4 w-4" />
                              Generate with Gemini AI
                            </>
                          )}
                        </Button>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Generated Image</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {generatedImage ? (
                          <div className="space-y-4">
                            <img
                              src={generatedImage}
                              alt="Generated"
                              className="w-full rounded-lg shadow-lg"
                            />
                            <Button
                              onClick={() => downloadImage(generatedImage, 'gemini-generated-image.png')}
                              variant="outline"
                              className="w-full"
                            >
                              <Download className="mr-2 h-4 w-4" />
                              Download Image
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
                            <p className="text-gray-500">Generated image will appear here</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="edit">
                  <div className="grid lg:grid-cols-2 gap-8">
                    <Card>
                      <CardHeader>
                        <CardTitle>Edit Existing Image with Gemini AI</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label htmlFor="image-upload">Upload Image to Edit</Label>
                          <Input
                            id="image-upload"
                            type="file"
                            accept="image/*"
                            onChange={handleFileUpload}
                            className="cursor-pointer"
                          />
                        </div>

                        {uploadedImage && (
                          <div className="space-y-4">
                            <img
                              src={URL.createObjectURL(uploadedImage)}
                              alt="Uploaded"
                              className="w-full max-h-48 object-cover rounded-lg"
                            />

                            <div>
                              <Label>Quick Edit Options</Label>
                              <div className="grid grid-cols-1 gap-2 mt-2">
                                <Button
                                  onClick={() => setEditPrompt('Transform this image to Studio Ghibli anime style with magical atmosphere')}
                                  variant="outline"
                                  size="sm"
                                  className="text-left justify-start"
                                >
                                  🎨 Transform to Ghibli Style
                                </Button>
                                <Button
                                  onClick={() => setEditPrompt('Remove the background from this image, make background transparent')}
                                  variant="outline"
                                  size="sm"
                                  className="text-left justify-start"
                                >
                                  🗑️ Remove Background
                                </Button>
                              </div>
                            </div>

                            <div>
                              <Label htmlFor="edit-prompt">Or describe custom changes you want</Label>
                              <Textarea
                                id="edit-prompt"
                                placeholder="Add a rainbow in the sky, change the color to blue..."
                                value={editPrompt}
                                onChange={(e) => setEditPrompt(e.target.value)}
                                className="min-h-[100px]"
                              />
                            </div>

                            <Button
                              onClick={editImage}
                              disabled={isEditing || !canGenerateImage()}
                              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                            >
                              {isEditing ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Editing with Gemini...
                                </>
                              ) : (
                                <>
                                  <Upload className="mr-2 h-4 w-4" />
                                  Edit with Gemini AI
                                </>
                              )}
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Edited Image</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {editedImage ? (
                          <div className="space-y-4">
                            <img
                              src={editedImage}
                              alt="Edited"
                              className="w-full rounded-lg shadow-lg"
                            />
                            <Button
                              onClick={() => downloadImage(editedImage, 'gemini-edited-image.png')}
                              variant="outline"
                              className="w-full"
                            >
                              <Download className="mr-2 h-4 w-4" />
                              Download Image
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
                            <p className="text-gray-500">Edited image will appear here</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            {/* Gallery Widget */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <History className="w-5 h-5" />
                      Recent Creations
                    </span>
                    <Button variant="outline" size="sm" onClick={handleHistory}>
                      View All
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ImageGallery images={images} onDelete={deleteImage} compact={true} />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageGenerator;
