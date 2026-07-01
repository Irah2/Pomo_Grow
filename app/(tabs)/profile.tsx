import React from 'react';
import { DimensionValue, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { usePlant } from './PlantContext';

// 1. Updated Interface: Include color and scale for variation
interface LeafConfig {
  id: string;
  top: DimensionValue;
  left?: DimensionValue;
  right?: DimensionValue;
  rotation: number;
  scale: number; // Scale factor (e.g., 0.8 to 1.2)
  color: string; // Hex color string (e.g., '#FF0000')
}

// 2. Helper function to generate a random hex color
const getRandomHexColor = (): string => {
  const hexChars = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += hexChars[Math.floor(Math.random() * 16)];
  }
  return color;
};

const Plant = () => {
  const { leaves, addLeaf } = usePlant();
  {/**
  const [leaves, setLeaves] = useState<LeafConfig[]>([]);

  const addLeaf = () => {
    const isLeft = Math.random() > 0.5;

    // Create a new leaf with unique, random properties
    const newLeaf: LeafConfig = {
      id: `leaf-${Date.now()}`, // Unique ID based on time
      top: `${Math.floor(Math.random() * 65) + 10}%`, // Random placement on the stem
      rotation: isLeft ? -Math.random() * 40 - 20 : Math.random() * 40 + 20, // Variation in angle
      scale: Math.random() * 0.6 + 0.7, // 3. Random Size: Between 0.7x and 1.3x size
      color: getRandomHexColor(), // 4. Random Color: Generate new color
    };

    if (isLeft) {
      newLeaf.left = -20;
    } else {
      newLeaf.right = -20;
    }

    setLeaves((currentLeaves) => [...currentLeaves, newLeaf]);
     */}
  

  return (
    <View style={styles.wrapper}>
      {/* Container holding the stem and dynamic leaves */}
      <View style={styles.plantContainer}>
        {/* The Base Stem */}
        <Image
          source={require('../../assets/images/stem.png')}
          style={styles.stem}
          resizeMode="contain"
        />

        {/* Dynamic Assembly Line (reads from 'leaves' state) */}
        {leaves.map((leaf) => (
          <Image
            key={leaf.id}
            source={require('../../assets/images/leaf.png')}
            style={[
              styles.leaf,
              {
                top: leaf.top,
                ...(leaf.left !== undefined && { left: leaf.left }),
                ...(leaf.right !== undefined && { right: leaf.right }),
                // 5. Apply the random color and size variation
                tintColor: leaf.color, // Recolors the leaf PNG
                transform: [
                  { rotate: `${leaf.rotation}deg` },
                  { scale: leaf.scale }, // Scales the leaf image
                ],
              },
            ]}
            resizeMode="contain"
          />
        ))}
      </View>

      {/* The Pot (plant base) */}
      <Image
        source={require('../../assets/images/pot.png')}
        style={styles.pot}
        resizeMode="contain"
      />

      {/* Interaction Button */}
      <TouchableOpacity style={styles.button} onPress={addLeaf}>
        <Text style={styles.buttonText}>Grow Unique Leaf 🌿</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,                  // 1. Tells the wrapper to stretch and fill the whole screen
    justifyContent: 'center', // 2. Pushes everything to the vertical center (up and down)
    alignItems: 'center',     // 3. Keeps everything in the horizontal center (left and right)
    // Remove marginTop: 50
  },
  plantContainer: {
    position: 'relative',
    width: 60, // Adjust to your stem width
    height: 300, // Adjust to your stem height
    alignItems: 'center',
    zIndex: 1,
  },
  stem: {
    width: '100%',
    height: '100%',
  },
  leaf: {
    position: 'absolute',
    width: 45, // Base leaf width before scaling
    height: 45,
    zIndex: 2,
  },
  pot: {
    width: 130, // Adjust to your pot width
    height: 100,
    marginTop: -30,
    zIndex: 3,
  },
  button: {
    marginTop: 40,
    backgroundColor: '#388E3C', // Rich green
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 30,
  },
  buttonText: {
    color: 'white',
    fontSize: 17,
    fontWeight: 'bold',
  },
});

export default Plant;