import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, ScrollView, BackHandler, Modal, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { FIRESTORE_DB } from '../../FirebaseConfig'; 
import { addDoc, collection } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { Ionicons } from '@expo/vector-icons';
import Voice from '@react-native-voice/voice'; // Import from react-native-voice

const FlashcardFormStack = () => {
    const navigation = useNavigation();

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [flashcardData, setFlashcardData] = useState([{ term: '', definition: '' }]);
    const [loading, setLoading] = useState(false);
    const [showMicOverlay, setShowMicOverlay] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [proficiency, setProficiency] = useState(0);
    const [recognizedText, setRecognizedText] = useState('');
    const [selectedField, setSelectedField] = useState(null);
    const [partialRecognizedText, setPartialRecognizedText] = useState('');
    const [selectedSetIndex, setSelectedSetIndex] = useState(null);


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
    }, []);
    

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
    
    const handleAddRecognizedText = () => {
        if (selectedSetIndex !== null && selectedField !== null && recognizedText.trim() !== '') {
            const updatedFlashcardData = [...flashcardData];
    
            if (selectedField === 'term') {
                updatedFlashcardData[selectedSetIndex].term = recognizedText;
            } else if (selectedField === 'definition') {
                updatedFlashcardData[selectedSetIndex].definition = recognizedText;
            }
    
            setFlashcardData(updatedFlashcardData);
            setShowMicOverlay(false);
            setSelectedField(null); 
            setPartialRecognizedText('');
            setRecognizedText(''); 
        }
    };
    

    const handleSave = async () => {
        // Validation check
        if (!title.trim() || flashcardData.some(item => !item.term.trim() || !item.definition.trim())) {
            Alert.alert('Warning', 'Please ensure all fields are completed before saving. Delete flashcards lacking input to proceed.');
            return;
        }
    
        setLoading(true);
        try {
            const auth = getAuth();
            const user = auth.currentUser;
    
            if (user) {
                const flashcardSetCollectionRef = collection(FIRESTORE_DB, 'flashcard_sets');
                const flashcardSetDocRef = await addDoc(flashcardSetCollectionRef, {
                    title: title,
                    description: description,
                    folder_id: null,
                    proficiency: proficiency, 
                    user_id: user.uid,
                });
    
                const flashcardCollectionRef = collection(FIRESTORE_DB, 'flashcards');
    
                
                const validFlashcards = flashcardData.filter(item => item.term.trim() && item.definition.trim());
    
                
                await Promise.all(validFlashcards.map(async (item) => {
                    await addDoc(flashcardCollectionRef, {
                        term: item.term,
                        definition: item.definition,
                        flashcard_set_id: flashcardSetDocRef.id,
                        user_id: user.uid,
                    });
                }));
    
                Alert.alert(
                    'Success',
                    'Flashcard set added successfully!',
                    [{ text: 'OK', onPress: () => navigation.navigate('Library') }]
                );
                setTitle('');
                setDescription('');
                setFlashcardData([{ term: '', definition: '' }]);
            } else {
                Alert.alert('Error', 'User not logged in. Please log in and try again.');
            }
        } catch (error) {
            console.error('Error adding flashcard: ', error);
            Alert.alert('Error', 'Failed to add flashcard. Please try again.');
        } finally {
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

    const handleAddFlashcard = () => {
        setFlashcardData([...flashcardData, { term: '', definition: '' }]);
    };

    const handleTermChange = (text, index) => {
        const newFlashcardData = [...flashcardData];
        newFlashcardData[index].term = text;
        setFlashcardData(newFlashcardData);
    };

    const handleDefinitionChange = (text, index) => {
        const newFlashcardData = [...flashcardData];
        newFlashcardData[index].definition = text;
        setFlashcardData(newFlashcardData);
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

    return (
        <View style={styles.container}>
            <StatusBar backgroundColor="#139362" barStyle="light-content" />
            <View style={styles.header}>
                <TouchableOpacity style={styles.headerButton} onPress={handleCancel}>
                    <Ionicons name="arrow-back" size={26} color="#FFFFFF" />
                </TouchableOpacity>
                <Text style={styles.headerText}>Create Flashcard Set</Text>
                <TouchableOpacity style={styles.headerCheckButton} onPress={handleSave} disabled={loading}>
                    <Ionicons name="checkmark-sharp" style={styles.headerCheckIcon} />
                </TouchableOpacity>
            </View>
            <ScrollView>
                <View style={styles.content}>
                    <View>
                        <TextInput
                            value={title}
                            style={styles.input}
                            onChangeText={setTitle}
                            placeholder='subject, chapter, unit, etc.'
                            textAlign='left'
                        />
                        <Text style={styles.label}>Title</Text>
                    </View>
                    <View>
                        <TextInput
                            value={description}
                            style={styles.input}
                            onChangeText={setDescription}
                            placeholder='provide a description of your set'
                            textAlign='left'
                        />
                        <Text style={styles.label}>Description (optional)</Text>
                    </View>
                    {flashcardData.map((item, index) => (
                        <View key={index} style={styles.flashcardContainer}>
                            <View style={styles.inputContainer}>
                                <TextInput
                                    value={item.term}
                                    style={styles.input}
                                    // onChangeText={(text) => {
                                    //     const newFlashcardData = [...flashcardData];
                                    //     newFlashcardData[index].term = text;
                                    //     setFlashcardData(newFlashcardData); }}
                                    onChangeText={(text) => handleTermChange(text, index)}
                                    placeholder='Enter a term'
                                    textAlign='left'
                                />
                                <TouchableOpacity style={styles.iconTouchable} 
                                                    onPress={() => {
                                                        setSelectedSetIndex(index);
                                                        setSelectedField('term');
                                                        setShowMicOverlay(true);
                                                    }}>
                                    <Ionicons name="mic" size={24} style={styles.icon} />
                                </TouchableOpacity>
                                <Text style={styles.label}>Term</Text>
                            </View>
                            <View style={styles.inputContainer}>
                                <TextInput
                                    value={item.definition}
                                    style={styles.input}
                                    // onChangeText={(text) => {
                                    //     const newFlashcardData = [...flashcardData];
                                    //     newFlashcardData[index].definition = text;
                                    //     setFlashcardData(newFlashcardData);
                                    // }}
                                    onChangeText={(text) => handleDefinitionChange(text, index)}
                                    placeholder='Enter a definition'
                                    textAlign='left'
                                />
                                <TouchableOpacity style={styles.iconTouchable} 
                                                    onPress={() => {
                                                        setSelectedSetIndex(index);
                                                        setSelectedField('definition');
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

            {/* Mic Overlay */}
            
            <Modal
                visible={showMicOverlay}
                transparent={true}
                animationType="slide"
            >
                <StatusBar backgroundColor="#000000B3" barStyle="light-content" />
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
        marginRight: 100,
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
        marginBottom: 50
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
        fontSize: 24,
        paddingTop: 10, 
        paddingLeft: 10,
        paddingRight: 30, // Adjust this value for spacing from the left
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

export default FlashcardFormStack;