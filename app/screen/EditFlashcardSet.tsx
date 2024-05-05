import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Modal,
  StatusBar
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  collection,
  doc,
  getDoc,
  updateDoc,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { FIRESTORE_DB } from '../../FirebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import Voice from '@react-native-voice/voice';

const EditFlashcardSet = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { flashcardSetId } = route.params;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [flashcardData, setFlashcardData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showMicOverlay, setShowMicOverlay] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [selectedField, setSelectedField] = useState(null);
  const [recognizedText, setRecognizedText] = useState('');
  const [descriptionHeight, setDescriptionHeight] = useState(60);
  const [partialRecognizedText, setPartialRecognizedText] = useState('');
  const [selectedSetIndex, setSelectedSetIndex] = useState(null);

  useEffect(() => {
    const loadFlashcardSet = async () => {
      try {
        const flashcardSetRef = doc(FIRESTORE_DB, 'flashcard_sets', flashcardSetId);
        const flashcardSetSnapshot = await getDoc(flashcardSetRef);

        if (flashcardSetSnapshot.exists()) {
          const { title, description } = flashcardSetSnapshot.data();
          setTitle(title);
          setDescription(description);

          const flashcardsRef = collection(FIRESTORE_DB, 'flashcards');
          const flashcardsQuery = query(flashcardsRef, where('flashcard_set_id', '==', flashcardSetId));
          const querySnapshot = await getDocs(flashcardsQuery);

          const loadedFlashcards = [];
          querySnapshot.forEach((doc) => {
            const { term, definition } = doc.data();
            loadedFlashcards.push({ id: doc.id, term, definition });
          });

          setFlashcardData(loadedFlashcards);
        } else {
          Alert.alert('Error', 'Flashcard set not found.');
        }
      } catch (error) {
        console.error('Error loading flashcard set:', error);
        Alert.alert('Error', 'Failed to load flashcard set. Please try again.');
      }
    };

    loadFlashcardSet();
  }, [flashcardSetId]);

  useEffect(() => {
    Voice.onSpeechResults = (e) => {
        setRecognizedText(e.value[0]);
    };

    Voice.onSpeechPartialResults = (e) => {
        setPartialRecognizedText(e.value[0]);
    };

    return () => {
        Voice.destroy().then(Voice.removeAllListeners);
    };
}, [flashcardSetId]);

  const startRecording = async () => {
    try {
      await Voice.start('en-US');
      setIsRecording(true);
    } catch (error) {
      Alert.alert('Recording Error', 'Failed to start recording. Please try again.');
      console.error('Failed to start recording', error);
    }
  };

  const stopRecording = async () => {
    try {
      await Voice.stop();
      setIsRecording(false);
    } catch (error) {
      Alert.alert('Recording Error', 'Failed to stop recording. Please try again.');
      console.error('Failed to stop recording', error);
    }
  };

  const handleTermChange = (text, index) => {
    const updatedFlashcards = [...flashcardData];
    updatedFlashcards[index].term = text;
    setFlashcardData(updatedFlashcards);
  };

  const handleDefinitionChange = (text, index) => {
    const updatedFlashcards = [...flashcardData];
    updatedFlashcards[index].definition = text;
    setFlashcardData(updatedFlashcards);
  };

  const handleSaveChanges = async () => {
    try {
      setLoading(true);

      const flashcardSetRef = doc(FIRESTORE_DB, 'flashcard_sets', flashcardSetId);
      await updateDoc(flashcardSetRef, { title, description });

      const batch = [];
      flashcardData.forEach((card) => {
        const flashcardRef = doc(FIRESTORE_DB, 'flashcards', card.id);
        batch.push(updateDoc(flashcardRef, { term: card.term, definition: card.definition }));
      });
      await Promise.all(batch);

      setLoading(false);
      Alert.alert('Success', 'Flashcard set updated successfully.');
      navigation.goBack();
    } catch (error) {
      console.error('Error updating flashcard set:', error);
      Alert.alert('Error', 'Failed to update flashcard set. Please try again.');
      setLoading(false);
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Confirmation',
      'Are you sure you want to go back? Your inputs will not be saved.',
      [
        { text: 'Cancel', onPress: () => console.log('Canceled') },
        { text: 'Yes', onPress: () => navigation.goBack() }
      ]
    );
  };

  const handleDescriptionChange = (text) => {
    setDescription(text);
  };

  const handleDescriptionContentSizeChange = (event) => {
    const { height } = event.nativeEvent.contentSize;
    setDescriptionHeight(height);
  };

const handleAddRecognizedText = () => {
    if (selectedSetIndex !== null && selectedField !== null && recognizedText.trim() !== '') {
        const updatedFlashcardData = [...flashcardData];

        // Update the appropriate field in the selected flashcard set
        if (selectedField === 'term') {
            updatedFlashcardData[selectedSetIndex].term = recognizedText;
        } else if (selectedField === 'definition') {
            updatedFlashcardData[selectedSetIndex].definition = recognizedText;
        }

        setFlashcardData(updatedFlashcardData);
        setShowMicOverlay(false);
        setSelectedField(null); // Reset selectedField state
        setPartialRecognizedText(''); // Clear partialRecognizedText
        setRecognizedText(''); // Clear recognizedText after adding
    }
};

  const handleDeleteFlashcard = (index) => {
    Alert.alert(
      'Confirmation',
      'Are you sure you want to delete this flashcard?',
      [
        { text: 'Cancel', onPress: () => console.log('Canceled') },
        {
          text: 'Yes', onPress: () => {
            const newFlashcardData = [...flashcardData];
            newFlashcardData.splice(index, 1);
            setFlashcardData(newFlashcardData);
          }
        }
      ]
    );
  };

  const handleAddFlashcard = () => {
    setFlashcardData([...flashcardData, { id: Date.now().toString(), term: '', definition: '' }]);
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#139362" barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={handleCancel}>
          <Ionicons name="arrow-back" size={26} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerText}>Edit Flashcard Set</Text>
        <TouchableOpacity style={styles.headerCheckButton} onPress={handleSaveChanges} disabled={loading}>
          <Ionicons name="checkmark-sharp" style={styles.headerCheckIcon} />
        </TouchableOpacity>
      </View>
      <ScrollView>
        <View style={styles.content}>
          <View>
            <TextInput
              value={title}
              onChangeText={setTitle}
              style={styles.input}
              placeholder="Subject, chapter, unit, etc."
              textAlign='left'
            />
            <Text style={styles.label}>Title</Text>
          </View>
          <View>
            <TextInput
              value={description}
              onChangeText={handleDescriptionChange}
              placeholder='Provide a description of your set'
              textAlign='left'
              multiline={true}
              onContentSizeChange={handleDescriptionContentSizeChange}
              style={[styles.input, { height: descriptionHeight }]}
            />
            <Text style={styles.label}>Description (optional)</Text>
          </View>
          {flashcardData.map((card, index) => (
            <View key={card.id} style={styles.flashcardContainer}>
              <View style={styles.inputContainer}>
                <TextInput
                  value={card.term}
                  onChangeText={(text) => handleTermChange(text, index)}
                  style={styles.input}
                  placeholder='Enter a term'
                  textAlign='left'
                />
                <TouchableOpacity
                  style={styles.iconTouchable}
                  onPress={() => {
                    setSelectedField('term');
                    setSelectedSetIndex(index);
                    setShowMicOverlay(true);
                  }}>
                  <Ionicons name="mic" size={24} style={styles.icon} />
                </TouchableOpacity>
                <Text style={styles.label}>Term</Text>
              </View>
              <View style={styles.inputContainer}>
                <TextInput
                  value={card.definition}
                  onChangeText={(text) => handleDefinitionChange(text, index)}
                  onContentSizeChange={handleDescriptionContentSizeChange}
                  style={[styles.input, styles.inputDesc, { height: descriptionHeight }]}
                  placeholder="Enter a definition"
                  multiline={true}
                />
                <TouchableOpacity
                  style={styles.iconTouchable}
                  onPress={() => {
                    setSelectedField('definition');
                    setSelectedSetIndex(index);
                    setShowMicOverlay(true);
                  }}>
                  <Ionicons name="mic" size={24} style={styles.icon} />
                </TouchableOpacity>
                <Text style={styles.label}>Definition</Text>
              </View>
              <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteFlashcard(index)}>
                <Ionicons name="trash" size={20} color="#616161" />
              </TouchableOpacity>
            </View>
          ))}
          <View style={styles.bottom}></View>
        </View>
      </ScrollView>
      <TouchableOpacity style={styles.circlePlusButton} onPress={handleAddFlashcard}>
        <Ionicons name="add" size={42} color="#FFFFFF" />
      </TouchableOpacity>
      <Modal
        visible={showMicOverlay}
        transparent={true}
        animationType="slide">
        <View style={styles.overlay}>
          <TouchableOpacity style={styles.closeButton} onPress={() => setShowMicOverlay(false)}>
            <Ionicons name="close" size={26} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.recognizedText}>{partialRecognizedText}</Text>
          <View style={styles.micContainer}>
            <View style={styles.micIcon}/>
            <View style={styles.circle1} />
            <View style={styles.circle2} />
            <View style={styles.circle3} />
            <TouchableOpacity onPress={isRecording ? stopRecording : startRecording}>
              {isRecording ? (
                <Ionicons name="stop" size={50} color="#FF0000" />
              ) : (
                <Ionicons name="mic" size={50} color="#08C47C" />
              )}
            </TouchableOpacity>
          </View>
                {selectedField && (
                        <TouchableOpacity style={styles.confirmButton} onPress={handleAddRecognizedText}>
                            <Text style={styles.confirmButtonText}>Add to {selectedField}</Text>
                        </TouchableOpacity>
                    )}
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#139362',
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  headerButton: {
    padding: 5,
  },
  headerCheckButton: {
    left: 28,
  },
  headerCheckIcon: {
    fontSize: 30,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  headerText: {
    color: '#FFFFFF',
    fontSize: 24,
    marginRight: 130,
  },
  content: {
    backgroundColor: '#fff',
    paddingVertical: 20,
    paddingHorizontal: 15,
    flex: 1,
  },
  label: {
    marginBottom: 10,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#616161',
  },
  input: {
    height: 40,
    padding: 10,
    fontSize: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#D6D6D6',
    width: '100%',
    textAlign: 'left',
    marginBottom: 5,
  },
  inputDesc: {
    textAlignVertical: 'top',
    minHeight: 60,
    padding: 10,
    fontSize: 16,
  },
  circlePlusButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#A42FC1',
    borderRadius: 40,
    width: 70,
    height: 70,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.75,
    shadowRadius: 3.84,
    elevation: 10,
  },
  flashcardContainer: {
    marginTop: 30,
    backgroundColor: '#F5F6FA',
    paddingVertical: 20,
    paddingHorizontal: 20,
    paddingBottom: 40,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    position: 'relative',
  },
  inputContainer: {
    width: '100%',
    position: 'relative',
  },
  icon: {
    position: 'absolute',
    right: 3,
    color: '#139362',
  },
  iconTouchable: {
    position: 'absolute',
    right: 3,
    top: 10,
  },
  deleteButton: {
    position: 'absolute',
    bottom: 10,
    right: 10,
  },
  bottom: {
    marginBottom: 100
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
  },
  micContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    bottom: 200
  },
  micIcon: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFFFFF',
  },
  circle1: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  circle2: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  circle3: {
    position: 'absolute',
    width: 170,
    height: 170,
    borderRadius: 90,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  recognizedText: {
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    position: 'absolute',
    top: 80,
    fontSize: 26,
    paddingTop: 15, 
    paddingLeft: 15,
    paddingRight: 50,
    color: '#FFF'
  },
  confirmButton: {
    backgroundColor: '#A42FC1',
    padding: 13,
    borderRadius: 100,
    width: 150,
    alignSelf: 'center',
    bottom: 70,
    position: 'absolute'
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default EditFlashcardSet;
