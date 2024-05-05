import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Platform, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FIRESTORE_DB } from '../../FirebaseConfig';
import { collection, query, where, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const FlashcardPickerScreen = ({ route, navigation }) => {
    const { folderId, showOptionsOverlay } = route.params;
    const [flashcardSets, setFlashcardSets] = useState([]);
    const [selectedFlashcardSets, setSelectedFlashcardSets] = useState([]);

    useEffect(() => {
        const fetchFlashcardSets = async () => {
            try {
                const auth = getAuth();
                const currentUser = auth.currentUser;
                if (!currentUser) {
                    return;
                }
    
                const q = query(collection(FIRESTORE_DB, 'flashcard_sets'), where('user_id', '==', currentUser.uid));
                const querySnapshot = await getDocs(q);
    
                const setsData = [];
                const dropdownVisibility = [];
                for (const doc of querySnapshot.docs) {
                    const flashcardSetData = { id: doc.id, ...doc.data() };
                    if (!flashcardSetData.folder_id) {
                        const flashcardCountQuery = query(collection(FIRESTORE_DB, 'flashcards'), where('flashcard_set_id', '==', doc.id));
                        const flashcardCountSnapshot = await getDocs(flashcardCountQuery);
                        const flashcardCount = flashcardCountSnapshot.size;
    
                        setsData.push({ ...flashcardSetData, flashcardCount });
                        dropdownVisibility.push(false);
                    }
                }
                setFlashcardSets(setsData);
            } catch (error) {
                console.error('Error fetching flashcard sets: ', error);
            }
        };
        fetchFlashcardSets();
    }, []);

    const handleAddToFolderWithConfirmation = () => {
        if (selectedFlashcardSets.length > 0) {
            Alert.alert(
                'Confirmation',
                `Are you sure you want to add ${
                    flashcardSets.find((flashcardSet) => flashcardSet.id === selectedFlashcardSets[0])?.title
                } flashcard set to this folder?`,
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Confirm', onPress: handleAddToFolder, style: 'destructive' },
                ]
            );            
        } else {
            Alert.alert('Info', 'No flashcard set selected. Please select at least one flashcard set.');
        }
    };

    const handleAddToFolder = async () => {
        try {
            const updatePromises = selectedFlashcardSets.map(async (flashcardSetId) => {
                const flashcardSetRef = doc(FIRESTORE_DB, 'flashcard_sets', flashcardSetId);
                const flashcardSetSnapshot = await getDoc(flashcardSetRef);
                const flashcardSetData = flashcardSetSnapshot.data();
    
                if (!flashcardSetData.folder_id) {
                    await updateDoc(flashcardSetRef, { folder_id: folderId });

                    Alert.alert(
                        'Success',
                        `Flashcard set ${
                            flashcardSets.find((flashcardSet) => flashcardSet.id === selectedFlashcardSets[0])?.title
                        } is successfully added to the folder.`,
                        [
                            {
                                text: 'Okay',
                                onPress: () => {
                                    navigation.navigate('FolderPage', { folderId, closeOptionsOverlay: true });
                                },
                                style: 'destructive'
                            }
                        ],
                        { cancelable: true, onDismiss: () => {} }
                    );
                } else {
                    Alert.alert('Info', 'Flashcard set is already in a folder.');
                }
            });
    
            await Promise.all(updatePromises);
    
        } catch (error) {
            console.error('Error adding flashcard sets to folder: ', error);
        }
    };
    
    

    const toggleFlashcardSelection = (flashcardSetId) => {
        setSelectedFlashcardSets((prevSelected) =>
            prevSelected.includes(flashcardSetId)
                ? prevSelected.filter((id) => id !== flashcardSetId)
                : [...prevSelected, flashcardSetId]
        );
    };

    const isFlashcardSelected = (flashcardSetId) => {
        return selectedFlashcardSets.includes(flashcardSetId);
    };

    const getProficiencyColor = (proficiency) => {
        if (proficiency >= 80) {
            return '#08C47C'; // Green
        } else if (proficiency >= 60) {
            return '#A42FC1'; // Purple
        } else if (proficiency >= 40) {
            return '#FFA500'; // Orange
        } else {
            return '#FF6347'; // Red
        }
    };

    const handleCancel = () => {
        Alert.alert(
            'Confirmation',
            'Are you sure you want to go back?',
            [
                {
                    text: 'Cancel',
                    style: 'cancel'
                },
                {
                    text: 'Confirm',
                    onPress: () => {
                        navigation.navigate('FolderPage', { folderId, closeOptionsOverlay: true });
                    },
                    style: 'destructive'
                }
            ]
        );
    };
    
    
    return (
        <ScrollView contentContainerStyle={styles.container}>
            <StatusBar backgroundColor="#139362" barStyle="light-content" />
            <View style={styles.header}>
                <TouchableOpacity style={styles.headerButton} onPress={handleCancel}>
                    <Ionicons name="arrow-back" size={26} color="#FFFFFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Add Flashcard Sets</Text>
                <TouchableOpacity style={styles.headerButton} onPress={handleAddToFolderWithConfirmation}>
                    <Ionicons name="checkmark-sharp" size={30} color="#FFFFFF" />
                </TouchableOpacity>
            </View>
            {flashcardSets.map((flashcardSet) => (
                <TouchableOpacity
                    key={flashcardSet.id}
                    style={[
                        styles.flashcardContainer,
                        isFlashcardSelected(flashcardSet.id) && styles.selectedFlashcard,
                    ]}
                    onPress={() => toggleFlashcardSelection(flashcardSet.id)}
                >
                    <View style={styles.upperLeftContainer}>
                            <View style={styles.moduleContainer}>
                                <Text style={styles.label}>{flashcardSet.title}</Text>
                                <Text style={styles.description}>{flashcardSet.description}</Text>
                            </View>
                    </View>
                    <View style={styles.lowerLeftContainer}>
                            <Text style={styles.additionalText}>{flashcardSet.flashcardCount} terms</Text>
                    </View>
                    <View style={styles.lowerRightContainer}>
                            <View style={styles.proficiencyContainer}>
                                <Text style={styles.proficiencyLabel}>Proficiency:</Text>
                                <Text style={[styles.proficiencyPercentage, { color: getProficiencyColor(flashcardSet.proficiency) }]}>
                                    {flashcardSet.proficiency.toFixed(2)}%
                                </Text>
                            </View>
                    </View>
                </TouchableOpacity>
            ))}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        backgroundColor: '#fff',
        paddingBottom: 30
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#139362',
        paddingVertical: 15,
        paddingHorizontal: 20,
        marginBottom: 20,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 3.84,
            },
            android: {
                elevation: 15,
            },
        }),
    },
    headerButton: {
        padding: 5,
    },
    headerTitle: {
        fontSize: 24,
        color: '#FFFFFF',
        fontWeight: 'bold',
        marginRight: 110
    },
    flashcardContainer: {
        height: 140,
        paddingHorizontal: 20,
        paddingVertical: 20,
        backgroundColor: '#F4F6FF',
        margin: 20,
        borderRadius: 10,
        borderWidth: 1.5,
        borderColor: '#08C47C',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
        position: 'relative',
        marginBottom: 5
    },
    selectedFlashcard: {
        backgroundColor: '#CFFFE5',
    },
    label: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#616161',
        paddingRight: 50
    },
    description: {
        fontSize: 14,
        color: '#616161',
        paddingRight: 60
    },
    upperLeftContainer: {
        position: 'absolute',
        top: 10,
        left: 10,
        marginLeft: 10
    },
    lowerLeftContainer: {
        position: 'absolute',
        bottom: 10,
        left: 10,
        marginLeft: 10,
        marginBottom: 10,
        backgroundColor: '#D9D9D9',
        paddingHorizontal: 20,
        paddingVertical: 7,
        borderRadius: 20,
    },
    lowerRightContainer: {
        position: 'absolute',
        bottom: 10,
        right: 10,
        marginRight: 10,
        marginBottom: 15,
    },
    moduleContainer: {
        flexDirection: 'column',
        alignItems: 'flex-start'
    },
    proficiencyContainer: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    proficiencyLabel: {
        marginRight: 5,
        color: '#616161',
        fontSize: 16
    },
    proficiencyPercentage: {
        fontWeight: 'bold',
        color: '#08C47C',
        fontSize: 16
    },
    additionalText: {
        fontSize: 16,
        color: '#616161',
        fontWeight: 'bold'
    },
});

export default FlashcardPickerScreen;
