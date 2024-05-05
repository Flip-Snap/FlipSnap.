import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar} from 'react-native';
import { TabView, TabBar } from 'react-native-tab-view';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import FlashcardsScreen from './LibraryFlashcards'; 
import FoldersScreen from './LibraryFolders'; 
import FolderModal from './AddFolder'; 

const LibraryScreen = () => {
    const navigation = useNavigation(); 
    const [index, setIndex] = useState(0);
    const [folderModalVisible, setFolderModalVisible] = useState(false); 

    const handleAddButtonPress = () => {
        if (index === 0) { 
            navigation.navigate('FlashcardFormStack'); 
        } else if (index === 1) { 
            setFolderModalVisible(true); 
        }
    };

    const closeFolderModal = () => {
        setFolderModalVisible(false); 
    };

    const renderScene = ({ route }) => {
        switch (route.key) {
            case 'flashcards':
                return <FlashcardsScreen />;
            case 'folders':
                return <FoldersScreen />;
            default:
                return null;
        }
    };

    const renderTabBar = props => (
        <TabBar
            {...props}
            indicatorStyle={{ backgroundColor: '#08C47C' }}
            style={styles.tabBar}
            activeColor="#000"
            inactiveColor="#D6D6D6"
            labelStyle={styles.tabLabel}
            tabStyle={styles.tab}
        />
    );

    return (
        <View style={styles.container}>
            <StatusBar backgroundColor="#fff" barStyle="dark-content" />
            <View style={styles.header}>
                <Text style={styles.title}>Library</Text>
                <TouchableOpacity style={styles.addButton} onPress={handleAddButtonPress}>
                    <Ionicons name="add" size={32} color="#08C47C" />
                </TouchableOpacity>
            </View>
            <TabView
                navigationState={{ index, routes: [{ key: 'flashcards', title: 'Flashcard Sets' }, { key: 'folders', title: 'Folders' }] }}
                renderScene={renderScene}
                onIndexChange={setIndex}
                renderTabBar={renderTabBar}
            />
            <FolderModal visible={folderModalVisible} onClose={closeFolderModal} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 20,
        marginBottom: 20
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#1D1E20'
    },
    addButton: {
        paddingHorizontal: 8,
        fontWeight: 'bold'
    },
    tabBar: {
        backgroundColor: 'white',
        justifyContent: 'flex-start',
        marginRight: 20,
        marginLeft: 20,
        elevation: 0,
        borderBottomWidth: 0.75,
        borderBottomColor: '#D6D6D6',
    },
    tab: {
        width: 120, 
    },
    tabLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'left',
        textTransform: 'none',
    },
});

export default LibraryScreen;
