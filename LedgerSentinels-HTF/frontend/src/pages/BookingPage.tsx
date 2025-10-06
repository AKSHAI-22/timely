import React from 'react';
import {
    Box,
    Typography,
    Container,
    Card,
    CardContent,
    Button,
    Grid,
    Chip,
    useTheme,
    Alert,
} from '@mui/material';
import {
    Schedule as ScheduleIcon,
    Person as PersonIcon,
    AttachMoney as MoneyIcon,
    CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useWallet } from '../contexts/WalletContext';

const BookingPage: React.FC = () => {
    const theme = useTheme();
    const { tokenId } = useParams<{ tokenId: string }>();
    const { user } = useAuth();
    const { isConnected } = useWallet();

    // Mock data - in real app, fetch from API
    const booking = {
        tokenId: tokenId || '1',
        startTime: '2024-01-20T10:00:00Z',
        endTime: '2024-01-20T11:00:00Z',
        price: '0.1',
        profession: 'Medical Consultation',
        description: 'General health consultation and checkup',
        expert: '0x1234...5678',
        expertName: 'Dr. Sarah Johnson',
        status: 'confirmed',
        meetingLink: 'https://meet.google.com/abc-defg-hij',
        notes: 'Please prepare your medical history and any current medications.',
    };

    if (!isConnected) {
        return (
            <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Alert severity="info" sx={{ maxWidth: 400 }}>
                    Please connect your wallet to view booking details.
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
            <Container maxWidth="md">
                {/* Header */}
                <Box sx={{ textAlign: 'center', mb: 4 }}>
                    <Typography
                        variant="h3"
                        sx={{
                            fontWeight: 700,
                            mb: 2,
                            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                            backgroundClip: 'text',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                        }}
                    >
                        Booking Details
                    </Typography>
                    <Typography variant="h6" color="text.secondary">
                        Your appointment information and next steps
                    </Typography>
                </Box>

                {/* Booking Card */}
                <Card sx={{ mb: 4, p: 4 }}>
                    <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                            <Typography variant="h5" sx={{ fontWeight: 600, color: 'primary.main' }}>
                                {booking.profession}
                            </Typography>
                            <Chip
                                label="Confirmed"
                                color="success"
                                sx={{ fontWeight: 600 }}
                            />
                        </Box>

                        <Grid container spacing={3}>
                            <Grid item xs={12} md={6}>
                                <Box sx={{ mb: 3 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                        <ScheduleIcon sx={{ mr: 2, color: 'primary.main' }} />
                                        <Box>
                                            <Typography variant="body2" color="text.secondary">
                                                Appointment Time
                                            </Typography>
                                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                                {new Date(booking.startTime).toLocaleString()} - {new Date(booking.endTime).toLocaleString()}
                                            </Typography>
                                        </Box>
                                    </Box>

                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                        <PersonIcon sx={{ mr: 2, color: 'primary.main' }} />
                                        <Box>
                                            <Typography variant="body2" color="text.secondary">
                                                Expert
                                            </Typography>
                                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                                {booking.expertName}
                                            </Typography>
                                        </Box>
                                    </Box>

                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <MoneyIcon sx={{ mr: 2, color: 'primary.main' }} />
                                        <Box>
                                            <Typography variant="body2" color="text.secondary">
                                                Price
                                            </Typography>
                                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                                {booking.price} ETH
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Box>
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <Box sx={{ mb: 3 }}>
                                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                                        Description
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                        {booking.description}
                                    </Typography>

                                    {booking.meetingLink && (
                                        <Box sx={{ mb: 3 }}>
                                            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                                                Meeting Link
                                            </Typography>
                                            <Button
                                                variant="outlined"
                                                href={booking.meetingLink}
                                                target="_blank"
                                                sx={{ fontWeight: 600, borderRadius: 2 }}
                                            >
                                                Join Meeting
                                            </Button>
                                        </Box>
                                    )}

                                    {booking.notes && (
                                        <Box>
                                            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                                                Important Notes
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                {booking.notes}
                                            </Typography>
                                        </Box>
                                    )}
                                </Box>
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>

                {/* Next Steps */}
                <Card sx={{ p: 4 }}>
                    <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
                        Next Steps
                    </Typography>

                    <Grid container spacing={3}>
                        <Grid item xs={12} md={4}>
                            <Box sx={{ textAlign: 'center', p: 3 }}>
                                <CheckCircleIcon sx={{ fontSize: 40, color: 'success.main', mb: 2 }} />
                                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                                    Booking Confirmed
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Your appointment has been successfully booked and confirmed.
                                </Typography>
                            </Box>
                        </Grid>

                        <Grid item xs={12} md={4}>
                            <Box sx={{ textAlign: 'center', p: 3 }}>
                                <ScheduleIcon sx={{ fontSize: 40, color: 'primary.main', mb: 2 }} />
                                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                                    Join Meeting
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Use the meeting link above to join your appointment at the scheduled time.
                                </Typography>
                            </Box>
                        </Grid>

                        <Grid item xs={12} md={4}>
                            <Box sx={{ textAlign: 'center', p: 3 }}>
                                <CheckCircleIcon sx={{ fontSize: 40, color: 'warning.main', mb: 2 }} />
                                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                                    Leave Review
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    After your appointment, don't forget to leave a review for the expert.
                                </Typography>
                            </Box>
                        </Grid>
                    </Grid>
                </Card>

                {/* Actions */}
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 4 }}>
                    <Button
                        variant="outlined"
                        sx={{ fontWeight: 600, borderRadius: 2 }}
                    >
                        Cancel Booking
                    </Button>

                    <Button
                        variant="contained"
                        sx={{
                            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                            '&:hover': {
                                background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                            },
                            fontWeight: 600,
                            borderRadius: 2,
                        }}
                    >
                        Contact Expert
                    </Button>
                </Box>
            </Container>
        </Box>
    );
};

export default BookingPage;



