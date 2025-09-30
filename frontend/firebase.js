// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_APIKEY,
  authDomain: "dishdrop-food-delivery.firebaseapp.com",
  projectId: "dishdrop-food-delivery",
  storageBucket: "dishdrop-food-delivery.appspot.com",
  messagingSenderId: "626703144193",
  appId: "1:626703144193:web:f39be05fe2a6888ffe3700",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { app, auth };
