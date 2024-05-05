import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Image, Animated, PanResponder, Alert, StatusBar } from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import { collection, query, where, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';
import { FIRESTORE_DB } from '../../FirebaseConfig';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const Flashcards = ({ route }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showDefinition, setShowDefinition] = useState(false);
  const [leftIndicatorCount, setLeftIndicatorCount] = useState(0);
  const [rightIndicatorCount, setRightIndicatorCount] = useState(0);
  const [flashcards, setFlashcards] = useState([]);
  const [flashcardSetTitle, setFlashcardSetTitle] = useState('');
  const position = useRef(new Animated.ValueXY()).current;
  const navigation = useNavigation();
  const isFocused = useIsFocused();

  useEffect(() => {
    const fetchFlashcards = async () => {
      try {
        if (route.params) {
          const { flashcardSetId } = route.params;
          const flashcardSetDoc = await getDoc(doc(FIRESTORE_DB, 'flashcard_sets', flashcardSetId));
          const flashcardSetTitle = flashcardSetDoc.data().title;
          setFlashcardSetTitle(flashcardSetTitle); 
          
          const q = query(collection(FIRESTORE_DB, 'flashcards'), where('flashcard_set_id', '==', flashcardSetId));
          const querySnapshot = await getDocs(q);

          const flashcardsData = [];
          querySnapshot.forEach((doc) => {
            flashcardsData.push({ id: doc.id, ...doc.data() });
          });
          setFlashcards(flashcardsData);
        }
      } catch (error) {
        console.error('Error fetching flashcards: ', error);
      }
    };

    fetchFlashcards();
  }, [route.params]);

  useEffect(() => {
    const handleNavigationToResult = () => {
      if (currentIndex === flashcards.length && flashcards.length > 0) {
        const proficiency = ((rightIndicatorCount / flashcards.length) * 100).toFixed(2);

        updateProficiency(proficiency);

        navigation.navigate('Result_FS', {
          leftCount: leftIndicatorCount,
          rightCount: rightIndicatorCount,
          flashcardsLength: flashcards.length,
          setTitle: flashcardSetTitle, 
          proficiency: proficiency,
          flashcardSetId: route.params.flashcardSetId
        });
      }
    };

    handleNavigationToResult();
  }, [currentIndex, leftIndicatorCount, rightIndicatorCount, flashcards.length, navigation, flashcardSetTitle, route.params]);


  useEffect(() => {
    setCurrentIndex(0);
    setLeftIndicatorCount(0);
    setRightIndicatorCount(0);
  }, [isFocused]);

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderMove: Animated.event(
      [null, { dx: position.x, dy: position.y }],
      { useNativeDriver: false }
    ),
    onPanResponderRelease: (event, gesture) => {
      if (gesture.dx > 120) {
        swipe('right', gesture.dx);
      } else if (gesture.dx < -120) {
        swipe('left', gesture.dx);
      } else {
        resetPosition();
      }
    },
  });

  const swipe = (direction) => {
    Animated.timing(position, {
      toValue: { x: direction === 'right' ? screenWidth : -screenWidth, y: 0 },
      duration: 200,
      useNativeDriver: false,
    }).start(() => {
      if (currentIndex < flashcards.length) {
        setCurrentIndex((prevIndex) => prevIndex + 1);
      }

      if (direction === 'right') {
        setRightIndicatorCount(prevCount => prevCount + 1);
      } else {
        setLeftIndicatorCount(prevCount => prevCount + 1);
      }

      resetPosition();
    });
  };

  const toggleDefinition = () => {
    setShowDefinition(!showDefinition);
  };

  const resetPosition = () => {
    Animated.spring(position, {
      toValue: { x: 0, y: 0 },
      useNativeDriver: false,
    }).start();
  };

  const handleBackPress = () => {
    Alert.alert(
      'Confirmation',
      'Are you sure you want to go back? Your progress will not be saved.',
      [
          {
              text: 'Cancel',
              style: 'cancel'
          },
          {
              text: 'Confirm',
              onPress: () => {
                  navigation.goBack();
              },
              style: 'destructive'
          }
      ]
  );
    // navigation.goBack();
  };

  const updateProficiency = async (proficiency) => {
    try {
      const roundedProficiency = parseFloat(proficiency).toFixed(2);
      const flashcardSetRef = doc(FIRESTORE_DB, 'flashcard_sets', route.params.flashcardSetId);
      await updateDoc(flashcardSetRef, { proficiency: parseFloat(roundedProficiency) });
      console.log('Proficiency updated successfully.');
    } catch (error) {
      console.error('Error updating proficiency:', error);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#fff" barStyle="dark-content" />
      <View style={styles.appBar}>
        <View style={styles.leftAppBar}>
          <Image source={require('../../images/fs_icon.png')} style={styles.appBarIcon} />
          <Text style={styles.appBarText}>Flashcards</Text>
        </View>
        <View style={styles.rightAppBar}>
          <TouchableOpacity style={styles.closeButton} onPress={handleBackPress}>
            <Icon name="x" size={25} color="#8F959E" />
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.topContainer}>
        <View style={styles.titleContainer}>
          <View style={[styles.indicatorContainer, styles.indicatorContainerLeft]}>
            <View style={styles.redIndicator}>
              <Text style={styles.indicatorText}>{leftIndicatorCount}</Text>
            </View>
          </View>
          <View style={[styles.indicatorContainer, styles.indicatorContainerRight]}>
            <View style={styles.greenIndicator}>
              <Text style={styles.indicatorText}>{rightIndicatorCount}</Text>
            </View>
          </View>
        </View>
        <Text style={styles.cardCountText}>{currentIndex + 1} / {flashcards.length}</Text>
        {/* Displaying the title of the flashcard set */}
        <Text style={styles.setTitleText}>{flashcardSetTitle}</Text>
      </View>
      <View style={styles.cardParentContainer}>
        <View style={styles.cardContainer1}></View>
        <Animated.View
          style={[
            styles.cardContainer,
            {
              transform: position.getTranslateTransform()
            }
          ]}
          {...panResponder.panHandlers}
        >
          {flashcards.map((card, index) => {
            if (index !== currentIndex) return null;

            return (
              <View key={index} style={styles.card}>
                <TouchableOpacity onPress={toggleDefinition}>
                  <Text style={styles.text}>{showDefinition ? card.definition : card.term}</Text>
                </TouchableOpacity>
                {index === 0 && (
                  <TouchableOpacity style={styles.clickIcon} onPress={toggleDefinition}>
                    <Image source={require('../../images/click_icon.png')} style={styles.clickImage} />
                  </TouchableOpacity>
                )}
                {index === 0 && (
                  <Text style={styles.tapText}>Tap the text to flip</Text>
                )}
              </View>
            );
          })}
        </Animated.View>
      </View>
      <View style={styles.navigation}>
        <TouchableOpacity style={styles.button} onPress={() => swipe('left')}>
          <Icon name="arrow-left-circle" size={43} color="#08C47C" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={() => swipe('right')}>
          <Icon name="arrow-right-circle" size={43} color="#08C47C" />
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
    backgroundColor: '#FFFFFF'
  },
  appBar: {
    flexDirection: 'row',
    width: '100%',
    height: 60,
    backgroundColor: 'transparent',
    justifyContent: 'space-between',
    position: 'absolute',
    top: 40,
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  leftAppBar: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rightAppBar: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appBarIcon: {
    width: 40,
    height: 34,
    marginHorizontal: 10,
  },
  appBarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1D1E20',
  },
  menuButton: {
    padding: 5,
    marginRight: 10,
  },
  closeButton: {
    padding: 5,
  },
  topContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%',
    position: 'absolute',
    top: 115,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 20,
  },
  indicatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    position: 'absolute',
    top: 32,
  },
  indicatorContainerLeft: {
    position: 'absolute',
    left: 0,
  },
  indicatorContainerRight: {
    position: 'absolute',
    right: 0,
  },
  redIndicator: {
    backgroundColor: '#FF3242',
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
    width: 60,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 2, 
    borderColor: '#FFA2A2', 
    borderStyle: 'solid', 
  },
  greenIndicator: {
    backgroundColor: '#15C98D',
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
    width: 60,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
    borderWidth: 2, 
    borderColor: '#A9EFD4', 
    borderStyle: 'solid', 
  },
  indicatorText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 15,
  },
  cardCountText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#1D1E20',
  },
  setTitleText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1D1E20',
    marginTop: 5
  },
  cardParentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30,
  },
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContainer1: {
    backgroundColor: '#09D989',
    width: screenWidth - 75, 
    height: screenHeight - 365, 
    position: 'absolute',
    borderRadius: 10,
  },
  card: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#08C47C',
    width: screenWidth - 80,
    height: screenHeight - 365, 
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  text: {
    fontSize: 28,
    textAlign: 'center',
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  tapText: {
    fontSize: 16,
    color: '#FFFFFF',
    position: 'absolute',
    bottom: 50,
    opacity: 0.5,
    fontWeight: '600',
  },
  clickIcon: {
    position: 'absolute',
    bottom: 76,
  },
  clickImage: {
    width: 25, 
    height: 25, 
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '80%',
    position: 'absolute',
    bottom: 90,
  },
  button: {
    padding: 10,
    borderRadius: 50, 
  },
});

export default Flashcards;