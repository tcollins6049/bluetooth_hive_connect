// src/BLEManagerContext.tsx
import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import BLEManagerSingleton from './BLEManagerSingleton';
import { BleManager } from 'react-native-ble-plx';

const BLEManagerContext = createContext<BleManager | null>(null);

interface BLEManagerProviderProps {
  children: ReactNode;
}

export const BLEManagerProvider: React.FC<BLEManagerProviderProps> = ({ children }) => {
  const bleManager = BLEManagerSingleton.getInstance();

  useEffect(() => {
    return () => {
      bleManager.destroy();
    };
  }, [bleManager]);

  return (
    <BLEManagerContext.Provider value={bleManager}>
      {children}
    </BLEManagerContext.Provider>
  );
};

export const useBLEManager = (): BleManager => {
  const context = useContext(BLEManagerContext);
  if (!context) {
    throw new Error('useBLEManager must be used within a BLEManagerProvider');
  }
  return context;
};
