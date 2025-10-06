import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useWallet } from './WalletContext';

interface User {
    id: string;
    address: string;
    name: string;
    email: string;
    userType: 'customer' | 'expert';
    isExpert: boolean;
    isVerified: boolean;
    isActive: boolean;
    profileImage?: string;
    bio?: string;
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    signup: (userData: Partial<User>) => Promise<void>;
    logout: () => void;
    updateProfile: (userData: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const { account, isConnected } = useWallet();

    const isAuthenticated = !!user && isConnected;

    const login = async (email: string, password: string) => {
        setIsLoading(true);
        try {
            // In a real app, this would make an API call to authenticate
            // For now, we'll simulate with wallet connection
            if (!isConnected) {
                throw new Error('Please connect your wallet first');
            }

            // Mock user data - in real app, fetch from API
            const mockUser: User = {
                id: account!,
                address: account!,
                name: 'User',
                email,
                userType: 'customer',
                isExpert: false,
                isVerified: false,
                isActive: true,
            };

            setUser(mockUser);
            localStorage.setItem('user', JSON.stringify(mockUser));
        } catch (error) {
            console.error('Login failed:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const signup = async (userData: Partial<User>) => {
        setIsLoading(true);
        try {
            if (!isConnected) {
                throw new Error('Please connect your wallet first');
            }

            const newUser: User = {
                id: account!,
                address: account!,
                name: userData.name || 'User',
                email: userData.email || '',
                userType: userData.userType || 'customer',
                isExpert: userData.isExpert || false,
                isVerified: false,
                isActive: true,
                profileImage: userData.profileImage,
                bio: userData.bio,
            };

            setUser(newUser);
            localStorage.setItem('user', JSON.stringify(newUser));
        } catch (error) {
            console.error('Signup failed:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('user');
    };

    const updateProfile = async (userData: Partial<User>) => {
        if (!user) return;

        setIsLoading(true);
        try {
            const updatedUser = { ...user, ...userData };
            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));
        } catch (error) {
            console.error('Profile update failed:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        // Check for stored user data
        const storedUser = localStorage.getItem('user');
        if (storedUser && isConnected) {
            try {
                const userData = JSON.parse(storedUser);
                if (userData.address === account) {
                    setUser(userData);
                } else {
                    localStorage.removeItem('user');
                }
            } catch (error) {
                localStorage.removeItem('user');
            }
        }
    }, [account, isConnected]);

    useEffect(() => {
        // Clear user if wallet disconnects
        if (!isConnected) {
            setUser(null);
        }
    }, [isConnected]);

    const value: AuthContextType = {
        user,
        isAuthenticated,
        isLoading,
        login,
        signup,
        logout,
        updateProfile,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};



