export default function Footer() {
  return (
    <footer className="bg-offwhite2 border-t border-greyLight mt-12 py-6">
      <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <span className="font-bold text-black text-lg">ZToolKit</span>
        <div className="flex gap-6 text-greyMedium text-sm">
          <a href="/tools" className="hover:text-primary">Tools</a>
          <a href="/pricing" className="hover:text-primary">Pricing</a>
        </div>
        <span className="text-greyMedium text-xs">© {new Date().getFullYear()} ZToolKit. All rights reserved.</span>
      </div>
    </footer>
  );
}
