import { IrishGrover_400Regular, useFonts } from '@expo-google-fonts/irish-grover';
import { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Image, Modal, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LeafConfig, usePlant } from '../PlantContext';

const { width, height } = Dimensions.get('window');

// 1. DEDICATED ANIMATED LEAF COMPONENT
const AnimatedLeaf = ({ leaf }: { leaf: LeafConfig }) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // --- THE POP / BURST ANIMATION ---
    if (leaf.isPopping) {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: leaf.scale * 1.5,
          duration: 250, 
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0, 
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
      return; 
    }

    // --- THE NORMAL SPROUT & BREATHE ANIMATION ---
    Animated.timing(scaleAnim, {
      toValue: leaf.scale,
      duration: 400,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        startBreathing();
      }
    });

    const startBreathing = () => {
      if (leaf.isPopping) return; 

      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: leaf.scale * 1.15,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: leaf.scale,
          duration: 1500,
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished && !leaf.isPopping) {
          startBreathing();
        }
      });
    };
  }, [leaf.scale, leaf.isPopping, scaleAnim, opacityAnim]);

  return (
    <Animated.Image
      source={require('../../assets/images/leaf.png')}
      style={[
        styles.leaf,
        {
          top: leaf.top,
          ...(leaf.left !== undefined && { left: leaf.left }),
          ...(leaf.right !== undefined && { right: leaf.right }),
          tintColor: leaf.color,
          opacity: opacityAnim, 
          transform: [
            { rotate: `${leaf.rotation}deg` },
            { scale: scaleAnim }, 
          ],
        },
      ]}
      resizeMode="contain"
    />
  );
};

// 2. MAIN PLANT SCREEN COMPONENT
const Plant = () => {
  const { leaves, addLeaf, clearLeaves } = usePlant();
  const [isModalVisible, setIsModalVisible] = useState(false);
  
  // Load Irish Grover Font
  const [fontsLoaded] = useFonts({
    IrishGrover_400Regular,
  });

  // Background Animation State
  const floatAnim = useRef(new Animated.Value(0)).current;

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

  // Helper function to handle the actual reset
  const confirmReset = () => {
    setIsModalVisible(false); 
    setTimeout(() => {
      clearLeaves();
    }, 300); 
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
      {/* Decorative Drifting Background Bubbles */}
      <Animated.View style={[
        styles.bubble, 
        { top: -40, left: -60, width: 220, height: 220, transform: [{ translateX: b1X }, { translateY: b1Y }] }
      ]} />
      <Animated.View style={[
        styles.bubble, 
        { top: 180, right: -50, width: 140, height: 140, transform: [{ translateX: b2X }, { translateY: b2Y }] }
      ]} />
      <Animated.View style={[
        styles.bubble, 
        { bottom: 120, left: -90, width: 280, height: 280, transform: [{ translateX: b3X }, { translateY: b3Y }] }
      ]} />
      <Animated.View style={[
        styles.bubble, 
        { bottom: 60, right: 20, width: 100, height: 100, transform: [{ translateX: b4X }, { translateY: b4Y }] }
      ]} />

      {/* Full-Width Header Pill */}
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
        {/* The Plant Area */}
        <View style={styles.plantWrapper}>
          <View style={styles.plantContainer}>
            <Image
              source={require('../../assets/images/stem.png')}
              style={styles.stem}
              resizeMode="contain"
            />

            {leaves.map((leaf) => (
              <AnimatedLeaf key={leaf.id} leaf={leaf} />
            ))}
          </View>

          <Image
            source={require('../../assets/images/pot.png')}
            style={styles.pot}
            resizeMode="contain"
          />
        </View>

        {/* The UI Controls Area */}
        <View style={styles.uiContainer}>
          
          {/* Leaf Counter Box (Clickable for testing purposes) */}
          <TouchableOpacity 
            style={styles.counterBox} 
            activeOpacity={0.8} 
            onPress={addLeaf} // Hidden feature to easily test leaf growth!
          >
            <Text style={styles.counterNumber}>{leaves.length}</Text>
            <Text style={styles.counterText}>Leaves</Text>
          </TouchableOpacity>

          {/* Styled Green Reset Button */}
          <TouchableOpacity style={styles.resetButton} onPress={() => setIsModalVisible(true)}>
            <Text style={styles.resetButtonText}>RESET</Text>
          </TouchableOpacity>

        </View>
      </View>

      {/* The Confirmation Modal */}
      <Modal
        animationType="fade"
        transparent={true} 
        visible={isModalVisible}
        onRequestClose={() => setIsModalVisible(false)} 
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Are you sure?</Text>
            <Text style={styles.modalText}>This will permanently delete all the leaves on your plant.</Text>
            
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={() => setIsModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.modalButton, styles.confirmButton]} 
                onPress={confirmReset}
              >
                <Text style={styles.confirmButtonText}>Pop 'em!</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { 
    flex: 1, 
    backgroundColor: '#E4F9A0' 
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
    
    paddingTop: 50,
    paddingBottom: 10,
    paddingHorizontal: 20,
  },

  // --- PLANT STYLES ---
  plantWrapper: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: height * 0.42, 
  },
  plantContainer: {
    position: 'relative',
    width: 60, 
    height: '75%', 
    alignItems: 'center',
    zIndex: 1,
  },
  stem: {
    width: '100%',
    height: '100%',
  },
  leaf: {
    position: 'absolute',
    width: 45, 
    height: 45,
    zIndex: 2,
  },
  pot: {
    width: 140, 
    height: 110,
    marginTop: -15, 
    zIndex: 3,
  },

  // --- UI CONTROLS STYLES ---
  uiContainer: {
    alignItems: 'center',
    gap: 16, 
    marginBottom: 8,
  },
  counterBox: {
    backgroundColor: '#FFFFFF', 
    borderWidth: 1,
    borderColor: '#C3E88D',
    borderRadius: 24,
    paddingVertical: 14,
    paddingHorizontal: 48,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  counterNumber: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#1E293B',
    lineHeight: 40,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  counterText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#709E5B',
    lineHeight: 24,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  resetButton: {
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
  resetButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontStyle: 'italic',
    letterSpacing: 1,
  },

  // --- MODAL STYLES ---
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)', 
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 25,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 8, 
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1E293B',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  modalText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    gap: 12, 
    width: '100%',
    justifyContent: 'center',
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
    minWidth: 100,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F1F5F9',
  },
  cancelButtonText: {
    color: '#475569',
    fontWeight: '600',
    fontSize: 14,
  },
  confirmButton: {
    backgroundColor: '#2D4E1F', 
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default Plant;