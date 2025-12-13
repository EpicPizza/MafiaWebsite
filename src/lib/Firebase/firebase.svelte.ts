import { goto, invalidateAll } from "$app/navigation";
import { initializeApp, type FirebaseApp } from "firebase/app";
import { type Auth, getAuth as getFirebaseAuth, GoogleAuthProvider, onAuthStateChanged, signInWithCredential, signInWithEmailAndPassword, signInWithRedirect, signInWithPopup, createUserWithEmailAndPassword, updateCurrentUser, updateProfile, sendEmailVerification, updateEmail, reauthenticateWithCredential, EmailAuthProvider, updatePassword, validatePassword, sendPasswordResetEmail, signInWithCustomToken } from "firebase/auth";
import { getFirestore as getFirebaseFirestore, type Firestore, type Unsubscribe, doc, getDoc, onSnapshot } from "firebase/firestore";
import { browser } from "$app/environment";
import type { UserInfo as ClientUserInfo } from "firebase/auth";
import { env } from "$env/dynamic/public";
import { custom } from "zod";
import { page } from "$app/state";

export interface User {
  photoURL: string | undefined;
  displayName: string | undefined;
  uid: string;
  preload: boolean
}

export type Client = ReturnType<typeof firebaseClient>;

export function firebaseClient(preload: Omit<User, "preload"> | undefined = undefined) {
    let app: FirebaseApp | undefined = undefined;
    let auth: Auth | undefined = undefined;
    let firestore: Firestore | undefined = undefined;
    
    let user = $state(preload ? { ...preload, preload: false } : undefined) as User | undefined;

    const getApp = (): FirebaseApp => {
        if (!browser) return undefined as any;                    

        if (app == undefined) {
            const firebaseConfig = JSON.parse(env.PUBLIC_FIREBASE_CLIENT);

            app = initializeApp(firebaseConfig);
        }

        return app;
    };

    const getAuth = (): Auth => {
        if (auth == undefined) {
            auth = getFirebaseAuth(getApp());
        }

        return auth;
    };

    const getFirestore = (): Firestore => {
        if (firestore == undefined) {
            firestore = getFirebaseFirestore(getApp());
        }

        return firestore;
    };

    const clientInit = async (customToken: string | undefined) => {
        if(!customToken || !user) {
            setupHandler();

            return;
        }
        
        const credential = await signInWithCustomToken(getAuth(), customToken);

        const idToken = await credential.user.getIdToken();

        const result = await fetch("/session/login", {
            method: "POST",
            headers: {
                "content-type": "application/json",
                Authorization: `Bearer ${idToken}`,
            },
        });

        if(result.status == 401) return signOut("/");

        user.preload = true;

        setupHandler();
    }

    const setupHandler = () => {
        onAuthStateChanged(getAuth(), async currentUser => {
            if(currentUser && user) {
                user.preload = true;
            }
        });
    }

    const signOut = async (redirect: string) => {
        await fetch("/session/logout", {
            method: "POST",
            headers: {
                "content-type": "application/json",
            },
        });

        await getAuth().signOut();

        await goto(redirect, { invalidateAll: true });

        user = undefined;
    };

    const reset = async () => {
        await fetch("/session/reset", {
            method: "POST",
            headers: {
                "content-type": "application/json",
            },
        });

        getAuth().signOut();
    }; 

    return {
        get user() { return user; },
        set user(updatedUser) { user = updatedUser; },
        getFirestore: getFirestore,
        getApp: getApp,
        getAuth: getAuth,
        signOut: signOut,
        reset: reset,
        clientInit: clientInit,
    };
}
