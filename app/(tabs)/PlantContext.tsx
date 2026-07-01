// PlantContext.tsx
import React, { createContext, ReactNode, useContext, useState } from 'react';
import { DimensionValue } from 'react-native';


export interface LeafConfig {
  id: string;
  top: DimensionValue;
  left?: DimensionValue;
  right?: DimensionValue;
  rotation: number;
  scale: number;
  color: string;
}

interface PlantContextType {
  leaves: LeafConfig[];
  addLeaf: () => void;
}

const PlantContext = createContext<PlantContextType | undefined>(undefined);

export const PlantProvider = ({ children }: { children: ReactNode }) => {
  const [leaves, setLeaves] = useState<LeafConfig[]>([]);

  const getRandomHexColor = (): string => {
    const hexChars = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += hexChars[Math.floor(Math.random() * 16)];
    }
    return color;
  };

  const addLeaf = () => {
    const isLeft = Math.random() > 0.5;
    const newLeaf: LeafConfig = {
      id: `leaf-${Date.now()}`,
      top: `${Math.floor(Math.random() * 65) + 10}%`,
      rotation: isLeft ? -Math.random() * 40 - 20 : Math.random() * 40 + 20,
      scale: Math.random() * 0.6 + 0.7,
      color: getRandomHexColor(),
    };

    if (isLeft) {
      newLeaf.left = -20;
    } else {
      newLeaf.right = -20;
    }

    setLeaves((currentLeaves) => [...currentLeaves, newLeaf]);
  };

  return (
    <PlantContext.Provider value={{ leaves, addLeaf }}>
      {children}
    </PlantContext.Provider>
  );
};

export const usePlant = () => {
  const context = useContext(PlantContext);
  if (!context) {
    throw new Error('usePlant must be used within a PlantProvider');
  }
  return context;
};