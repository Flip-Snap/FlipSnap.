import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ActivityIndicator, TouchableOpacity, KeyboardAvoidingView, StatusBar } from 'react-native';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth'; 
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { FIREBASE_AUTH, FIRESTORE_DB } from '../../FirebaseConfig';
import { doc, updateDoc  } from 'firebase/firestore';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [emailFocused, setEmailFocused] = useState(false);
    const [passwordFocused, setPasswordFocused] = useState(false);
    const [loading, setLoading] = useState(false);
    const [passwordVisible, setPasswordVisible] = useState(false);
    const auth = FIREBASE_AUTH;
    const navigation = useNavigation();

    const handleEmailChange = (text) => {
        setEmail(text);
    };

    const handlePasswordChange = (text) => {
        setPassword(text);
    };

    const handleEmailFocus = () => {
        setEmailFocused(true);
        setPasswordFocused(false);
    };

    const handlePasswordFocus = () => {
        setPasswordFocused(true);
        setEmailFocused(false);
    };

    const handleForgotPassword = async () => {
        if (!email.trim()) {
            alert('Please enter your email to reset your password.');
            return;
        }
    
        try {
            await sendPasswordResetEmail(auth, email);
            alert('Password reset email sent. Please check your inbox.');
        } catch (error) {
            console.log(error);
            alert('Failed to send password reset email. Please try again.');
        }
    };

    const signInAndNavigate = async () => {
        if (!email.trim() || !password.trim()) {
            alert('Please enter both email and password.');
            return;
        }

        setLoading(true);

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const uid = userCredential.user.uid;

            const userDocRef = doc(FIRESTORE_DB, 'users', uid); 
            await updateDoc(userDocRef, { password });

            navigation.reset({
                index: 0,
                routes: [{ name: 'MainTab', params: { uid } }],
            });
        } catch (error) {
            console.log(error);
            alert('Sign in failed. Please check your credentials.');
        }

        setLoading(false);
    };

    return (
        <KeyboardAvoidingView style={styles.container} behavior="height">
            <StatusBar backgroundColor="#fff" barStyle="dark-content" />
            <View>
                <Text style={styles.signupText}>Login</Text>
                <Text style={styles.space}>Email</Text>
                <TextInput 
                    value={email} 
                    style={[styles.input, { borderBottomColor: emailFocused ? '#08C47C' : '#8F959E' }]} 
                    autoCapitalize='none' 
                    onChangeText={handleEmailChange}
                    onFocus={handleEmailFocus}
                />
                <Text style={styles.space}>Password</Text>
                <View style={{position: 'relative'}}>
                    <TextInput 
                        value={password} 
                        style={[styles.input, { borderBottomColor: passwordFocused ? '#08C47C' : '#8F959E' }]} 
                        autoCapitalize='none' 
                        onChangeText={handlePasswordChange}
                        onFocus={handlePasswordFocus}
                        secureTextEntry={!passwordVisible}
                    />
                    <TouchableOpacity
                        onPress={() => setPasswordVisible(!passwordVisible)}
                        style={styles.eyeIcon}
                    >
                        <Ionicons
                            name={passwordVisible ? 'eye-off-outline' : 'eye-outline'}
                            size={24}
                            color="#8F959E"
                        />
                    </TouchableOpacity>
                </View>

                    <Text onPress={handleForgotPassword} style={styles.forgotPass}>Forgot Password?</Text>

                { loading ? (
                    <ActivityIndicator size="large" color="#000ff" />
                ) : (
                    <>
                        <TouchableOpacity 
                            style={[styles.button, (!email.trim() || !password.trim()) && { backgroundColor: '#ccc' }]} 
                            onPress={() => {
                                if (!email.trim() || !password.trim()) {
                                    alert('Please check email and password.');
                                    return; 
                                }
                                signInAndNavigate();
                            }}
                            disabled={!email.trim() || !password.trim()} 
                        >
                            <Text style={styles.buttonText}>Login</Text>
                        </TouchableOpacity>
                        <Text style={styles.loginText}>
                            Don't have an account? 
                            <Text onPress={() => navigation.navigate('SignUp')} style={styles.loginLink}> Sign Up</Text>
                        </Text>
                    </>
                )}
            </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
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
        marginBottom: 50,
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
    button: {
        backgroundColor: '#08C47C',
        padding: 15,
        borderRadius: 100, 
        alignItems: 'center',
        marginTop: 100
    },
    buttonText: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold'
    },
    loginText: {
        marginTop: 20,
        textAlign: 'center'
    },
    loginLink: {
        color: '#A42FC1',
        fontWeight: 'bold'
    },
    forgotPass: {
        color: '#A42FC1',
        textAlign: 'right',
        fontWeight: 'bold',
        marginTop: 8
    },
    eyeIcon: {
        position: 'absolute',
        right: 10,
        bottom: 12,
    }
});

export default Login;