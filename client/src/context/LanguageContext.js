import React, {createContext, useContext, useMemo, useState} from 'react';
import {LANGUAGES, translate} from '../i18n/translations';

const LanguageContext = createContext(null);

export function LanguageProvider({children}) {
  const [language, setLanguage] = useState('ru');

  const value = useMemo(
    () => ({
      language,
      languages: LANGUAGES,
      setLanguage,
      t: (key, vars) => translate(language, key, vars),
    }),
    [language],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used inside LanguageProvider');
  }
  return context;
}
