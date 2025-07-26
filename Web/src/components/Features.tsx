
import { Zap, Shield, Download, Palette, Clock, Star } from "lucide-react";

const Features = () => {
  const features = [
    {
      icon: Zap,
      title: "Lightning Fast AI",
      description: "Transform your images in seconds with our advanced AI models powered by cutting-edge technology."
    },
    {
      icon: Palette,
      title: "Multiple Art Styles",
      description: "Choose from various cartoon styles including anime, disney, comic book, and custom artistic filters."
    },
    {
      icon: Shield,
      title: "Privacy Protected",
      description: "Your images are processed securely and automatically deleted after transformation. Complete privacy guaranteed."
    },
    {
      icon: Download,
      title: "High Quality Output",
      description: "Download your cartoon images in high resolution formats suitable for printing and professional use."
    },
    {
      icon: Clock,
      title: "Batch Processing",
      description: "Transform multiple images at once with our batch processing feature. Save time and increase productivity."
    },
    {
      icon: Star,
      title: "Premium Quality",
      description: "State-of-the-art AI ensures professional-grade results that rival traditional digital artists."
    }
  ];

  return (
    <section className="py-24 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Powerful Features for
            <span className="block bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Creative Excellence
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Everything you need to transform ordinary photos into extraordinary cartoon masterpieces
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-gray-100"
            >
              <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl mb-6 group-hover:scale-110 transition-transform duration-300">
                <feature.icon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">{feature.title}</h3>
              <p className="text-gray-600 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
