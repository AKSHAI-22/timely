import React, { useState } from 'react';
import {
    AppBar,
    Toolbar,
    Typography,
    Button,
    Box,
    IconButton,
    Menu,
    MenuItem,
    Avatar,
    Chip,
    Badge,
    useTheme,
} from '@mui/material';
import {
    Schedule as ScheduleIcon,
    Wallet as WalletIcon,
    Person as PersonIcon,
    ExitToApp as LogoutIcon,
    Dashboard as DashboardIcon,
    Store as StoreIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useWallet } from '../contexts/WalletContext';
import { useAuth } from '../contexts/AuthContext';
import { formatAddress } from '../utils/contracts';

const Navbar: React.FC = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const location = useLocation();
    const { account, connectWallet, isConnected, chainId } = useWallet();
    const { user, isAuthenticated, logout } = useAuth();
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleLogout = () => {
        logout();
        handleMenuClose();
        navigate('/');
    };

    const isLocalhost = chainId === 31337;

    return (
        <AppBar position="sticky" elevation={0}>
            <Toolbar>
                {/* Logo */}
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        cursor: 'pointer',
                        mr: 4,
                    }}
                    onClick={() => navigate('/')}
                >
                    <Box
                        sx={{
                            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                            borderRadius: 2,
                            p: 1,
                            mr: 2,
                        }}
                    >
                        <ScheduleIcon sx={{ color: 'white', fontSize: 28 }} />
                    </Box>
                    <Typography
                        variant="h5"
                        sx={{
                            fontWeight: 700,
                            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                            backgroundClip: 'text',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                        }}
                    >
                        Timely
                    </Typography>
                </Box>

                {/* Navigation Links */}
                <Box sx={{ flexGrow: 1, display: 'flex', gap: 2 }}>
                    <Button
                        color="primary"
                        onClick={() => navigate('/marketplace')}
                        sx={{
                            fontWeight: 600,
                            borderRadius: 2,
                            '&:hover': {
                                backgroundColor: 'rgba(99, 102, 241, 0.08)',
                            },
                        }}
                    >
                        <StoreIcon sx={{ mr: 1 }} />
                        Marketplace
                    </Button>

                    {isAuthenticated && (
                        <Button
                            color="primary"
                            onClick={() => navigate(user?.isExpert ? '/expert-dashboard' : '/customer-dashboard')}
                            sx={{
                                fontWeight: 600,
                                borderRadius: 2,
                                '&:hover': {
                                    backgroundColor: 'rgba(99, 102, 241, 0.08)',
                                },
                            }}
                        >
                            <DashboardIcon sx={{ mr: 1 }} />
                            Dashboard
                        </Button>
                    )}
                </Box>

                {/* Right Side */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {/* Network Status */}
                    {isConnected && (
                        <Chip
                            label={isLocalhost ? 'Localhost' : 'Wrong Network'}
                            color={isLocalhost ? 'success' : 'error'}
                            size="small"
                            variant="outlined"
                        />
                    )}

                    {/* Wallet Connection */}
                    {!isConnected ? (
                        <Button
                            variant="contained"
                            onClick={connectWallet}
                            startIcon={<WalletIcon />}
                            sx={{
                                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                                '&:hover': {
                                    background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                                    boxShadow: '0 8px 25px rgba(99, 102, 241, 0.3)',
                                },
                                boxShadow: '0 4px 15px rgba(99, 102, 241, 0.2)',
                            }}
                        >
                            Connect Wallet
                        </Button>
                    ) : (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            {/* Wallet Address */}
                            <Chip
                                label={formatAddress(account!)}
                                variant="outlined"
                                sx={{
                                    fontWeight: 500,
                                    '&:hover': {
                                        backgroundColor: 'rgba(99, 102, 241, 0.08)',
                                    },
                                }}
                            />

                            {/* User Menu */}
                            {isAuthenticated ? (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Badge
                                        overlap="circular"
                                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                                        badgeContent={
                                            <Box
                                                sx={{
                                                    width: 12,
                                                    height: 12,
                                                    borderRadius: '50%',
                                                    backgroundColor: 'success.main',
                                                    border: '2px solid white',
                                                }}
                                            />
                                        }
                                    >
                                        <Avatar
                                            sx={{
                                                width: 40,
                                                height: 40,
                                                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                                                cursor: 'pointer',
                                            }}
                                            onClick={handleMenuOpen}
                                        >
                                            <PersonIcon />
                                        </Avatar>
                                    </Badge>

                                    <Menu
                                        anchorEl={anchorEl}
                                        open={Boolean(anchorEl)}
                                        onClose={handleMenuClose}
                                        PaperProps={{
                                            sx: {
                                                mt: 1,
                                                minWidth: 200,
                                                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
                                                border: '1px solid rgba(0, 0, 0, 0.05)',
                                            },
                                        }}
                                    >
                                        <MenuItem onClick={() => { navigate('/profile'); handleMenuClose(); }}>
                                            <PersonIcon sx={{ mr: 2 }} />
                                            Profile
                                        </MenuItem>
                                        <MenuItem onClick={handleLogout}>
                                            <LogoutIcon sx={{ mr: 2 }} />
                                            Logout
                                        </MenuItem>
                                    </Menu>
                                </Box>
                            ) : (
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                    <Button
                                        color="primary"
                                        onClick={() => navigate('/login')}
                                        sx={{
                                            fontWeight: 600,
                                            borderRadius: 2,
                                        }}
                                    >
                                        Login
                                    </Button>
                                    <Button
                                        variant="contained"
                                        onClick={() => navigate('/signup')}
                                        sx={{
                                            background: 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)',
                                            '&:hover': {
                                                background: 'linear-gradient(135deg, #d97706 0%, #ea580c 100%)',
                                            },
                                            fontWeight: 600,
                                            borderRadius: 2,
                                        }}
                                    >
                                        Sign Up
                                    </Button>
                                </Box>
                            )}
                        </Box>
                    )}
                </Box>
            </Toolbar>
        </AppBar>
    );
};

export default Navbar;



