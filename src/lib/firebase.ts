import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import type { IdeaAnalysis } from './gemini';

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Error signing in with Google:", error);
    throw error;
  }
};

export const logOut = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out:", error);
    throw error;
  }
};

export const saveAnalysisResult = async (userId: string, idea: string, analysisResult: IdeaAnalysis) => {
  // Use idea hash or normalized idea as document ID to easily fetch it
  const normalizedIdea = idea.trim().toLowerCase();
  // Basic hash function
  let hash = 0;
  for (let i = 0; i < normalizedIdea.length; i++) {
    hash = ((hash << 5) - hash) + normalizedIdea.charCodeAt(i);
    hash |= 0;
  }
  const docId = `idea_${Math.abs(hash)}`;

  const collectionPath = `users/${userId}/analyses`;
  const newDocRef = doc(db, collectionPath, docId);
  try {
    const docSnap = await (await import('firebase/firestore')).getDoc(newDocRef);
    if (!docSnap.exists()) {
      await setDoc(newDocRef, {
        userId,
        idea: normalizedIdea,
        analysisResult,
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp()
      });
    } else {
      await (await import('firebase/firestore')).updateDoc(newDocRef, {
        analysisResult,
        updatedAt: serverTimestamp()
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, collectionPath);
  }
};

export const getAllAnalyses = async (userId: string): Promise<{idea: string, analysisResult: IdeaAnalysis, createdAt: any}[]> => {
  const q = (await import('firebase/firestore')).query(
    collection(db, `users/${userId}/analyses`),
    (await import('firebase/firestore')).orderBy('createdAt', 'desc')
  );
  try {
    const defaultExport = await import('firebase/firestore');
    const querySnapshot = await defaultExport.getDocs(q);
    return querySnapshot.docs.map(doc => ({
      idea: doc.data().idea,
      analysisResult: doc.data().analysisResult,
      createdAt: doc.data().createdAt
    }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, `users/${userId}/analyses`);
    return [];
  }
};

export const getAnalysisResult = async (userId: string, idea: string): Promise<IdeaAnalysis | null> => {
  const normalizedIdea = idea.trim().toLowerCase();
  let hash = 0;
  for (let i = 0; i < normalizedIdea.length; i++) {
    hash = ((hash << 5) - hash) + normalizedIdea.charCodeAt(i);
    hash |= 0;
  }
  const docId = `idea_${Math.abs(hash)}`;

  const docRef = doc(db, `users/${userId}/analyses`, docId);
  try {
    const docSnap = await (await import('firebase/firestore')).getDoc(docRef);
    if (docSnap.exists() && docSnap.data().idea === normalizedIdea) {
      return docSnap.data().analysisResult as IdeaAnalysis;
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `users/${userId}/analyses`);
  }
  return null;
};
