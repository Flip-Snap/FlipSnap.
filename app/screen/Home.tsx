import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, BackHandler, Image, ScrollView, StatusBar } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons'; 
import { useNavigation } from '@react-navigation/native';
import { doc, onSnapshot } from 'firebase/firestore'; // Import onSnapshot from firestore
import { FIRESTORE_DB } from '../../FirebaseConfig';
import FolderModal from './AddFolder';

const HomeScreen = ({ route }) => {
    const navigation = useNavigation();
    const { uid } = route.params;

    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [folderModalVisible, setFolderModalVisible] = useState(false);

    useEffect(() => {
        if (!uid) {
            console.error('User ID is undefined or null');
            setLoading(false);
            return;
        }

        const userDocRef = doc(FIRESTORE_DB, 'users', uid);

        const unsubscribe = onSnapshot(userDocRef, (doc) => {
            if (doc.exists()) {
                setUser(doc.data());
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        return unsubscribe;
    }, [uid]);

    useEffect(() => {
        const backAction = () => {
            Alert.alert("Log out", "Are you sure you want to log out?", [
                {
                    text: "Cancel",
                    onPress: () => null,
                    style: "cancel"
                },
                { 
                    text: "Log out", 
                    onPress: () => {
                        navigation.reset({
                            index: 0,
                            routes: [{ name: 'Login' }],
                        });
                    }
                }
            ]);
            return true;
        };

        const backHandler = BackHandler.addEventListener(
            "hardwareBackPress",
            backAction
        );

        return () => backHandler.remove();
    }, []);

    const navigateToFlashcardPage = () => {
        navigation.navigate('FlashcardFormStack'); 
      };

      const openFolderModal = () => {
        setFolderModalVisible(true);
      };
    
      const closeFolderModal = () => {
        setFolderModalVisible(false);
      };

    return (
        <ScrollView contentContainerStyle={styles.scrollViewContainer}>
            <StatusBar backgroundColor="#fff" barStyle="dark-content" />
            <View style={styles.container}>
                <View style={styles.userInfo}>
                    <Text style={styles.welcome}>Welcome,</Text>
                    <Text style={styles.username}>{user && user.first_name} {user && user.last_name}!</Text>
                </View>
                <View style={styles.imageContainer}>
                    <Image
                        style={styles.logo}
                        source={require('../../images/homelogo.png')}
                    />
                </View>
                <View style={styles.contentContainer}>
                    <Text style={styles.levelUpText}>Level Up Your Review.</Text>
                    <Text style={styles.intro}>FlipSnap is a smart flashcard, {'\n'} study partner, made for students.</Text>
                    <Image
                        style={styles.homePicture}
                        source={require('../../images/homePicture.png')}
                    />
                </View>

                <View style={styles.navContainer}>
                    <TouchableOpacity style={styles.buttonContainer} onPress={navigateToFlashcardPage}>
                        <View style={styles.textContainer}>
                            <Text style={styles.createFlashcard}>Create a Flashcard Set</Text>
                            <Text style={styles.flashcardText}>Now powered by voice recognition!</Text>
                        </View>
                        <FontAwesome5 name="arrow-right" style={styles.arrowIcon} />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.buttonContainer2} onPress={openFolderModal}>
                        <View style={styles.textContainer}>
                            <Text style={styles.createFolderText}>Create a Folder</Text>
                            <Text style={styles.folderText}>Organize your flashcards in folders</Text>
                        </View>
                        <FontAwesome5 name="arrow-right" style={styles.arrowIcon} />
                    </TouchableOpacity>
                    <FolderModal visible={folderModalVisible} onClose={closeFolderModal} />
                </View>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    scrollViewContainer: {
        flexGrow: 1,
        backgroundColor: '#fff'
    },
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    userInfo: {
        position: 'absolute',
        top: 50,
        left: 20,
        padding: 10,
        zIndex: 2,
    },
    welcome: {
        fontSize: 28,
        fontWeight: 'bold',
    },
    username: {
        fontSize: 32,
    },
    imageContainer: {
        position: 'absolute',
        top: 20,
        right: 10,
        zIndex: 2,
    },
    logo: {
        width: 100,
        height: 30,
    },
    contentContainer: {
        alignItems: 'center',
    },
    levelUpText: {
        fontSize: 30,
        fontWeight: 'bold',
        paddingTop: 0,
        marginTop: 170,
    },
    intro: {
        fontSize: 18,
        marginTop: 10,
        marginBottom: 15,
        textAlign: 'center',
        color: '#8F959E',
    },
    homePicture: {
        width: 260,
        height: 230,
        marginTop: 15,
        marginBottom: 30,
    },
    navContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F6FA',
        paddingVertical: 20,
        paddingHorizontal: 20,
        marginBottom: 20,
        borderRadius: 10,
        width: '90%',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    buttonContainer2: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F6FA',
        paddingVertical: 20,
        paddingHorizontal: 20,
        marginBottom: 50,
        borderRadius: 10,
        width: '90%',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    textContainer: {
        flex: 1,
    },
    createFlashcard: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 5,
        textAlign: 'left',
    },
    flashcardText: {
        fontSize: 16,
        color: 'gray',
        textAlign: 'left',
    },
    createFolderText: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 5,
        textAlign: 'left',
    },
    folderText: {
        fontSize: 16,
        color: 'gray',
        textAlign: 'left',
    },
    arrowIcon: {
        fontSize: 20,
        marginLeft: 'auto',
    },
});

export default HomeScreen;

