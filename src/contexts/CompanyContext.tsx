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

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export const CompanyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<StoreConfig>(INITIAL_STORE_CONFIG);
  const [isLoading, setIsLoading] = useState(true);

  const refreshConfig = async () => {
    try {
      const data = await companyService.getConfig();
      setConfig(data);
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
  }, [config.storeName, config.tagline]);

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
