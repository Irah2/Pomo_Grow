import { Tabs } from 'expo-router';
import React from 'react';
import { PlantProvider } from '../PlantContext';

import { HapticTab } from '@/components/haptic-tab';
// 1. Import Ionicons from Expo's built-in vector icons
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <PlantProvider>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarButton: HapticTab,
          
          tabBarActiveTintColor: '#F0E673', 
          tabBarInactiveTintColor: '#A8C78C', 
          
          tabBarStyle: {
            backgroundColor: '#5D8D4A', 
            borderTopWidth: 0,
            elevation: 0,
            shadowOpacity: 0,
          }
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Timer',
            // 2. Use Ionicons here
            tabBarIcon: ({ color }) => (
              <Ionicons size={28} name="timer" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Plant',
            // 3. Use Ionicons here (Ionicons uses "leaf" instead of "leaf.fill")
            tabBarIcon: ({ color }) => (
              <Ionicons size={28} name="leaf" color={color} />
            ),
          }}
        />
      </Tabs>
    </PlantProvider>
  );
}