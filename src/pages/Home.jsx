import React from 'react';
import { useTranslation } from 'react-i18next';

const Home = () => {
  const { t } = useTranslation();

  return (
    <div className="text-center p-10">
      <h1 className="text-3xl font-bold mb-4">{t('home')}</h1>
      <p>{t('convertify.title')}</p>
    </div>
  );
};

export default Home;
