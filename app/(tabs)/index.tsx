import { StyleSheet, ScrollView, TouchableOpacity, Dimensions, TextInput } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useState, useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import bomData from '@/assets/data/bom.json';

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
  const navigation = useNavigation();

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

  const renderContent = () => {
    if (selectedChapter) {
      // Show verses for selected chapter
      const verses = getVerses();
      return (
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.versesContent}
          showsVerticalScrollIndicator={false}
        >
          <TextInput 
            style={styles.verseText} 
            value={verses.map((verse: string, index: number) => `${index + 1} ${verse}`).join('\n\n')}
            editable={false}
            multiline={true}
          />
        </ScrollView>
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
});
