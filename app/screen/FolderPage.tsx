import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, Alert, BackHandler, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FIRESTORE_DB } from '../../FirebaseConfig';
import { doc, getDoc, onSnapshot, collection, query, where, getDocs, deleteDoc, updateDoc } from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import { getAuth } from 'firebase/auth';
import EditFolderModal from './EditFolder';

const FolderPage = ({ route }) => {
    const { folderId, closeOptionsOverlay, flashcardSetId } = route.params;
    const [folder, setFolder] = useState(null);
    const [flashcardSets, setFlashcardSets] = useState([]);
    const [flashcardSetsCount, setFlashcardSetsCount] = useState(0);
    const [showDropdown, setShowDropdown] = useState([]);
    const [showOptionsOverlay, setShowOptionsOverlay] = useState(false);
    const navigation = useNavigation();
    const [setToDelete, setSetToDelete] = useState(null);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [showFolderConfirmation, setShowFolderConfirmation] = useState(false);
    const [folderModalVisible, setFolderModalVisible] = useState(false);

    useEffect(() => {
        if (closeOptionsOverlay) {
            setShowOptionsOverlay(false);
        }
    }, [closeOptionsOverlay]);

    const openFolderModal = () => {
        setFolderModalVisible(true);
      };
    
      const closeFolderModal = () => {
        setFolderModalVisible(false);
      };


    const handleCloseOverlay = () => {
        setShowOptionsOverlay(false);
    };

    const getProficiencyColor = (proficiency) => {
        if (proficiency >= 80) {
            return '#08C47C';
        } else if (proficiency >= 60) {
            return '#A42FC1';
        } else if (proficiency >= 40) {
            return '#FFA500';
        } else {
            return '#FF6347';
        }
    };

    const toggleDropdown = (index) => {
        const newDropdownVisibility = [...showDropdown];
        newDropdownVisibility[index] = !newDropdownVisibility[index];
        setShowDropdown(newDropdownVisibility);
    };

    useEffect(() => {
        const backAction = () => {
            navigation.goBack();
            return true;
        };

        const backHandler = BackHandler.addEventListener(
            'hardwareBackPress',
            backAction
        );

        return () => backHandler.remove();
    }, [navigation]);
    

    useEffect(() => {
        const fetchFolder = async () => {
            try {
                const auth = getAuth();
                const currentUser = auth.currentUser;
                if (!currentUser) {
                    return;
                }

                const folderDocRef = doc(FIRESTORE_DB, 'folders', folderId);
                const folderDocSnap = await getDoc(folderDocRef);
                if (folderDocSnap.exists()) {
                    setFolder({ id: folderDocSnap.id, ...folderDocSnap.data() });
                } else {
                    console.error('Folder does not exist');
                }
            } catch (error) {
                console.error('Error fetching folder: ', error);
            }
        };

        const unsubscribeFolder = onSnapshot(doc(FIRESTORE_DB, 'folders', folderId), (snapshot) => {
            if (snapshot.exists()) {
                setFolder({ id: snapshot.id, ...snapshot.data() });
            } else {
                console.error('Folder does not exist');
            }
        });

        return () => {
            unsubscribeFolder();
        };
    }, [folderId]);

    useEffect(() => {
        const fetchFlashcardSetsCount = async () => {
            try {
                const q = query(collection(FIRESTORE_DB, 'flashcard_sets'), where('folder_id', '==', folderId));
                const querySnapshot = await getDocs(q);
                const flashcardSetsCount = querySnapshot.size;

                const setsData = [];
                const dropdownVisibility = Array(querySnapshot.size).fill(false);

                for (const doc of querySnapshot.docs) {
                    const flashcardSetId = doc.id;
                    const flashcardCountQuery = query(collection(FIRESTORE_DB, 'flashcards'), where('flashcard_set_id', '==', flashcardSetId));
                    const flashcardCountSnapshot = await getDocs(flashcardCountQuery);
                    const flashcardCount = flashcardCountSnapshot.size;

                    setsData.push({ id: flashcardSetId, ...doc.data(), flashcardCount });
                }

                setFlashcardSetsCount(flashcardSetsCount);
                setFlashcardSets(setsData);
                setShowDropdown(dropdownVisibility);
            } catch (error) {
                console.error('Error fetching flashcard sets count: ', error);
            }
        };
    
        const unsubscribeFlashcardSets = onSnapshot(query(collection(FIRESTORE_DB, 'flashcard_sets'), where('folder_id', '==', folderId)), () => {
            fetchFlashcardSetsCount();
        });

        return () => {
            unsubscribeFlashcardSets();
        };
    }, [folderId]);

    const handleBackPress = () => {
        navigation.navigate('Library');
    };

    const handleOptionsPress = () => {
        setShowOptionsOverlay(true);
    };
    
    const handleDeleteConfirmation = (flashcardSet) => {
        setSetToDelete(flashcardSet);
        setShowConfirmation(true);
    };

    const handleDeleteFolderConfirmation = () => {
        setShowFolderConfirmation(true);
    };

    const handleDeleteConfirmed = async () => {
        try {
            await deleteDoc(doc(FIRESTORE_DB, 'flashcard_sets', setToDelete.id));
            setShowConfirmation(false);
            Alert.alert('Success', 'Flashcard set deleted successfully.',);
        } catch (error) {
            console.error('Error deleting flashcard set: ', error);
        }
    };

    const handleFolderDeleteConfirmed = async () => {
        try {
            const flashcardSetRefs = collection(FIRESTORE_DB, 'flashcard_sets');
            const q = query(flashcardSetRefs, where('folder_id', '==', folderId));
            const querySnapshot = await getDocs(q);

            const updatePromises = querySnapshot.docs.map(async (doc) => {
                try {
                    await updateDoc(doc.ref, { folder_id: null });
                } catch (error) {
                    console.error('Error updating flashcard set:', error);
                }
            });

            await Promise.all(updatePromises);

            await deleteDoc(doc(FIRESTORE_DB, 'folders', folderId));

            setShowFolderConfirmation(false);
            Alert.alert('Success', 'Folder deleted successfully.',
            [{ text: 'OK', onPress: () => navigation.navigate('LibraryFolders') }]
            );
        } catch (error) {
            console.error('Error deleting folder: ', error);
        }
    };

    const handleFlashcardPress = (flashcardSetId) => {
        navigation.navigate('Flashcards', { flashcardSetId });
    };

    const openAddFlashcardSet = () => {
        navigation.navigate('FlashcardPickerScreen', { folderId });
    };

    const moveFlashcardSet = (flashcardSetId) => {
        navigation.navigate('MoveFlashcardSetScreen', { flashcardSetId });
    };

    return (

        <View style={styles.container}>
            <StatusBar backgroundColor="#139362" barStyle="light-content" />
            <ScrollView contentContainerStyle={styles.scrollViewContent}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.headerButton} onPress={handleBackPress}>
                    <Ionicons name="arrow-back" size={26} color="#FFFFFF" />
                </TouchableOpacity>
                <Text style={styles.headerText}>Folder</Text>

                <TouchableOpacity style={styles.headerOptionButton} onPress={handleOptionsPress}>
                    <Ionicons name="ellipsis-vertical-sharp" style={styles.headerOptionIcon} />
                </TouchableOpacity>

                <View style={styles.folderInfo}>
                    <Text style={styles.folderName}>{folder ? folder.name : ' '}</Text>
                    <View style={styles.lowerLeftContainer}>
                        <Text style={styles.additionalText}>{flashcardSetsCount} sets</Text>
                    </View>
                </View>
            </View>

            {flashcardSets.map((flashcard, index) => (
                <TouchableOpacity
                    key={flashcard.id}
                    style={styles.touchableFlashcardContainer}
                    onPress={() => handleFlashcardPress(flashcard.id)}
                >
                    <View key={flashcard.id} style={styles.flashcardContainer}>
                        <View style={styles.upperLeftContainer}>
                            <View style={styles.moduleContainer}>
                                <Text style={styles.label}>{flashcard.title}</Text>
                                <Text style={styles.description}>{flashcard.description}</Text>
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
                                <TouchableOpacity onPress={() => moveFlashcardSet(flashcard.id)}>
                                    <View style={styles.dropdownOption}>
                                        <Ionicons name="folder-outline" size={15} color="#616161" />
                                        <Text style={styles.dropdownOptionText}>Move to Folder</Text>
                                    </View>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => {}}>
                                    <View style={styles.dropdownOption}>
                                        <Ionicons name="create-outline" size={15} color="#616161" />
                                        <Text style={styles.dropdownOptionText}>Edit</Text>
                                    </View>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => handleDeleteConfirmation(flashcard)}>
                                    <View style={styles.dropdownOption}>
                                        <Ionicons name="trash-outline" size={15} color="#616161" />
                                        <Text style={styles.dropdownOptionText}>Delete</Text>
                                    </View>
                                </TouchableOpacity>
                            </View>
                        )}
                        <View style={styles.lowerLeftFlashcard}>
                            <Text style={styles.additionalText}>{flashcard.flashcardCount} terms</Text>
                        </View>
                        <View style={styles.lowerRightContainer}>
                            <View style={styles.proficiencyContainer}>
                                <Text style={styles.proficiencyLabel}>Proficiency:</Text>
                                <Text style={[styles.proficiencyPercentage, { color: getProficiencyColor(flashcard.proficiency) }]}>
                                    {flashcard.proficiency.toFixed(2)}%
                                </Text>
                            </View>
                        </View>
                    </View>
                </TouchableOpacity>
            ))}
            </ScrollView>
            <Modal
                visible={showConfirmation}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowConfirmation(false)}
            >
                <StatusBar backgroundColor="#000000CC" barStyle="light-content" />
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
            <Modal
                visible={showFolderConfirmation}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowFolderConfirmation(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalText}>Are you sure you want to delete this folder permanently? The sets inside will not be deleted.</Text>
                        <View style={styles.modalButtons}>
                            <TouchableOpacity style={styles.modalCancel} onPress={() => setShowFolderConfirmation(false)}>
                                <Text style={styles.modalButtonCancel}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.modalDelete} onPress={handleFolderDeleteConfirmed}>
                                <Text style={styles.modalButtonDelete}>Delete</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
            <Modal
                visible={showOptionsOverlay}
                transparent={true}
                animationType="fade"
                onRequestClose={handleCloseOverlay}
            >
                <StatusBar backgroundColor="#000000CC" barStyle="light-content" />
                <View style={styles.overlay}>
                    <TouchableOpacity style={styles.overlayOptionContainer} onPress={openAddFlashcardSet}>
                        <Ionicons name="add" size={24} color="#FFF" style={styles.overlayIcon} />
                        <Text style={styles.overlayOption}>Add Flashcard Sets</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.overlayOptionContainer} onPress={openFolderModal}>
                        <Ionicons name="pencil" size={24} color="#FFF" style={styles.overlayIcon} />
                        <Text style={styles.overlayOption}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.overlayOptionContainer} onPress={handleDeleteFolderConfirmation}>
                        <Ionicons name="trash-outline" size={24} color="#FFF" style={styles.overlayIcon} />
                        <Text style={styles.overlayOption}>Delete Folder</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.overlayCancel} onPress={handleCloseOverlay}>
                        <Ionicons name="close" size={30} color="#FFF" style={styles.overlayCancel} />
                    </TouchableOpacity>
                </View>
            </Modal>
            <EditFolderModal visible={folderModalVisible} onClose={closeFolderModal} folderId={folderId}/>
        </View>
    );
};

const styles = StyleSheet.create({
    scrollViewContent: {
        flexGrow: 1,
        backgroundColor: '#fff',
        paddingBottom: 30
    },
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        justifyContent: 'space-between',
        flexDirection: 'row',
        backgroundColor: '#139362',
        padding: 15,
        marginBottom: 20,
        width: '100%',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 15,
        },
        shadowOpacity: 0.75,
        shadowRadius: 3.84,
        elevation: 15,
        height: 150,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30
    },
    headerButton: {
        padding: 5,
    },
    headerOptionButton: {
        padding: 5,
    },
    headerOptionIcon: {
        fontSize: 30,
        color: '#FFFFFF',
        fontWeight: 'bold',
    },
    headerText: {
        color: '#FFFFFF',
        fontSize: 32,
        marginRight: 200,
        padding: 1
    },
    folderInfo: {
        justifyContent: 'space-between',
        flexDirection: 'row',
        position: 'absolute',
        bottom: 20,
        left: 15,
    },
    folderName: {
        marginLeft: 30,
        marginBottom: 10,
        fontSize: 32,
        color: '#FFF',
        fontWeight: 'bold'
    },
    lowerLeftContainer: {
        marginLeft: 30,
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 30,
        paddingVertical: 9,
        borderRadius: 20,
        height: 38
    },
    lowerLeftFlashcard: {
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
    additionalText: {
        fontSize: 16,
        color: '#616161',
        fontWeight: 'bold'
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
    button: {
        backgroundColor: '#139362',
        paddingVertical: 10,
        paddingHorizontal: 30,
        borderRadius: 50,
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
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
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        justifyContent: 'flex-end',
    },
    overlayOptionContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 40,
        marginLeft: 30
    },
    overlayIcon: {
        marginRight: 40,
    },
    overlayOption: {
        fontSize: 24,
        color: '#fff',
    },
    overlayCancel: {
        fontSize: 40,
        color: '#fff',
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 30,
        paddingHorizontal: 20,
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        paddingLeft: 30,
        paddingRight: 30
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

export default FolderPage;

