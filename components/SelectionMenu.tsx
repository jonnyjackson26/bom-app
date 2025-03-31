import React from 'react';
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
  const screenWidth = Dimensions.get('window').width;
  const menuWidth = 160; // Width of our menu
  const padding = 16; // Padding from screen edges

  // Calculate position to ensure menu stays within screen bounds
  let left = position.x;
  let top = position.y;

  // Adjust horizontal position if menu would go off screen
  if (left + menuWidth > screenWidth - padding) {
    left = screenWidth - menuWidth - padding;
  }

  // Ensure menu doesn't go off the left side
  if (left < padding) {
    left = padding;
  }

  return (
    <View style={[styles.container, { top, left }]}>
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