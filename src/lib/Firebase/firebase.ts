import { invalidateAll } from "$app/navigation";
import { initializeApp, type FirebaseApp } from "firebase/app";
import { type Auth, getAuth as getFirebaseAuth, GoogleAuthProvider, onAuthStateChanged, signInWithCredential, signInWithEmailAndPassword, type User, signInWithRedirect, signInWithPopup, createUserWithEmailAndPassword, updateCurrentUser, updateProfile, sendEmailVerification, updateEmail, reauthenticateWithCredential, EmailAuthProvider, updatePassword, validatePassword, sendPasswordResetEmail } from "firebase/auth";
import { getFirestore as getFirebaseFirestore, type Firestore, type Unsubscribe, doc, getDoc, onSnapshot } from "firebase/firestore";
import { browser } from "$app/environment";
import type { UserInfo as AdminUserInfo } from "firebase-admin/auth";
import type { UserInfo as ClientUserInfo } from "firebase/auth";

export function firebaseClient() {
  let app: FirebaseApp | undefined = undefined;
  let auth: Auth | undefined = undefined;
  let firestore: Firestore | undefined = undefined;

  const getApp = (): FirebaseApp => {
    if (!browser) return undefined as any;                    

    if (app == undefined) {
        const firebaseConfig = {
            apiKey: "AIzaSyCxffEECf9KUcaYj-8Zk8WMAaQwxZj2src",
            authDomain: "mafia-bot-dev-a30a9.firebaseapp.com",
            projectId: "mafia-bot-dev-a30a9",
            storageBucket: "mafia-bot-dev-a30a9.firebasestorage.app",
            messagingSenderId: "826904353477",
            appId: "1:826904353477:web:9d5a9bac30c97fbb15aeac"
        };

      app = initializeApp(firebaseConfig);
    }

    return app;
  };

  
  const getFirestore = (): Firestore => {
    if (firestore == undefined) {
      firestore = getFirebaseFirestore(getApp());
    }

    return firestore;
  };

  return {
    getFirestore: getFirestore,
    getApp: getApp,
  };
}
