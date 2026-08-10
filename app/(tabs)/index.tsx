import { IrishGrover_400Regular, useFonts } from '@expo-google-fonts/irish-grover';
import { Accelerometer } from 'expo-sensors';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  LayoutAnimation,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

import { usePlant } from '../PlantContext';

// Enable LayoutAnimation on Android
if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  const isNewArchitecture = Boolean((globalThis as any).nativeFabricUIManager);
  if (!isNewArchitecture) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

const { width } = Dimensions.get('window');

// Dimensions matching the UI layout
const timerSize = width * 0.74;
const scaledTimerSize = timerSize * 1.12;
const ringStroke = 8;
const glowStroke = 22;
const ringRadius = scaledTimerSize / 2 + ringStroke / 2;
const ringCircumference = 2 * Math.PI * ringRadius;
const svgSize = (ringRadius + glowStroke) * 2;

export default function HomeScreen() {
  const { addLeaf } = usePlant();

  // Load Irish Grover Font
  const [fontsLoaded] = useFonts({
    IrishGrover_400Regular,
  });

  const [movementStatus, setMovementStatus] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [IsInterrupted, setIsInterrupted] = useState(false);

  // Timer States
  const [seconds, setSeconds] = useState(1500);
  const [isActive, setIsActive] = useState(false);

  // 4-Second Start-Up Phase States
  const [isStabilizing, setIsStabilizing] = useState(false);
  const [prepSeconds, setPrepSeconds] = useState(4);

  // Animation States
  const timerScale = useRef(new Animated.Value(1)).current;
  const glowOpacity = useRef(new Animated.Value(0.2)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  const formatTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const remainingSeconds = totalSeconds % 60;
    const paddedMinutes = String(minutes).padStart(2, '0');
    const paddedSeconds = String(remainingSeconds).padStart(2, '0');
    return `${paddedMinutes}:${paddedSeconds}`;
  };

  const resetTimer = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

    Animated.spring(timerScale, {
      toValue: 1,
      friction: 6,
      useNativeDriver: true,
    }).start();

    setIsActive(false);
    setIsStabilizing(false);
    setSeconds(1500);
    setPrepSeconds(4);
    setMovementStatus('');
  };

  // Background Drifting Animation
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 8000,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 8000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [floatAnim]);

  // Bubble Interpolations
  const b1X = floatAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 20] });
  const b1Y = floatAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 15] });

  const b2X = floatAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -15] });
  const b2Y = floatAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -25] });

  const b3X = floatAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 25] });
  const b3Y = floatAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -20] });

  const b4X = floatAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -20] });
  const b4Y = floatAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 25] });

  // Accelerometer Movement Detection
  useEffect(() => {
    Accelerometer.setUpdateInterval(100);

    const subscription = Accelerometer.addListener((accelerometerData) => {
      const { x, y, z } = accelerometerData;
      const totalForce = Math.sqrt(x * x + y * y + z * z);

      const isYanked = totalForce > 1.5;
      const isTilted = z < 0.9 && Math.abs(y) > 0.2;

      if (isYanked || isTilted) {
        if (isActive) {
          setMovementStatus('Woah! Put me down!');
          setIsInterrupted(true);
          resetTimer();
        } else if (isStabilizing) {
          setMovementStatus('Keep the device still!');
          setPrepSeconds(4);
        }
      }
    });

    return () => {
      subscription.remove();
    };
  }, [isActive, isStabilizing]);

  // The 4-Second Pre-Start Timer
  useEffect(() => {
    if (isStabilizing && prepSeconds > 0) {
      const timer = setTimeout(() => setPrepSeconds((prev) => prev - 1), 1000);
      return () => clearTimeout(timer);
    } else if (isStabilizing && prepSeconds === 0) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

      Animated.spring(timerScale, {
        toValue: 1.12,
        friction: 5,
        useNativeDriver: true,
      }).start();

      setIsStabilizing(false);
      setIsActive(true);
    }
  }, [isStabilizing, prepSeconds]);

  // Main Session Timer
  useEffect(() => {
    if (isActive && seconds > 0) {
      const timer = setTimeout(() => setSeconds((prev) => prev - 1), 1000);
      return () => clearTimeout(timer);
    } else if (isActive && seconds === 0) {
      setIsActive(false);
      setIsModalVisible(true);
      addLeaf();
    }
  }, [isActive, seconds]);

  // Glowing Pulse Animation
  useEffect(() => {
    if (isActive) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowOpacity, { toValue: 1, duration: 1200, useNativeDriver: true }),
          Animated.timing(glowOpacity, { toValue: 0.2, duration: 1200, useNativeDriver: true }),
        ])
      ).start();
    } else {
      glowOpacity.stopAnimation();
      glowOpacity.setValue(0.2);
    }
  }, [isActive]);

  const timeFraction = seconds / 1500;
  const strokeDashoffset = ringCircumference - timeFraction * ringCircumference;

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
      {/* Decorative Drifting Background Bubbles */}
      <Animated.View
        style={[
          styles.bubble,
          { top: -40, left: -60, width: 220, height: 220, transform: [{ translateX: b1X }, { translateY: b1Y }] },
        ]}
      />
      <Animated.View
        style={[
          styles.bubble,
          { top: 180, right: -50, width: 140, height: 140, transform: [{ translateX: b2X }, { translateY: b2Y }] },
        ]}
      />
      <Animated.View
        style={[
          styles.bubble,
          { bottom: 120, left: -90, width: 280, height: 280, transform: [{ translateX: b3X }, { translateY: b3Y }] },
        ]}
      />
      <Animated.View
        style={[
          styles.bubble,
          { bottom: 60, right: 20, width: 100, height: 100, transform: [{ translateX: b4X }, { translateY: b4Y }] },
        ]}
      />

      {/* Full-width Header Pill */}
      <View style={styles.headerPill}>
        <Text
          style={[
            styles.headerText,
            fontsLoaded && { fontFamily: 'IrishGrover_400Regular' },
          ]}
        >
          PomoGrow
        </Text>
      </View>

      <View style={styles.mainContainer}>
        {/* Main Timer Area */}
        <View style={styles.timerWrapper}>
          {isActive && (
            <Animated.View style={[styles.svgContainer, { opacity: glowOpacity }]}>
              <Svg width={svgSize} height={svgSize}>
                <Circle
                  cx={svgSize / 2}
                  cy={svgSize / 2}
                  r={ringRadius}
                  stroke="rgba(255, 255, 255, 0.3)"
                  strokeWidth={ringStroke}
                  fill="transparent"
                />
                <Circle
                  cx={svgSize / 2}
                  cy={svgSize / 2}
                  r={ringRadius}
                  stroke="rgba(251, 191, 36, 0.35)"
                  strokeWidth={glowStroke}
                  fill="transparent"
                  strokeDasharray={ringCircumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  transform={`rotate(-90 ${svgSize / 2} ${svgSize / 2})`}
                />
                <Circle
                  cx={svgSize / 2}
                  cy={svgSize / 2}
                  r={ringRadius}
                  stroke="#fbbf24"
                  strokeWidth={ringStroke}
                  fill="transparent"
                  strokeDasharray={ringCircumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  transform={`rotate(-90 ${svgSize / 2} ${svgSize / 2})`}
                />
              </Svg>
            </Animated.View>
          )}

          {/* Main Timer Circle with Radial Gradient */}
          <Animated.View style={[styles.timerCircle, { transform: [{ scale: timerScale }] }]}>
            <View style={StyleSheet.absoluteFill}>
              <Svg height="100%" width="100%">
                <Defs>
                  <RadialGradient
                    id="timerGradient"
                    cx="50%"
                    cy="50%"
                    rx="50%"
                    ry="50%"
                    fx="50%"
                    fy="50%"
                    gradientUnits="userSpaceOnUse"
                  >
                    <Stop offset="0%" stopColor="#72AB40" stopOpacity="1" />
                    <Stop offset="100%" stopColor="#3E6B24" stopOpacity="1" />
                  </RadialGradient>
                </Defs>
                <Circle cx={timerSize / 2} cy={timerSize / 2} r={timerSize / 2} fill="url(#timerGradient)" />
              </Svg>
            </View>

            <Text style={styles.timerText}>{formatTime(seconds)}</Text>
          </Animated.View>
        </View>

        {/* Reserved instruction slot so layout doesn't jump */}
        <View style={styles.instructionContainer}>
          {isStabilizing && (
            <View style={styles.prepCard}>
              <Text style={styles.prepTitle}>
                {movementStatus ? movementStatus : 'Keep the device still for:'}{' '}
                <Text style={styles.prepHighlight}>{prepSeconds} sec</Text>
              </Text>
              <Text style={styles.prepSubtext}>
                Place your phone face down to begin growing your tree.
              </Text>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonStack}>
          <TouchableOpacity
            style={styles.button}
            activeOpacity={isStabilizing ? 1 : 0.8}
            onPress={() => {
              if (isStabilizing) return;
              if (isActive) {
                resetTimer();
              } else {
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                setIsStabilizing(true);
              }
            }}
          >
            <Text style={styles.buttonText}>{isActive ? 'STOP' : 'START'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            activeOpacity={0.8}
            onPress={resetTimer}
          >
            <Text style={styles.buttonText}>RESET</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Loss Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={IsInterrupted}
        onRequestClose={() => setIsInterrupted(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Loss</Text>
            <Text style={styles.modalMessage}>You moved! Restart a new session.</Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                setIsInterrupted(false);
                resetTimer();
              }}
            >
              <Text style={styles.modalButtonText}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Success Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>🎉 Time's Up!</Text>
            <Text style={styles.modalMessage}>Great job completing your session.</Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                setIsModalVisible(false);
                resetTimer();
              }}
            >
              <Text style={styles.modalButtonText}>Finish</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#E4F9A0',
  },
  bubble: {
    position: 'absolute',
    backgroundColor: '#D7F589',
    borderRadius: 999,
    opacity: 0.6,
  },
  headerPill: {
    backgroundColor: '#528D38',
    paddingTop: Platform.OS === 'ios' ? 54 : 40,
    paddingBottom: 20,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  headerText: {
    color: '#FFFFFF',
    fontSize: 36,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  mainContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  timerWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginBottom: 12,
    marginTop: 25,
  },
  svgContainer: {
    position: 'absolute',
    zIndex: 0,
  },
  timerCircle: {
    width: timerSize,
    height: timerSize,
    borderRadius: timerSize / 2,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    zIndex: 1,
    overflow: 'hidden',
  },
  timerText: {
    fontSize: 76,
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontWeight: '300',
  },
  instructionContainer: {
    minHeight: 85,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    marginVertical: 6,
  },
  prepCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 20,
    width: width * 0.88,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#C3E88D',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  prepTitle: {
    fontSize: 15,
    color: '#1E293B',
    fontWeight: '600',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  prepHighlight: {
    color: '#709E5B',
    fontWeight: 'bold',
  },
  prepSubtext: {
    fontSize: 12,
    color: '#8E9A86',
    textAlign: 'center',
    marginTop: 4,
  },
  buttonStack: {
    alignItems: 'center',
    gap: 12,
    width: '100%',
    marginBottom: 8,
  },
  button: {
    backgroundColor: '#2D4E1F',
    paddingVertical: 14,
    paddingHorizontal: 36,
    borderRadius: 24,
    width: 140,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontStyle: 'italic',
    letterSpacing: 1,
  },
  /* Modals */
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalCard: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 25,
    padding: 30,
    alignItems: 'center',
    elevation: 8,
  },
  modalTitle: { fontSize: 26, fontWeight: 'bold', color: '#333', marginBottom: 10 },
  modalMessage: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 25 },
  modalButton: {
    backgroundColor: '#2D4E1F',
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 24,
    width: '100%',
    alignItems: 'center',
  },
  modalButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
});