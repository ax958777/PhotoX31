
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import SeeTheMagic from "@/components/SeeTheMagic";
import HowItWorks from "@/components/HowItWorks";
import Pricing from "@/components/Pricing";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Hero />
      <div id="features">
        <Features />
      </div>
      <div id="examples">
        <SeeTheMagic />
      </div>
      <HowItWorks />
      <div id="pricing">
        <Pricing />
      </div>
      <Footer />
    </div>
  );
};

export default Index;
