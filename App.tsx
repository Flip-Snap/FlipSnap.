import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SplashScreen from './app/screen/SplashScreen';
import Login from './app/screen/Login';
import SignUp from './app/screen/SignUp';
import GetStarted from './app/screen/GetStarted';
import Home from './app/screen/Home';
import Search from './app/screen/Search';
import Add from './app/screen/Add';
import Library from './app/screen/Library';
import Profile from './app/screen/Profile';
import EditProfile from './app/screen/EditProfile';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons'; 
import AddModal from './app/screen/Add'; // Import the AddModal component
import FlashcardFormStack from './app/screen/AddFlashcard';
import FolderPage from './app/screen/FolderPage';
import Flashcards from './app/screen/Play_FS';
import Result_FS from './app/screen/Result_FS';
import FlashcardPickerScreen from './app/screen/AddFlashcardSets';
import MoveFlashcardSetScreen from './app/screen/MoveFlashcard';
import EditFlashcardSet from './app/screen/EditFlashcardSet';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('Home');
  const [isModalVisible, setIsModalVisible] = useState(false);

  const openModal = () => {
    setIsModalVisible(true);
  };

  const closeModal = () => {
    setIsModalVisible(false);
  };

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName='SplashScreen'>
        <Stack.Screen name='SplashScreen' component={SplashScreen} options={{ headerShown: false }}/>
        <Stack.Screen name='GetStarted' component={GetStarted} options={{ headerShown: false }}/>
        <Stack.Screen name='Login' component={Login} options={{ headerShown: false }}/>
        <Stack.Screen name='SignUp' component={SignUp} options={{ headerShown: false }}/>
        <Stack.Screen name='MainTab' component={NavigationTabScreen} options={{ headerShown: false }}/>
        <Stack.Screen name='EditProfile' component={EditProfile} options={{ headerShown: false }}/>
        <Stack.Screen name='FlashcardFormStack' component={FlashcardFormStack} options={{ headerShown: false,}}/>
        <Stack.Screen name='FolderPage' component={FolderPage} options={{ headerShown: false,}}/>
        <Stack.Screen name='Flashcards' component={Flashcards} options={{ headerShown: false,}}/>
        <Stack.Screen name='Result_FS' component={Result_FS} options={{ headerShown: false,}}/>
        <Stack.Screen name='FlashcardPickerScreen' component={FlashcardPickerScreen} options={{ headerShown: false,}}/>
        <Stack.Screen name='MoveFlashcardSetScreen' component={MoveFlashcardSetScreen} options={{ headerShown: false,}}/>
        <Stack.Screen name='EditFlashcardSet' component={EditFlashcardSet} options={{ headerShown: false,}}/>
      </Stack.Navigator>

      {isModalVisible && (
        <AddModal
          visible={isModalVisible}
          onClose={() => {
            closeModal();
            setCurrentScreen(currentScreen); // Render the current screen again
          }}
        />
      )}
    </NavigationContainer>
  );

  function NavigationTabScreen({ route }) {
    const { uid } = route.params;

    return (
      <Tab.Navigator
        initialRouteName='Home'
        screenOptions={{
          tabBarLabelStyle: ({ focused }) => ({
            color: focused ? '#08C47C' : '#848484', // Change tab label color
          }),
        }}
      >
        <Tab.Screen 
          name='Home' 
          component={Home}
          initialParams={{uid:uid}} 
          options={{
            headerShown: false,
            tabBarIcon: ({ focused }) => (
              <Ionicons name="home" size={30} color={focused ? '#08C47C' : '#848484'}/>
            ),
          }}
        />
        <Tab.Screen 
          name='Search' 
          component={Search} 
          options={{
            headerShown: false,
            tabBarIcon: ({ focused }) => (
              <Ionicons name="search" size={30} color={focused ? '#08C47C' : '#848484'}/>
            ),
          }}
        />
        <Tab.Screen 
          name=' ' 
          component={Add} 
          initialParams={{uid:uid}}
          listeners={{
            tabPress: e => {
              e.preventDefault(); // Prevent default action
              openModal(); // Open the modal
            },
          }}
          options={{
            tabBarIcon: ({ focused }) => (
              <Ionicons name="add-circle"                 
              size={80}
              color={'#A42FC1'}
              style={{ 
                position: 'absolute', 
                alignSelf: 'center',
                borderRadius: 50, 
                paddingBottom: 10,
              }}/>
            ),
          }}
        />
        <Tab.Screen 
          name='Library' 
          component={Library} 
          options={{
            headerShown: false,
            tabBarIcon: ({ focused }) => (
              <Ionicons name="folder" size={30} color={focused ? '#08C47C' : '#848484'}/>
            ),
          }}
        />
        <Tab.Screen 
          name='Profile' 
          component={Profile}
          initialParams={{uid:uid}}
          options={{
            headerShown: false,
            tabBarIcon: ({ focused }) => (
              <Ionicons name="person" size={30} color={focused ? '#08C47C' : '#848484'}/>
            ),
          }}
        />
      </Tab.Navigator>
    );
  }
}
