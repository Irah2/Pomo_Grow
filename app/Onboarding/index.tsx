import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Image,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const SLIDES = [
  {
    type: 'intro',
    title: 'GROW YOUR FOCUS',
    subtitle: 'With',
    description:
      'Each session you complete will sprout a new leaf on the plant, small steps that grows into big progress',
    // Load image directly using require
    image: require('../../assets/images/page1.png'), 
  },
  {
    type: 'info',
    title: 'What is Pomodoro?',
    description:
      'The Pomodoro Technique is a time management method where you break work into 25-minute focused intervals (called "pomodoros") separated by 5-minute breaks',
    image: require('../../assets/images/page2.png'),
  },
  {
    type: 'final',
    title: 'Let’s Start',
    subtitle: 'Let’s grow our own tree!',
    description: '',
    image: require('../../assets/images/page3.png'),
  },
];

export default function OnboardingScreen() {
  const [currentStep, setCurrentStep] = useState(0);
  const router = useRouter();

  const handleFinish = async () => {
    await AsyncStorage.setItem('@completed_onboarding', 'true');
    router.replace('/(tabs)');
  };

  const handleNext = () => {
    if (currentStep < SLIDES.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleFinish();
    }
  };

  const slide = SLIDES[currentStep];

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Bar / Skip Button */}
      <View style={styles.topBar}>
        {currentStep > 0 ? (
          <TouchableOpacity onPress={handleFinish} style={styles.skipButton}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        ) : (
          <View />
        )}
      </View>

      {/* Main Content Area */}
      <View style={styles.content}>
        {slide.type === 'intro' && (
          <View style={styles.centerContent}>
            <Text style={styles.headerTitle}>{slide.title}</Text>
            <Text style={styles.headerSubtitle}>{slide.subtitle}</Text>
            <View style={styles.pill}>
              <Text style={styles.pillText}>PomoGrow</Text>
            </View>
          </View>
        )}

        {/* Dynamic Image Loader */}
        <Image
          source={slide.image}
          style={styles.illustrationImage}
          resizeMode="contain"
        />
      </View>

      {/* Dots Indicator */}
      <View style={styles.dotsContainer}>
        {SLIDES.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              index === currentStep ? styles.activeDot : styles.inactiveDot,
            ]}
          />
        ))}
      </View>

      {/* Bottom Sheet Card */}
      <View style={styles.bottomCard}>
        <View style={styles.cardTextContainer}>
          {slide.type === 'info' && (
            <Text style={styles.cardTitle}>{slide.title}</Text>
          )}

          {slide.type === 'final' && (
            <>
              <Text style={styles.cardTitle}>{slide.title}</Text>
              <Text style={styles.cardSubtitle}>{slide.subtitle}</Text>
            </>
          )}

          {!!slide.description && (
            <Text style={styles.cardDescription}>{slide.description}</Text>
          )}
        </View>

        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <Ionicons name="arrow-forward" size={32} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2B4C1E',
  },
  topBar: {
    height: 50,
    paddingHorizontal: 20,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  skipButton: {
    borderWidth: 1,
    borderColor: 'rgba(217, 249, 157, 0.4)',
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 20,
  },
  skipText: {
    color: '#D9F99D',
    fontStyle: 'italic',
    fontSize: 14,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#D9F99D',
    letterSpacing: 1,
  },
  headerSubtitle: {
    fontSize: 14,
    fontStyle: 'italic',
    color: 'rgba(217, 249, 157, 0.8)',
    marginBottom: 12,
  },
  pill: {
    backgroundColor: '#528A38',
    paddingHorizontal: 28,
    paddingVertical: 10,
    borderRadius: 25,
    marginBottom: 16,
  },
  pillText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 22,
  },
  illustrationImage: {
    width: 220,
    height: 220,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: '#FFFFFF',
    transform: [{ scale: 1.2 }],
  },
  inactiveDot: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  bottomCard: {
    backgroundColor: '#E2FBC2',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 250,
  },
  cardTextContainer: {
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 8,
    textAlign: 'center',
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#333333',
    marginBottom: 12,
    textAlign: 'center',
  },
  cardDescription: {
    fontSize: 14,
    color: '#333333',
    textAlign: 'center',
    lineHeight: 20,
  },
  nextButton: {
    backgroundColor: '#2B4C1E',
    width: '100%',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
});