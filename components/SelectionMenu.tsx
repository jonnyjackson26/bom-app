import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, View, TouchableOpacity, Platform, Dimensions } from 'react-native';
import { Text } from './Themed';

type SelectionMenuProps = {
  position: { x: number; y: number };
  onHighlight: () => void;
  onAnnotate: () => void;
  onShare: () => void;
  onCopy: () => void;
  onDismiss: () => void;
};

export function SelectionMenu({ position, onHighlight, onAnnotate, onShare, onCopy, onDismiss }: SelectionMenuProps) {
  const [menuDimensions, setMenuDimensions] = useState({ width: 160, height: 170 });
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
    // Calculate position to ensure menu stays within screen bounds
    let left = pos.x - (menuDimensions.width / 2); // Center the menu horizontally
    let top = pos.y;
  
    // Ensure menu stays within horizontal screen bounds
    if (left + menuDimensions.width > screenWidth - padding) {
      left = screenWidth - menuDimensions.width - padding;
    }
    if (left < padding) {
      left = padding;
    }
  
    // Ensure menu stays within vertical screen bounds
    // If menu would go below screen bottom, position it above the selection instead
    if (top + menuDimensions.height > screenHeight - padding) {
      // If there's not enough space above either, position at the top of the screen
      if (pos.y - menuDimensions.height < padding) {
        top = padding;
      } else {
        // Position above the selection point
        top = pos.y - menuDimensions.height - 20;
      }
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
          <Text style={styles.menuText}>Highlight</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={onAnnotate}>
          <Text style={styles.menuText}>Annotate</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={onShare}>
          <Text style={styles.menuText}>Share</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={onCopy}>
          <Text style={styles.menuText}>Copy</Text>
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
    borderRadius: 8,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    minWidth: 160,
  },
  menuItem: {
    padding: 8,
    paddingHorizontal: 12,
  },
  menuText: {
    fontSize: 14,
    color: '#000',
  },
}); 