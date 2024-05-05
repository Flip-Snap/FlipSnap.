// SplashScreen.js
import React, { useEffect } from 'react';
import { View, StyleSheet, StatusBar, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const SplashScreen = () => {
  const navigation = useNavigation();

  useEffect(() => {
    const splashDuration = 3100;
    const timer = setTimeout(() => {
      navigation.navigate('GetStarted');
    }, splashDuration);

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#fff" barStyle="dark-content" />
      <Image
        source={require('../../images/splash.gif')}
        style={styles.backgroundImage}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
});

export default SplashScreen;
