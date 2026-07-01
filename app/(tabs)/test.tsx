import { Accelerometer } from 'expo-sensors';
import { useEffect, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { usePlant } from './PlantContext';

export default function HomeScreen() {
  const { addLeaf } = usePlant();


  const [movementStatus, setMovementStatus] = useState("Resting peacefully...");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [IsInterrupted, setIsInterrupted] = useState(false);
  
  // Timer States
  const [seconds, setSeconds] = useState(10);
  const [isActive, setIsActive] = useState(false);
  
  // 4-Second Start-Up Phase States
  const [isStabilizing, setIsStabilizing] = useState(false);
  const [prepSeconds, setPrepSeconds] = useState(4);

  const formatTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const remainingSeconds = totalSeconds % 60;
    const paddedMinutes = String(minutes).padStart(2, '0');
    const paddedSeconds = String(remainingSeconds).padStart(2, '0');
    return `${paddedMinutes}:${paddedSeconds}`;
  };

  const resetTimer = () => {
    setIsActive(false); 
    setIsStabilizing(false); 
    setSeconds(10);      
    setPrepSeconds(4);
  };

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
          resetTimer();
  
          setTimeout(() => {
            setMovementStatus("Resting peacefully...");
          }, 2000);
        } else if (isStabilizing) {
          setMovementStatus("Keep the device still!");
          setPrepSeconds(4); 
          
          setTimeout(() => {
            setMovementStatus("Resting peacefully...");
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
      // Just count down
      const timer = setTimeout(() => setPrepSeconds((prev) => prev - 1), 1000);
      return () => clearTimeout(timer);
    } else if (isStabilizing && prepSeconds === 0) {
      // When it hits 0, trigger the next phase!
      setIsStabilizing(false);
      setIsActive(true);
    }
  }, [isStabilizing, prepSeconds]);


  // Main Session Timer
  useEffect(() => {
    if (isActive && seconds > 0) {
      // Just count down
      const timer = setTimeout(() => setSeconds((prev) => prev - 1), 1000);
      return () => clearTimeout(timer);
    } else if (isActive && seconds === 0) {
      // When it hits 0, finish the session and add the leaf!
      setIsActive(false);
      setIsModalVisible(true);
      addLeaf(); 
    }
  }, [isActive, seconds]);


  const getButtonConfig = () => {
    if (isStabilizing) {
      return { style: styles.buttonStabilizing, text: `Hold Still...` };
    }
    if (isActive) {
      return { style: styles.buttonStop, text: 'Pause' };
    }
    return { style: styles.buttonStart, text: 'Start' };
  };

  const buttonConfig = getButtonConfig();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.container}>
          <Text style={styles.titleText}>Movement Detector</Text>
          
          <Text style={[
            styles.statusText,
            movementStatus !== "Resting peacefully..." && styles.statusActive
          ]}>
            {movementStatus}
          </Text>
        </View>

        <Text style={styles.bigText}>Welcome to my App!</Text>

        <View style={styles.container}>
          
          <Text style={[styles.bigText, isStabilizing && { color: '#cccccc' }]}>
            {formatTime(seconds)}
          </Text>

          {/* NEW: The countdown is always structurally here now. 
              It just turns invisible when the main timer is active so the layout doesn't jump! */}
          <Text style={[styles.prepText, isActive && { opacity: 0 }]}>
            Starting in: {prepSeconds}
          </Text>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, buttonConfig.style]}
              activeOpacity={isStabilizing ? 1 : 0.7} 
              onPress={() => {
                if (isStabilizing) return; 
                if (isActive) {
                  setIsActive(false); 
                } else {
                  setIsStabilizing(true); 
                }
              }}
            >
              <Text style={styles.buttonText}>{buttonConfig.text}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.buttonReset]}
              onPress={resetTimer}
            >
              <Text style={styles.buttonText}>Reset</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

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
              style={[styles.button, styles.buttonStart, { width: '100%', alignItems: 'center' }]}
              onPress={() => {
                setIsInterrupted(false); 
                resetTimer();             
              }}
            >
              <Text style={styles.buttonText}>Dismiss</Text>
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
              style={[styles.button, styles.buttonStart, { width: '100%', alignItems: 'center' }]}
              onPress={() => {
                setIsModalVisible(false); 
                resetTimer();             
              }}
            >
              <Text style={styles.buttonText}>Finish</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#ffffff' },
  scrollContainer: { padding: 20, alignItems: 'center' },
  titleText: { fontSize: 28, fontWeight: '900', color: '#333333', marginBottom: 20 },
  statusText: { fontSize: 20, fontWeight: '600', color: '#666666', textAlign: 'center' },
  statusActive: { color: '#ff4444' },
  bigText: { fontSize: 48, fontWeight: '900', textAlign: 'center', marginTop: 20, color: '#333333' },
  prepText: { 
    fontSize: 28, 
    fontWeight: 'bold', 
    color: '#f39c12', 
    marginTop: 10,
    marginBottom: -10 
  },
  container: { alignItems: 'center', marginTop: 40 },
  buttonRow: { flexDirection: 'row', gap: 15, marginTop: 20 },
  button: { paddingVertical: 15, paddingHorizontal: 30, borderRadius: 30 },
  buttonStart: { backgroundColor: '#0a7ea4' },
  buttonStop: { backgroundColor: '#ff4444' },
  buttonStabilizing: { backgroundColor: '#f39c12' }, 
  buttonReset: { backgroundColor: '#666666' },
  buttonText: { color: 'white', fontSize: 20, fontWeight: 'bold' },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.6)' },
  modalCard: {
    width: '80%', backgroundColor: 'white', borderRadius: 25, padding: 30, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 8,
  },
  modalTitle: { fontSize: 28, fontWeight: '900', color: '#333333', marginBottom: 10 },
  modalMessage: { fontSize: 18, color: '#666666', textAlign: 'center', marginBottom: 25, lineHeight: 24 }
});