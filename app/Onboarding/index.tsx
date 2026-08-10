import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    type: 'intro',
    title: 'GROW YOUR FOCUS',
    subtitle: 'With',
    description:
      'Each session you complete will sprout a new leaf on the plant, small steps that grows into big progress',
    image: require('../../assets/images/page1.png'),
    // Pre-calculated target heights for each slide
    cardHeight: 210,
  },
  {
    id: '2',
    type: 'info',
    title: 'What is Pomodoro?',
    description:
      'The Pomodoro Technique is a time management method where you break work into 25-minute focused intervals (called "pomodoros") separated by 5-minute breaks',
    image: require('../../assets/images/page2.png'),
    cardHeight: 250,
  },
  {
    id: '3',
    type: 'final',
    title: 'Let’s Start',
    subtitle: 'Let’s grow our own tree!',
    description: '',
    image: require('../../assets/images/page3.png'),
    cardHeight: 180,
  },
];

export default function OnboardingScreen() {
  const [currentStep, setCurrentStep] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const router = useRouter();

  const handleFinish = async () => {
    await AsyncStorage.setItem('@completed_onboarding', 'true');
    router.replace('/(tabs)');
  };

  const handleNext = () => {
    if (currentStep < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentStep + 1,
        animated: true,
      });
    } else {
      handleFinish();
    }
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / SCREEN_WIDTH);
    if (index !== currentStep && index >= 0 && index < SLIDES.length) {
      setCurrentStep(index);
    }
  };

  // Interpolate card height continuously based on horizontal drag offset
  const animatedCardHeight = scrollX.interpolate({
    inputRange: SLIDES.map((_, i) => i * SCREEN_WIDTH),
    outputRange: SLIDES.map((slide) => slide.cardHeight),
    extrapolate: 'clamp',
  });

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

      {/* Swipeable Carousel Area */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          {
            useNativeDriver: false,
            listener: handleScroll,
          }
        )}
        renderItem={({ item }) => (
          <View style={styles.slideItem}>
            {item.type === 'intro' && (
              <View style={styles.centerContent}>
                <Text style={styles.headerTitle}>{item.title}</Text>
                <Text style={styles.headerSubtitle}>{item.subtitle}</Text>
                <View style={styles.pill}>
                  <Text style={styles.pillText}>PomoGrow</Text>
                </View>
              </View>
            )}

            <Image
              source={item.image}
              style={styles.illustrationImage}
              resizeMode="contain"
            />
          </View>
        )}
      />

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

      {/* Continuously Animated Bottom Card */}
      <Animated.View style={[styles.bottomCard, { height: animatedCardHeight }]}>
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
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2B4C1E',
  },
  topBar: {
    height: 60,
    paddingHorizontal: 20,
    paddingTop: 16,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  skipButton: {
    borderWidth: 1,
    borderColor: 'rgba(217, 249, 157, 0.4)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  skipText: {
    color: '#D9F99D',
    fontStyle: 'italic',
    fontSize: 14,
  },
  slideItem: {
    width: SCREEN_WIDTH,
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
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 20,
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'hidden',
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
    color: '#4B5563',
    marginBottom: 8,
    textAlign: 'center',
  },
  cardDescription: {
    fontSize: 14,
    color: '#4B5563',
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
  },
});