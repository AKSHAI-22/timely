import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Container,
    Grid,
    Card,
    CardContent,
    CardActions,
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
    Person as PersonIcon,
    AttachMoney as MoneyIcon,
    Star as StarIcon,
    CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useWallet } from '../contexts/WalletContext';
import { contractService } from '../services/contractService';
import { formatEther, formatAddress, formatTime, getSlotStatus, getSlotStatusColor, getSlotStatusText } from '../utils/contracts';

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`customer-tabpanel-${index}`}
            aria-labelledby={`customer-tab-${index}`}
            {...other}
        >
            {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
        </div>
    );
}

const CustomerDashboard: React.FC = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { provider } = useWallet();

    const [tabValue, setTabValue] = useState(0);
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (provider && user) {
            loadCustomerBookings();
        }
    }, [provider, user]);

    const loadCustomerBookings = async () => {
        try {
            setLoading(true);
            setError(null);

            if (!provider || !user) {
                throw new Error('Provider or user not available');
            }

            contractService.setProvider(provider);
            const allSlots = await contractService.getAllTimeSlots(50);

            // Filter slots booked by this customer
            const customerBookings = allSlots.filter(slot =>
                slot.bookedBy.toLowerCase() === user.address.toLowerCase()
            );

            setBookings(customerBookings);
        } catch (err) {
            console.error('Failed to load customer bookings:', err);
            setError('Failed to load your bookings. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    const upcomingBookings = bookings.filter(booking => {
        const now = Math.floor(Date.now() / 1000);
        return booking.startTime > now && getSlotStatus(booking) === 'booked';
    });

    const pastBookings = bookings.filter(booking => {
        const now = Math.floor(Date.now() / 1000);
        return booking.startTime <= now || getSlotStatus(booking) === 'revoked';
    });

    const totalSpent = bookings.reduce((total, booking) =>
        total + Number(formatEther(booking.price)), 0
    );

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress size={60} />
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
                <Box sx={{ textAlign: 'center', mb: 6 }}>
                    <Typography
                        variant="h2"
                        sx={{
                            fontWeight: 700,
                            mb: 3,
                            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                            backgroundClip: 'text',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                        }}
                    >
                        Customer Dashboard
                    </Typography>
                    <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
                        Manage your appointments and bookings
                    </Typography>
                </Box>

                {/* Stats Cards */}
                <Grid container spacing={3} sx={{ mb: 4 }}>
                    <Grid item xs={12} sm={4}>
                        <Card sx={{ textAlign: 'center', p: 3 }}>
                            <ScheduleIcon sx={{ fontSize: 40, color: 'primary.main', mb: 2 }} />
                            <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                                {upcomingBookings.length}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Upcoming Appointments
                            </Typography>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <Card sx={{ textAlign: 'center', p: 3 }}>
                            <CheckCircleIcon sx={{ fontSize: 40, color: 'success.main', mb: 2 }} />
                            <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>
                                {pastBookings.length}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Completed Appointments
                            </Typography>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <Card sx={{ textAlign: 'center', p: 3 }}>
                            <MoneyIcon sx={{ fontSize: 40, color: 'warning.main', mb: 2 }} />
                            <Typography variant="h4" sx={{ fontWeight: 700, color: 'warning.main' }}>
                                {totalSpent.toFixed(2)}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Total Spent (ETH)
                            </Typography>
                        </Card>
                    </Grid>
                </Grid>

                {/* Action Buttons */}
                <Box sx={{ display: 'flex', gap: 2, mb: 4, justifyContent: 'center' }}>
                    <Button
                        variant="contained"
                        onClick={() => navigate('/marketplace')}
                        sx={{
                            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                            '&:hover': {
                                background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                            },
                        }}
                    >
                        Browse Experts
                    </Button>
                </Box>

                {/* Error Alert */}
                {error && (
                    <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
                        {error}
                    </Alert>
                )}

                {/* Tabs */}
                <Card>
                    <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                        <Tabs value={tabValue} onChange={handleTabChange} aria-label="customer dashboard tabs">
                            <Tab label={`Upcoming (${upcomingBookings.length})`} />
                            <Tab label={`Past (${pastBookings.length})`} />
                            <Tab label={`All Bookings (${bookings.length})`} />
                        </Tabs>
                    </Box>

                    <TabPanel value={tabValue} index={0}>
                        <Grid container spacing={3}>
                            {upcomingBookings.length === 0 ? (
                                <Grid item xs={12}>
                                    <Box sx={{ textAlign: 'center', py: 8 }}>
                                        <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
                                            No upcoming appointments.
                                        </Typography>
                                        <Button
                                            variant="contained"
                                            onClick={() => navigate('/marketplace')}
                                            sx={{
                                                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                                                '&:hover': {
                                                    background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                                                },
                                            }}
                                        >
                                            Browse Experts
                                        </Button>
                                    </Box>
                                </Grid>
                            ) : (
                                upcomingBookings.map((booking) => (
                                    <Grid item xs={12} md={6} lg={4} key={booking.tokenId.toString()}>
                                        <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                                            <CardContent sx={{ flexGrow: 1 }}>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                                    <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
                                                        {booking.profession}
                                                    </Typography>
                                                    <Chip
                                                        label="Upcoming"
                                                        color="info"
                                                        size="small"
                                                        variant="outlined"
                                                    />
                                                </Box>

                                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                                    {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                                                </Typography>

                                                <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main', mb: 2 }}>
                                                    {formatEther(booking.price)} ETH
                                                </Typography>

                                                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                                    Expert: {formatAddress(booking.expert)}
                                                </Typography>

                                                <Typography variant="body2" color="text.secondary">
                                                    {booking.description || 'No description provided.'}
                                                </Typography>
                                            </CardContent>

                                            <CardActions sx={{ p: 2, pt: 0 }}>
                                                <Button
                                                    variant="contained"
                                                    fullWidth
                                                    onClick={() => navigate(`/booking/${booking.tokenId.toString()}`)}
                                                >
                                                    View Details
                                                </Button>
                                            </CardActions>
                                        </Card>
                                    </Grid>
                                ))
                            )}
                        </Grid>
                    </TabPanel>

                    <TabPanel value={tabValue} index={1}>
                        <Grid container spacing={3}>
                            {pastBookings.length === 0 ? (
                                <Grid item xs={12}>
                                    <Box sx={{ textAlign: 'center', py: 8 }}>
                                        <Typography variant="h6" color="text.secondary">
                                            No past appointments yet.
                                        </Typography>
                                    </Box>
                                </Grid>
                            ) : (
                                pastBookings.map((booking) => {
                                    const status = getSlotStatus(booking);
                                    const statusColor = getSlotStatusColor(status);
                                    const statusText = getSlotStatusText(status);

                                    return (
                                        <Grid item xs={12} md={6} lg={4} key={booking.tokenId.toString()}>
                                            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                                                <CardContent sx={{ flexGrow: 1 }}>
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                                        <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
                                                            {booking.profession}
                                                        </Typography>
                                                        <Chip
                                                            label={statusText}
                                                            color={statusColor as any}
                                                            size="small"
                                                            variant="outlined"
                                                        />
                                                    </Box>

                                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                                        {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                                                    </Typography>

                                                    <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main', mb: 2 }}>
                                                        {formatEther(booking.price)} ETH
                                                    </Typography>

                                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                                        Expert: {formatAddress(booking.expert)}
                                                    </Typography>

                                                    <Typography variant="body2" color="text.secondary">
                                                        {booking.description || 'No description provided.'}
                                                    </Typography>
                                                </CardContent>

                                                <CardActions sx={{ p: 2, pt: 0 }}>
                                                    <Button
                                                        variant="outlined"
                                                        fullWidth
                                                        onClick={() => navigate(`/booking/${booking.tokenId.toString()}`)}
                                                    >
                                                        View Details
                                                    </Button>
                                                </CardActions>
                                            </Card>
                                        </Grid>
                                    );
                                })
                            )}
                        </Grid>
                    </TabPanel>

                    <TabPanel value={tabValue} index={2}>
                        <Grid container spacing={3}>
                            {bookings.length === 0 ? (
                                <Grid item xs={12}>
                                    <Box sx={{ textAlign: 'center', py: 8 }}>
                                        <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
                                            No bookings yet.
                                        </Typography>
                                        <Button
                                            variant="contained"
                                            onClick={() => navigate('/marketplace')}
                                            sx={{
                                                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                                                '&:hover': {
                                                    background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                                                },
                                            }}
                                        >
                                            Browse Experts
                                        </Button>
                                    </Box>
                                </Grid>
                            ) : (
                                bookings.map((booking) => {
                                    const status = getSlotStatus(booking);
                                    const statusColor = getSlotStatusColor(status);
                                    const statusText = getSlotStatusText(status);

                                    return (
                                        <Grid item xs={12} md={6} lg={4} key={booking.tokenId.toString()}>
                                            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                                                <CardContent sx={{ flexGrow: 1 }}>
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                                        <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
                                                            {booking.profession}
                                                        </Typography>
                                                        <Chip
                                                            label={statusText}
                                                            color={statusColor as any}
                                                            size="small"
                                                            variant="outlined"
                                                        />
                                                    </Box>

                                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                                        {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                                                    </Typography>

                                                    <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main', mb: 2 }}>
                                                        {formatEther(booking.price)} ETH
                                                    </Typography>

                                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                                        Expert: {formatAddress(booking.expert)}
                                                    </Typography>

                                                    <Typography variant="body2" color="text.secondary">
                                                        {booking.description || 'No description provided.'}
                                                    </Typography>
                                                </CardContent>

                                                <CardActions sx={{ p: 2, pt: 0 }}>
                                                    <Button
                                                        variant="outlined"
                                                        fullWidth
                                                        onClick={() => navigate(`/booking/${booking.tokenId.toString()}`)}
                                                    >
                                                        View Details
                                                    </Button>
                                                </CardActions>
                                            </Card>
                                        </Grid>
                                    );
                                })
                            )}
                        </Grid>
                    </TabPanel>
                </Card>
            </Container>
        </Box>
    );
};

export default CustomerDashboard;