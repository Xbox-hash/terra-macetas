import React, { createContext, useContext, useState, useEffect } from 'react';
import { StoreConfig } from '../types';
import { companyService } from '../services/companyService';
import { INITIAL_STORE_CONFIG } from '../data/initialConfig';

interface CompanyContextType {
  config: StoreConfig;
  isLoading: boolean;
  updateConfig: (newConfig: StoreConfig) => Promise<void>;
  refreshConfig: () => Promise<void>;
}

const getInitialConfig = (): StoreConfig => {
  try {
    const cached = localStorage.getItem('terra_company_config');
    if (cached) {
      const parsed = JSON.parse(cached);
      return { ...INITIAL_STORE_CONFIG, ...parsed };
    }
  } catch (err) {
    console.error('Error al leer configuración en caché:', err);
  }
  return INITIAL_STORE_CONFIG;
};

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export const CompanyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<StoreConfig>(getInitialConfig);
  const [isLoading, setIsLoading] = useState(false);

  const refreshConfig = async () => {
    try {
      const data = await companyService.getConfig();
      setConfig(data);
    } catch (err) {
      console.error('Error al actualizar configuración:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshConfig();
  }, []);


  useEffect(() => {
    if (config.storeName) {
      document.title = `${config.storeName} | ${config.tagline || 'Macetas de Diseño'}`;
    }

    const existingFavicon = (document.getElementById('app-favicon') ||
      document.querySelector("link[rel*='icon']")) as HTMLLinkElement | null;

    const newFavicon = document.createElement('link');
    newFavicon.id = 'app-favicon';
    newFavicon.rel = 'icon';

    if (config.logoUrl && config.logoUrl.trim() !== '') {
      const url = config.logoUrl.trim();
      newFavicon.href = url;
      if (url.includes('.svg') || url.startsWith('data:image/svg')) {
        newFavicon.type = 'image/svg+xml';
      } else if (url.includes('.png') || url.startsWith('data:image/png')) {
        newFavicon.type = 'image/png';
      } else if (url.includes('.jpg') || url.includes('.jpeg') || url.startsWith('data:image/jpeg')) {
        newFavicon.type = 'image/jpeg';
      } else if (url.includes('.webp') || url.startsWith('data:image/webp')) {
        newFavicon.type = 'image/webp';
      } else if (url.includes('.ico') || url.startsWith('data:image/x-icon')) {
        newFavicon.type = 'image/x-icon';
      }
    } else {
      newFavicon.type = 'image/svg+xml';
      newFavicon.href = 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🏺</text></svg>';
    }

    if (existingFavicon && existingFavicon.parentNode) {
      existingFavicon.parentNode.replaceChild(newFavicon, existingFavicon);
    } else {
      document.head.appendChild(newFavicon);
    }
  }, [config.storeName, config.tagline, config.logoUrl]);

  const updateConfig = async (newConfig: StoreConfig) => {
    const updated = await companyService.updateConfig(newConfig);
    setConfig(updated);
  };

  return (
    <CompanyContext.Provider value={{ config, isLoading, updateConfig, refreshConfig }}>
      {children}
    </CompanyContext.Provider>
  );
};

export const useCompany = () => {
  const context = useContext(CompanyContext);
  if (!context) {
    throw new Error('useCompany debe utilizarse dentro de un CompanyProvider');
  }
  return context;
};
