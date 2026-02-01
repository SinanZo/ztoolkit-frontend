import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function Hero() {
  return (
    <section className="relative py-16 md:py-24 bg-offwhite rounded-xl shadow-card mb-10">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_20%_40%,#F3F4F6_0%,transparent_70%)]"></div>
      <div className="relative z-10 max-w-3xl mx-auto text-center px-4">
        <h1 className="text-4xl md:text-5xl font-bold text-black mb-4">All Your Tools. One Toolkit.</h1>
        <p className="text-greyMedium text-lg mb-8">Convert, compress, and manage files with a single, modern SaaS platform. Free and Pro tools for everyone.</p>
        <Link to="/tools" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-offwhite font-bold text-lg shadow-card hover:bg-accent transition">
          Explore Tools <ArrowRight size={20} />
        </Link>
      </div>
    </section>
  );
}
