import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const GetStarted = () => {
    const navigation = useNavigation();

    const handleGetStarted = () => {
        navigation.navigate('Login'); 
    };

    return (
        <View style={styles.container}>
            <StatusBar backgroundColor="#08C47C" barStyle="light-content" />
            <View style={styles.logoContainer}>
                <Image 
                    source={require('../../images/logo.png')}
                    style={styles.logo}
                />
            </View>
            <View style={styles.content}>
                <TouchableOpacity style={styles.button} onPress={handleGetStarted}>
                    <Text style={styles.buttonText}>Get Started</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#08C47C',
    },
    logoContainer: {
        marginBottom: 150,
    },
    logo: {
        width: 319,
        height: 85,
    },
    content: {
        paddingHorizontal: 20,
    },
    button: {
        backgroundColor: '#08C47C',
        paddingVertical: 15,
        paddingHorizontal: 53,
        borderRadius: 100,
        borderWidth: 1,
        borderColor: '#FCFCFC'
    },
    buttonText: {
        color: '#FEFEFE',
        fontSize: 20,
        fontWeight: 'bold',
    },
});

export default GetStarted;
