import { Accelerometer } from 'expo-sensors';
import { useEffect, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {  
    const [movementStatus, setMovementStatus] = useState("Resting peacefully...");
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [IsInterrupted, setIsInterrupted] = useState(false);
  const [seconds, setSeconds] = useState(10);
  const [isActive, setIsActive] = useState(false);

  // 1. Helper function to format seconds into MM:SS
  const formatTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const remainingSeconds = totalSeconds % 60;
    
    // padStart ensures it always shows two digits (e.g., '05' instead of '5')
    const paddedMinutes = String(minutes).padStart(2, '0');
    const paddedSeconds = String(remainingSeconds).padStart(2, '0');
    
    return `${paddedMinutes}:${paddedSeconds}`;
  };

  // 2. Helper function to reset the timer
  const resetTimer = () => {
    setIsActive(false); // Pause the timer
    setSeconds(10);      // Reset time to zero
  };

  useEffect(() => {
    // 2. Set how often the sensor checks for movement (in milliseconds)
    // 100ms is fast enough to catch a pickup, but slow enough to save battery.
    Accelerometer.setUpdateInterval(100);

    // 3. Subscribe to the sensor data stream
    const subscription = Accelerometer.addListener(accelerometerData => {
      const { x, y, z } = accelerometerData;
      
      // 4. The Physics Math: Calculate total acceleration magnitude
      // Using the Pythagorean theorem for 3D space: √(x² + y² + z²)
      const totalForce = Math.sqrt(x * x + y * y + z * z);

      const isYanked = totalForce > 1.5;

      // 2. The new check: Did they smoothly tilt it up to look at it?
      // If Z drops below 0.8, it is no longer flat on the table.
      // If Y goes above 0.3, the top of the phone is pointing up.
      const isTilted = z < 0.9 && Math.abs(y) > 0.2;

      // 5. Check if the force is high enough to be considered a "pickup" or "shake"
      // 1.0 is normal resting gravity. 1.5 means a deliberate, sharp movement.
      if (isYanked || isTilted) {
        setMovementStatus("Woah! Put me down!");
        setIsInterrupted(true);
        // Optional: Reset the text back to normal after 2 seconds
        setTimeout(() => {
          setMovementStatus("Resting peacefully...");
        }, 2000);
      }
    });

    // 6. Cleanup: Turn off the sensor when leaving the screen to save battery
    return () => {
      subscription.remove();
    };
  }, []);



  useEffect(() => {
    let interval: any;
    
    if (isActive) {
      interval = setInterval(() => {
        setSeconds((prevSeconds) => {
          // When the timer is about to hit 0...
          if (prevSeconds <= 1) {
            clearInterval(interval);
            setIsActive(false);
            
            // Trigger the native popup!
            setIsModalVisible(true);

            
            return 0;
          }
          return prevSeconds - 1;
        });
      }, 1000);
    } else {
      clearInterval(interval);
    }
    
    return () => clearInterval(interval);
  }, [isActive]); 

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.container}>
        
        <Text style={styles.titleText}>Movement Detector</Text>
        
        {/* Dynamic text that changes based on the movement status */}
        <Text style={[
          styles.statusText, 
          movementStatus !== "Resting peacefully..." && styles.statusActive
        ]}>
          {movementStatus}
        </Text>

      </View>

        <Text style={styles.bigText}>
          Welcome to my App!
        </Text>

        <View style={styles.container}>
          {/* 3. Display the formatted time instead of plain seconds */}
          <Text style={styles.bigText}>
            {formatTime(seconds)}
          </Text>
          
          {/* 4. Group the buttons horizontally */}
          <View style={styles.buttonRow}>
            <TouchableOpacity 
              style={[styles.button, isActive ? styles.buttonStop : styles.buttonStart]} 
              onPress={() => setIsActive(!isActive)}
            >
              <Text style={styles.buttonText}>
                {isActive ? 'Pause' : 'Start'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.button, styles.buttonReset]} 
              onPress={resetTimer}
            >
              <Text style={styles.buttonText}>Reset</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.smallText}>
          Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque
          ipsa quae ab illo inventore veritatis et quasi
          architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit,
          sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia 
          dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi
          tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem. Ut enim ad minima veniam, quis nostrum exercitationem 
          ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur? Quis autem vel eum iure reprehenderit qui in ea 
          voluptate velit esse quam nihil molestiae consequatur, vel illum qui dolorem eum fugiat quo voluptas nulla pariatur?"
        </Text>
      </ScrollView>

        <Modal
        animationType="fade"         // Makes it smoothly fade in
        transparent={true}           // Allows the background behind the modal to show through
        visible={IsInterrupted}     // Tied to our state variable
        onRequestClose={() => setIsInterrupted(false)} // Handles the Android hardware back button
      >
        {/* The dark, semi-transparent background overlay */}
        <View style={styles.modalOverlay}>
          
          {/* The actual white pop-up card */}
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Loss</Text>
            <Text style={styles.modalMessage}>Restart a new session.</Text>
            
            {/* A button to close the modal and restart the timer */}
            <TouchableOpacity 
              style={[styles.button, styles.buttonStart, { width: '100%', alignItems: 'center' }]} 
              onPress={() => {
                setIsModalVisible(false); // Hide the popup
                resetTimer();             // Start fresh
              }}
            >
              <Text style={styles.buttonText}>Restart Timer</Text>
            </TouchableOpacity>
          </View>

        </View>
      </Modal>


        <Modal
        animationType="fade"         // Makes it smoothly fade in
        transparent={true}           // Allows the background behind the modal to show through
        visible={isModalVisible}     // Tied to our state variable
        onRequestClose={() => setIsModalVisible(false)} // Handles the Android hardware back button
      >
        {/* The dark, semi-transparent background overlay */}
        <View style={styles.modalOverlay}>
          
          {/* The actual white pop-up card */}
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>🎉 Time's Up!</Text>
            <Text style={styles.modalMessage}>Great job completing your 30-minute session.</Text>
            
            {/* A button to close the modal and restart the timer */}
            <TouchableOpacity 
              style={[styles.button, styles.buttonStart, { width: '100%', alignItems: 'center' }]} 
              onPress={() => {
                setIsModalVisible(false); // Hide the popup
                resetTimer();             // Start fresh
              }}
            >
              <Text style={styles.buttonText}>Restart Timer</Text>
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
    backgroundColor: '#ffffff', 
  },
  scrollContainer: {
    padding: 20, 
    alignItems: 'center', 
  },
  titleText: {
    fontSize: 28,          
    fontWeight: '900',       
    color: '#333333',
    marginBottom: 20,
  },
  statusText: {
    fontSize: 20,          
    fontWeight: '600',       
    color: '#666666',      
    textAlign: 'center',
  },
  statusActive: {
    color: '#ff4444', // Change color when active
  },

  bigText: {
    fontSize: 48,          
    fontWeight: '900',     
    textAlign: 'center',   
    marginTop: 20,         
    color: '#333333',      
  },
  smallText: {
    fontSize: 24,          
    fontWeight: '600',     
    textAlign: 'center',   
    marginTop: 20,         
    color: '#666666',      
  },
  container: {
    alignItems: 'center', 
    marginTop: 40,
  },
  buttonRow: {
    flexDirection: 'row', // Places buttons side-by-side
    gap: 15,              // Adds 15px of space between the buttons
    marginTop: 20,
  },
  button: {
    paddingVertical: 15,
    paddingHorizontal: 30, // Slightly reduced horizontal padding so they fit better
    borderRadius: 30, 
  },
  buttonStart: {
    backgroundColor: '#0a7ea4', 
  },
  buttonStop: {
    backgroundColor: '#ff4444', 
  },
  buttonReset: {
    backgroundColor: '#666666', // A neutral gray for the reset button
  },
  buttonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  // Styles for the modal and its components
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)', // The dark, transparent background effect
  },
  modalCard: {
    width: '80%',                 // Takes up 80% of the screen width
    backgroundColor: 'white',
    borderRadius: 25,             // Smooth, rounded corners
    padding: 30,
    alignItems: 'center',
    // These properties add a subtle drop shadow (iOS and Android have different shadow engines)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8, 
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#333333',
    marginBottom: 10,
  },
  modalMessage: {
    fontSize: 18,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 24,
  }
});