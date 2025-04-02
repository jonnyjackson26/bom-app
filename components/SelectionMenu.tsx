import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, View, TouchableOpacity, Platform, Dimensions, Animated } from 'react-native';
import { Text } from './Themed';
import { FontAwesome } from '@expo/vector-icons';

type SelectionMenuProps = {
  position: { x: number; y: number };
  onHighlight: () => void;
  onAnnotate: () => void;
  onShare: () => void;
  onCopy: () => void;
  onDismiss: () => void;
};

export function SelectionMenu({ position, onHighlight, onAnnotate, onShare, onCopy, onDismiss }: SelectionMenuProps) {
  const [menuDimensions, setMenuDimensions] = useState({ width: 50, height: 220 });
  const [menuPosition, setMenuPosition] = useState({ left: 0, top: 0 });
  const hasMeasured = useRef(false);
  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;
  const padding = 16; // Padding from screen edges
  const menuRef = useRef<View>(null);
  const animatedValue = useRef(new Animated.Value(0)).current;

  // Run entrance animation when component mounts
  useEffect(() => {
    Animated.spring(animatedValue, {
      toValue: 1,
      friction: 7,
      tension: 70,
      useNativeDriver: true,
    }).start();
    
    return () => {
      // Reset animation when component unmounts
      animatedValue.setValue(0);
    };
  }, []);

  // Update position immediately when the input position changes
  useEffect(() => {
    updateMenuPosition(position);
  }, [position]);
  
  const updateMenuPosition = (pos: { x: number, y: number }) => {
    // Position the menu on the right side of the screen
    // Ensure there's a reasonable gap between the text and menu
    const rightSidePosition = screenWidth - menuDimensions.width - padding;
    
    // Always position menu to the right of the screen
    let left = rightSidePosition;
    
    // Vertically center the menu with the selection
    let top = pos.y - (menuDimensions.height / 2);
    
    // Ensure menu stays within vertical screen bounds
    if (top < padding) {
      top = padding;
    }
    
    if (top + menuDimensions.height > screenHeight - padding) {
      top = screenHeight - menuDimensions.height - padding;
    }
    
    setMenuPosition({ left, top });
  };

  // Animate out and then dismiss
  const animatedDismiss = (callback: () => void) => {
    Animated.timing(animatedValue, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      callback();
    });
  };

  // Wrap each action with animation
  const animatedHighlight = () => animatedDismiss(onHighlight);
  const animatedAnnotate = () => animatedDismiss(onAnnotate);
  const animatedShare = () => animatedDismiss(onShare);
  const animatedCopy = () => animatedDismiss(onCopy);

  // Measure the actual dimensions of the menu when it renders
  const onLayout = (event: any) => {
    if (!hasMeasured.current) {
      const { width, height } = event.nativeEvent.layout;
      setMenuDimensions({ width, height });
      updateMenuPosition(position);
      hasMeasured.current = true;
    }
  };

  // Animation transforms
  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [50, 0], // Slide in from right
  });

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  return (
    <Animated.View 
      ref={menuRef}
      style={[
        styles.container, 
        { top: menuPosition.top, left: menuPosition.left },
        { opacity, transform: [{ translateX }] }
      ]}
      onLayout={onLayout}
    >
      <View style={styles.menu}>
        <TouchableOpacity style={styles.menuItem} onPress={animatedHighlight}>
          <FontAwesome name="paint-brush" size={22} color="#FF9500" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={animatedAnnotate}>
          <FontAwesome name="pencil" size={22} color="#007AFF" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={animatedShare}>
          <FontAwesome name="share" size={22} color="#34C759" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={animatedCopy}>
          <FontAwesome name="copy" size={22} color="#5856D6" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 1000,
  },
  menu: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    flexDirection: 'column',
    alignItems: 'center',
  },
  menuItem: {
    padding: 10,
    marginVertical: 4,
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
}); 