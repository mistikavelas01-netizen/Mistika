import "server-only";
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBM92MU7M112g-Nqn3sUSoc2Q_RdWAbZ4o",
  authDomain: "velas-689e4.firebaseapp.com",
  projectId: "velas-689e4",
  storageBucket: "velas-689e4.firebasestorage.app",
  messagingSenderId: "4149750392",
  appId: "1:4149750392:web:149b1a613642be4ac41b8d",
  databaseURL: "https://velas-689e4-default-rtdb.firebaseio.com"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);