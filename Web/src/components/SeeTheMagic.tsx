
import { Sparkles, ArrowRight } from "lucide-react";

const SeeTheMagic = () => {
  const examples = [
    {
      before: "https://images.unsplash.com/photo-1649972904349-6e44c42644a7?w=400&h=400&fit=crop&crop=face",
      after: "https://images.unsplash.com/photo-1581090464777-f3220bbe1b8b?w=400&h=400&fit=crop",
      title: "Portrait Magic"
    },
    {
      before: "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=400&h=400&fit=crop",
      after: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&h=400&fit=crop",
      title: "Tech Transformation"
    },
    {
      before: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=400&fit=crop",
      after: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=400&h=400&fit=crop",
      title: "Workspace Wonder"
    }
  ];

  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-100 text-purple-700 text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            See the Magic in Action
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Witness the
            <span className="block bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Incredible Transformation
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Watch ordinary photos become extraordinary cartoon masterpieces with just one click
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          {examples.map((example, index) => (
            <div key={index} className="group">
              <div className="bg-gray-50 rounded-2xl p-6 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
                <h3 className="text-xl font-semibold text-gray-900 mb-6 text-center">{example.title}</h3>
                
                {/* Before/After Container */}
                <div className="relative">
                  {/* Before Image */}
                  <div className="mb-4">
                    <div className="text-sm font-medium text-gray-500 mb-2 text-center">BEFORE</div>
                    <div className="aspect-square rounded-xl overflow-hidden border-2 border-gray-200">
                      <img 
                        src={example.before}
                        alt="Original photo"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>

                  {/* Arrow */}
                  <div className="flex justify-center mb-4">
                    <div className="bg-gradient-to-r from-purple-500 to-blue-500 rounded-full p-3 shadow-lg">
                      <ArrowRight className="w-6 h-6 text-white rotate-90" />
                    </div>
                  </div>

                  {/* After Image */}
                  <div>
                    <div className="text-sm font-medium text-purple-600 mb-2 text-center">AFTER</div>
                    <div className="aspect-square rounded-xl overflow-hidden border-2 border-purple-200 relative">
                      <img 
                        src={example.after}
                        alt="Cartoon transformation result"
                        className="w-full h-full object-cover filter saturate-150 contrast-125"
                      />
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-blue-500/10"></div>
                      <Sparkles className="absolute top-3 right-3 w-6 h-6 text-purple-500 animate-pulse" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl p-8">
            <div className="text-3xl md:text-4xl font-bold text-purple-600 mb-2">10M+</div>
            <div className="text-gray-600 font-medium">Images Transformed</div>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8">
            <div className="text-3xl md:text-4xl font-bold text-blue-600 mb-2">99.9%</div>
            <div className="text-gray-600 font-medium">Success Rate</div>
          </div>
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-8">
            <div className="text-3xl md:text-4xl font-bold text-indigo-600 mb-2">&lt; 5s</div>
            <div className="text-gray-600 font-medium">Average Processing Time</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SeeTheMagic;
