import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const Navbar = () => {
  const { t, i18n } = useTranslation();
  const changeLang = (lng) => i18n.changeLanguage(lng);

  return (
    <nav className="bg-white shadow-md p-4 flex justify-between items-center">
      <Link to="/" className="text-xl font-bold text-gray-800">ZToolKit</Link>
      <div className="space-x-4">
        <Link to="/" className="hover:underline">{t('home')}</Link>
        <Link to="/tools" className="hover:underline">{t('tools')}</Link>
        <Link to="/pricing" className="hover:underline">{t('pricing')}</Link>
        <select onChange={(e) => changeLang(e.target.value)} className="ml-4 border p-1 rounded">
          <option value="en">EN</option>
          <option value="ar">AR</option>
          {/* Add others */}
        </select>
      </div>
    </nav>
  );
};

export default Navbar;
