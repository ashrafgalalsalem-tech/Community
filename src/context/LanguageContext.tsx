import React, { createContext, useContext, useState, useEffect } from 'react';
import { TRANSLATIONS, Language } from '../lib/translations';

interface LanguageContextType {
  language: Language;
  isArabic: boolean;
  dir: 'ltr' | 'rtl';
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: typeof TRANSLATIONS['en'];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = 'hle_sgh_language_preference';

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Default to English as explicitly requested: "عايزها كلها إنجليزي وده الديفولت"
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'ar' || saved === 'en') return saved;
    } catch {
      // fallback
    }
    return 'en';
  });

  const isArabic = language === 'ar';
  const dir: 'ltr' | 'rtl' = isArabic ? 'rtl' : 'ltr';

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, language);
    } catch {
      // ignore
    }

    // Sync HTML document direction and language attributes
    document.documentElement.lang = language;
    document.documentElement.dir = dir;

    if (isArabic) {
      document.documentElement.classList.add('font-brand-arabic');
      document.title = 'مجتمع القادة الصحيين';
    } else {
      document.documentElement.classList.remove('font-brand-arabic');
      document.title = 'Healthcare Leaders Community';
    }
  }, [language, dir, isArabic]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const toggleLanguage = () => {
    setLanguageState(prev => (prev === 'en' ? 'ar' : 'en'));
  };

  const t = TRANSLATIONS[language];

  return (
    <LanguageContext.Provider
      value={{
        language,
        isArabic,
        dir,
        setLanguage,
        toggleLanguage,
        t,
      }}
    >
      <div dir={dir} className={isArabic ? 'font-brand-arabic' : 'font-sans'}>
        {children}
      </div>
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
