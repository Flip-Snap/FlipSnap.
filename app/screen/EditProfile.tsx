import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ActivityIndicator, TouchableOpacity, KeyboardAvoidingView, Alert, Linking, ScrollView } from 'react-native';
import { doc, setDoc } from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import { FIREBASE_AUTH, FIRESTORE_DB } from '../../FirebaseConfig';
import { FontAwesome } from '@expo/vector-icons';
import { Ionicons } from '@expo/vector-icons';
import { getAuth, updateEmail, updatePassword } from 'firebase/auth';

const EditProfile = ({ route }) => {
    const { user } = route.params;
    const [first_name, setFirstName] = useState(user.first_name);
    const [last_name, setLastName] = useState(user.last_name);
    const [email, setEmail] = useState(user.email);
    const [password, setPassword] = useState(user.password);
    const [nameFocused, setNameFocused] = useState(false);
    const [emailFocused, setEmailFocused] = useState(false);
    const [passwordFocused, setPasswordFocused] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isPasswordStrong, setIsPasswordStrong] = useState(true);
    const [emailError, setEmailError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [showEmailStatus, setShowEmailStatus] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const auth = FIREBASE_AUTH;
    const navigation = useNavigation(); 
    

    const handleFirstNameChange = (text) => {
        setFirstName(text);
    };

    const handleLastNameChange = (text) => {
        setLastName(text);
    };

    const handleEmailChange = (text) => {
        setEmail(text);
        setEmailError('');
        setShowEmailStatus(text.length > 0);
    };

    const handlePasswordChange = (text) => {
        setPassword(text);
        setIsPasswordStrong(validatePassword(text));
        setPasswordError('');
    };

    const handleFirstNameFocus = () => {
        setNameFocused(true);
        setEmailFocused(false);
        setPasswordFocused(false);
    };

    const handleLastNameFocus = () => {
        setNameFocused(true);
        setEmailFocused(false);
        setPasswordFocused(false);
    };

    const handleEmailFocus = () => {
        setEmailFocused(true);
        setNameFocused(false);
        setPasswordFocused(false);
    };

    const handlePasswordFocus = () => {
        setPasswordFocused(true);
        setNameFocused(false);
        setEmailFocused(false);
    };

      
    const validateEmail = (email) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
  };

  const validatePassword = (password) => {
      const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/;
      return passwordRegex.test(password);
  };

  const togglePasswordVisibility = () => {
      setShowPassword(!showPassword);
  };

  const updateProfileData = async () => {
    setLoading(true);
    try {
        if (!validateEmail(email)) {
            throw new Error('Invalid email format (ex. juandelacruz@gmail.com)');
        }

        if (!isPasswordStrong) {
            throw new Error('Password should be at least 8 characters long and include one uppercase letter, one lowercase letter, one number, and one special character.');
        }

        const currentUser = auth.currentUser;

        if (!currentUser) {
            throw new Error('No user is currently signed in.');
        }

        if (password !== user.password) {
            await updatePassword(auth.currentUser, password);
        }
        
        const capitalizedFirstName = first_name.charAt(0).toUpperCase() + first_name.slice(1);
        const capitalizedLastName = last_name.charAt(0).toUpperCase() + last_name.slice(1);

        const userDocRef = doc(FIRESTORE_DB, 'users', currentUser.uid);
        await setDoc(userDocRef, {
            first_name: capitalizedFirstName,
            last_name: capitalizedLastName,
            email: email,
            password: password,
            image: {
                profile: `${capitalizedFirstName.charAt(0)}${capitalizedLastName.charAt(0)}`,
            }
        });

        Alert.alert(
            'Success',
            'Your profile has been updated successfully!',
            [{ text: 'OK', onPress: () => navigation.navigate('Profile') }]
        );
    } catch (error) {
        console.log(error);
        if (error.code === 'auth/invalid-email') {
            setEmailError('Invalid email format');
        } else if (error.code === 'auth/weak-password') {
            setPasswordError('Password should be at least 8 characters long and include one uppercase letter, one lowercase letter, one number, and one special character.');
        } else {
            alert(error.message);
        }
    } finally {
        setLoading(false);
    }
};



const generateInitialsAvatar = () => {
  const profile = first_name.charAt(0).toUpperCase() + last_name.charAt(0).toUpperCase();
  return (
      <View style={styles.avatarBorder}>
          <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>{profile}</Text>
          </View>
      </View>
  );
};


    return (
        <KeyboardAvoidingView style={styles.container} behavior="padding">
            <ScrollView contentContainerStyle={styles.scrollViewContainer}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="black" />
            </TouchableOpacity>
                <View>
                    <Text style={styles.signupText}>Edit Profile</Text>
                   
                    {generateInitialsAvatar()}

                    <Text style={styles.space}>First Name</Text>
                    <TextInput 
                        value={first_name} 
                        style={[styles.input, { borderBottomColor: nameFocused ? '#08C47C' : '#8F959E' }]} 
                        autoCapitalize='words' 
                        onChangeText={handleFirstNameChange}
                        onFocus={handleFirstNameFocus}
                    />
                    <Text style={styles.space}>Last Name</Text>
                    <TextInput 
                        value={last_name} 
                        style={[styles.input, { borderBottomColor: nameFocused ? '#08C47C' : '#8F959E' }]} 
                        autoCapitalize='words' 
                        onChangeText={handleLastNameChange}
                        onFocus={handleLastNameFocus}
                    />
<Text style={styles.space}>Email</Text>
<View style={styles.emailInputContainer}>
    <TextInput 
        value={email} 
        style={[styles.input]} 
        autoCapitalize='none' 
        editable={false}
    />
    {validateEmail(email) && <Text style={[styles.emailStatus]}>✔️</Text>}
</View>
<Text style={styles.emailDesc}>Kindly note that changes cannot be made to this email.</Text>

                    <Text style={styles.space}>Password</Text>
                    <View style={styles.passwordInputContainer}>
                        <TextInput 
                            secureTextEntry={!showPassword} 
                            value={password} 
                            style={[styles.input, styles.passwordInput, { borderBottomColor: passwordFocused ? '#08C47C' : '#8F959E' }]} 
                            autoCapitalize='none' 
                            onChangeText={handlePasswordChange}
                            onFocus={handlePasswordFocus}
                        />
                        <TouchableOpacity
                            style={styles.showPasswordButton}
                            onPress={togglePasswordVisibility}>
                            <FontAwesome
                                name={showPassword ? 'eye' : 'eye-slash'}
                                size={20}
                                color="#8F959E"
                            />
                        </TouchableOpacity>
                        {password.length > 0 && (
                            <Text style={[styles.passwordStrength, { color: isPasswordStrong ? '#08C47C' : '#FF5733' }]}>
                                {isPasswordStrong ? 'Strong' : 'Weak'}
                            </Text>
                        )}
                    </View>
                    {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
                    <Text style={styles.formatText}>At least 8 characters with one uppercase letter, one lowercase letter, one number, and one special character.</Text>

                    { loading ? (
                        <ActivityIndicator size="large" color="#000ff" />
                    ) : (
                        <>
                            <TouchableOpacity 
                                style={[styles.button, styles.saveButton]}
                                onPress={updateProfileData}>
                                <Text style={styles.buttonText}>Save Changes</Text>
                            </TouchableOpacity>
                        </>
                    )}
               <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={() => navigation.goBack()}>
                  <Text style={[styles.buttonText, { color: '#FF5733' }]}>Cancel</Text>
                </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    scrollViewContainer: {
        flexGrow: 1,
    },
    container: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 20,
        backgroundColor: '#fff',
    },
    signupText: {
        fontSize: 28,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 30,
        marginTop: 20,
    },
    input: {
        height: 40,
        padding: 10,
        fontSize: 16,
        borderBottomWidth: 1, 
        borderBottomColor: '#8F959E', 
    },
    space: {
        color: '#8F959E',
        marginTop: 20, 
    },
    terms: {
        color: '#8F959E',
        marginTop: 50,
        fontSize: 13,
    },
    button: {
        padding: 15,
        borderRadius: 100, 
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold'
    },
    loginText: {
        marginTop: 15,
        textAlign: 'center'
    },
    loginLink: {
        color: '#A42FC1',
        fontWeight: 'bold'
    },
    passwordInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#8F959E',
        position: 'relative'
    },
    passwordInput: {
        height: 40,
        padding: 10,
        fontSize: 16,
        flex: 1,
        borderBottomWidth: 1,
    },
    errorText: {
        color: '#FF5733',
        textAlign: 'right',
        marginTop: 5
    },
    formatText: {
        color: '#8F959E',
        fontSize: 12,
        textAlign: 'left'
    },
    emailInputContainer: {
        position: 'relative'
    },
    emailStatus: {
        position: 'absolute',
        top: 10,
        right: 10,
        fontSize: 14,
        color: '#FF5733',
    },
    showPasswordButton: {
        position: 'absolute',
        right: 10,
        top: 10,
    },
    passwordStrength: {
        fontSize: 14,
        color: '#8F959E',
        position: 'absolute',
        right: 40,
    },
    // New styles for initials avatar
    avatarBorder: {
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
    avatarContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#08C47C',
    },
    avatarText: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#fff',
    },

    backButton: {
      top: 20,
      left: 5,
      zIndex: 1,
    },
    cancelButton: {
      backgroundColor: '#fff',
      borderWidth: 1,
      borderColor: '#FF5733',
      marginBottom: 50,
    },
    saveButton: {
      backgroundColor: '#A42FC1',
      borderColor: '#A42FC1',
      marginTop: 30,
      marginBottom: 20,
    },
    emailDesc: {
        fontSize: 12,
        fontStyle: 'italic',
        color: '#FF5733',
    }
});

export default EditProfile;