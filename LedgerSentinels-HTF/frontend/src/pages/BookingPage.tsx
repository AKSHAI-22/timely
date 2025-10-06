import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Container,
    Card,
    CardContent,
    CardActions,
    Button,
    Chip,
    Grid,
    CircularProgress,
    Alert,
    Divider,
    useTheme,
} from '@mui/material';
import {
    Schedule as ScheduleIcon,
    Person as PersonIcon,
    AttachMoney as MoneyIcon,
    CheckCircle as CheckCircleIcon,
    Cancel as CancelIcon,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useWallet } from '../contexts/WalletContext';
import { contractService } from '../services/contractService';
import { formatEther, formatAddress, formatTime, getSlotStatus, getSlotStatusColor, getSlotStatusText } from '../utils/contracts';

const BookingPage: React.FC = () => {
    const theme = useTheme();
    const { tokenId } = useParams<{ tokenId: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { provider, signer } = useWallet();

    const [slot, setSlot] = useState<any>(null);
    const [escrow, setEscrow] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        if (provider && tokenId) {
            loadBookingDetails();
        }
    }, [provider, tokenId]);

    const loadBookingDetails = async () => {
        try {
            setLoading(true);
            setError(null);

            if (!provider || !tokenId) {
                throw new Error('Provider or token ID not available');
            }

            contractService.setProvider(provider);

            // Load slot details
            const slotData = await contractService.getTimeSlot(BigInt(tokenId));
            setSlot(slotData);

            // Try to load escrow details if slot is booked
            if (slotData.isBooked) {
                try {
                    const escrowData = await contractService.getEscrow(BigInt(tokenId));
                    setEscrow(escrowData);
                } catch (err) {
                    console.warn('No escrow found for this booking');
                }
            }
        } catch (err) {
            console.error('Failed to load booking details:', err);
            setError('Failed to load booking details. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmAppointment = async () => {
        if (!signer || !tokenId) return;

        try {
            setActionLoading(true);
            contractService.setSigner(signer);

            const tx = await contractService.confirmAppointment(BigInt(tokenId));
            await tx.wait();

            // Reload details
            loadBookingDetails();
        } catch (err) {
            console.error('Failed to confirm appointment:', err);
            setError('Failed to confirm appointment. Please try again.');
        } finally {
            setActionLoading(false);
        }
    };

    const handleCompleteEscrow = async () => {
        if (!signer || !tokenId) return;

        try {
            setActionLoading(true);
            contractService.setSigner(signer);

            const tx = await contractService.completeEscrow(BigInt(tokenId));
            await tx.wait();

            // Reload details
            loadBookingDetails();
        } catch (err) {
            console.error('Failed to complete escrow:', err);
            setError('Failed to complete escrow. Please try again.');
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress size={60} />
            </Box>
        );
    }

    if (error || !slot) {
        return (
            <Container maxWidth="md" sx={{ py: 8 }}>
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error || 'Booking not found'}
                </Alert>
                <Button variant="contained" onClick={() => navigate('/marketplace')}>
                    Back to Marketplace
                </Button>
            </Container>
        );
    }

    const status = getSlotStatus(slot);
    const statusColor = getSlotStatusColor(status);
    const statusText = getSlotStatusText(status);

    const isExpert = user?.address.toLowerCase() === slot.expert.toLowerCase();
    const isCustomer = user?.address.toLowerCase() === slot.bookedBy.toLowerCase();
    const canConfirm = escrow && (
        (isExpert && !escrow.sellerConfirmed) ||
        (isCustomer && !escrow.buyerConfirmed)
    );
    const canComplete = escrow && escrow.buyerConfirmed && escrow.sellerConfirmed && escrow.status === 1;

    return (
        <Box
            sx={{
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                py: 4,
            }}
        >
            <Container maxWidth="md">
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
                        Booking Details
                    </Typography>
                </Box>

                {/* Error Alert */}
                {error && (
                    <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
                        {error}
                    </Alert>
                )}

                {/* Main Card */}
                <Card sx={{ mb: 4 }}>
                    <CardContent sx={{ p: 4 }}>
                        {/* Status and Title */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
                            <Typography variant="h4" sx={{ fontWeight: 600, color: 'primary.main' }}>
                                {slot.profession}
                            </Typography>
                            <Chip
                                label={statusText}
                                color={statusColor as any}
                                size="medium"
                                variant="outlined"
                            />
                        </Box>

                        {/* Time and Price */}
                        <Grid container spacing={4} sx={{ mb: 4 }}>
                            <Grid item xs={12} sm={6}>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                    <ScheduleIcon sx={{ fontSize: 24, mr: 2, color: 'primary.main' }} />
                                    <Box>
                                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                            Appointment Time
                                        </Typography>
                                        <Typography variant="body1" color="text.secondary">
                                            {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                                        </Typography>
                                    </Box>
                                </Box>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                    <MoneyIcon sx={{ fontSize: 24, mr: 2, color: 'primary.main' }} />
                                    <Box>
                                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                            Price
                                        </Typography>
                                        <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main' }}>
                                            {formatEther(slot.price)} ETH
                                        </Typography>
                                    </Box>
                                </Box>
                            </Grid>
                        </Grid>

                        {/* Participants */}
                        <Grid container spacing={4} sx={{ mb: 4 }}>
                            <Grid item xs={12} sm={6}>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                    <PersonIcon sx={{ fontSize: 24, mr: 2, color: 'primary.main' }} />
                                    <Box>
                                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                            Expert
                                        </Typography>
                                        <Typography variant="body1" color="text.secondary">
                                            {formatAddress(slot.expert)}
                                        </Typography>
                                    </Box>
                                </Box>
                            </Grid>
                            {slot.isBooked && (
                                <Grid item xs={12} sm={6}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                        <PersonIcon sx={{ fontSize: 24, mr: 2, color: 'primary.main' }} />
                                        <Box>
                                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                                Customer
                                            </Typography>
                                            <Typography variant="body1" color="text.secondary">
                                                {formatAddress(slot.bookedBy)}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Grid>
                            )}
                        </Grid>

                        {/* Description */}
                        <Box sx={{ mb: 4 }}>
                            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                                Description
                            </Typography>
                            <Typography variant="body1" color="text.secondary">
                                {slot.description || 'No description provided.'}
                            </Typography>
                        </Box>

                        {/* Escrow Details */}
                        {escrow && (
                            <>
                                <Divider sx={{ my: 4 }} />
                                <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
                                    Escrow Details
                                </Typography>

                                <Grid container spacing={3} sx={{ mb: 3 }}>
                                    <Grid item xs={12} sm={6}>
                                        <Typography variant="body2" color="text.secondary">
                                            Escrow Amount
                                        </Typography>
                                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                            {formatEther(escrow.amount)} ETH
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <Typography variant="body2" color="text.secondary">
                                            Status
                                        </Typography>
                                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                            {escrow.status === 0 ? 'Pending' :
                                                escrow.status === 1 ? 'Active' :
                                                    escrow.status === 2 ? 'Completed' : 'Disputed'}
                                        </Typography>
                                    </Grid>
                                </Grid>

                                {escrow.meetingLink && (
                                    <Box sx={{ mb: 3 }}>
                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                            Meeting Link
                                        </Typography>
                                        <Typography variant="body1">
                                            {escrow.meetingLink}
                                        </Typography>
                                    </Box>
                                )}

                                {escrow.notes && (
                                    <Box sx={{ mb: 3 }}>
                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                            Notes
                                        </Typography>
                                        <Typography variant="body1">
                                            {escrow.notes}
                                        </Typography>
                                    </Box>
                                )}

                                <Grid container spacing={2} sx={{ mb: 3 }}>
                                    <Grid item xs={12} sm={6}>
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <CheckCircleIcon
                                                sx={{
                                                    fontSize: 20,
                                                    mr: 1,
                                                    color: escrow.buyerConfirmed ? 'success.main' : 'text.disabled'
                                                }}
                                            />
                                            <Typography variant="body2">
                                                Customer Confirmed: {escrow.buyerConfirmed ? 'Yes' : 'No'}
                                            </Typography>
                                        </Box>
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <CheckCircleIcon
                                                sx={{
                                                    fontSize: 20,
                                                    mr: 1,
                                                    color: escrow.sellerConfirmed ? 'success.main' : 'text.disabled'
                                                }}
                                            />
                                            <Typography variant="body2">
                                                Expert Confirmed: {escrow.sellerConfirmed ? 'Yes' : 'No'}
                                            </Typography>
                                        </Box>
                                    </Grid>
                                </Grid>
                            </>
                        )}
                    </CardContent>

                    <CardActions sx={{ p: 4, pt: 0 }}>
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                                <Button
                                    variant="outlined"
                                    fullWidth
                                    onClick={() => navigate('/marketplace')}
                                >
                                    Back to Marketplace
                                </Button>
                            </Grid>

                            {canConfirm && (
                                <Grid item xs={12} sm={6}>
                                    <Button
                                        variant="contained"
                                        fullWidth
                                        onClick={handleConfirmAppointment}
                                        disabled={actionLoading}
                                        startIcon={actionLoading ? <CircularProgress size={20} /> : <CheckCircleIcon />}
                                        sx={{
                                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                            '&:hover': {
                                                background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                                            },
                                        }}
                                    >
                                        {actionLoading ? 'Confirming...' : 'Confirm Appointment'}
                                    </Button>
                                </Grid>
                            )}

                            {canComplete && (
                                <Grid item xs={12} sm={6}>
                                    <Button
                                        variant="contained"
                                        fullWidth
                                        onClick={handleCompleteEscrow}
                                        disabled={actionLoading}
                                        startIcon={actionLoading ? <CircularProgress size={20} /> : <CheckCircleIcon />}
                                        sx={{
                                            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                                            '&:hover': {
                                                background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                                            },
                                        }}
                                    >
                                        {actionLoading ? 'Completing...' : 'Complete Escrow'}
                                    </Button>
                                </Grid>
                            )}
                        </Grid>
                    </CardActions>
                </Card>
            </Container>
        </Box>
    );
};

export default BookingPage;