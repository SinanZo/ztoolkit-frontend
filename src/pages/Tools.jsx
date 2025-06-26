import React from 'react';
import { useTranslation } from 'react-i18next';

const Tools = () => {
  const { t } = useTranslation();

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-center mb-4">{t('tools')}</h1>
      <p className="text-center">Here you will find all the tools bundled in ZToolKit.net</p>
      {/* Example placeholder for future tool components */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <div className="border rounded-lg p-4 shadow hover:shadow-lg transition">
          <h2 className="font-bold text-xl mb-2">🔁 Convertify</h2>
          <p className="text-sm text-gray-600">Convert files, formats, and more.</p>
        </div>
        <div className="border rounded-lg p-4 shadow hover:shadow-lg transition">
          <h2 className="font-bold text-xl mb-2">🔒 Hashify</h2>
          <p className="text-sm text-gray-600">Generate hashes instantly.</p>
        </div>
        <div className="border rounded-lg p-4 shadow hover:shadow-lg transition">
          <h2 className="font-bold text-xl mb-2">📄 DocReader</h2>
          <p className="text-sm text-gray-600">Preview, extract, and translate PDFs.</p>
        </div>
      </div>
    </div>
  );
};

export default Tools;
