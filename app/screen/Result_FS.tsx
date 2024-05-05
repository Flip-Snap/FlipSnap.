import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, Image, TouchableOpacity, Dimensions, Modal, Alert, StatusBar } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useRoute, useNavigation } from '@react-navigation/native';
import { FIRESTORE_DB } from '../../FirebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { doc, deleteDoc, getDocs, collection, query, where } from 'firebase/firestore';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const Result_FS = ({ route }) => {
    const { leftCount, rightCount, flashcardsLength, setTitle, proficiency, flashcardSetId, closeOptionsOverlay } = route.params;
    const navigation = useNavigation();
    const [setToDelete, setSetToDelete] = useState(null);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [showOptionsOverlay, setShowOptionsOverlay] = useState(false);

    useEffect(() => {
        navigation.setOptions({ headerShown: false });
    }, [navigation]);

    useEffect(() => {
        if (closeOptionsOverlay) {
            setShowOptionsOverlay(false);
        }
    }, [closeOptionsOverlay]);

    const handlePlayAgain = () => {
        navigation.navigate('Flashcards', {
          flashcardSetId: flashcardSetId 
        });
      };

    const handleDownload = async () => {
        try {
            const termsAndDefinitions = [];
    
            const q = query(collection(FIRESTORE_DB, 'flashcards'), where('flashcard_set_id', '==', flashcardSetId));
            const querySnapshot = await getDocs(q);
    
            querySnapshot.forEach((doc) => {
                const { term, definition } = doc.data();
                termsAndDefinitions.push({ term, definition });
            });
    
const currentDate = new Date();
const formattedDate = currentDate.toLocaleString();

let pdfContent = `
    <style>
        body {
            font-family: 'Courier New', Courier, monospace;
            margin-top: 500px;
            margin: 30px;
            position: absolute; /* Required for positioning the date */
            // page-break-after: always;
            box-sizing: border-box;
        }

        .flashcard {
            margin-bottom: 20px;
            margin-left: 30px;
            font-size: 16px;
            margin-right: 30px;
            text-align: justify;
        }
        .term {
            font-weight: bold;
            margin-top: 20px;
        }
        h1 {
            margin-top: 30px;
            margin-left: 30px;
            font-size: 50px;
            padding-right: 200px;
        }
        .footer {
            position: fixed;
            bottom: 10px;
            left: 0;
            width: 100%;
            text-align: center; /* Center the text */
            font-family: 'Courier New', Courier, monospace;
            font-size: 12px;
        }
        .logo {
            position: absolute;
            top: 25px;
            right: 20px;
        }
        /* Watermark */
        .watermark {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: -1; /* Place the watermark behind the content */
            opacity: 0.2; /* Adjust the opacity of the watermark */
            pointer-events: none; /* Make the watermark non-clickable */
            width: 550px; /* Adjust the size of the watermark */
            height: 200px;
            background-image: url('https://cdn.glitch.global/29de972c-44fa-4f09-8ae9-37876b0bb078/homelogo.png?v=1713944642309'); /* URL of the watermark image */
            background-repeat: no-repeat;
            background-size: cover;
        }
        /* Date and time */
        .generated-date {
            position: absolute;
            top: 5px; /* Adjust the distance from the top */
            right: 20px; /* Adjust the distance from the right */
            font-size: 12px;
        }
    </style>
    <div class="logo">
    <img src="https://cdn.glitch.global/29de972c-44fa-4f09-8ae9-37876b0bb078/homelogo.png?v=1713944642309" style="width:130px; height:50px;">
    </div>
    <h1>${setTitle}</h1>
`;

termsAndDefinitions.forEach(({ term, definition }, index) => {
    pdfContent += `
    <div class="flashcard">
    <div class="term">Term: ${term}</div>
    <div class="definition">Definition: ${definition}</div>
</div>
    `;

    if (index !== termsAndDefinitions.length - 1) {
        pdfContent += '<div style="page-break-inside: avoid;"></div>';
    }
});

pdfContent += `<div class="generated-date">Generated on: ${formattedDate}</div>`;

pdfContent += `<div class="watermark"></div>`;

pdfContent += `<div class="footer">FlipSnap: Mastering Knowledge One Snap at a Time  |  2024</div>`;
    
            const printOptions = {
                html: pdfContent,
            };
    
            const pdfUri = await Print.printToFileAsync(printOptions);
    
            const directory = `${FileSystem.cacheDirectory}${flashcardSetId}`;
            await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
    
            const newPath = `${directory}/${setTitle}.pdf`;
            await FileSystem.moveAsync({ from: pdfUri.uri, to: newPath });
    
            await Sharing.shareAsync(newPath, { mimeType: 'application/pdf', dialogTitle: `${setTitle}.pdf` });
        } catch (error) {
            console.error('Error creating or sharing PDF:', error);
        }
    };
    


    const handleBackPress = () => {
        navigation.navigate('Library');
    };

    const handleOptionsPress = () => {
        setShowOptionsOverlay(true);
    };

    const handleCloseOverlay = () => {
        setShowOptionsOverlay(false);
    };

    const moveFlashcardSet = (flashcardSetId) => {
        navigation.navigate('MoveFlashcardSetScreen', { flashcardSetId });
    };

    const handleDeleteConfirmation = (flashcardSet) => {
        setSetToDelete(flashcardSet);
        setShowConfirmation(true);
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

    const editFlashcardSet = (flashcardSetId) => {
        navigation.navigate('EditFlashcardSet', { flashcardSetId });
    };

    return (
        <View style={styles.container}>
            <StatusBar backgroundColor="#fff" barStyle="dark-content" />
            <View style={styles.appBar}>
                <View style={styles.leftAppBar}>
                    <Image source={require('../../images/fs_icon.png')} style={styles.appBarIcon} />
                    <Text style={styles.appBarText}>Play Results</Text>
                </View>
                <View style={styles.rightAppBar}>
                    <TouchableOpacity style={styles.menuButton} onPress={handleOptionsPress}>
                        <Icon name="menu" size={24} color="#1D1E20" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.closeButton} onPress={handleBackPress}>
                        <Icon name="x" size={24} color="#1D1E20" />
                    </TouchableOpacity>
                </View>
            </View>
            <View style={styles.content}>
                <Text style={styles.setTitle}>{setTitle}</Text>
                <View style={styles.percentage}>
                    <View style={styles.circle1}></View>
                    <View style={styles.circle2}></View>
                    <View style={styles.circle3}></View>
                    <View style={styles.circle4}></View>
                    <View style={styles.circle5}></View>
                    <View style={styles.circle6}></View>
                    <View style={styles.circle7}>
                        <Text style={styles.percentText}>{proficiency}<Text style={styles.percentTextPercent}>%</Text></Text>
                    </View>
                </View>
                <View style={styles.details}>
                    <View style={styles.firstRow}>
                        <View style={styles.leftSide}>
                            <View style={styles.circleWithDetail}>
                                <View style={styles.circleDetail1} />
                                <Text style={styles.completion}>100%</Text>
                            </View>
                            <Text style={styles.detailLabel}>Completion</Text>
                        </View>
                        <View style={styles.total}>
                            <View style={styles.circleWithDetail}>
                                <View style={styles.circleDetail2} />
                                <Text style={styles.total}>{flashcardsLength}</Text>
                            </View>
                            <Text style={styles.detailLabel}>Total Questions</Text>
                        </View>
                    </View>
                    <View style={styles.secondRow}>
                        <View style={styles.leftSide}>
                            <View style={styles.circleWithDetail}>
                                <View style={styles.circleDetail3} />
                                <Text style={styles.know}>{rightCount}</Text>
                            </View>
                            <Text style={styles.detailLabel}>Know</Text>
                        </View>
                        <View style={styles.rightSide}>
                            <View style={styles.circleWithDetail}>
                                <View style={styles.circleDetail4} />
                                <Text style={styles.stillLearning}>{leftCount}</Text>
                            </View>
                            <Text style={styles.detailLabel}>Still Learning</Text>
                        </View>
                    </View>
                </View>
                <View style={styles.buttonContainer}>
                    <View style={styles.buttonWrapper}>
                        <TouchableOpacity style={[styles.button, styles.againBtn]} onPress={handlePlayAgain}>
                            <Icon name="rotate-cw" size={24} color="#FFFFFF" />
                        </TouchableOpacity>
                        <Text style={styles.buttonLabel}>Play Again</Text>
                    </View>
                    <View style={styles.buttonWrapper}>
                        <TouchableOpacity style={[styles.button, styles.downloadBtn]} onPress={handleDownload}>
                            <Icon name="download" size={24} color="#FFFFFF" />
                        </TouchableOpacity>
                        <Text style={styles.buttonLabel}>Download</Text>
                    </View>
                </View>
            </View>


            <Modal
                visible={showOptionsOverlay}
                transparent={true}
                animationType="fade"
                onRequestClose={handleCloseOverlay}
            >
                <StatusBar backgroundColor="#000000CC" barStyle="light-content" />
                <View style={styles.overlay}>
                    <TouchableOpacity style={styles.overlayOptionContainer} onPress={() => moveFlashcardSet(flashcardSetId)}>
                        <Ionicons name="add" size={24} color="#FFF" style={styles.overlayIcon} />
                        <Text style={styles.overlayOption}>Move to Folder</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.overlayOptionContainer} onPress={() => editFlashcardSet(flashcardSetId)}>
                        <Ionicons name="pencil" size={24} color="#FFF" style={styles.overlayIcon} />
                        <Text style={styles.overlayOption}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.overlayOptionContainer} onPress={() => handleDeleteConfirmation(flashcardSetId)}>
                        <Ionicons name="trash-outline" size={24} color="#FFF" style={styles.overlayIcon} />
                        <Text style={styles.overlayOption}>Delete Flashcard Set</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.overlayCancel} onPress={handleCloseOverlay}>
                        <Ionicons name="close" size={30} color="#FFF" style={styles.overlayCancel} />
                    </TouchableOpacity>
                </View>
            </Modal>

            <Modal
                visible={showConfirmation}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowConfirmation(false)}
            >
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


        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF'
    },
    appBar: {
        flexDirection: 'row',
        width: '100%',
        height: 60,
        backgroundColor: 'transparent',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 30,
        marginTop: 40,
    },
    leftAppBar: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    rightAppBar: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    appBarIcon: {
        width: 40,
        height: 34,
        marginHorizontal: 10,
    },
    appBarText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1D1E20',
    },
    menuButton: {
        padding: 5,
        marginRight: 10,
    },
    closeButton: {
        padding: 5,
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    setTitle: {
        position: 'absolute',
        top: 15,
        fontSize: 20,
        fontWeight: '700',
    },
    percentage: {
        backgroundColor: '#08C47C',
        height: 370,
        width: screenWidth - 50,
        borderRadius: 30,
        position: 'absolute',
        top: 50,
        elevation: 5,
        marginTop: 20
    },
    
    circle1: {
        backgroundColor: '#FFFFFF',
        opacity: 0.1,
        borderRadius: 50,
        width: 90,
        height: 90,
        position: 'absolute',
        top: 55,
        left: -25,
    },
    circle2: {
        backgroundColor: '#FFFFFF',
        opacity: 0.1,
        borderRadius: 50,
        width: 90,
        height: 90,
        position: 'absolute',
        top: -30,
        left: 90,
    },
    circle3: {
        backgroundColor: '#FFFFFF',
        opacity: 0.1,
        borderRadius: 50,
        width: 48,
        height: 48,
        position: 'absolute',
        top: 20,
        left: 200,
    },
    circle4: {
        backgroundColor: '#FFFFFF',
        opacity: 0.1,
        borderRadius: 50,
        width: 100,
        height: 100,
        position: 'absolute',
        top: 75,
        right: -32,
    },
    circle5: {
        backgroundColor: '#FFFFFF',
        opacity: 0.15,
        borderRadius: 100,
        width: 200,
        height: 200,
        position: 'absolute',
        top: '50%',
        left: '50%',
        marginLeft: -100,
        marginTop: -100,
        elevation: 5,
    },
    circle6: {
        backgroundColor: '#FFFFFF',
        opacity: 0.2,
        borderRadius: 100,
        width: 160,
        height: 160,
        position: 'absolute',
        top: '50%',
        left: '50%',
        marginLeft: -80,
        marginTop: -80,
        elevation: 5,
    },
    circle7: {
        backgroundColor: '#FFFFFF',
        opacity: 1,
        borderRadius: 100,
        width: 125,
        height: 125,
        position: 'absolute',
        top: '50%',
        left: '50%',
        marginLeft: -62.5,
        marginTop: -62.5,
        elevation: 2,
    },
    percentText: {
        textAlign: 'center',
        lineHeight: 148,
        fontSize: 40,
        fontWeight: '700',
        color: '#A42FC1',
    },
    percentTextPercent: {
        fontSize: 24,
    },
    details: {
        backgroundColor: 'white',
        padding: 30,
        height: 150,
        width: screenWidth - 90,
        borderRadius: 30,
        position: 'absolute',
        top: 370,
        elevation: 10,
        justifyContent: 'center',
    },
    firstRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 13,
        alignItems: 'center',
    },
    secondRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    rightSide: {
        flex: 1,
        marginLeft: 40
    },
    leftSide: {
        flex: 1,
        marginRight: 10,
    },
    completion: {
        fontWeight: 'bold',
        fontSize: 20,
        color: '#A42FC1',
    },
    total: {
        fontWeight: 'bold',
        fontSize: 20,
        color: '#1D7FA9',
    },
    know: {
        fontWeight: 'bold',
        fontSize: 20,
        color: '#08C47C',
    },
    stillLearning: {
        fontWeight: 'bold',
        fontSize: 20,
        color: '#FF3242',
    },
    detailLabel: {
        fontSize: 15,
        marginLeft: 20,
    },
    circleWithDetail: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    circleDetail1: {
        width: 11,
        height: 11,
        borderRadius: 12,
        backgroundColor: '#A42FC1',
        marginRight: 7,
    },
    circleDetail2: {
        width: 11,
        height: 11,
        borderRadius: 12,
        backgroundColor: '#1D7FA9',
        marginRight: 7,
    },
    circleDetail3: {
        width: 11,
        height: 11,
        borderRadius: 12,
        backgroundColor: '#08C47C',
        marginRight: 7,
    },
    circleDetail4: {
        width: 11,
        height: 11,
        borderRadius: 12,
        backgroundColor: '#FF3242',
        marginRight: 7,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 60,
        marginTop: screenHeight * 0.6,
        width: '100%',
    },
    button: {
        borderRadius: 50,
        paddingVertical: 15,
        paddingHorizontal: 15,
        alignItems: 'center',
        justifyContent: 'center',
        width: 70, 
        height: 70,
    },
    againBtn: {
        backgroundColor: '#A42FC1',
    },
    downloadBtn: {
        backgroundColor: '#08C47C',
    },
    buttonWrapper: {
        alignItems: 'center',
    },
    buttonLabel: {
        textAlign: 'center',
        fontSize: 15,
        color: '#1D1E20',
        marginTop: 5, 
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

export default Result_FS;