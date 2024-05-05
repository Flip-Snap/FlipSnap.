import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Image, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FIRESTORE_DB } from '../../FirebaseConfig';
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { useNavigation } from '@react-navigation/native';

const SearchScreen = () => {
    const navigation = useNavigation();
    const [folderSets, setFolderSets] = useState([]);
    const [flashcardSets, setFlashcardSets] = useState([]);
    const [searchKeyword, setSearchKeyword] = useState('');

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


    const handleFolderPress = (folderId) => {
        navigation.navigate('FolderPage', { folderId });
    };

    const handleFlashcardPress = (flashcardSetId) => {
        navigation.navigate('Flashcards', { flashcardSetId });
    };

    const filteredFolderSets = folderSets.filter(folderSet =>
        folderSet.name.toLowerCase().includes(searchKeyword.toLowerCase()) || folderSet.description.toLowerCase().includes(searchKeyword.toLowerCase())
    );

    const filteredFlashcardSets = flashcardSets.filter(flashcardSet =>
        flashcardSet.title.toLowerCase().includes(searchKeyword.toLowerCase()) || flashcardSet.description.toLowerCase().includes(searchKeyword.toLowerCase())
    );

    const getMasteryColor = (mastery) => {
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

    const handleViewFlashcard = () => {
        navigation.navigate('Library');
    };

    const handleViewFolders = () => {
        navigation.navigate('Library');
    };
   

    return (
        <ScrollView contentContainerStyle={styles.scrollViewContent}>
            <StatusBar backgroundColor="#fff" barStyle="dark-content" />
            <View style={styles.logoContainer}>
                <Image  
                    style={styles.logo}
                    source={require('../../images/homelogo.png')}
                />
            </View>
            <View style={styles.searchContainerWrapper}>
                <View style={styles.searchContainer}>
                    <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search"
                        onChangeText={setSearchKeyword}
                        value={searchKeyword}
                    />
                </View>
            </View>

            {searchKeyword === '' && (
                <View>
                    <Image
                        source={require('../../images/search_pic.gif')}
                        style={styles.searchImage}
                    />
                    <Text style={styles.searchText}>Effortlessly find your study materials. Enter your search for folders, flashcards set, or descriptions.</Text>
                </View>
            )}

            {searchKeyword !== '' && filteredFolderSets.length === 0 && filteredFlashcardSets.length === 0 && (
                <View>
                    <Image 
                        source={require('../../images/no_found.png')}
                        style={styles.foundImage}
                    />
                    <Text style={styles.foundText}>Oops! It seems there are no matching results for your search. Want to give it another shot?</Text>
                </View>

            )}

            {searchKeyword !== '' && filteredFlashcardSets.length > 0 && (
                <View style={styles.titleContainer}>
                    <Text style={styles.resultTitle}>Flashcard Sets</Text>
                    <Text style={styles.viewAllText} onPress={handleViewFolders}>View All</Text>
                </View>
            )}

            {searchKeyword !== '' && filteredFlashcardSets.map(flashcardSet => (
                <TouchableOpacity
                    key={flashcardSet.id}
                    style={styles.touchableContainer}
                    onPress={() => handleFlashcardPress(flashcardSet.id)}
                >

                    <View style={styles.flashcardContainer}>
                        <View style={styles.upperLeftContainerCards}>
                            <View style={styles.moduleContainerCards}>
                                <Text style={styles.labelCards}>{flashcardSet.title}</Text>
                                <Text style={styles.folderDescription}>{flashcardSet.description}</Text>
                            </View>
                        </View>
                        <View style={styles.lowerLeftContainerCards}>
                            <Text style={styles.additionalText}>{flashcardSet.flashcardCount} terms</Text>
                        </View>
                        <View style={styles.lowerRightContainerCards}>
                            <View style={styles.proficiencyContainer}>
                                <Text style={styles.proficiencyLabel}>Proficiency:</Text>
                                <Text style={[styles.proficiencyPercentage, { color: getProficiencyColor(flashcardSet.proficiency) }]}>{flashcardSet.proficiency.toFixed(2)}%</Text>
                            </View>
                        </View>
                    </View>
                </TouchableOpacity>
            ))}

            {searchKeyword !== '' && filteredFolderSets.length > 0 && (
                <View style={styles.titleContainer}>
                    <Text style={styles.resultTitle}>Folders</Text>
                    <Text style={styles.viewAllText} onPress={handleViewFolders}>View All</Text>
                </View>
            )}
            {searchKeyword !== '' && filteredFolderSets.map(folderSet => (
                <TouchableOpacity
                    key={folderSet.id}
                    style={styles.touchableContainer}
                    onPress={() => handleFolderPress(folderSet.id)}
                >
                    <View style={styles.folderContainer}>
                        <View style={styles.upperLeftContainerFolder}>
                            <View style={styles.moduleContainerFolder}>
                                <Ionicons name="folder" size={38} color="#616161" style={styles.iconFolder} />
                                <Text style={styles.folderName}>{folderSet.name}</Text>
                                <Text style={styles.folderDescription}>{folderSet.description}</Text>
                            </View>  
                        </View>
                        <View style={styles.lowerLeftContainerFolder}>
                                <Text style={styles.additionalText}>{folderSet.folderCount} sets</Text>
                        </View>
                        <View style={styles.lowerRightContainerFolder}>
                            <View style={styles.masteryContainer}>
                                    <Text style={styles.masteryLabel}>Mastery Level:</Text>
                                    <Text style={[styles.masteryPercentage, { color: getMasteryColor(folderSet.mastery) }]}>{folderSet.mastery}%</Text>
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
        paddingVertical: 20,
    },
    logo: {
        width: 140,
        height: 30,
    },
    logoContainer: {
        alignItems: 'flex-start',
        marginTop: 20,
        marginLeft: 20,
        marginBottom: 50,
    },
    searchImage: {
        alignSelf: 'center',
        justifyContent: 'center',
        marginTop:100,
        width: 280,
        height: 280
    },
    searchText: {
        marginTop: 30,
        fontSize: 18,
        marginBottom: 15,
        textAlign: 'center',
        color: '#5F5F5F',
    },
    foundImage: {
        alignSelf: 'center',
        justifyContent: 'center',
        marginTop:150,
        width: 200,
        height: 200
    },
    foundText: {
        marginTop: 30,
        fontSize: 18,
        marginBottom: 15,
        textAlign: 'center',
        color: '#5F5F5F',
    },
    folderContainer: {
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
    touchableContainer: {
        marginBottom: 5,
    },
    icon: {
        marginHorizontal: 10,
    },
    label: {
        flex: 1,
        fontSize: 20,
        fontWeight: 'bold',
        color: '#616161',
    },
    textContainer: {
        flex: 3,
    },
    additionalText1: {
        fontSize: 16,
        color: '#616161',
    },
    description: {
        fontSize: 14,
        color: '#616161',
    },
    searchContainerWrapper: {
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
        borderRadius: 50,
        overflow: 'hidden',
        marginLeft: 10,
        marginRight: 10
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 50,
        backgroundColor: 'white',
        height: 50
    },
    searchIcon: {
        marginLeft: 15,
    },
    searchInput: {
        flex: 1,
        height: 40,
        paddingHorizontal: 10,
        fontSize: 18
    },

    resultTitle: {
        marginLeft: 20,
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    viewAllText: {
        color: '#08C47C',
        fontSize: 20,
        marginRight: 20,
    },
    titleContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 30,
    },

    //Folders Design
    upperLeftContainerFolder: {
        position: 'absolute',
        top: 10,
        left: 10,
        marginLeft: 10
    },
    iconFolder: {
        marginTop: 5,
        marginBottom: 10
    },
    lowerLeftContainerFolder: {
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
    lowerRightContainerFolder: {
        position: 'absolute',
        bottom: 10,
        right: 10,
        marginRight: 10,
        marginBottom: 15,
    },
    moduleContainerFolder: {
        flexDirection: 'column',
        alignItems: 'flex-start'
    },
    folderName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#616161',
    },
    folderDescription: {
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

    //Flashcard UI
    touchableFlashcardContainer: {
        marginBottom: 5,
    },
    upperLeftContainerCards: {
        position: 'absolute',
        top: 10,
        left: 10,
        marginLeft: 10
    },
    lowerLeftContainerCards: {
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
    lowerRightContainerCards: {
        position: 'absolute',
        bottom: 10,
        right: 10,
        marginRight: 10,
        marginBottom: 15,
    },
    moduleContainerCards: {
        flexDirection: 'column',
        alignItems: 'flex-start'
    },
    labelCards: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#616161',
        paddingRight: 50
    },
    descriptionCards: {
        fontSize: 14,
        color: '#616161',
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

    startSearchingText: {
        fontSize: 18,
        textAlign: 'center',
        marginTop: 20,
    },
    noItemFoundText: {
        fontSize: 18,
        textAlign: 'center',
        marginTop: 20,
    },
});

export default SearchScreen;
