import { Menu, ArrowRight } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

export default function Header() {
  const { pathname } = useLocation();
  return (
    <header className="sticky top-0 z-30 bg-offwhite2 shadow-card">
      <nav className="max-w-6xl mx-auto flex items-center justify-between py-4 px-4">
        <Link to="/" className="font-bold text-2xl text-black tracking-tight">ZToolKit</Link>
        <div className="hidden md:flex gap-8 items-center">
          <Link to="/tools" className={`text-greyMedium font-medium hover:text-primary transition ${pathname === "/tools" ? "text-primary" : ""}`}>Tools</Link>
          <Link to="/pricing" className={`text-greyMedium font-medium hover:text-primary transition ${pathname === "/pricing" ? "text-primary" : ""}`}>Pricing</Link>
          <Link to="/" className="ml-4 px-5 py-2 rounded-xl bg-primary text-offwhite font-bold shadow-card hover:bg-accent transition flex items-center gap-2">
            Get Started <ArrowRight size={18} />
          </Link>
        </div>
        <button className="md:hidden p-2 rounded-xl hover:bg-greyLight">
          <Menu size={28} className="text-black" />
        </button>
      </nav>
    </header>
  );
}
