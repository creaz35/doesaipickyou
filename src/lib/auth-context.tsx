"use client";

import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as fbSignOut,
  updateProfile,
  type User,
} from "firebase/auth";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getDb, getFirebaseAuth, isFirebaseConfigured } from "@/lib/firebase/client";
import { subscribe } from "@/lib/firebase/subscribers";
import {
  ensureUserProfile,
  fetchUserProfile,
  splitDisplayName,
  type UserProfile,
} from "@/lib/firebase/users";

/**
 * New accounts join the newsletter. A failure here must never break
 * sign-in, so it is fire-and-forget.
 */
async function subscribeNewAccount(profile: UserProfile) {
  if (!profile.email) return;
  try {
    await subscribe(getDb(), profile.email, {
      source: "signup",
      uid: profile.uid,
      firstName: profile.firstName || null,
    });
  } catch {
    // already subscribed, offline, or rules not deployed: not worth surfacing
  }
}

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  /** True until the first auth state resolves, so guards don't flash. */
  loading: boolean;
  configured: boolean;
  isAdmin: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (input: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(isFirebaseConfigured);

  useEffect(() => {
    if (!isFirebaseConfigured) return;
    const unsubscribe = onAuthStateChanged(getFirebaseAuth(), async (nextUser) => {
      setUser(nextUser);
      if (nextUser) {
        try {
          setProfile(await fetchUserProfile(getDb(), nextUser.uid));
        } catch {
          // Profile read can fail offline or before rules are deployed;
          // the session is still valid, so keep the user signed in.
          setProfile(null);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      user,
      profile,
      loading,
      configured: isFirebaseConfigured,
      isAdmin: profile?.role === "admin",
      async signInWithGoogle() {
        const credential = await signInWithPopup(getFirebaseAuth(), new GoogleAuthProvider());
        const names = splitDisplayName(credential.user.displayName);
        const nextProfile = await ensureUserProfile(getDb(), credential.user, names);
        setProfile(nextProfile);
        void subscribeNewAccount(nextProfile);
      },
      async signInWithEmail(email, password) {
        const credential = await signInWithEmailAndPassword(getFirebaseAuth(), email, password);
        setProfile(await fetchUserProfile(getDb(), credential.user.uid));
      },
      async signUpWithEmail({ email, password, firstName, lastName }) {
        const credential = await createUserWithEmailAndPassword(getFirebaseAuth(), email, password);
        await updateProfile(credential.user, { displayName: `${firstName} ${lastName}`.trim() });
        const nextProfile = await ensureUserProfile(getDb(), credential.user, {
          firstName,
          lastName,
        });
        setProfile(nextProfile);
        void subscribeNewAccount(nextProfile);
      },
      async signOut() {
        await fbSignOut(getFirebaseAuth());
        setProfile(null);
      },
    }),
    [user, profile, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside <AuthProvider>");
  return context;
}
