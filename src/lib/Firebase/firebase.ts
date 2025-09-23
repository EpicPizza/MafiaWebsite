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
          apiKey: "AIzaSyBdcjtuQcsVp6dpEgR84IFlqmtrm4rNVr8",
          authDomain: "mafia-bot-ucsc.firebaseapp.com",
          projectId: "mafia-bot-ucsc",
          storageBucket: "mafia-bot-ucsc.firebasestorage.app",
          messagingSenderId: "243263308170",
          appId: "1:243263308170:web:b1e6ef3b7b2734010f0873"
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
