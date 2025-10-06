import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useWallet } from './WalletContext';
import { apiService } from '../services/api';

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
    profession?: string;
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
            if (!isConnected) {
                throw new Error('Please connect your wallet first');
            }

            const response = await apiService.login({
                email,
                password,
                walletAddress: account!,
            });

            setUser(response.user);
            localStorage.setItem('user', JSON.stringify(response.user));
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

            const response = await apiService.register({
                name: userData.name || 'User',
                email: userData.email || '',
                password: 'defaultPassword123', // In a real app, this would be generated or provided
                userType: userData.userType || 'customer',
                walletAddress: account!,
                profession: userData.profession,
                bio: userData.bio,
            });

            setUser(response.user);
            localStorage.setItem('user', JSON.stringify(response.user));
        } catch (error) {
            console.error('Signup failed:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        try {
            await apiService.logout();
        } catch (error) {
            console.warn('Logout API call failed:', error);
        } finally {
            setUser(null);
            localStorage.removeItem('user');
            apiService.clearToken();
        }
    };

    const updateProfile = async (userData: Partial<User>) => {
        if (!user) return;

        setIsLoading(true);
        try {
            const updatedUser = await apiService.updateProfile(userData);
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



