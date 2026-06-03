import { createContext, useContext, useState, useEffect } from 'react';
import { applyTheme } from '../theme/tokens.js';

const BusinessContext = createContext(null);

export function BusinessProvider({ children }) {
  const [business, setBusinessState] = useState(() => {
    const stored = sessionStorage.getItem('business');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return null;
      }
    }
    return null;
  });

  useEffect(() => {
    if (business) {
      applyTheme(business.type === 'KRISHI' ? 'krishi' : 'hardware');
    } else {
      applyTheme('neutral');
    }
  }, [business]);

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
