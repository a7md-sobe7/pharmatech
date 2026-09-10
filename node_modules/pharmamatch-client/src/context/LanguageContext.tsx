import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'ar';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  isRTL: boolean;
  t: (key: string, fallback?: string) => string;
}

const translations: Record<string, Record<Language, string>> = {
  // Navigation & Brand
  'app.name': { en: 'PharmaMatch AI', ar: 'فارما ماتش AI' },
  'app.subtitle': { en: 'Pharmacy Intelligence & Similarity Platform', ar: 'منصة الذكاء الصيدلاني وبدائل الأدوية' },
  'nav.dashboard': { en: 'Dashboard', ar: 'لوحة القيادة' },
  'nav.search': { en: 'Similarity Studio', ar: 'بحث وبدائل الأدوية' },
  'nav.catalog': { en: 'Drug Knowledge DB', ar: 'قاعدة بيانات الأدوية' },
  'nav.inventory': { en: 'Pharmacy Inventory', ar: 'مخزون الصيدلية' },
  'nav.assistant': { en: 'AI Clinical Assistant', ar: 'المساعد الصيدلاني الذكي' },
  'nav.admin': { en: 'Admin Center', ar: 'إدارة النظام والأوزان' },

  // Search & Results
  'search.placeholder': { en: 'Search medicine by brand, generic, or Arabic name (e.g. Calmag, Augmentin, كتافلام)...', ar: 'ابحث عن الدواء بالاسم التجاري أو العلمي أو بالعربي (مثل: كالماج، أوجمنتين)...' },
  'search.unavailable': { en: 'Product Unavailable in Inventory', ar: 'المنتج غير متوفر حالياً في المخزن' },
  'search.available': { en: 'In Stock & Available', ar: 'متوفر حالياً في المخزون' },
  'search.primaryIngredient': { en: 'Primary Active Ingredient', ar: 'المادة الفعالة الرئيسية' },
  'search.candidatesFound': { en: 'Available Similar Candidates', ar: 'المنتجات البديلة المتاحة في الصيدلية' },
  'search.compare': { en: 'Compare Formulations', ar: 'مقارنة التركيبة' },
  'search.feedback.useful': { en: 'Useful Match', ar: 'بديل مناسب' },
  'search.feedback.notSuitable': { en: 'Not Clinically Suitable', ar: 'غير ملائم سريرياً' },

  // Metrics
  'metric.totalDrugs': { en: 'Drug Products', ar: 'إجمالي الأدوية' },
  'metric.availableStock': { en: 'Available In-Stock', ar: 'المتوفر في المخزن' },
  'metric.lowStock': { en: 'Low Stock Alert', ar: 'أوشك على النفاد' },
  'metric.outOfStock': { en: 'Out of Stock', ar: 'المنتجات المنتهية' },
  'metric.expired': { en: 'Expired Items', ar: 'منتهي الصلاحية' },

  // Disclaimer
  'disclaimer.banner': {
    en: 'Medical Safety Principle: System similarity matches are based on structured primary active ingredient rules and are NOT autonomous substitution orders. Pharmacist verification is mandatory.',
    ar: 'مبدأ السلامة الدوائية: اقتراحات النظام مبنية على تطابق المادة الفعالة الرئيسية فقط وليست أمراً تلقائياً بالصرف. المراجعة السريرية للصيدلي إلزامية.'
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');

  const isRTL = language === 'ar';

  useEffect(() => {
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language, isRTL]);

  const toggleLanguage = () => {
    setLanguage(prev => (prev === 'en' ? 'ar' : 'en'));
  };

  const t = (key: string, fallback?: string): string => {
    if (translations[key] && translations[key][language]) {
      return translations[key][language];
    }
    return fallback || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, isRTL, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within a LanguageProvider');
  return context;
};
