import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, Alert, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FIRESTORE_DB } from '../../FirebaseConfig';
import { collection, query, where, getDocs, deleteDoc, doc, onSnapshot } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { useNavigation } from '@react-navigation/native';

const FlashcardsScreen = () => {
    const navigation = useNavigation();
    const [flashcardSets, setFlashcardSets] = useState([]);
    const [showDropdown, setShowDropdown] = useState([]);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [setToDelete, setSetToDelete] = useState(null);
    const [lastFetchTimestamp, setLastFetchTimestamp] = useState(null);

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
                const flashcardSetId = doc.id;
                const flashcardCountQuery = query(collection(FIRESTORE_DB, 'flashcards'), where('flashcard_set_id', '==', flashcardSetId));
                const flashcardCountSnapshot = await getDocs(flashcardCountQuery);
                const flashcardCount = flashcardCountSnapshot.size;

                setsData.push({ id: flashcardSetId, ...doc.data(), flashcardCount });
                dropdownVisibility.push(false);
            }
            setFlashcardSets(setsData);
            setShowDropdown(dropdownVisibility);
            setLastFetchTimestamp(Date.now());
        } catch (error) {
            console.error('Error fetching flashcard sets: ', error);
        }
    };

    useEffect(() => {
        fetchFlashcardSets();
    }, []);

    useEffect(() => {
        const unsubscribe = onSnapshot(collection(FIRESTORE_DB, 'flashcard_sets'), () => {
            fetchFlashcardSets();
        });
        return () => {
            unsubscribe();
        };
    }, []);

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

    const toggleDropdown = (index) => {
        const newDropdownVisibility = [...showDropdown];
        newDropdownVisibility[index] = !newDropdownVisibility[index];
        setShowDropdown(newDropdownVisibility);
    };

    const handleFlashcardPress = (flashcardSetId) => {
        navigation.navigate('Flashcards', { flashcardSetId });
    };

    const handleDeleteConfirmation = (flashcardSet) => {
        setSetToDelete(flashcardSet);
        setShowConfirmation(true);
    };

    const handleDeleteConfirmed = async () => {
        try {
            await deleteDoc(doc(FIRESTORE_DB, 'flashcard_sets', setToDelete.id));
            setShowConfirmation(false);
            fetchFlashcardSets();
            Alert.alert('Success', 'Flashcard set deleted successfully.');
        } catch (error) {
            console.error('Error deleting flashcard set: ', error);
        }
    };
    
    const moveFlashcardSet = (flashcardSetId) => {
        navigation.navigate('MoveFlashcardSetScreen', { flashcardSetId });
    };

    const editFlashcardSet = (flashcardSetId) => {
        navigation.navigate('EditFlashcardSet', { flashcardSetId });
    };

    return (
        <ScrollView contentContainerStyle={styles.scrollViewContent}>
            <StatusBar backgroundColor="#fff" barStyle="light-content" />
            {flashcardSets.map((flashcardSet, index) => (
                <TouchableOpacity
                    key={flashcardSet.id}
                    style={styles.touchableFlashcardContainer}
                    onPress={() => handleFlashcardPress(flashcardSet.id)}
                >
                    <View style={styles.flashcardContainer}>
                        <View style={styles.upperLeftContainer}>
                            <View style={styles.moduleContainer}>
                                <Text style={styles.label}>{flashcardSet.title}</Text>
                                <Text style={styles.description}>{flashcardSet.description}</Text>
                            </View>
                        </View>
                        <TouchableOpacity
                            style={styles.upperRightContainer}
                            onPress={() => toggleDropdown(index)}
                        >
                            <View style={styles.optionContainer}>
                                <Ionicons name="ellipsis-vertical-sharp" size={20} color="#616161" />
                            </View>
                        </TouchableOpacity>
                        {showDropdown[index] && (
                            <View style={styles.dropdown}>
                                <TouchableOpacity onPress={() => moveFlashcardSet(flashcardSet.id)}>
                                    <View style={styles.dropdownOption}>
                                        <Ionicons name="folder-outline" size={15} color="#616161" />
                                        <Text style={styles.dropdownOptionText}>Move to Folder</Text>
                                    </View>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => editFlashcardSet(flashcardSet.id)}>
                                    <View style={styles.dropdownOption}>
                                        <Ionicons name="create-outline" size={15} color="#616161" />
                                        <Text style={styles.dropdownOptionText}>Edit</Text>
                                    </View>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => handleDeleteConfirmation(flashcardSet)}>
                                    <View style={styles.dropdownOption}>
                                        <Ionicons name="trash-outline" size={15} color="#616161" />
                                        <Text style={styles.dropdownOptionText}>Delete</Text>
                                    </View>
                                </TouchableOpacity>
                            </View>
                        )}
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
                    </View>
                </TouchableOpacity>
            ))}
            <Modal
                visible={showConfirmation}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowConfirmation(false)}
            >
                <StatusBar backgroundColor="#00000080" barStyle="light-content" />
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalText}>Are you sure you want to delete this flashcard set?</Text>
                        <View style={styles.modalButtons}>
                            <TouchableOpacity style={styles.modalCancel} onPress={() => setShowConfirmation(false)}>
                                <Text style={styles.modalButtonCancel}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.modalDelete} onPress={handleDeleteConfirmed}>
                                <Text style={styles.modalButtonDelete}>Delete</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    scrollViewContent: {
        flexGrow: 1,
        backgroundColor: '#fff',
        paddingVertical: 20,
    },
    flashcardContainer: {
        height: 180,
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
    touchableFlashcardContainer: {
        marginBottom: 5,
    },
    upperLeftContainer: {
        position: 'absolute',
        top: 10,
        left: 10,
        marginLeft: 10
    },
    upperRightContainer: {
        position: 'absolute',
        top: 10,
        right: 3,
        marginRight: 5
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
    optionContainer: {
        flexDirection: 'row',
        alignItems: 'center'
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
    dropdown: {
        position: 'absolute',
        top: 20,
        right: 20,
        backgroundColor: '#fff',
        padding: 5,
        borderRadius: 5,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    dropdownOption: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 5,
    },
    dropdownOptionText: {
        marginLeft: 10,
        fontSize: 15,
        color: '#616161',
    },

    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 10,
        elevation: 5,
    },
    modalText: {
        fontSize: 16,
        marginBottom: 20,
        textAlign: 'center',
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'flex-end'
    },
    modalCancel: {
        padding: 10,
        paddingHorizontal: 20,
        borderRadius: 5,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#FF5733',
        marginRight: 8
    },
    modalDelete: {
        padding: 10,
        paddingHorizontal: 20,
        borderRadius: 5,
        backgroundColor: '#A42FC1',
        borderColor: '#A42FC1',
    },
    modalButtonCancel: {
        color: '#FF5733',
        fontSize: 16
    },
    modalButtonDelete: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16
    }
});

export default FlashcardsScreen;

