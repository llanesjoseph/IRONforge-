import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { UserProfile } from '../types';

export async function getOrCreateUserProfile(): Promise<UserProfile> {
  const user = auth.currentUser;
  if (!user) throw new Error('No authenticated user');

  const userRef = doc(db, 'users', user.uid);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    return userSnap.data() as UserProfile;
  }

  // Create new user profile with default role as 'player'
  const newProfile: UserProfile = {
    uid: user.uid,
    displayName: user.displayName || user.email?.split('@')[0] || 'User',
    role: 'player'
  };

  await setDoc(userRef, newProfile);
  return newProfile;
}

export async function updateUserRole(uid: string, role: 'coach' | 'player'): Promise<void> {
  const userRef = doc(db, 'users', uid);
  await setDoc(userRef, { role }, { merge: true });
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      return userSnap.data() as UserProfile;
    }
    return null;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
}