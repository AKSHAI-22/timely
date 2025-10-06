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
    Avatar,
    CircularProgress,
    Alert,
    Divider,
    Rating,
} from '@mui/material';
import {
    Schedule as ScheduleIcon,
    Person as PersonIcon,
    AttachMoney as MoneyIcon,
    Star as StarIcon,
    Verified as VerifiedIcon,
    LocationOn as LocationIcon,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useWallet } from '../contexts/WalletContext';
import { contractService } from '../services/contractService';
import { formatEther, formatAddress, formatTime, getSlotStatus, getSlotStatusColor, getSlotStatusText } from '../utils/contracts';

const ExpertProfile: React.FC = () => {
    const { address } = useParams<{ address: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { provider } = useWallet();

    const [expertProfile, setExpertProfile] = useState<any>(null);
    const [expertSlots, setExpertSlots] = useState<any[]>([]);
    const [reviews, setReviews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (provider && address) {
            loadExpertProfile();
        }
    }, [provider, address]);

    const loadExpertProfile = async () => {
        try {
            setLoading(true);
            setError(null);

            if (!provider || !address) {
                throw new Error('Provider or address not available');
            }

            contractService.setProvider(provider);

            // Load expert profile
            const profile = await contractService.getUserProfile(address);
            setExpertProfile(profile);

            // Load expert's time slots
            const allSlots = await contractService.getAllTimeSlots(50);
            const expertSlots = allSlots.filter(slot =>
                slot.expert.toLowerCase() === address.toLowerCase()
            );
            setExpertSlots(expertSlots);

            // Load expert's reviews
            try {
                const expertReviews = await contractService.getExpertReviews(address);
                setReviews(expertReviews);
            } catch (err) {
                console.warn('No reviews found for this expert');
            }
        } catch (err) {
            console.error('Failed to load expert profile:', err);
            setError('Failed to load expert profile. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const availableSlots = expertSlots.filter(slot => getSlotStatus(slot) === 'available');
    const averageRating = reviews.length > 0
        ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
        : 0;

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress size={60} />
            </Box>
        );
    }

    if (error || !expertProfile) {
        return (
            <Container maxWidth="md" sx={{ py: 8 }}>
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error || 'Expert profile not found'}
                </Alert>
                <Button variant="contained" onClick={() => navigate('/marketplace')}>
                    Back to Marketplace
                </Button>
            </Container>
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
                        Expert Profile
                    </Typography>
                </Box>

                {/* Error Alert */}
                {error && (
                    <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
                        {error}
                    </Alert>
                )}

                <Grid container spacing={4}>
                    {/* Expert Info Card */}
                    <Grid item xs={12} md={4}>
                        <Card sx={{ mb: 4 }}>
                            <CardContent sx={{ p: 4, textAlign: 'center' }}>
                                <Avatar
                                    sx={{
                                        width: 120,
                                        height: 120,
                                        mx: 'auto',
                                        mb: 3,
                                        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                                        fontSize: '3rem',
                                    }}
                                >
                                    {expertProfile.name.charAt(0).toUpperCase()}
                                </Avatar>

                                <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
                                    {expertProfile.name}
                                </Typography>

                                <Typography variant="h6" color="primary.main" sx={{ mb: 2 }}>
                                    {expertProfile.profession}
                                </Typography>

                                {expertProfile.isVerified && (
                                    <Chip
                                        icon={<VerifiedIcon />}
                                        label="Verified Expert"
                                        color="success"
                                        variant="outlined"
                                        sx={{ mb: 2 }}
                                    />
                                )}

                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                                    <Rating value={averageRating} readOnly precision={0.1} />
                                    <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                                        ({reviews.length} reviews)
                                    </Typography>
                                </Box>

                                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                                    {expertProfile.bio || 'No bio available.'}
                                </Typography>

                                <Divider sx={{ my: 3 }} />

                                <Box sx={{ textAlign: 'left' }}>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                        <strong>Address:</strong> {formatAddress(address!)}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                        <strong>Status:</strong> {expertProfile.isActive ? 'Active' : 'Inactive'}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        <strong>Last Active:</strong> {new Date(Number(expertProfile.lastActive) * 1000).toLocaleDateString()}
                                    </Typography>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Available Slots */}
                    <Grid item xs={12} md={8}>
                        <Card>
                            <CardContent sx={{ p: 4 }}>
                                <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
                                    Available Time Slots
                                </Typography>

                                {availableSlots.length === 0 ? (
                                    <Box sx={{ textAlign: 'center', py: 8 }}>
                                        <Typography variant="h6" color="text.secondary">
                                            No available slots at the moment.
                                        </Typography>
                                    </Box>
                                ) : (
                                    <Grid container spacing={3}>
                                        {availableSlots.map((slot) => (
                                            <Grid item xs={12} sm={6} key={slot.tokenId.toString()}>
                                                <Card
                                                    sx={{
                                                        height: '100%',
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        cursor: 'pointer',
                                                        '&:hover': {
                                                            transform: 'translateY(-2px)',
                                                            boxShadow: 3,
                                                        },
                                                        transition: 'all 0.2s ease-in-out',
                                                    }}
                                                    onClick={() => navigate(`/booking/${slot.tokenId.toString()}`)}
                                                >
                                                    <CardContent sx={{ flexGrow: 1, p: 3 }}>
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

                                                    <CardActions sx={{ p: 3, pt: 0 }}>
                                                        <Button
                                                            variant="contained"
                                                            fullWidth
                                                            sx={{
                                                                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                                                                '&:hover': {
                                                                    background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                                                                },
                                                            }}
                                                        >
                                                            Book Appointment
                                                        </Button>
                                                    </CardActions>
                                                </Card>
                                            </Grid>
                                        ))}
                                    </Grid>
                                )}
                            </CardContent>
                        </Card>

                        {/* Reviews Section */}
                        {reviews.length > 0 && (
                            <Card sx={{ mt: 4 }}>
                                <CardContent sx={{ p: 4 }}>
                                    <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
                                        Reviews ({reviews.length})
                                    </Typography>

                                    <Grid container spacing={3}>
                                        {reviews.map((review, index) => (
                                            <Grid item xs={12} key={index}>
                                                <Card variant="outlined">
                                                    <CardContent sx={{ p: 3 }}>
                                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                                                {formatAddress(review.reviewer)}
                                                            </Typography>
                                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                                <Rating value={review.rating} readOnly size="small" />
                                                                <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                                                                    {review.rating}/5
                                                                </Typography>
                                                            </Box>
                                                        </Box>

                                                        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                                                            {review.comment}
                                                        </Typography>

                                                        <Typography variant="body2" color="text.secondary">
                                                            {new Date(Number(review.timestamp) * 1000).toLocaleDateString()}
                                                        </Typography>
                                                    </CardContent>
                                                </Card>
                                            </Grid>
                                        ))}
                                    </Grid>
                                </CardContent>
                            </Card>
                        )}
                    </Grid>
                </Grid>
            </Container>
        </Box>
    );
};

export default ExpertProfile;