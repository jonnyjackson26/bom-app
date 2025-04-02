import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, View, TouchableOpacity, Platform, Dimensions } from 'react-native';
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

  // Measure the actual dimensions of the menu when it renders
  const onLayout = (event: any) => {
    if (!hasMeasured.current) {
      const { width, height } = event.nativeEvent.layout;
      setMenuDimensions({ width, height });
      updateMenuPosition(position);
      hasMeasured.current = true;
    }
  };

  return (
    <View 
      ref={menuRef}
      style={[styles.container, { top: menuPosition.top, left: menuPosition.left }]}
      onLayout={onLayout}
    >
      <View style={styles.menu}>
        <TouchableOpacity style={styles.menuItem} onPress={onHighlight}>
          <FontAwesome name="paint-brush" size={22} color="#FF9500" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={onAnnotate}>
          <FontAwesome name="pencil" size={22} color="#007AFF" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={onShare}>
          <FontAwesome name="share" size={22} color="#34C759" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={onCopy}>
          <FontAwesome name="copy" size={22} color="#5856D6" />
        </TouchableOpacity>
      </View>
    </View>
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