// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyD_AMFubguAZCLAKJTtcetHTdvY7Jb7N4A",
  authDomain: "flipsnap-85e2d.firebaseapp.com",
  projectId: "flipsnap-85e2d",
  storageBucket: "flipsnap-85e2d.appspot.com",
  messagingSenderId: "705804711277",
  appId: "1:705804711277:web:9d4f61c19820a02d1e1664",
  measurementId: "G-JEFX72KK1T"
};

// Initialize Firebase
export const FIREBASE_APP = initializeApp(firebaseConfig);
export const FIREBASE_AUTH = getAuth(FIREBASE_APP);
export const FIRESTORE_DB = getFirestore(FIREBASE_APP);
export const analytics = getAnalytics(FIREBASE_APP);