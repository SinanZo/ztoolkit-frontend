import React from 'react';
import { useTranslation } from 'react-i18next';

const Pricing = () => {
  const { t } = useTranslation();

  return (
    <div className="p-6 text-center">
      <h1 className="text-3xl font-bold mb-4">{t('pricing')}</h1>
      <p>Our plans will be listed here soon, including pay-per-tool and monthly packages.</p>
    </div>
  );
};

export default Pricing;
