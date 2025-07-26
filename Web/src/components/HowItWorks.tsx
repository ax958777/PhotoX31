
import { Upload, Cpu, Download } from "lucide-react";

const HowItWorks = () => {
  const steps = [
    {
      step: "01",
      icon: Upload,
      title: "Upload Your Image",
      description: "Simply drag and drop your photo or click to browse and select the image you want to transform."
    },
    {
      step: "02", 
      icon: Cpu,
      title: "AI Processing",
      description: "Our advanced AI analyzes your image and applies sophisticated cartoon transformation algorithms."
    },
    {
      step: "03",
      icon: Download,
      title: "Download Result",
      description: "Get your stunning cartoon image in high resolution, ready to share or print in just seconds."
    }
  ];

  return (
    <section className="py-24 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-black/20"></div>
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"></div>
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            How It Works
          </h2>
          <p className="text-xl text-white/80 max-w-3xl mx-auto">
            Transform your photos into cartoon masterpieces in three simple steps
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
          {steps.map((step, index) => (
            <div key={index} className="relative text-center group">
              {/* Step Number */}
              <div className="text-6xl md:text-7xl font-bold text-white/10 mb-4 group-hover:text-white/20 transition-colors duration-300">
                {step.step}
              </div>
              
              {/* Icon */}
              <div className="flex items-center justify-center w-20 h-20 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-2xl">
                <step.icon className="w-10 h-10 text-white" />
              </div>
              
              {/* Content */}
              <h3 className="text-2xl font-bold text-white mb-4">{step.title}</h3>
              <p className="text-white/80 leading-relaxed max-w-sm mx-auto">{step.description}</p>
              
              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-24 left-full w-full h-0.5 bg-gradient-to-r from-purple-500 to-transparent -translate-x-1/2 z-0"></div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
