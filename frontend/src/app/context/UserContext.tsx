"use client";

import React, { createContext, useState, useEffect, ReactNode, useContext } from 'react';

interface User {
    first_name: string;
    last_name: string;
    username: string;
    id: number;  // Include user ID
}

interface UserContextType {
    user: User | null;
    token: string | null;
    policies: any[];  // Store policies here
    setUser: (user: User, token: string) => void;
    setPolicies: (policies: any[]) => void;
    policiesFetched: boolean;  // Add a boolean flag to track if policies have been fetched
    setPoliciesFetched: (fetched: boolean) => void;
    logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUserState] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [policies, setPoliciesState] = useState<any[]>([]); // State for policies
    const [policiesFetched, setPoliciesFetched] = useState(false);

    useEffect(() => {
        // Load user, token, and policies from localStorage on initial load
        const storedUser = localStorage.getItem('user');
        const storedToken = localStorage.getItem('token');
        const storedPolicies = localStorage.getItem('policies');

        if (storedUser && storedToken) {
            setUserState(JSON.parse(storedUser));
            setToken(storedToken);
            if (storedPolicies) {
                setPoliciesState(JSON.parse(storedPolicies));
            }
        }
    }, []);

    const setUser = (user: User, token: string) => {
        setUserState(user);
        setToken(token);
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('token', token);
    };

    const setPolicies = (policies: any[]) => {
        setPoliciesState(policies);
        localStorage.setItem('policies', JSON.stringify(policies));
    };

    const logout = () => {
        setUserState(null);
        setToken(null);
        setPoliciesState([]);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        localStorage.removeItem('policies');
    };

    return (
        <UserContext.Provider value={{
            user,
            token,
            policies,
            setUser,
            setPolicies,
            policiesFetched,
            setPoliciesFetched,
            logout
        }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
};
