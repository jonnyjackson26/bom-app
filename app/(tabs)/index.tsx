import { StyleSheet, ScrollView, TouchableOpacity, Dimensions, TextInput, Modal, View, TouchableWithoutFeedback, Share } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import AsyncStorage from '@react-native-async-storage/async-storage';
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

// Enhanced highlight type with color option
type Highlight = {
  text: string, 
  start: number, 
  end: number,
  color?: string
};

// Available highlight colors
const HIGHLIGHT_COLORS = {
  yellow: 'rgba(255, 235, 59, 0.4)',
  green: 'rgba(76, 175, 80, 0.4)',
  blue: 'rgba(33, 150, 243, 0.4)',
  pink: 'rgba(233, 30, 99, 0.4)',
  purple: 'rgba(156, 39, 176, 0.4)',
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

// A component for text highlighting directly over the selected text
const HighlightedText = ({ 
  text, 
  highlights, 
  style, 
  onSelectionChange,
  textRef,
  removeHighlight,
  updateHighlightColor
}: { 
  text: string, 
  highlights: Highlight[],
  style: any,
  onSelectionChange: (event: any) => void,
  textRef: React.RefObject<TextInput>,
  removeHighlight?: (index: number) => void,
  updateHighlightColor?: (index: number, color: string) => void
}) => {
  // Extract style values safely
  const fontSize = style?.fontSize || 16;
  const lineHeight = style?.lineHeight || 24;
  const textColor = style?.color || '#000';
  const padding = style?.padding || 12;
  const paddingVertical = style?.paddingVertical || 12;

  type TextSegment = {
    text: string;
    isHighlighted: boolean;
    color: string | undefined;
    index: number;
  };

  // Render a segment with appropriate styling
  const renderSegment = (segment: TextSegment, lineIndex: number, segmentIndex: number) => {
    return (
      <Text
        key={`segment-${lineIndex}-${segmentIndex}`}
        style={{
          backgroundColor: segment.isHighlighted ? segment.color : 'transparent',
          fontSize,
          lineHeight,
          color: textColor,
        }}
      >
        {segment.text}
      </Text>
    );
  };

  // Create text spans with highlights
  const renderTextWithHighlights = () => {
    // If no highlights, just return the plain text with original styling
    if (!highlights.length) {
      return (
        <Text style={[{ fontSize, lineHeight, color: textColor }]}>
          {text}
        </Text>
      );
    }
    
    // Split text into paragraphs (preserving the original paragraph structure)
    const paragraphs = text.split('\n\n');
    const paragraphOffsets: number[] = [];
    
    // Calculate the offset of each paragraph in the original text
    let offset = 0;
    paragraphs.forEach(p => {
      paragraphOffsets.push(offset);
      offset += p.length + 2; // +2 for '\n\n'
    });
    
    // Render each paragraph with its highlights
    return paragraphs.map((paragraph, paragraphIndex) => {
      const paragraphOffset = paragraphOffsets[paragraphIndex];
      const isLastParagraph = paragraphIndex === paragraphs.length - 1;
      
      // Find highlights that affect this paragraph
      const paragraphHighlights = highlights.filter(h => 
        (h.start >= paragraphOffset && h.start < paragraphOffset + paragraph.length) ||
        (h.end > paragraphOffset && h.end <= paragraphOffset + paragraph.length) ||
        (h.start <= paragraphOffset && h.end >= paragraphOffset + paragraph.length)
      );
      
      // If no highlights in this paragraph, render it as-is
      if (paragraphHighlights.length === 0) {
        return (
          <Text 
            key={`paragraph-${paragraphIndex}`}
            style={{
              marginBottom: isLastParagraph ? 0 : 16,
              fontSize,
              lineHeight,
              color: textColor,
            }}
          >
            {paragraph}
          </Text>
        );
      }
      
      // Create segments specifically for this paragraph
      const localSegments: TextSegment[] = [];
      let lastIdx = 0;
      
      // Sort paragraph highlights by position
      const sortedParagraphHighlights = [...paragraphHighlights].sort((a, b) => 
        Math.max(a.start - paragraphOffset, 0) - Math.max(b.start - paragraphOffset, 0)
      );
      
      sortedParagraphHighlights.forEach((highlight, idx) => {
        // Adjust highlight positions to be relative to this paragraph
        const relativeStart = Math.max(highlight.start - paragraphOffset, 0);
        const relativeEnd = Math.min(highlight.end - paragraphOffset, paragraph.length);
        
        // Only process this highlight if it actually covers some text in this paragraph
        if (relativeEnd > relativeStart) {
          // Add non-highlighted text before this highlight
          if (relativeStart > lastIdx) {
            localSegments.push({
              text: paragraph.substring(lastIdx, relativeStart),
              isHighlighted: false,
              color: undefined,
              index: -1
            });
          }
          
          // Add the highlighted text
          localSegments.push({
            text: paragraph.substring(relativeStart, relativeEnd),
            isHighlighted: true,
            color: highlight.color || HIGHLIGHT_COLORS.yellow,
            index: idx
          });
          
          lastIdx = relativeEnd;
        }
      });
      
      // Add any remaining text after the last highlight
      if (lastIdx < paragraph.length) {
        localSegments.push({
          text: paragraph.substring(lastIdx),
          isHighlighted: false,
          color: undefined,
          index: -1
        });
      }
      
      // Render this paragraph with its highlights
      return (
        <Text 
          key={`paragraph-${paragraphIndex}`} 
          style={{
            marginBottom: isLastParagraph ? 0 : 16,
          }}
        >
          {localSegments.map((segment, segmentIndex) => 
            renderSegment(segment, paragraphIndex, segmentIndex)
          )}
        </Text>
      );
    });
  };

  // Create a hidden TextInput for handling text selection
  const renderHiddenInput = () => (
    <TextInput
      ref={textRef}
      style={[
        style,
        {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          color: 'transparent',
          backgroundColor: 'transparent',
        }
      ]}
      value={text}
      editable={false}
      multiline={true}
      onSelectionChange={onSelectionChange}
      contextMenuHidden={true}
      selectionColor="rgba(255, 235, 59, 0.5)"
      scrollEnabled={false}
    />
  );

  return (
    <View style={{ position: 'relative' }}>
      {/* Visible text with highlights */}
      <View style={[
        style, 
        { 
          backgroundColor: 'white',
          padding,
          paddingVertical
        }
      ]}>
        {renderTextWithHighlights()}
      </View>
      
      {/* Hidden input to handle selection */}
      {renderHiddenInput()}
    </View>
  );
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
  const [highlightedTexts, setHighlightedTexts] = useState<Highlight[]>([]);
  const [currentSelectionRange, setCurrentSelectionRange] = useState<{ start: number, end: number } | null>(null);

  // Load highlights from storage when the book and chapter change
  useEffect(() => {
    if (selectedBook && selectedChapter) {
      loadHighlights();
    }
  }, [selectedBook, selectedChapter]);
  
  // Save highlights to AsyncStorage whenever they change
  useEffect(() => {
    if (selectedBook && selectedChapter && highlightedTexts.length > 0) {
      saveHighlights();
    }
  }, [highlightedTexts]);

  // Save highlights to storage
  const saveHighlights = async () => {
    if (!selectedBook || !selectedChapter) return;
    
    try {
      const key = `highlights_${selectedBook.replace(/\s+/g, '_')}_${selectedChapter}`;
      await AsyncStorage.setItem(key, JSON.stringify(highlightedTexts));
      console.log('Saved highlights for', key);
    } catch (error) {
      console.error('Error saving highlights:', error);
    }
  };
  
  // Load highlights from storage
  const loadHighlights = async () => {
    if (!selectedBook || !selectedChapter) return;
    
    try {
      const key = `highlights_${selectedBook.replace(/\s+/g, '_')}_${selectedChapter}`;
      const savedHighlights = await AsyncStorage.getItem(key);
      
      if (savedHighlights) {
        setHighlightedTexts(JSON.parse(savedHighlights));
        console.log('Loaded highlights for', key);
      } else {
        // No highlights found, reset to empty array
        setHighlightedTexts([]);
      }
    } catch (error) {
      console.error('Error loading highlights:', error);
      setHighlightedTexts([]);
    }
  };

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
      
      // Remember current scroll position
      const currentScrollPosition = lastScrollY;
      
      // Check if text is being unselected (start equals end)
      if (start === end) {
        // No text is selected, hide the menu
        setShowSelectionMenu(false);
        setSelectedText('');
        setLastSelectionEnd(0);
        setCurrentSelectionRange(null);
        return;
      }
      
      const selectedText = text.substring(start, end);
      
      if (selectedText.trim()) {
        setSelectedText(selectedText);
        // Store current selection range for highlighting
        setCurrentSelectionRange({ start, end });
        
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
            
            // Restore scroll position after a short delay to prevent jumping
            setTimeout(() => {
              if (scrollViewRef.current) {
                scrollViewRef.current.scrollTo({ y: currentScrollPosition, animated: false });
              }
            }, 10);
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
    // Only highlight if text is selected and we know its position
    if (selectedText && currentSelectionRange) {
      // Store the current scroll position before modifying state
      const currentScrollPosition = lastScrollY;
      
      // Store highlights for future implementation
      setHighlightedTexts(prev => {
        // Check if this text is already highlighted (toggle behavior)
        const existingIndex = prev.findIndex(h => 
          h.start === currentSelectionRange.start && 
          h.end === currentSelectionRange.end
        );
        
        if (existingIndex >= 0) {
          // Remove this highlight (toggle off)
          const newHighlights = [...prev];
          newHighlights.splice(existingIndex, 1);
          return newHighlights;
        } else {
          // Add new highlight with default yellow color
          return [...prev, {
            text: selectedText,
            start: currentSelectionRange.start,
            end: currentSelectionRange.end,
            color: HIGHLIGHT_COLORS.yellow
          }];
        }
      });
      
      // Close the menu but keep the selection
      setShowSelectionMenu(false);
      
      // Restore scroll position after a short delay to let rendering finish
      setTimeout(() => {
        if (scrollViewRef.current) {
          scrollViewRef.current.scrollTo({ y: currentScrollPosition, animated: false });
        }
      }, 50);
    } else {
      // Just close the menu if no selection
      setShowSelectionMenu(false);
    }
  };

  const handleAnnotate = () => {
    // TODO: Implement annotation
    setShowSelectionMenu(false);
  };

  const handleShare = async () => {
    // Implement sharing using Share API
    if (selectedText) {
      try {
        const result = await Share.share({
          message: selectedText,
          title: selectedBook && selectedChapter 
            ? `${selectedBook} ${selectedChapter}` 
            : 'Scripture Sharing'
        });
        
        if (result.action === Share.sharedAction) {
          if (result.activityType) {
            // shared with activity type of result.activityType
            console.log('Shared with activity type:', result.activityType);
          } else {
            // shared
            console.log('Shared successfully');
          }
        } else if (result.action === Share.dismissedAction) {
          // dismissed
          console.log('Share dismissed');
        }
      } catch (error) {
        console.error('Error sharing:', error);
      }
    }
    setShowSelectionMenu(false);
  };

  const handleCopy = () => {
    // Copy selected text to clipboard
    if (selectedText) {
      Clipboard.setStringAsync(selectedText)
        .then(() => {
          console.log('Copied to clipboard:', selectedText);
        })
        .catch(error => {
          console.error('Failed to copy text: ', error);
        });
    }
    setShowSelectionMenu(false);
  };

  const handleRemoveHighlight = (index: number) => {
    setHighlightedTexts(prev => {
      const newHighlights = [...prev];
      newHighlights.splice(index, 1);
      return newHighlights;
    });
  };

  const handleUpdateHighlightColor = (index: number, color: string) => {
    setHighlightedTexts(prev => {
      const newHighlights = [...prev];
      newHighlights[index].color = color;
      return newHighlights;
    });
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
            maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
            keyboardShouldPersistTaps="handled"
            scrollEnabled={true}
          >
            <HighlightedText
              text={verses.map((verse: string, index: number) => `${index + 1} ${verse}`).join('\n\n')}
              highlights={highlightedTexts}
              style={styles.verseText}
              onSelectionChange={handleTextSelection}
              textRef={textInputRef}
              removeHighlight={handleRemoveHighlight}
              updateHighlightColor={handleUpdateHighlightColor}
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
