import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Platform, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FIRESTORE_DB } from '../../FirebaseConfig';
import { collection, query, where, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const MoveFlashcardSetScreen = ({ route, navigation }) => {
    const { folderId, showOptionsOverlay, flashcardSetId } = route.params;
    const [folders, setFolders] = useState([]);
    const [selectedFlashcardSets, setSelectedFlashcardSets] = useState([]);
    const [selectedFolderId, setSelectedFolderId] = useState(null);

    useEffect(() => {
        setSelectedFlashcardSets([flashcardSetId]);
    }, [flashcardSetId]);

    useEffect(() => {
        const fetchFolders = async () => {
            try {
                const auth = getAuth();
                const currentUser = auth.currentUser;
                if (!currentUser) {
                    return;
                }
        
                const q = query(collection(FIRESTORE_DB, 'folders'), where('user_id', '==', currentUser.uid));
                const querySnapshot = await getDocs(q);
        
                const foldersData = [];
                for (const doc of querySnapshot.docs) {
                    const folderData = { id: doc.id, ...doc.data() };
                    
                    const folderCountQuery = query(collection(FIRESTORE_DB, 'flashcard_sets'), where('folder_id', '==', doc.id));
                    const folderCountSnapshot = await getDocs(folderCountQuery);
                    const folderCount = folderCountSnapshot.size;
                    folderData.folderCount = folderCount;
        
                    let totalMastery = 0;
                    folderCountSnapshot.forEach(flashcard => {
                        totalMastery += flashcard.data().proficiency;
                    });
                    const meanMastery = folderCount === 0 ? null : totalMastery / folderCount;
                    folderData.mastery = meanMastery !== null ? meanMastery.toFixed(2) : null;
        
                    foldersData.push(folderData);
                }
        
                setFolders(foldersData);
            } catch (error) {
                console.error('Error fetching folders: ', error);
            }
        };
        
        fetchFolders();
    }, []);

    const handleMoveToFolder = async (folderId) => {
        try {
            const auth = getAuth();
            const currentUser = auth.currentUser;
            if (!currentUser) {
                return;
            }

            if (!Array.isArray(selectedFlashcardSets) || !selectedFlashcardSets.length) {
                console.error('No valid flashcard set IDs found.');
                return;
            }

            const updatePromises = selectedFlashcardSets.map(async (flashcardSetId) => {
                const flashcardSetRef = doc(FIRESTORE_DB, 'flashcard_sets', flashcardSetId);
                await updateDoc(flashcardSetRef, { folder_id: folderId });
            });

            await Promise.all(updatePromises);

            Alert.alert(
                'Success',
                `Flashcard set moved to ${folders.find(folder => folder.id === selectedFolderId).name} folder successfully`,
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
        } catch (error) {
            console.error('Error moving flashcard set to folder: ', error);
            Alert.alert('Error', 'Failed to move flashcard set to folder. Please try again later.');
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
                        navigation.goBack(() => {
                            navigation.navigate('Result_FS', { closeOptionsOverlay: true });
                        });
                    },
                    style: 'destructive'
                }
            ]
        );
    };
    

    const handleConfirmMove = () => {
        if (selectedFolderId) {
            Alert.alert(
                'Confirmation',
                `Are you sure you want to move this flashcard set to ${folders.find(folder => folder.id === selectedFolderId).name} folder?`,
                [
                    {
                        text: 'Cancel',
                        style: 'cancel'
                    },
                    {
                        text: 'Move',
                        onPress: () => {
                            handleMoveToFolder(selectedFolderId);
                        },
                        style: 'destructive'
                    }
                ]
            );
        } else {
            Alert.alert('Error', 'Please select a folder to move the flashcard set.');
        }
    };

    const getProficiencyColor = (mastery) => {
        if (mastery >= 80) {
            return '#08C47C';
        } else if (mastery >= 60) {
            return '#A42FC1';
        } else if (mastery >= 40) {
            return '#FFA500';
        } else {
            return '#FF6347';
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar backgroundColor="#139362" barStyle="light-content" />
                <View style={styles.header}>
                    <TouchableOpacity style={styles.headerButton} onPress={handleCancel}>
                        <Ionicons name="arrow-back" size={26} color="#FFFFFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Move to Folder</Text>
                    <TouchableOpacity style={styles.headerButton} onPress={handleConfirmMove}>
                        <Ionicons name="checkmark-sharp" size={26} color="#FFFFFF" />
                    </TouchableOpacity>
                </View>
                <ScrollView contentContainerStyle={styles.scrollViewContent}>
                <View>
                    {folders.map(folder => (
                        <TouchableOpacity
                            key={folder.id}
                            style={[styles.folderItem, folder.id === selectedFolderId ? styles.selectedFolderItem : null]}
                            onPress={() => setSelectedFolderId(folder.id)}
                        >
                        <View style={styles.upperLeftContainer}>
                            <View style={styles.moduleContainer}>
                                <Text style={styles.label}>{folder.name}</Text>
                                <Text style={styles.description}>{folder.description}</Text>
                            </View>
                        </View>
                        <View style={styles.lowerLeftContainer}>
                                <Text style={styles.additionalText}>{folder.folderCount} sets</Text>
                        </View>
                        <View style={styles.lowerRightContainer}>
                                <View style={styles.masteryContainer}>
                                    <Text style={styles.masteryLabel}>Mastery Level:</Text>
                                    <Text style={[styles.masteryPercentage, { color: getProficiencyColor(folder.mastery) }]}>
                                        {folder.mastery}%
                                    </Text>
                                </View>
                        </View>

                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>
        </View>
    );
};


const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        flex: 1,
        backgroundColor: '#fff',
    },
    scrollViewContent: {
        flexGrow: 1,
        backgroundColor: '#fff',
        paddingBottom: 50
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
    folderItem: {
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
    moduleContainer: {
        flexDirection: 'column',
        alignItems: 'flex-start'
    },
    upperLeftContainer: {
        position: 'absolute',
        top: 10,
        left: 10,
        marginLeft: 10
    },
    lowerRightContainer: {
        position: 'absolute',
        bottom: 10,
        right: 10,
        marginRight: 10,
        marginBottom: 15,
    },
    masteryContainer: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    masteryLabel: {
        marginRight: 5,
        color: '#616161',
        fontSize: 16
    },
    masteryPercentage: {
        fontWeight: 'bold',
        color: '#08C47C',
        fontSize: 16
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
    additionalText: {
        fontSize: 16,
        color: '#616161',
        fontWeight: 'bold'
    },
    selectedFolderItem: {
        backgroundColor: '#CFFFE5',
    }
});

export default MoveFlashcardSetScreen;
