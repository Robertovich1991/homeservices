import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {fetchCategories} from '../../api';
import {colors} from '../theme';
import {useAuth} from './AuthContext';
import {useLanguage} from './LanguageContext';

const CategoriesContext = createContext(null);

export function CategoriesProvider({children}) {
  const {token} = useAuth();
  const {language} = useLanguage();
  const [categories, setCategories] = useState([]);

  const reload = useCallback(async () => {
    if (!token) {
      setCategories([]);
      return;
    }
    try {
      const list = await fetchCategories(token);
      setCategories(Array.isArray(list) ? list : []);
    } catch {
      // Labels fall back to category ids until the next successful load.
    }
  }, [token]);

  useEffect(() => {
    reload();
  }, [reload]);

  const value = useMemo(() => {
    const find = id => categories.find(category => category.id === id);
    return {
      categories,
      reload,
      label: id => {
        const category = find(id);
        if (!category) {
          return id;
        }
        return category.names[language] || category.names.en || id;
      },
      color: id => find(id)?.color || colors.primary,
    };
  }, [categories, language, reload]);

  return (
    <CategoriesContext.Provider value={value}>
      {children}
    </CategoriesContext.Provider>
  );
}

export function useCategories() {
  const context = useContext(CategoriesContext);
  if (!context) {
    throw new Error('useCategories must be used inside CategoriesProvider');
  }
  return context;
}
