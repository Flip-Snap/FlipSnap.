import React, { useState } from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity, TouchableWithoutFeedback, StatusBar } from 'react-native';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import FolderModal from './AddFolder'; 
import { useNavigation } from '@react-navigation/native'; 

const AddModal = ({ visible, onClose }) => {
  const navigation = useNavigation(); 

  const [folderModalVisible, setFolderModalVisible] = useState(false);

  const openFolderModal = () => {
    setFolderModalVisible(true);
  };

  const closeFolderModal = () => {
    setFolderModalVisible(false);
  };

  const navigateToFlashcardPage = () => {
    // Navigate to the flashcard page
    navigation.navigate('FlashcardFormStack'); 
    onClose(); 
  };

  return (
    <React.Fragment>
      <StatusBar backgroundColor="#00000080" barStyle="light-content" />
      <Modal
        animationType="slide"
        transparent={true}
        visible={visible}
        onRequestClose={onClose}
      >
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.container}>
            <View style={styles.modalContent}>
              <TouchableOpacity style={styles.slideDownArea} onPress={onClose}>
                <View style={styles.slideDownLine}></View>
              </TouchableOpacity>

              <TouchableOpacity style={styles.buttonContainer} onPress={navigateToFlashcardPage}>
                <Ionicons name="layers-sharp" style={styles.icon}/>
                <View style={styles.textContainer}>
                  <Text style={styles.createFlashcard}>Flashcard Set</Text>
                </View>
                <FontAwesome5 name="plus" style={styles.arrowIcon} />
              </TouchableOpacity>

              <TouchableOpacity style={styles.buttonContainer} onPress={openFolderModal}>
                <Ionicons name="folder" style={styles.icon}/>
                <View style={styles.textContainer}>
                  <Text style={styles.createFolderText}>Folder</Text>
                </View>
                <FontAwesome5 name="plus" style={styles.arrowIcon} />
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Rendering FolderModal component */}
      <FolderModal visible={folderModalVisible} onClose={closeFolderModal} />
    </React.Fragment>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    alignItems: 'center',
    overflow: 'hidden',
    paddingBottom: 30,
    justifyContent:'flex-end'
  },
  slideDownArea: {
    alignItems: 'center',
    paddingTop: 15,
    paddingBottom: 35,
  },
  slideDownLine: {
    width: 80,
    height: 8,
    backgroundColor: '#ccc',
    borderRadius: 5,
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F6FA',
    paddingVertical: 20,
    paddingHorizontal: 20,
    marginBottom: 20,
    borderRadius: 20,
    width: '95%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  textContainer: {
    flex: 1,
  },
  createFlashcard: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
    textAlign: 'left',
  },
  createFolderText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
    textAlign: 'left',
  },
  arrowIcon: {
    fontSize: 20,
    marginLeft: 'auto',
  },
  icon: {
    fontSize: 25,
    marginRight: 15,
  },
});

export default AddModal;
