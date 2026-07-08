import React, { useEffect, useRef, useState } from 'react';
import { Animated, Image, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LeafConfig, usePlant } from '../PlantContext';

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

const Plant = () => {
  const { leaves, addLeaf, clearLeaves } = usePlant();
  
  // NEW: State to control if the confirmation modal is showing
  const [isModalVisible, setIsModalVisible] = useState(false);

  // Helper function to handle the actual reset
  // Helper function to handle the actual reset
  const confirmReset = () => {
    // 1. Instantly start fading out the modal
    setIsModalVisible(false); 

    // 2. Wait 300 milliseconds for the modal to completely disappear, THEN trigger the explosion
    setTimeout(() => {
      clearLeaves();
    }, 300); 
  };

  return (
    <View style={styles.wrapper}>
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

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.growButton} onPress={addLeaf}>
          <Text style={styles.buttonText}>Grow Unique Leaf 🌿</Text>
        </TouchableOpacity>

        {/* Change the Reset button to open the Modal instead of instantly resetting */}
        <TouchableOpacity style={styles.resetButton} onPress={() => setIsModalVisible(true)}>
          <Text style={styles.resetButtonText}>Reset Plant</Text>
        </TouchableOpacity>
      </View>

      {/* NEW: The Confirmation Modal */}
      <Modal
        animationType="fade"
        transparent={true} // Allows us to see the dark background
        visible={isModalVisible}
        onRequestClose={() => setIsModalVisible(false)} // Handles the Android physical back button
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Are you sure?</Text>
            <Text style={styles.modalText}>This will permanently delete all the leaves on your plant.</Text>
            
            <View style={styles.modalButtonContainer}>
              {/* Cancel Button */}
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={() => setIsModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              {/* Confirm Button */}
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

    </View>
  );
};

const styles = StyleSheet.create({
  // ... (Keep all your existing styles here)
  wrapper: {
    flex: 1,                  
    justifyContent: 'flex-end', 
    alignItems: 'center',     
    marginBottom: 50,            
  },
  plantContainer: {
    position: 'relative',
    width: 60, 
    height: 300, 
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
    width: 130, 
    height: 100,
    marginTop: -30,
    zIndex: 3,
  },
  buttonContainer: {
    marginTop: 40,
    alignItems: 'center',
    gap: 12, 
  },
  growButton: {
    backgroundColor: '#388E3C', 
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 30,
  },
  resetButton: {
    backgroundColor: 'transparent', 
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 17,
    fontWeight: 'bold',
  },
  resetButtonText: {
    color: '#D32F2F', 
    fontSize: 15,
    fontWeight: '600',
  },

  // --- NEW MODAL STYLES ---
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent black background
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
    elevation: 5, // Android shadow
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
    gap: 16, // Space between the two buttons
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
    backgroundColor: '#D32F2F', // Danger Red
  },
  confirmButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 15,
  },
});

export default Plant;