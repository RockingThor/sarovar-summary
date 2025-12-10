import React, { createContext, useContext, useEffect, useState } from "react";
import { User as FirebaseUser } from "firebase/auth";
import { onAuthChange, signIn, signOut } from "@/lib/firebase";
import { authApi } from "@/lib/api";

interface User {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "USER";
  hotelId: string | null;
  hotel?: {
    id: string;
    name: string;
    code: string;
  } | null;
}

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAdmin: boolean;
  isUser: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthChange(async (fbUser) => {
      setFirebaseUser(fbUser);

      if (fbUser) {
        try {
          const token = await fbUser.getIdToken();
          const response = await authApi.verify(token);
          setUser(response.user);
        } catch (error) {
          console.error("Failed to verify user:", error);
          setUser(null);
        }
      } else {
        setUser(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    const credential = await signIn(email, password);
    const token = await credential.user.getIdToken();
    const response = await authApi.verify(token);
    setUser(response.user);
  };

  const logout = async () => {
    await signOut();
    setUser(null);
  };

  const value = {
    user,
    firebaseUser,
    loading,
    login,
    logout,
    isAdmin: user?.role === "ADMIN",
    isUser: user?.role === "USER",
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
