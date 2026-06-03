import { createContext, useContext, useState, useEffect } from 'react';
import { applyTheme } from '../theme/tokens.js';

const BusinessContext = createContext(null);

export function BusinessProvider({ children }) {
  const [business, setBusinessState] = useState(null);

  useEffect(() => {
    const stored = sessionStorage.getItem('business');
    if (stored) {
      const b = JSON.parse(stored);
      setBusinessState(b);
      applyTheme(b.type === 'KRISHI' ? 'krishi' : 'hardware');
    } else {
      applyTheme('neutral');
    }
  }, []);

  const setBusiness = (b) => {
    sessionStorage.setItem('businessId', b.id);
    sessionStorage.setItem('business', JSON.stringify(b));
    setBusinessState(b);
    applyTheme(b.type === 'KRISHI' ? 'krishi' : 'hardware');
  };

  const clearBusiness = () => {
    sessionStorage.removeItem('businessId');
    sessionStorage.removeItem('business');
    setBusinessState(null);
    applyTheme('neutral');
  };

  return (
    <BusinessContext.Provider value={{ business, setBusiness, clearBusiness }}>
      {children}
    </BusinessContext.Provider>
  );
}

export function useBusiness() {
  return useContext(BusinessContext);
}
