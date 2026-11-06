import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile } from '../types/travel';

interface AuthContextType {
  currentUser: UserProfile;
  allUsers: UserProfile[];
  login: (email: string) => boolean;
  signup: (userData: Partial<UserProfile> & { name: string; email: string }) => UserProfile;
  switchUser: (userId: string) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const DEFAULT_USERS: UserProfile[] = [
  {
    id: 'user_alex_voyager',
    name: 'Alex Rivera',
    email: 'alex.rivera@voyagemind.ai',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    currency: 'USD',
    homeCity: 'San Francisco, CA',
    preferredTransport: 'Flight',
    preferredStay: 'Boutique Stay',
    travelInterests: ['Culture & History', 'Scenic Photography', 'Culinary Tours', 'Nature & Hiking'],
    dietaryRequirements: 'Vegetarian Friendly',
    accessibilityNeeds: 'None',
    passportCountry: 'United States'
  },
  {
    id: 'user_priya_sharma',
    name: 'Priya Sharma',
    email: 'priya.sharma@example.com',
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80',
    currency: 'EUR',
    homeCity: 'London, UK',
    preferredTransport: 'Train',
    preferredStay: 'Luxury Hotel',
    travelInterests: ['Architecture', 'Fine Dining', 'Art Galleries', 'Wellness & Spas'],
    dietaryRequirements: 'Halal / Nut Allergy',
    accessibilityNeeds: 'Elevator required',
    passportCountry: 'United Kingdom'
  }
];

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [allUsers, setAllUsers] = useState<UserProfile[]>(() => {
    try {
      const stored = localStorage.getItem('voyagemind_all_users');
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_USERS;
  });

  const [currentUserId, setCurrentUserId] = useState<string>(() => {
    try {
      const stored = localStorage.getItem('voyagemind_active_user_id');
      if (stored && allUsers.some(u => u.id === stored)) return stored;
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_USERS[0].id;
  });

  useEffect(() => {
    try {
      localStorage.setItem('voyagemind_all_users', JSON.stringify(allUsers));
    } catch (e) {
      console.error(e);
    }
  }, [allUsers]);

  useEffect(() => {
    try {
      localStorage.setItem('voyagemind_active_user_id', currentUserId);
    } catch (e) {
      console.error(e);
    }
  }, [currentUserId]);

  const currentUser = allUsers.find(u => u.id === currentUserId) || allUsers[0];

  const login = (email: string): boolean => {
    const user = allUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (user) {
      setCurrentUserId(user.id);
      return true;
    }
    return false;
  };

  const signup = (userData: Partial<UserProfile> & { name: string; email: string }): UserProfile => {
    const newId = `user_${Date.now()}`;
    const newUser: UserProfile = {
      id: newId,
      name: userData.name,
      email: userData.email,
      avatarUrl: userData.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
      currency: userData.currency || 'USD',
      homeCity: userData.homeCity || 'New York, NY',
      preferredTransport: userData.preferredTransport || 'Flight',
      preferredStay: userData.preferredStay || 'Hotel' as any,
      travelInterests: userData.travelInterests || ['Sightseeing', 'Food'],
      dietaryRequirements: userData.dietaryRequirements || 'None',
      accessibilityNeeds: userData.accessibilityNeeds || 'None',
      passportCountry: userData.passportCountry || 'United States'
    };

    setAllUsers(prev => [...prev, newUser]);
    setCurrentUserId(newId);
    return newUser;
  };

  const switchUser = (userId: string) => {
    if (allUsers.some(u => u.id === userId)) {
      setCurrentUserId(userId);
    }
  };

  const updateProfile = (updates: Partial<UserProfile>) => {
    setAllUsers(prev => prev.map(user => {
      if (user.id === currentUserId) {
        return { ...user, ...updates };
      }
      return user;
    }));
  };

  const logout = () => {
    // Return to first user
    setCurrentUserId(DEFAULT_USERS[0].id);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        allUsers,
        login,
        signup,
        switchUser,
        updateProfile,
        logout,
        isAuthenticated: !!currentUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
