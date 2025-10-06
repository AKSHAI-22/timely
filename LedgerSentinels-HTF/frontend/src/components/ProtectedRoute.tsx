import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useWallet } from '../contexts/WalletContext';
import { Box, CircularProgress, Typography, Alert } from '@mui/material';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requireAuth?: boolean;
    requireExpert?: boolean;
    requireCustomer?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
    children,
    requireAuth = true,
    requireExpert = false,
    requireCustomer = false,
}) => {
    const { user, isAuthenticated, isLoading } = useAuth();
    const { isConnected } = useWallet();
    const location = useLocation();

    // Show loading spinner while checking authentication
    if (isLoading) {
        return (
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '100vh',
                    gap: 2,
                }}
            >
                <CircularProgress size={60} />
                <Typography variant="h6" color="text.secondary">
                    Loading...
                </Typography>
            </Box>
        );
    }

    // Check wallet connection
    if (!isConnected) {
        return (
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '100vh',
                    gap: 2,
                    p: 4,
                }}
            >
                <Alert severity="warning" sx={{ maxWidth: 400, mb: 2 }}>
                    Please connect your wallet to access this page.
                </Alert>
                <Navigate to="/" replace />
            </Box>
        );
    }

    // Check authentication requirement
    if (requireAuth && !isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Check expert requirement
    if (requireExpert && (!user || !user.isExpert)) {
        return (
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '100vh',
                    gap: 2,
                    p: 4,
                }}
            >
                <Alert severity="error" sx={{ maxWidth: 400, mb: 2 }}>
                    This page is only accessible to verified experts.
                </Alert>
                <Navigate to="/" replace />
            </Box>
        );
    }

    // Check customer requirement
    if (requireCustomer && (!user || user.isExpert)) {
        return (
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '100vh',
                    gap: 2,
                    p: 4,
                }}
            >
                <Alert severity="error" sx={{ maxWidth: 400, mb: 2 }}>
                    This page is only accessible to customers.
                </Alert>
                <Navigate to="/" replace />
            </Box>
        );
    }

    return <>{children}</>;
};

export default ProtectedRoute;
