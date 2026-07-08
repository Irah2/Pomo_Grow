import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { DimensionValue } from 'react-native';

export interface LeafConfig {
  id: string;
  top: DimensionValue;
  left?: DimensionValue;
  right?: DimensionValue;
  rotation: number;
  scale: number;
  color: string;
  isPopping?: boolean; // 1. NEW: Flag to tell the leaf it is about to die
}

interface PlantContextType {
  leaves: LeafConfig[];
  addLeaf: () => void;
  clearLeaves: () => void;
}

const PlantContext = createContext<PlantContextType | undefined>(undefined);
const STORAGE_KEY = '@plant_leaves';

const getRandomHexColor = (): string => {
  const hexChars = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += hexChars[Math.floor(Math.random() * 16)];
  }
  return color;
};

export const PlantProvider = ({ children }: { children: ReactNode }) => {
  const [leaves, setLeaves] = useState<LeafConfig[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadLeaves = async () => {
      try {
        const savedLeaves = await AsyncStorage.getItem(STORAGE_KEY);
        if (savedLeaves !== null) {
          setLeaves(JSON.parse(savedLeaves));
        }
      } catch (error) {
        console.error('Failed to load leaves', error);
      } finally {
        setIsLoaded(true);
      }
    };
    loadLeaves();
  }, []);

  useEffect(() => {
    const saveLeaves = async () => {
      if (isLoaded) {
        try {
          // We filter out any leaves that are currently popping so we don't accidentally save them mid-explosion
          const leavesToSave = leaves.filter(leaf => !leaf.isPopping);
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(leavesToSave));
        } catch (error) {
          console.error('Failed to save leaves', error);
        }
      }
    };
    saveLeaves();
  }, [leaves, isLoaded]);

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

  const clearLeaves = () => {
    // 2. THE BURST INITIATOR: Tell all leaves to start their pop animation
    setLeaves((currentLeaves) => 
      currentLeaves.map(leaf => ({ ...leaf, isPopping: true }))
    );

    // 3. THE CLEANUP: Wait 300 milliseconds for the animation to finish, then clear memory
    setTimeout(() => {
      setLeaves([]);
    }, 300); 
  };

  return (
    <PlantContext.Provider value={{ leaves, addLeaf, clearLeaves }}>
      {children}
    </PlantContext.Provider>
  );
};

export const usePlant = () => {
  const context = useContext(PlantContext);
  if (context === undefined) {
    throw new Error('usePlant must be used within a PlantProvider');
  }
  return context;
};