import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ActivityIndicator, TouchableOpacity, KeyboardAvoidingView, Alert, Linking, ScrollView, StatusBar } from 'react-native';
import { createUserWithEmailAndPassword, updateProfile, sendEmailVerification } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import { FIREBASE_AUTH, FIRESTORE_DB } from '../../FirebaseConfig';
import { FontAwesome } from '@expo/vector-icons';

const SignUp = () => {
    const [first_name, setFirstName] = useState('');
    const [last_name, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [nameFocused, setNameFocused] = useState(false);
    const [emailFocused, setEmailFocused] = useState(false);
    const [passwordFocused, setPasswordFocused] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isPasswordStrong, setIsPasswordStrong] = useState(false);
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

    const signUp = async () => {
        setLoading(true);
        try {
            if (!validateEmail(email)) {
                throw new Error('Invalid email format (ex. juandelacruz@gmail.com)');
            }
            
            if (!isPasswordStrong) {
                throw new Error('Password should be at least 8 characters long and include one uppercase letter, one lowercase letter, one number, and one special character.');
            }

            const response = await createUserWithEmailAndPassword(auth, email, password);
            const user = response.user;

            // Update user's display name
            await updateProfile(user, {
                displayName: `${first_name} ${last_name}`
            });

            // Send email verification
            await sendEmailVerification(user);

            const userDocRef = doc(FIRESTORE_DB, 'users', user.uid);
            await setDoc(userDocRef, {
                first_name: first_name,
                last_name: last_name,
                email: email,
                password: password,
                image: {
                    profile: `${first_name.charAt(0)}${last_name.charAt(0)}`,
                }
            });

            Alert.alert(
                'Success',
                'Your account has been created successfully! Please check your email for verification.',
                [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
            );
        } catch(error) {
            console.log(error);
            if (error.code === 'auth/invalid-email') {
                setEmailError('Invalid email format');
            } else if (error.code === 'auth/weak-password') {
                alert('Password should be at least 8 characters long and include one uppercase letter, one lowercase letter, one number, and one special character.');
            } else {
                alert(error.message);
            }
        } finally {
            setLoading(false);
        }
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
            <StatusBar backgroundColor="#fff" barStyle="dark-content" />
            <ScrollView contentContainerStyle={styles.scrollViewContainer}>
                <View>
                    <Text style={styles.signupText}>Sign Up</Text>
                    
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
                            style={[styles.input, { borderBottomColor: emailFocused ? '#08C47C' : '#8F959E' }]} 
                            autoCapitalize='none' 
                            onChangeText={handleEmailChange}
                            onFocus={handleEmailFocus}
                        />
                        {showEmailStatus && (
                            <Text style={[styles.emailStatus, { color: validateEmail(email) ? '#08C47C' : '#FF5733' }]}>
                                {validateEmail(email) ? '✔️' : '❌'}
                            </Text>
                        )}
                    </View>
                    <Text style={styles.formatText}>example@example.com</Text>
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

                    <Text style={[styles.terms, { textAlign: 'center' }]}>By connecting your account confirm that you agree with our <Text style={{ fontWeight: 'bold', textDecorationLine: 'underline' }} onPress={() => Linking.openURL('YOUR_TERM_AND_CONDITION_URL')}>Term and Condition</Text>.</Text>

                    { loading ? (
                        <ActivityIndicator size="large" color="#000ff" />
                    ) : (
                        <>
                            <TouchableOpacity 
                                style={[styles.button, { backgroundColor: isPasswordStrong ? '#08C47C' : '#8F959E' }]}
                                onPress={isPasswordStrong ? signUp : null}>
                                <Text style={styles.buttonText}>Sign Up</Text>
                            </TouchableOpacity>
                            <Text style={styles.loginText}>
                                Already have an account? 
                                <Text onPress={() => navigation.navigate('Login')} style={styles.loginLink}> Login</Text>
                            </Text>
                        </>
                    )}
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    scrollViewContainer: {
        flexGrow: 1,
        justifyContent: 'center',
    },
    container: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 20,
        backgroundColor: '#fff'
    },
    signupText: {
        fontSize: 28,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 30,
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
        marginTop: 20 
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
        color: '#08C47C',
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
    avatarBorder: {
        alignSelf: 'center',
        width: 115,
        height: 115,
        borderRadius: 60,
        borderWidth: 3,
        borderColor: '#08C47C',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
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
});

export default SignUp;
