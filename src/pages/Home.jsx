import Hero from "../components/Hero.jsx";
import ToolsGallery from "../components/ToolsGallery.jsx";
import Pricing from "../components/Pricing.jsx";

export default function Home() {
  return (
    <div className="flex flex-col gap-12">
      <Hero />
      <ToolsGallery />
      <Pricing />
    </div>
  );
}
