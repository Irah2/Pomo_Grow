import React, { useEffect, useRef } from 'react';
import { Animated, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LeafConfig, usePlant } from '../PlantContext';

// 1. DEDICATED ANIMATED LEAF COMPONENT
const AnimatedLeaf = ({ leaf }: { leaf: LeafConfig }) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current; // NEW: Tracks visibility

  useEffect(() => {
    // --- THE POP / BURST ANIMATION ---
    // If context tells this leaf it is resetting, run the explosion and ignore the rest!
    if (leaf.isPopping) {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: leaf.scale * 1.5, // Burst outward to 1.5x size
          duration: 250, // Fast burst
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0, // Fade into nothingness
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
      return; // Exit early so the growing animation doesn't run
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
      // If the leaf starts popping mid-breath, abort the breathing cycle
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
          opacity: opacityAnim, // Bind the new opacity value here
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
  // Pull in clearLeaves from your context
  const { leaves, addLeaf, clearLeaves } = usePlant();

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

      {/* Button Container to hold both buttons nicely */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.growButton} onPress={addLeaf}>
          <Text style={styles.buttonText}>Grow Unique Leaf 🌿</Text>
        </TouchableOpacity>

        {/* New Reset Button */}
        <TouchableOpacity style={styles.resetButton} onPress={clearLeaves}>
          <Text style={styles.resetButtonText}>Reset Plant</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
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
    gap: 12, // Adds space between the buttons
  },
  growButton: {
    backgroundColor: '#388E3C', 
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 30,
  },
  resetButton: {
    backgroundColor: 'transparent', // Make it less prominent than the grow button
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 17,
    fontWeight: 'bold',
  },
  resetButtonText: {
    color: '#D32F2F', // A subtle red color to indicate deletion
    fontSize: 15,
    fontWeight: '600',
  }
});

export default Plant;