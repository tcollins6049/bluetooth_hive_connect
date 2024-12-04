import React, { useState } from 'react';
import { View, TouchableOpacity, Animated, Text, StyleSheet } from 'react-native';

const SideMenu: React.FC<{navigation: any, deviceId: string, deviceName: string}> = ({ navigation, deviceId, deviceName }) => {
  const [menuWidth] = useState(new Animated.Value(-250)); // Initially off-screen
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [buttonRotation] = useState(new Animated.Value(0)); // For rotating button to form an 'X'

  const toggleMenu = () => {
    const toValue = isMenuOpen ? -250 : 0;
    Animated.timing(menuWidth, {
      toValue,
      duration: 300,
      useNativeDriver: true,
    }).start();
    setIsMenuOpen(!isMenuOpen);

    // Animating button rotation to create the "X" effect
    Animated.timing(buttonRotation, {
      toValue: isMenuOpen ? 0 : 1, // Rotate to create 'X' when menu opens
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  // Interpolate rotation to make the hamburger menu lines change into an "X"
  const rotateButton = buttonRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'], // 45 degrees for 'X' symbol
  });

  return (
    <>
      {/* Side menu container */}
      <Animated.View
        style={[styles.menuContainer, { transform: [{ translateX: menuWidth }] }]}
      >
        <TouchableOpacity style={styles.menuButton} onPress={() => navigation.navigate('VarScreen', { deviceId, deviceName })}>
          <Text style={styles.menuButtonText}>Modifications</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuButton} onPress={() => navigation.navigate('audio', { deviceId, deviceName })}>
          <Text style={styles.menuButtonText}>Audio</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuButton} onPress={() => navigation.navigate('video', { deviceId, deviceName })}>
          <Text style={styles.menuButtonText}>Video</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Floating Half-Circle Button to toggle the menu */}
      <TouchableOpacity style={styles.sideButtonContainer} onPress={toggleMenu}>
        <Animated.View
          style={[styles.sideButton, { transform: [{ rotate: rotateButton }] }]}
        >
          {/* The half-circle button shape */}
          <View style={styles.halfCircle}>
            {/* Three-bar hamburger icon inside the half-circle */}
            <View style={styles.hamburger}>
              <View style={styles.bar}></View>
              <View style={styles.bar}></View>
              <View style={styles.bar}></View>
            </View>
          </View>
        </Animated.View>
      </TouchableOpacity>
    </>
  );
};

const styles = StyleSheet.create({
  menuContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: 170,
    backgroundColor: '#e0e0e0',
    zIndex: 150,
    borderRightWidth: 1,
    borderColor: '#ddd',
    paddingTop: 50,
  },
  menuButton: {
    padding: 20,
  },
  menuButtonText: {
    fontSize: 18,
    fontWeight: 'bold', // Make text bold
  },
  sideButtonContainer: {
    position: 'absolute',
    top: '0%',
    left: 0,
    zIndex: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sideButton: {
    width: 60, // Initially small width
    height: 60, // Initially small height
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'column',
    padding: 8,
  },
  halfCircle: {
    width: 60,
    height: 60,
    backgroundColor: '#aaa',
    borderTopRightRadius: 30, // Half-circle shape with the flat edge on the left
    borderBottomRightRadius: 30,
    position: 'absolute',
    left: 0, // Keep it to the left side of the screen
    justifyContent: 'center',
    alignItems: 'center',
  },
  hamburger: {
    width: 30,
    height: 20,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bar: {
    width: '100%',
    height: 4,
    backgroundColor: '#fff',
  },
});

export default SideMenu;
