import { StyleSheet, ScrollView, TouchableOpacity, Dimensions, TextInput, Modal, View, TouchableWithoutFeedback } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Text } from '@/components/Themed';
import { useState, useEffect, useRef } from 'react';
import { useNavigation } from '@react-navigation/native';
import bomData from '@/assets/data/bom.json';
import { SelectionMenu } from '@/components/SelectionMenu';

// Define types for the Book of Mormon data structure
type BookOfMormonData = {
  [key: string]: {
    [key: string]: string[];
  };
};

const booksOfMormon = [
  '1 Nephi',
  '2 Nephi',
  'Jacob',
  'Enos',
  'Jarom',
  'Omni',
  'Words of Mormon',
  'Mosiah',
  'Alma',
  'Helaman',
  '3 Nephi',
  '4 Nephi',
  'Mormon',
  'Ether',
  'Moroni'
];

// Chapter counts for each book
const bookChapters: { [key: string]: number } = {
  '1 Nephi': 22,
  '2 Nephi': 33,
  'Jacob': 7,
  'Enos': 1,
  'Jarom': 1,
  'Omni': 1,
  'Words of Mormon': 1,
  'Mosiah': 29,
  'Alma': 63,
  'Helaman': 16,
  '3 Nephi': 30,
  '4 Nephi': 1,
  'Mormon': 9,
  'Ether': 15,
  'Moroni': 10
};

export default function TabOneScreen() {
  const [selectedBook, setSelectedBook] = useState<string | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);
  const [selectedText, setSelectedText] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const textInputRef = useRef<TextInput>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const navigation = useNavigation();
  const [selectionPosition, setSelectionPosition] = useState({ x: 0, y: 0 });
  const [showSelectionMenu, setShowSelectionMenu] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [lastSelectionEnd, setLastSelectionEnd] = useState(0);

  useEffect(() => {
    // Set up the back button in the header
    if (selectedBook) {
      navigation.setOptions({
        headerLeft: () => (
          <TouchableOpacity 
            onPress={() => {
              if (selectedChapter) {
                setSelectedChapter(null);
              } else {
                setSelectedBook(null);
                navigation.setOptions({
                  title: 'Book of Mormon'
                });
              }
            }}
            style={styles.backButton}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
        ),
        title: selectedChapter ? `${selectedBook} Chapter ${selectedChapter}` : selectedBook
      });
    } else {
      navigation.setOptions({
        headerLeft: undefined,
        title: 'Book of Mormon'
      });
    }
  }, [selectedBook, selectedChapter]);

  const handleBookSelect = (book: string) => {
    setSelectedBook(book);
  };

  const handleChapterSelect = (chapter: number) => {
    setSelectedChapter(chapter);
  };

  const getVerses = () => {
    if (!selectedBook || !selectedChapter) return [];
    
    // Convert book name to JSON key format (e.g., "1 Nephi" to "1-nephi")
    const bookKey = selectedBook.toLowerCase().replace(' ', '-');
    return (bomData as BookOfMormonData)[bookKey]?.[selectedChapter.toString()] || [];
  };

  const handleTextSelection = (event: any) => {
    const { selection } = event.nativeEvent;
    if (selection) {
      const { start, end } = selection;
      const text = event.nativeEvent.text;
      
      // Check if text is being unselected (start equals end)
      if (start === end) {
        // No text is selected, hide the menu
        setShowSelectionMenu(false);
        setSelectedText('');
        setLastSelectionEnd(0);
        return;
      }
      
      const selectedText = text.substring(start, end);
      
      if (selectedText.trim()) {
        setSelectedText(selectedText);
        
        // Only update position if the selection has changed
        if (end !== lastSelectionEnd) {
          setLastSelectionEnd(end);
          
          // Get the position of the selection
          textInputRef.current?.measure((x, y, width, height, pageX, pageY) => {
            // Calculate approximate position of the MIDDLE of the selection
            // This is an estimation since we can't get exact coordinates
            const totalTextLength = text.length;
            const selectionStartPercent = start / totalTextLength;
            const selectionEndPercent = end / totalTextLength;
            const selectionMidPercent = (selectionStartPercent + selectionEndPercent) / 2;
            
            // Estimate vertical position of the middle of the selection
            const selectionY = pageY + (height * selectionMidPercent);
            
            // Send the position to the menu component
            setSelectionPosition({ 
              x: pageX + width, // Position to the right of text
              y: selectionY // Center of selection
            });
            
            // Only show the menu if it wasn't already showing
            if (!showSelectionMenu) {
              setShowSelectionMenu(true);
            }
          });
        }
      }
    }
  };

  const handleScroll = (event: any) => {
    const currentScrollY = event.nativeEvent.contentOffset.y;
    
    // Keep track of last scroll position
    const scrollDifference = currentScrollY - lastScrollY;
    setLastScrollY(currentScrollY);
    
    // If menu is showing and there's an active selection, update its position to move with the scroll
    if (showSelectionMenu && selectedText) {
      // Directly adjust the position based on the scroll amount
      setSelectionPosition(prevPos => ({
        x: prevPos.x, // Keep x position the same
        y: prevPos.y - scrollDifference // Move menu with the scroll
      }));
    }
  };

  const handleHighlight = () => {
    // TODO: Implement highlighting
    setShowSelectionMenu(false);
  };

  const handleAnnotate = () => {
    // TODO: Implement annotation
    setShowSelectionMenu(false);
  };

  const handleShare = () => {
    // TODO: Implement sharing
    setShowSelectionMenu(false);
  };

  const handleCopy = () => {
    // Copy selected text to clipboard
    if (selectedText) {
      // Using dynamic import for Clipboard since the API changed in React Native
      const copyToClipboard = async () => {
        try {
          // Try using the newer API first
          if (navigator && navigator.clipboard) {
            await navigator.clipboard.writeText(selectedText);
          } else {
            // Fallback for older React Native versions or platforms without navigator.clipboard
            const Clipboard = require('react-native').Clipboard;
            Clipboard.setString(selectedText);
          }
          console.log('Copied to clipboard:', selectedText);
        } catch (error) {
          console.error('Failed to copy text: ', error);
        }
      };
      
      copyToClipboard();
    }
    setShowSelectionMenu(false);
  };

  const renderContent = () => {
    if (selectedChapter) {
      // Show verses for selected chapter
      const verses = getVerses();
      return (
        <View 
          style={styles.container}
          onStartShouldSetResponder={() => {
            // Close the menu if tapping outside the selection
            if (showSelectionMenu) {
              setShowSelectionMenu(false);
              return true;
            }
            return false;
          }}
        >
          <ScrollView 
            ref={scrollViewRef}
            style={styles.scrollView}
            contentContainerStyle={styles.versesContent}
            showsVerticalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
          >
            <TextInput 
              ref={textInputRef}
              style={styles.verseText} 
              value={verses.map((verse: string, index: number) => `${index + 1} ${verse}`).join('\n\n')}
              editable={false}
              multiline={true}
              onSelectionChange={handleTextSelection}
              contextMenuHidden={true}
            />
          </ScrollView>
          {showSelectionMenu && (
            <SelectionMenu
              position={selectionPosition}
              onHighlight={handleHighlight}
              onAnnotate={handleAnnotate}
              onShare={handleShare}
              onCopy={handleCopy}
              onDismiss={() => setShowSelectionMenu(false)}
            />
          )}
        </View>
      );
    }

    if (selectedBook) {
      // Show chapters for selected book
      const chapters = Array.from({ length: bookChapters[selectedBook] }, (_, i) => i + 1);
      return (
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {chapters.map((chapter) => (
            <TouchableOpacity 
              key={chapter}
              style={styles.chapterButton}
              onPress={() => handleChapterSelect(chapter)}
            >
              <Text style={styles.chapterText}>Chapter {chapter}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      );
    }

    // Show books list
    return (
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {booksOfMormon.map((book, index) => (
          <TouchableOpacity 
            key={index}
            style={styles.bookButton}
            onPress={() => handleBookSelect(book)}
          >
            <Text style={styles.bookText}>{book}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

  return (
    <View style={styles.container}>
      {renderContent()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  versesContent: {
    padding: 16,
    paddingBottom: 32,
  },
  bookButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  chapterButton: {
    backgroundColor: '#34C759',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  bookText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  chapterText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  backButton: {
    marginLeft: 16,
  },
  backButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  verseText: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
    color: '#000',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  menuContainer: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    minWidth: 200,
  },
  menuItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  menuText: {
    fontSize: 16,
    color: '#000',
  },
});
