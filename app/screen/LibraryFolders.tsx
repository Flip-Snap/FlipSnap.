import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FIRESTORE_DB } from '../../FirebaseConfig';
import { collection, query, where, getDocs, onSnapshot, updateDoc, doc as firestoreDoc } from 'firebase/firestore'; // Renamed 'doc' to 'firestoreDoc'
import { getAuth } from 'firebase/auth';
import { useNavigation } from '@react-navigation/native';

const FoldersScreen = () => {
    const [folderSets, setFolderSets] = useState([]);
    const navigation = useNavigation();

    useEffect(() => {
        const fetchFolderSets = async () => {
            try {
                const auth = getAuth();
                const currentUser = auth.currentUser;
                if (!currentUser) {
                    return;
                }

                const q = query(collection(FIRESTORE_DB, 'folders'), where('user_id', '==', currentUser.uid));
                const querySnapshot = await getDocs(q);

                const setsData = [];
                for (const doc of querySnapshot.docs) {
                    const folderSetId = doc.id;
                    const folderCountQuery = query(collection(FIRESTORE_DB, 'flashcard_sets'), where('folder_id', '==', folderSetId));
                    const folderCountSnapshot = await getDocs(folderCountQuery);
                    const folderCount = folderCountSnapshot.size;

                    let totalMastery = 0;
                    for (const flashcard of folderCountSnapshot.docs) {
                        totalMastery += flashcard.data().proficiency;
                    }
                    const meanMastery = folderCount === 0 ? null : totalMastery / folderCount;
                    const masteryLevel = meanMastery !== null ? meanMastery.toFixed(2) : null;
                    const folderRef = firestoreDoc(FIRESTORE_DB, 'folders', folderSetId); 
                    await updateDoc(folderRef, { mastery: meanMastery });

                    setsData.push({ id: folderSetId, ...doc.data(), folderCount, mastery: masteryLevel });
                }
                setFolderSets(setsData);
            } catch (error) {
                console.error('Error fetching folder sets: ', error);
            }
        };

        const unsubscribe = onSnapshot(collection(FIRESTORE_DB, 'folders'), () => {
            fetchFolderSets();
        });

        const unsubscribeFlashcardSets = onSnapshot(collection(FIRESTORE_DB, 'flashcard_sets'), () => {
            fetchFolderSets();
        });

        return () => {
            unsubscribe();
            unsubscribeFlashcardSets();
        };
    }, []);

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

    const handleFolderPress = (folderId) => {
        navigation.navigate('FolderPage', { folderId });
    };

    return (
        <ScrollView contentContainerStyle={styles.scrollViewContent}>
            <StatusBar backgroundColor="#fff" barStyle="dark-content" />
            {folderSets.map((folderSet, index) => (
                <TouchableOpacity
                    key={folderSet.id}
                    style={styles.touchableFolderContainer}
                    onPress={() => handleFolderPress(folderSet.id)}
                >
                    <View style={styles.folderContainer}>
                        <View style={styles.upperLeftContainer}>
                            <View style={styles.moduleContainer}>
                                <Ionicons name="folder" size={38} color="#616161" style={styles.iconFolder} />
                                <Text style={styles.label}>{folderSet.name}</Text>
                                <Text style={styles.description}>{folderSet.description}</Text>
                            </View>
                        </View>
                        <View style={styles.lowerLeftContainer}>
                            <Text style={styles.additionalText}>{folderSet.folderCount} sets</Text>
                        </View>
                        <View style={styles.lowerRightContainer}>
                            <View style={styles.masteryContainer}>
                                <Text style={styles.masteryLabel}>Mastery Level:</Text>
                                <Text style={[styles.masteryPercentage, { color: getProficiencyColor(folderSet.mastery) }]}>
                                    {folderSet.mastery}%
                                </Text>
                            </View>
                        </View>
                    </View>
                </TouchableOpacity>
            ))}
        </ScrollView>
    );
};


const styles = StyleSheet.create({
    scrollViewContent: {
        flexGrow: 1,
        backgroundColor: '#fff',

    },
    folderContainer: {
        height: 180,
        paddingHorizontal: 20,
        marginTop: 20,
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
    touchableFolderContainer: {
        marginBottom: 5,
    },
    upperLeftContainer: {
        position: 'absolute',
        top: 10,
        left: 10,
        marginLeft: 10
    },
    iconFolder: {
        marginTop: 5,
        marginBottom: 10
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
    },
    description: {
        fontSize: 14,
        color: '#616161',
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
    additionalText: {
        fontSize: 16,
        color: '#616161',
        fontWeight: 'bold'
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
});

export default FoldersScreen;
