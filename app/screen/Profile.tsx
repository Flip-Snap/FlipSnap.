import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Image, Alert, ScrollView, StatusBar } from 'react-native';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { FIRESTORE_DB } from '../../FirebaseConfig';
import { FontAwesome5 } from '@expo/vector-icons';
import { faUser, faEnvelope, faUserLock } from '@fortawesome/free-solid-svg-icons';

const Profile = ({ route, navigation }) => {
    const { uid } = route.params;

    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

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

    const onEditProfile = () => {
        navigation.navigate('EditProfile', { user });
    };

    const updateUserProfile = async (updatedUserData) => {
        try {
            await updateDoc(doc(FIRESTORE_DB, 'users', uid), updatedUserData);
            setUser(updatedUserData);
            navigation.goBack();
        } catch (error) {
            console.error('Error updating profile:', error);
        }
    };

    const handleLogout = () => {
        Alert.alert(
            'Logout',
            'Are you sure you want to logout?',
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Logout',
                    onPress: () => {
                        navigation.navigate('Login');
                    },
                    style: 'destructive',
                },
            ],
            { cancelable: false }
        );
    };

    if (!uid) {
        return (
            <View style={styles.container}>
                <Text>User ID is missing.</Text>
            </View>
        );
    }

    if (loading) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" color="#0000ff" />
            </View>
        );
    }

    return (
        <ScrollView contentContainerStyle={styles.scrollViewContent}>
            <StatusBar backgroundColor="#fff" barStyle="dark-content" />
            <View style={styles.container}>
                {user ? (
                    <>
                        <Text style={styles.profileText}>My Profile</Text>
                        {user.profile ? (
                            <View style={styles.outerCircle}>
                                <Image source={{ uri: user.profile }} style={styles.profileImage} />
                            </View>
                        ) : (
                            <View style={[styles.outerCircle]}>
                                <View style={[styles.defaultProfileImage]}>
                                    <Text style={styles.avatarText}>
                                        {user.first_name.charAt(0).toUpperCase()}
                                        {user.last_name.charAt(0).toUpperCase()}
                                    </Text>
                                </View>
                            </View>
                        )}
                        <Text style={styles.nameText}>{user.first_name} {user.last_name}</Text>
                        <Text style={styles.emailText}>{user.email}</Text>

                        <TouchableOpacity style={styles.editButton} onPress={onEditProfile}>
                            <Text style={styles.editButtonText}>EDIT PROFILE</Text>
                        </TouchableOpacity>

                        <View style={styles.leftAlignedContainer}>
                            <View style={styles.infoContainer}>
                                <View style={styles.iconBackground}>
                                    <FontAwesome5 name='user' icon={faUser} style={styles.icon} />
                                </View>
                                <View>
                                    <Text style={styles.info}>Name</Text>
                                    <Text style={styles.infoAnswer}>{user.first_name} {user.last_name}</Text>
                                </View>
                            </View>

                            <View style={styles.horizontalLine} />

                            <View style={styles.infoContainer}>
                                <View style={styles.iconBackground}>
                                    <FontAwesome5 name='envelope' icon={faEnvelope} style={styles.icon} />
                                </View>
                                <View>
                                    <Text style={styles.info}>Email</Text>
                                    <Text style={styles.infoAnswer}>{user.email}</Text>
                                </View>
                            </View>

                            <View style={styles.horizontalLine} />

                            <View style={styles.infoContainer}>
                                <View style={styles.iconBackground}>
                                    <FontAwesome5 name='user-lock' icon={faUserLock} style={styles.icon} />
                                </View>
                                <View>
                                    <Text style={styles.info}>Password</Text>
                                    <Text style={styles.infoAnswer}>{'*'.repeat(user.password.length)}</Text>
                                </View>
                            </View>

                            <View style={styles.horizontalLine} />

                        </View>
                    </>
                ) : (
                    <Text>No user data found.</Text>
                )}

                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <Text style={styles.logoutButtonText}>LOGOUT</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    scrollViewContent: {
        flexGrow: 1,
        justifyContent: 'center',
        backgroundColor: '#ffff',
    },
    container: {
        flex: 1,
        justifyContent: 'center',
    },
    profileText: {
        fontSize: 33,
        fontWeight: 'bold',
        marginBottom: 20,
        alignSelf: 'center',
    },
    outerCircle: {
        alignSelf: 'center',
        width: 115,
        height: 115,
        borderRadius: 90,
        borderWidth: 3,
        borderColor: '#A42FC1',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
    },
    profileImage: {
        width: 100,
        height: 100,
        borderRadius: 80,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#08C47C',
    },
    defaultProfileImage: {
        width: 100,
        height: 100,
        borderRadius: 80,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#08C47C',
    },
    avatarText: {
        fontSize: 40,
        fontWeight: 'bold',
        color: '#fff',
    },
    nameText: {
        fontSize: 24,
        fontWeight: 'bold',
        alignSelf: 'center',
    },
    emailText: {
        fontSize: 16,
        fontWeight: 'normal',
        color: 'gray',
        alignSelf: 'center',
    },
    editButton: {
        marginTop: 18,
        marginBottom: 10,
        backgroundColor: '#A42FC1',
        padding: 10,
        borderRadius: 100,
        width: 150,
        alignSelf: 'center',
    },
    editButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    logoutButton: {
        backgroundColor: '#FFFF',
        borderWidth: 1,
        borderColor: '#EF5350',
        padding: 10,
        borderRadius: 100,
        width: 150,
        marginTop: 50,
        alignSelf: 'center',
        marginBottom: 30,
    },
    logoutButtonText: {
        color: '#EF5350',
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    infoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        marginTop: 20,
    },
    iconBackground: {
        backgroundColor: '#08C47C',
        borderRadius: 50,
        padding: 5,
        marginRight: 10,
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    icon: {
        color: 'white',
        fontSize: 14,
    },
    leftAlignedContainer: {
        alignItems: 'flex-start',
        paddingHorizontal: 20,
        marginLeft: 40,
    },
    info: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#5F5F5F',
    },
    infoAnswer: {
        fontSize: 16,
        fontWeight: 'normal',
        color: '#8F959E',
    },
    horizontalLine: {
        borderBottomColor: '#E8E8E8',
        borderBottomWidth: 1,
        width: '85%',
    },
});

export default Profile;

    