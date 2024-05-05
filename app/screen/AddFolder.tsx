import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Modal, StyleSheet, TouchableOpacity, TouchableWithoutFeedback, ActivityIndicator, Alert, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { FIRESTORE_DB } from '../../FirebaseConfig';
import { collection, addDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const FolderModal = ({ route, visible, onClose }) => {
    const navigation = useNavigation();

    const [nameFocused, setNameFocused] = useState(false);
    const [descriptionFocused, setDescriptionFocused] = useState(false);
    const [description, setDescription] = useState('');
    const [name, setName] = useState('');
    const [mastery, setMastery] = useState(0);
    const [loading, setLoading] = useState(false);
    const [saveDisabled, setSaveDisabled] = useState(true);

        useEffect(() => {
            setSaveDisabled(name.trim() === '');
        }, [name]);
    
        useEffect(() => {
            if (visible) {
                setMastery(0);
            }
        }, [visible]);
    
    const handleSave = async () => {
        setLoading(true);
        try {
            const auth = getAuth();
            const user = auth.currentUser;

            if (user) {
                const folderCollectionRef = collection(FIRESTORE_DB, 'folders');
                await addDoc(folderCollectionRef, {
                    description: description,
                    name: name,
                    mastery: Number(mastery),
                    user_id: user.uid
                });
                console.log('Folder added successfully!');
                Alert.alert(
                    'Success',
                    'Folder added successfully!',
                    [{ text: 'Okay', onPress: () => navigation.navigate('Library')}]
                );
                setDescription('');
                setName('');
                setMastery(0);
            } else {
                Alert.alert('Error', 'User not logged in. Please log in and try again.');
            }
        } catch (error) {
            console.error('Error adding folder: ', error);
            Alert.alert('Error', 'Failed to add folder. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleDescription = (text) => {
        setDescription(text);
    };

    const handleName = (text) => {
        setName(text);
    };

    const handleDescriptionFocus = () => {
        setDescriptionFocused(true);
        setNameFocused(false);
    };

    const handleNameFocus = () => {
        setNameFocused(true);
        setDescriptionFocused(false);
    };

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <StatusBar backgroundColor="#00000080" barStyle="light-content" />
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={[{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}>
                    <TouchableWithoutFeedback>
                        <View style={styles.folderModalContent}>
                            <Text style={styles.label}>Create a Folder</Text>
                            <View>
                                <TextInput
                                    value={name}
                                    style={[styles.input, { borderBottomColor: nameFocused ? '#08C47C' : '#8F959E' }]}
                                    autoCapitalize='words'
                                    onChangeText={handleName}
                                    onFocus={handleNameFocus}
                                    placeholder='Folder Name'
                                    textAlign='left'
                                    multiline={true}
                                />
                            </View>
                            <View>
                                <TextInput
                                    value={description}
                                    style={[styles.input, { borderBottomColor: descriptionFocused ? '#08C47C' : '#8F959E' }]}
                                    autoCapitalize='sentences'
                                    onChangeText={handleDescription}
                                    onFocus={handleDescriptionFocus}
                                    placeholder='Description (optional)'
                                    textAlign='left'
                                    multiline={true}
                                />
                            </View>
                            <View style={styles.buttonContainer}>
                                <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                                    <Text style={styles.cancelText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.saveButton, { opacity: saveDisabled ? 0.5 : 1 }]} onPress={handleSave} disabled={saveDisabled || loading}>
                                    {loading ? (
                                        <ActivityIndicator color="#FFFFFF" />
                                    ) : (
                                        <Text style={styles.buttonText}>Save</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
};

const styles = StyleSheet.create({
    folderModalContent: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 10,
        width: '90%',
        maxHeight: 400,
    },
    label: {
        alignSelf: 'flex-start',
        marginBottom: 20,
        fontSize: 18,
        fontWeight: 'bold',
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 30,
    },
    cancelButton: {
        backgroundColor: '#fff',
        padding: 10,
        borderRadius: 5,
        borderWidth: 2,
        borderColor: '#FF5733',
        width: '45%',
        alignItems: 'center',
    },
    saveButton: {
        backgroundColor: '#A42FC1',
        borderColor: '#A42FC1',
        padding: 10,
        borderRadius: 5,
        width: '45%',
        alignItems: 'center',
    },
    cancelText: {
        color: '#FF5733',
        fontSize: 18,
        textAlign: 'center',
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 18,
        textAlign: 'center',
    },
    input: {
        height: 60,
        padding: 5,
        paddingRight: 50,
        fontSize: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#8F959E',
        width: '100%',
        textAlign: 'left',
        marginBottom: 20,
    },
});

export default FolderModal;
