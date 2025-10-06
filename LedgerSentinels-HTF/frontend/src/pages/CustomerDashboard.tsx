import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Container,
    Grid,
    Card,
    CardContent,
    Button,
    Chip,
    useTheme,
    CircularProgress,
    Alert,
    Tabs,
    Tab,
} from '@mui/material';
import {
    Schedule as ScheduleIcon,
    AttachMoney as MoneyIcon,
    CheckCircle as CheckCircleIcon,
    Cancel as CancelIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useWallet } from '../contexts/WalletContext';
import {
    getContract,
    CONTRACT_ADDRESSES,
    TimeSlotNFT_ABI,
    formatEther,
    formatTime,
    getSlotStatus,
    getSlotStatusColor,
    getSlotStatusText,
} from '../utils/contracts';

interface TimeSlot {
    tokenId: bigint;
    startTime: bigint;
    endTime: bigint;
    price: bigint;
    profession: string;
    description: string;
    expert: string;
    bookedBy: string;
    isBooked: boolean;
    isRevoked: boolean;
}

const CustomerDashboard: React.FC = () => {
    const theme = useTheme();
    const { user } = useAuth();
    const { signer, isConnected } = useWallet();

    const [slots, setSlots] = useState<TimeSlot[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState(0);

    useEffect(() => {
        if (isConnected && signer) {
            loadMyBookings();
        }
    }, [isConnected, signer]);

    const loadMyBookings = async () => {
        try {
            setLoading(true);
            setError(null);

            if (!signer) {
                throw new Error('Signer not available');
            }

            const contract = getContract(CONTRACT_ADDRESSES.TimeSlotNFT, TimeSlotNFT_ABI, signer);
            const totalSupply = await contract.totalSupply();

            const slotsData: TimeSlot[] = [];

            // Load first 50 slots and filter by current user
            const maxSlots = Math.min(Number(totalSupply), 50);

            for (let i = 0; i < maxSlots; i++) {
                try {
                    const tokenId = await contract.tokenByIndex(i);
                    const slot = await contract.getTimeSlot(tokenId);

                    if (slot.bookedBy.toLowerCase() === user?.address.toLowerCase()) {
                        slotsData.push({
                            tokenId,
                            startTime: slot.startTime,
                            endTime: slot.endTime,
                            price: slot.price,
                            profession: slot.profession,
                            description: slot.description,
                            expert: slot.expert,
                            bookedBy: slot.bookedBy,
                            isBooked: slot.isBooked,
                            isRevoked: slot.isRevoked,
                        });
                    }
                } catch (err) {
                    console.warn(`Failed to load slot ${i}:`, err);
                }
            }

            setSlots(slotsData);
        } catch (err) {
            console.error('Failed to load bookings:', err);
            setError('Failed to load your bookings. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setActiveTab(newValue);
    };

    const getFilteredSlots = () => {
        switch (activeTab) {
            case 0: // All
                return slots;
            case 1: // Upcoming
                return slots.filter(slot => slot.isBooked && !slot.isRevoked && new Date(Number(slot.startTime) * 1000) > new Date());
            case 2: // Completed
                return slots.filter(slot => slot.isBooked && !slot.isRevoked && new Date(Number(slot.startTime) * 1000) <= new Date());
            case 3: // Cancelled
                return slots.filter(slot => slot.isRevoked);
            default:
                return slots;
        }
    };

    const stats = {
        totalBookings: slots.length,
        upcomingBookings: slots.filter(slot => slot.isBooked && !slot.isRevoked && new Date(Number(slot.startTime) * 1000) > new Date()).length,
        completedBookings: slots.filter(slot => slot.isBooked && !slot.isRevoked && new Date(Number(slot.startTime) * 1000) <= new Date()).length,
        totalSpent: slots
            .filter(slot => slot.isBooked)
            .reduce((sum, slot) => sum + Number(formatEther(slot.price)), 0),
    };

    if (!isConnected) {
        return (
            <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Alert severity="info" sx={{ maxWidth: 400 }}>
                    Please connect your wallet to access the customer dashboard.
                </Alert>
            </Box>
        );
    }

    return (
        <Box
            sx={{
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                py: 4,
            }}
        >
            <Container maxWidth="lg">
                {/* Header */}
                <Box sx={{ mb: 4 }}>
                    <Typography
                        variant="h3"
                        sx={{
                            fontWeight: 700,
                            mb: 1,
                            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                            backgroundClip: 'text',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                        }}
                    >
                        My Bookings
                    </Typography>
                    <Typography variant="h6" color="text.secondary">
                        Manage your appointments and track your booking history
                    </Typography>
                </Box>

                {/* Stats */}
                <Grid container spacing={3} sx={{ mb: 4 }}>
                    <Grid size={{ xs: 6, md: 3 }}>
                        <Card sx={{ p: 3, textAlign: 'center' }}>
                            <ScheduleIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                            <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                                {stats.totalBookings}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Total Bookings
                            </Typography>
                        </Card>
                    </Grid>

                    <Grid size={{ xs: 6, md: 3 }}>
                        <Card sx={{ p: 3, textAlign: 'center' }}>
                            <CheckCircleIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
                            <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>
                                {stats.upcomingBookings}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Upcoming
                            </Typography>
                        </Card>
                    </Grid>

                    <Grid size={{ xs: 6, md: 3 }}>
                        <Card sx={{ p: 3, textAlign: 'center' }}>
                            <CheckCircleIcon sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
                            <Typography variant="h4" sx={{ fontWeight: 700, color: 'info.main' }}>
                                {stats.completedBookings}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Completed
                            </Typography>
                        </Card>
                    </Grid>

                    <Grid size={{ xs: 6, md: 3 }}>
                        <Card sx={{ p: 3, textAlign: 'center' }}>
                            <MoneyIcon sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
                            <Typography variant="h4" sx={{ fontWeight: 700, color: 'warning.main' }}>
                                {stats.totalSpent.toFixed(2)}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Total Spent (ETH)
                            </Typography>
                        </Card>
                    </Grid>
                </Grid>

                {/* Tabs */}
                <Card sx={{ mb: 4 }}>
                    <Tabs
                        value={activeTab}
                        onChange={handleTabChange}
                        sx={{
                            '& .MuiTab-root': {
                                fontWeight: 600,
                                textTransform: 'none',
                            },
                        }}
                    >
                        <Tab label="All Bookings" />
                        <Tab label="Upcoming" />
                        <Tab label="Completed" />
                        <Tab label="Cancelled" />
                    </Tabs>
                </Card>

                {/* Error Alert */}
                {error && (
                    <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
                        {error}
                    </Alert>
                )}

                {/* Loading State */}
                {loading && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                        <CircularProgress size={60} />
                    </Box>
                )}

                {/* Bookings */}
                {!loading && (
                    <Grid container spacing={3}>
                        {getFilteredSlots().length === 0 ? (
                            <Grid item xs={12}>
                                <Card sx={{ p: 6, textAlign: 'center' }}>
                                    <ScheduleIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
                                    <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
                                        {activeTab === 0 ? 'No bookings yet' :
                                            activeTab === 1 ? 'No upcoming bookings' :
                                                activeTab === 2 ? 'No completed bookings' :
                                                    'No cancelled bookings'}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {activeTab === 0 ? 'Start booking appointments with experts' :
                                            activeTab === 1 ? 'Your upcoming appointments will appear here' :
                                                activeTab === 2 ? 'Your completed appointments will appear here' :
                                                    'Your cancelled appointments will appear here'}
                                    </Typography>
                                </Card>
                            </Grid>
                        ) : (
                            getFilteredSlots().map((slot) => {
                                const status = getSlotStatus(slot);
                                const statusColor = getSlotStatusColor(status);
                                const statusText = getSlotStatusText(status);
                                const isUpcoming = new Date(Number(slot.startTime) * 1000) > new Date();
                                const isCompleted = new Date(Number(slot.startTime) * 1000) <= new Date();

                                return (
                                    <Grid size={{ xs: 12, md: 6, lg: 4 }} key={slot.tokenId.toString()}>
                                        <Card
                                            sx={{
                                                height: '100%',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                borderTop: `4px solid ${status === 'available' ? theme.palette.success.main :
                                                        status === 'booked' ? theme.palette.info.main :
                                                            theme.palette.error.main
                                                    }`,
                                            }}
                                        >
                                            <CardContent sx={{ flexGrow: 1, p: 3 }}>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                                    <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
                                                        {slot.profession}
                                                    </Typography>
                                                    <Chip
                                                        label={statusText}
                                                        color={statusColor as any}
                                                        size="small"
                                                        variant="outlined"
                                                    />
                                                </Box>

                                                <Box sx={{ mb: 2 }}>
                                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                                        <strong>Time:</strong> {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                                        <strong>Price:</strong> {formatEther(slot.price)} ETH
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary">
                                                        <strong>Expert:</strong> {slot.expert.slice(0, 6)}...{slot.expert.slice(-4)}
                                                    </Typography>
                                                </Box>

                                                <Typography variant="body2" color="text.secondary">
                                                    {slot.description || 'No description provided.'}
                                                </Typography>
                                            </CardContent>

                                            <Box sx={{ p: 3, pt: 0 }}>
                                                {slot.isBooked && !slot.isRevoked && (
                                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                                        {isUpcoming && (
                                                            <Button
                                                                variant="outlined"
                                                                color="primary"
                                                                fullWidth
                                                                sx={{ fontWeight: 600, borderRadius: 2 }}
                                                            >
                                                                View Details
                                                            </Button>
                                                        )}
                                                        {isCompleted && (
                                                            <Button
                                                                variant="contained"
                                                                color="success"
                                                                fullWidth
                                                                sx={{ fontWeight: 600, borderRadius: 2 }}
                                                            >
                                                                Leave Review
                                                            </Button>
                                                        )}
                                                    </Box>
                                                )}
                                            </Box>
                                        </Card>
                                    </Grid>
                                );
                            })
                        )}
                    </Grid>
                )}
            </Container>
        </Box>
    );
};

export default CustomerDashboard;



