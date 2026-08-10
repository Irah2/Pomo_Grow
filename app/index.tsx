import AsyncStorage from '@react-native-async-storage/async-storage';
import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

export default function Index() {
  const [isLoading, setIsLoading] = useState(true);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    try {
      const value = await AsyncStorage.getItem('@completed_onboarding');
      setHasCompletedOnboarding(value === 'true');
    } catch {
      setHasCompletedOnboarding(false);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#2B4C1E' }}>
        <ActivityIndicator size="large" color="#D9F99D" />
      </View>
    );
  }

  if (hasCompletedOnboarding) {
    return <Redirect href="/(tabs)" />;
  }

  // Redirect to the onboarding route (omit the parentheses in typed routes)
  // If your file is app/(onboarding)/index.tsx, href="/onboarding" or href="/" works.
  return <Redirect href="/Onboarding" />;
}