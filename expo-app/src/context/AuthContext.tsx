// Name-based local auth, mirroring the Flutter `AuthService`.
// Enter a name -> the user is found or auto-created in SQLite.
// The active user id is persisted to AsyncStorage so the session survives
// app restarts (an offline-first improvement over the in-memory Flutter version).

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LocalUser } from '@/types/bill';
import { getUserById, getUserByUsername, insertUser } from '@/db/database';

const STORAGE_KEY = 'bill_reminder.currentUserId';

interface AuthContextValue {
  currentUser: LocalUser | null;
  /** True until the persisted session has been restored on startup. */
  initializing: boolean;
  signInWithName: (name: string) => Promise<LocalUser>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<LocalUser | null>(null);
  const [initializing, setInitializing] = useState(true);

  // Restore any previously signed-in user.
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const storedId = await AsyncStorage.getItem(STORAGE_KEY);
        if (storedId) {
          const user = await getUserById(Number(storedId));
          if (active && user) {
            setCurrentUser({ id: user.id, username: user.username });
          }
        }
      } catch (e) {
        console.warn('Failed to restore session', e);
      } finally {
        if (active) setInitializing(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const signInWithName = useCallback(async (name: string): Promise<LocalUser> => {
    const trimmed = name.trim();
    const existing = await getUserByUsername(trimmed);

    let user: LocalUser;
    if (existing) {
      user = { id: existing.id, username: existing.username };
    } else {
      const id = await insertUser(trimmed);
      user = { id, username: trimmed };
    }

    await AsyncStorage.setItem(STORAGE_KEY, String(user.id));
    setCurrentUser(user);
    return user;
  }, []);

  const signOut = useCallback(async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    setCurrentUser(null);
  }, []);

  const value = useMemo(
    () => ({ currentUser, initializing, signInWithName, signOut }),
    [currentUser, initializing, signInWithName, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
