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
    Add as AddIcon,
    Edit as EditIcon,
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
            id={`expert-tabpanel-${index}`}
            aria-labelledby={`expert-tab-${index}`}
            {...other}
        >
            {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
        </div>
    );
}

const ExpertDashboard: React.FC = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { provider, signer } = useWallet();

    const [tabValue, setTabValue] = useState(0);
    const [slots, setSlots] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (provider && user) {
            loadExpertSlots();
        }
    }, [provider, user]);

    const loadExpertSlots = async () => {
        try {
            setLoading(true);
            setError(null);

            if (!provider || !user) {
                throw new Error('Provider or user not available');
            }

            contractService.setProvider(provider);
            const allSlots = await contractService.getAllTimeSlots(50);

            // Filter slots for this expert
            const expertSlots = allSlots.filter(slot =>
                slot.expert.toLowerCase() === user.address.toLowerCase()
            );

            setSlots(expertSlots);
        } catch (err) {
            console.error('Failed to load expert slots:', err);
            setError('Failed to load your time slots. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateSlot = () => {
        navigate('/create-slot');
    };

    const handleEditSlot = (tokenId: bigint) => {
        navigate(`/edit-slot/${tokenId.toString()}`);
    };

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    const availableSlots = slots.filter(slot => getSlotStatus(slot) === 'available');
    const bookedSlots = slots.filter(slot => getSlotStatus(slot) === 'booked');
    const revokedSlots = slots.filter(slot => getSlotStatus(slot) === 'revoked');

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
                        Expert Dashboard
                    </Typography>
                    <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
                        Manage your time slots and appointments
                    </Typography>
                </Box>

                {/* Stats Cards */}
                <Grid container spacing={3} sx={{ mb: 4 }}>
                    <Grid item xs={12} sm={4}>
                        <Card sx={{ textAlign: 'center', p: 3 }}>
                            <ScheduleIcon sx={{ fontSize: 40, color: 'primary.main', mb: 2 }} />
                            <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                                {availableSlots.length}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Available Slots
                            </Typography>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <Card sx={{ textAlign: 'center', p: 3 }}>
                            <PersonIcon sx={{ fontSize: 40, color: 'success.main', mb: 2 }} />
                            <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>
                                {bookedSlots.length}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Booked Appointments
                            </Typography>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <Card sx={{ textAlign: 'center', p: 3 }}>
                            <MoneyIcon sx={{ fontSize: 40, color: 'warning.main', mb: 2 }} />
                            <Typography variant="h4" sx={{ fontWeight: 700, color: 'warning.main' }}>
                                {slots.reduce((total, slot) => total + Number(formatEther(slot.price)), 0).toFixed(2)}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Total Value (ETH)
                            </Typography>
                        </Card>
                    </Grid>
                </Grid>

                {/* Action Buttons */}
                <Box sx={{ display: 'flex', gap: 2, mb: 4, justifyContent: 'center' }}>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={handleCreateSlot}
                        sx={{
                            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                            '&:hover': {
                                background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                            },
                        }}
                    >
                        Create New Slot
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
                        <Tabs value={tabValue} onChange={handleTabChange} aria-label="expert dashboard tabs">
                            <Tab label={`Available (${availableSlots.length})`} />
                            <Tab label={`Booked (${bookedSlots.length})`} />
                            <Tab label={`All Slots (${slots.length})`} />
                        </Tabs>
                    </Box>

                    <TabPanel value={tabValue} index={0}>
                        <Grid container spacing={3}>
                            {availableSlots.length === 0 ? (
                                <Grid item xs={12}>
                                    <Box sx={{ textAlign: 'center', py: 8 }}>
                                        <Typography variant="h6" color="text.secondary">
                                            No available slots. Create your first time slot!
                                        </Typography>
                                    </Box>
                                </Grid>
                            ) : (
                                availableSlots.map((slot) => (
                                    <Grid item xs={12} md={6} lg={4} key={slot.tokenId.toString()}>
                                        <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                                            <CardContent sx={{ flexGrow: 1 }}>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                                    <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
                                                        {slot.profession}
                                                    </Typography>
                                                    <Chip
                                                        label="Available"
                                                        color="success"
                                                        size="small"
                                                        variant="outlined"
                                                    />
                                                </Box>

                                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                                    {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                                                </Typography>

                                                <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main', mb: 2 }}>
                                                    {formatEther(slot.price)} ETH
                                                </Typography>

                                                <Typography variant="body2" color="text.secondary">
                                                    {slot.description || 'No description provided.'}
                                                </Typography>
                                            </CardContent>

                                            <CardActions sx={{ p: 2, pt: 0 }}>
                                                <Button
                                                    variant="outlined"
                                                    startIcon={<EditIcon />}
                                                    onClick={() => handleEditSlot(slot.tokenId)}
                                                    fullWidth
                                                >
                                                    Edit Slot
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
                            {bookedSlots.length === 0 ? (
                                <Grid item xs={12}>
                                    <Box sx={{ textAlign: 'center', py: 8 }}>
                                        <Typography variant="h6" color="text.secondary">
                                            No booked appointments yet.
                                        </Typography>
                                    </Box>
                                </Grid>
                            ) : (
                                bookedSlots.map((slot) => (
                                    <Grid item xs={12} md={6} lg={4} key={slot.tokenId.toString()}>
                                        <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                                            <CardContent sx={{ flexGrow: 1 }}>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                                    <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
                                                        {slot.profession}
                                                    </Typography>
                                                    <Chip
                                                        label="Booked"
                                                        color="info"
                                                        size="small"
                                                        variant="outlined"
                                                    />
                                                </Box>

                                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                                    {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                                                </Typography>

                                                <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main', mb: 2 }}>
                                                    {formatEther(slot.price)} ETH
                                                </Typography>

                                                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                                    Booked by: {formatAddress(slot.bookedBy)}
                                                </Typography>

                                                <Typography variant="body2" color="text.secondary">
                                                    {slot.description || 'No description provided.'}
                                                </Typography>
                                            </CardContent>

                                            <CardActions sx={{ p: 2, pt: 0 }}>
                                                <Button
                                                    variant="contained"
                                                    fullWidth
                                                    onClick={() => navigate(`/booking/${slot.tokenId.toString()}`)}
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

                    <TabPanel value={tabValue} index={2}>
                        <Grid container spacing={3}>
                            {slots.length === 0 ? (
                                <Grid item xs={12}>
                                    <Box sx={{ textAlign: 'center', py: 8 }}>
                                        <Typography variant="h6" color="text.secondary">
                                            No time slots created yet.
                                        </Typography>
                                    </Box>
                                </Grid>
                            ) : (
                                slots.map((slot) => {
                                    const status = getSlotStatus(slot);
                                    const statusColor = getSlotStatusColor(status);
                                    const statusText = getSlotStatusText(status);

                                    return (
                                        <Grid item xs={12} md={6} lg={4} key={slot.tokenId.toString()}>
                                            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                                                <CardContent sx={{ flexGrow: 1 }}>
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

                                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                                        {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                                                    </Typography>

                                                    <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main', mb: 2 }}>
                                                        {formatEther(slot.price)} ETH
                                                    </Typography>

                                                    {slot.isBooked && (
                                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                                            Booked by: {formatAddress(slot.bookedBy)}
                                                        </Typography>
                                                    )}

                                                    <Typography variant="body2" color="text.secondary">
                                                        {slot.description || 'No description provided.'}
                                                    </Typography>
                                                </CardContent>

                                                <CardActions sx={{ p: 2, pt: 0 }}>
                                                    <Button
                                                        variant="outlined"
                                                        startIcon={<EditIcon />}
                                                        onClick={() => handleEditSlot(slot.tokenId)}
                                                        fullWidth
                                                        disabled={status === 'booked'}
                                                    >
                                                        {status === 'booked' ? 'View Details' : 'Edit Slot'}
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

export default ExpertDashboard;