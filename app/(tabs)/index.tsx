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
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';

import { usePlant } from '../PlantContext';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width } = Dimensions.get('window');

// Calculate Dimensions for the Timer and Glowing Ring
const timerSize = width * 0.7;
const scaledTimerSize = timerSize * 1.15; // The size of the timer when it springs up
const ringStroke = 8; // Thinner core for a sleek edge
const glowStroke = 22; // The soft optical glow extending outward
// Sits perfectly on the outer boundary of the timer (no extra gap)
const ringRadius = (scaledTimerSize / 2) + (ringStroke / 2); 
const ringCircumference = 2 * Math.PI * ringRadius;
const svgSize = (ringRadius + glowStroke) * 2; // Expanded SVG canvas so the glow doesn't clip

export default function HomeScreen() {
  const { addLeaf } = usePlant();

  const [movementStatus, setMovementStatus] = useState("Rest peacefully for");
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
  const glowOpacity = useRef(new Animated.Value(0.2)).current; // Controls the glowing pulse
  const floatAnim = useRef(new Animated.Value(0)).current; // Controls the background bubbles

  const formatTime = (totalSeconds) => {
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
    setMovementStatus("Rest peacefully for");
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
        })
      ])
    ).start();
  }, [floatAnim]);

  // Bubble Interpolations (Mapping 0-1 to different X/Y pixel movements)
  const b1X = floatAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 20] });
  const b1Y = floatAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 15] });
  
  const b2X = floatAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -15] });
  const b2Y = floatAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -25] });
  
  const b3X = floatAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 25] });
  const b3Y = floatAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -20] });
  
  const b4X = floatAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -20] });
  const b4Y = floatAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 25] });


  // Accelerometer Code
  useEffect(() => {
    Accelerometer.setUpdateInterval(100);

    const subscription = Accelerometer.addListener(accelerometerData => {
      const { x, y, z } = accelerometerData;
      const totalForce = Math.sqrt(x * x + y * y + z * z);

      const isYanked = totalForce > 1.5;
      const isTilted = z < 0.9 && Math.abs(y) > 0.2;

      if (isYanked || isTilted) {
        if (isActive) {
          setMovementStatus("Woah! Put me down!");
          setIsInterrupted(true);
          resetTimer(); // This turns isActive to false, so the text pops back up!
  
          setTimeout(() => {
            setMovementStatus("Rest peacefully for");
          }, 2000);
        } else if (isStabilizing) {
          setMovementStatus("Keep the device still!");
          setPrepSeconds(4); 
          
          setTimeout(() => {
            setMovementStatus("Rest peacefully for");
          }, 2000);
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
        toValue: 1.15,
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
          Animated.timing(glowOpacity, { toValue: 0.2, duration: 1200, useNativeDriver: true })
        ])
      ).start();
    } else {
      glowOpacity.stopAnimation();
      glowOpacity.setValue(0.2);
    }
  }, [isActive]);

  const getStartButtonText = () => {
    if (isStabilizing) return 'HOLD STILL';
    if (isActive) return 'STOP';
    return 'START';
  };

  // Calculate how much of the ring should be filled (1 = full, 0 = empty)
  const timeFraction = seconds / 1500;
  const strokeDashoffset = ringCircumference - (timeFraction * ringCircumference);

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Decorative Drifting Background Bubbles */}
      <Animated.View style={[
        styles.bubble, 
        { top: -50, left: -50, width: 200, height: 200, transform: [{ translateX: b1X }, { translateY: b1Y }] }
      ]} />
      <Animated.View style={[
        styles.bubble, 
        { top: 150, right: -40, width: 120, height: 120, transform: [{ translateX: b2X }, { translateY: b2Y }] }
      ]} />
      <Animated.View style={[
        styles.bubble, 
        { bottom: 100, left: -80, width: 250, height: 250, transform: [{ translateX: b3X }, { translateY: b3Y }] }
      ]} />
      <Animated.View style={[
        styles.bubble, 
        { bottom: 50, right: 30, width: 80, height: 80, transform: [{ translateX: b4X }, { translateY: b4Y }] }
      ]} />

      <View style={styles.mainContainer}>
        
        {/* Header Pill */}
        <View style={styles.headerPill}>
          <Text style={styles.headerText}>PomoGrow</Text>
        </View>

        {/* Movement Status Text - Now ONLY visible when NOT active! */}
        {!isActive && (
          <Text style={[
            styles.movementStatus, 
            movementStatus !== "Rest peacefully for" && styles.movementStatusRed
          ]}>
            {movementStatus}
          </Text>
        )}

        {/* Preparation Banner */}
        {!isActive && (
          <View style={styles.prepBanner}>
            <Text style={styles.prepTextBold}>{prepSeconds} sec</Text>
          </View>
        )}

        {/* Main Timer Area */}
        <View style={styles.timerWrapper}>
          
          {/* Glowing Progress Ring */}
          {isActive && (
            <Animated.View style={[styles.svgContainer, { opacity: glowOpacity }]}>
              <Svg width={svgSize} height={svgSize}>
                {/* Track Background */}
                <Circle
                  cx={svgSize / 2}
                  cy={svgSize / 2}
                  r={ringRadius}
                  stroke="rgba(255, 255, 255, 0.3)"
                  strokeWidth={ringStroke}
                  fill="transparent"
                />
                {/* Layer 1: Soft Optical Glow (Thick & Semi-transparent) */}
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
                {/* Layer 2: Core Solid Ring (Thinner & Opaque) */}
                <Circle
                  cx={svgSize / 2}
                  cy={svgSize / 2}
                  r={ringRadius}
                  stroke="#fbbf24" // Bright solid yellow
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

          {/* Main Timer Circle */}
          <Animated.View style={[
            styles.timerCircle, 
            { transform: [{ scale: timerScale }] }
          ]}>
            <Text style={styles.timerText}>
              {formatTime(seconds)}
            </Text>
          </Animated.View>

        </View>

        {/* Button */}
        <View style={styles.buttonStack}>
          <TouchableOpacity
            style={styles.button}
            activeOpacity={isStabilizing ? 1 : 0.7} 
            onPress={() => {
              if (isStabilizing) return; 
              if (isActive) {
                resetTimer();
              } else {
                setIsStabilizing(true); 
              }
            }}
          >
            <Text style={styles.buttonText}>{getStartButtonText()}</Text>
          </TouchableOpacity>
        </View>

      </View>

      {/* Loss Modal */}
      <Modal animationType="fade" transparent={true} visible={IsInterrupted} onRequestClose={() => setIsInterrupted(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Loss</Text>
            <Text style={styles.modalMessage}>You moved! Restart a new session.</Text>
            <TouchableOpacity style={styles.modalButton} onPress={() => { setIsInterrupted(false); resetTimer(); }}>
              <Text style={styles.modalButtonText}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Success Modal */}
      <Modal animationType="fade" transparent={true} visible={isModalVisible} onRequestClose={() => setIsModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>🎉 Time's Up!</Text>
            <Text style={styles.modalMessage}>Great job completing your session.</Text>
            <TouchableOpacity style={styles.modalButton} onPress={() => { setIsModalVisible(false); resetTimer(); }}>
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
    backgroundColor: '#d8f4b5' 
  },
  bubble: {
    position: 'absolute',
    backgroundColor: '#c4e995',
    borderRadius: 999,
    opacity: 0.8,
  },
  mainContainer: {
    flex: 1,
    gap: 20,
    alignItems: 'center',
    justifyContent: 'space-evenly', 
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  headerPill: {
    backgroundColor: '#5d8e47',
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    borderRadius: 40,
    marginTop: -10, 
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  headerText: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  movementStatus: {
    fontSize: 16,
    color: '#666666',
    fontWeight: '600',
    textAlign: 'center',
  },
  movementStatusRed: {
    color: '#ff4444',
    fontWeight: 'bold',
    fontSize: 18,
  },
  prepBanner: {
    backgroundColor: '#e6f7c6',
    borderWidth: 1,
    borderColor: '#000000',
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 20,
    width: '50%',
    alignItems: 'center',
  },
  prepTextBold: {
    fontSize: 32,
    fontWeight: '900',
    color: '#000000',
    marginVertical: 2,
  },
  timerWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative', 
  },
  svgContainer: {
    position: 'absolute',
    zIndex: 0,
  },
  timerCircle: {
    width: timerSize, 
    height: timerSize,
    borderRadius: timerSize / 2,
    backgroundColor: '#4c8635',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    zIndex: 1, 
  },
  timerText: {
    fontSize: 64, 
    color: '#ffffff',
    fontFamily: 'serif', 
  },
  buttonStack: {
    alignItems: 'center',
    gap: 15, 
    width: '100%',
  },
  button: {
    backgroundColor: '#2b521b',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 30,
    minWidth: 140,
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontFamily: 'serif',
    fontStyle: 'italic',
    letterSpacing: 1,
  },
  /* Modals */
  modalOverlay: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: 'rgba(0, 0, 0, 0.6)' 
  },
  modalCard: {
    width: '80%', 
    backgroundColor: 'white', 
    borderRadius: 25, 
    padding: 30, 
    alignItems: 'center',
    elevation: 8,
  },
  modalTitle: { fontSize: 28, fontWeight: 'bold', color: '#333', marginBottom: 10 },
  modalMessage: { fontSize: 18, color: '#666', textAlign: 'center', marginBottom: 25 },
  modalButton: { backgroundColor: '#4c8635', paddingVertical: 15, paddingHorizontal: 30, borderRadius: 30, width: '100%', alignItems: 'center' },
  modalButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold' }
});