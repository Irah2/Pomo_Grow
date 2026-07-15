import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Image, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
            <Text style={styles.counterText}>Leafs</Text>
          </TouchableOpacity>

          {/* Styled Yellow Reset Button */}
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
    justifyContent: 'space-evenly', // This dynamically spaces elements so it fits any screen height
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  headerPill: {
    backgroundColor: '#5d8e47',
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 40,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    marginTop: -4, 
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
  
  // --- PLANT STYLES ---
  plantWrapper: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    // Adjusted height to ensure it scales nicely on smaller screens
    height: height * 0.45, 
  },
  plantContainer: {
    position: 'relative',
    width: 60, 
    height: '75%', // Takes up top portion of wrapper
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
    marginTop: -15, // Overlaps perfectly with the stem
    zIndex: 3,
  },

  // --- UI CONTROLS STYLES ---
  uiContainer: {
    alignItems: 'center',
    gap: 20, 
  },
  counterBox: {
    backgroundColor: '#e6f7c6', 
    borderWidth: 1,
    borderColor: '#000000',
    borderRadius: 25,
    paddingVertical: 15,
    paddingHorizontal: 50,
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
  },
  counterNumber: {
    fontSize: 42,
    fontWeight: '900',
    color: '#000000',
    lineHeight: 46,
  },
  counterText: {
    fontSize: 28,
    fontWeight: '900',
    color: '#000000',
    lineHeight: 32,
  },
  resetButton: {
    backgroundColor: '#fcee74', 
    paddingVertical: 14,
    paddingHorizontal: 35,
    borderRadius: 30,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  resetButtonText: {
    color: '#333333',
    fontSize: 18,
    fontFamily: 'serif',
    fontStyle: 'italic',
    letterSpacing: 1,
  },

  // --- MODAL STYLES ---
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)', 
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5, 
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  modalText: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    gap: 16, 
    width: '100%',
    justifyContent: 'center',
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    minWidth: 100,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  cancelButtonText: {
    color: '#333',
    fontWeight: '600',
    fontSize: 15,
  },
  confirmButton: {
    backgroundColor: '#4c8635', 
  },
  confirmButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 15,
  },
});

export default Plant;