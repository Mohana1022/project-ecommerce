import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { fetchUsers, toggleUserBlock } from '../api/axios';

const UserContext = createContext();

export const useUsers = () => {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error('useUsers must be used within a UserProvider');
    }
    return context;
};

export const UserProvider = ({ children }) => {
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [stats, setStats] = useState({ total: 0, active: 0, blocked: 0 });

    const loadUsers = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await fetchUsers();
            // The API returns { users: [...], total, active, blocked }
            // Fall back to data.results (DRF pagination) or a raw array
            const userList = data?.users || data?.results || (Array.isArray(data) ? data : []);

            const formattedUsers = userList.map(u => ({
                id: u.id,
                name: u.username || u.name || 'Unknown',
                email: u.email,
                status: u.status || (u.is_blocked ? 'BLOCKED' : 'ACTIVE'),
                joinDate: u.joinDate || new Date(u.date_joined || Date.now()).toLocaleDateString(),
                // Risk & order data from live API
                riskScore: u.riskScore ?? 0,
                total_orders: u.total_orders ?? 0,
                cancelled_orders: u.cancelled_orders ?? 0,
                return_requests: u.return_requests ?? 0,
                failed_payments: u.failed_payments ?? 0,
                blocked_reason: u.blocked_reason || '',
            }));

            setUsers(formattedUsers);

            // Store server-side aggregate counts from API response
            setStats({
                total: data?.total ?? formattedUsers.length,
                active: data?.active ?? formattedUsers.filter(u => u.status === 'ACTIVE').length,
                blocked: data?.blocked ?? formattedUsers.filter(u => u.status === 'BLOCKED').length,
            });

        } catch (err) {
            console.error("Failed to load users:", err);
            setError("Failed to load users. Please try again.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadUsers();
    }, [loadUsers]);

    const updateUserStatus = useCallback(async (userId, newStatus, reason = '') => {
        try {
            // Backend expects action as 'BLOCK' or 'UNBLOCK' (uppercase)
            const action = newStatus === 'BLOCKED' ? 'BLOCK' : 'UNBLOCK';
            await toggleUserBlock(userId, action, reason);

            setUsers(prev => prev.map(user =>
                user.id === userId ? { ...user, status: newStatus, blocked_reason: reason } : user
            ));
            // Keep stats in sync without a full reload
            setStats(prev => ({
                ...prev,
                active: newStatus === 'BLOCKED' ? prev.active - 1 : prev.active + 1,
                blocked: newStatus === 'BLOCKED' ? prev.blocked + 1 : prev.blocked - 1,
            }));
            return true;
        } catch (err) {
            console.error("Failed to update user status:", err);
            return false;
        }
    }, []);

    const value = useMemo(() => ({
        users,
        isLoading,
        error,
        stats,
        updateUserStatus,
        reloadUsers: loadUsers,    // name expected by User.jsx
        refreshUsers: loadUsers,   // backwards compat alias
    }), [users, isLoading, error, stats, updateUserStatus, loadUsers]);

    return (
        <UserContext.Provider value={value}>
            {children}
        </UserContext.Provider>
    );
};
