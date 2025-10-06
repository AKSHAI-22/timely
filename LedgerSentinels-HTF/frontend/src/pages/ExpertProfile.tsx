import React from 'react';
import {
    Box,
    Typography,
    Container,
    Card,
    CardContent,
    Avatar,
    Chip,
    Grid,
    Button,
    useTheme,
} from '@mui/material';
import {
    Star as StarIcon,
    Schedule as ScheduleIcon,
    People as PeopleIcon,
    AttachMoney as MoneyIcon,
} from '@mui/icons-material';
import { useParams } from 'react-router-dom';

const ExpertProfile: React.FC = () => {
    const theme = useTheme();
    const { address } = useParams<{ address: string }>();

    // Mock data - in real app, fetch from API
    const expert = {
        address: address || '0x1234...5678',
        name: 'Dr. Sarah Johnson',
        profession: 'Medical Consultant',
        bio: 'Experienced medical consultant with over 10 years of practice. Specializing in general medicine and preventive care.',
        rating: 4.8,
        reviewCount: 127,
        totalSlots: 45,
        totalBookings: 38,
        isVerified: true,
        profileImage: '',
    };

    const reviews = [
        {
            id: 1,
            reviewer: '0xabcd...1234',
            rating: 5,
            comment: 'Excellent consultation. Very professional and helpful.',
            timestamp: '2024-01-15',
        },
        {
            id: 2,
            reviewer: '0xefgh...5678',
            rating: 4,
            comment: 'Good service, would recommend to others.',
            timestamp: '2024-01-10',
        },
    ];

    return (
        <Box
            sx={{
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                py: 4,
            }}
        >
            <Container maxWidth="lg">
                {/* Profile Header */}
                <Card sx={{ mb: 4, p: 4 }}>
                    <Grid container spacing={4} alignItems="center">
                        <Grid item xs={12} md={3}>
                            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                                <Avatar
                                    sx={{
                                        width: 120,
                                        height: 120,
                                        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                                        fontSize: '3rem',
                                    }}
                                >
                                    {expert.name.charAt(0)}
                                </Avatar>
                            </Box>
                        </Grid>

                        <Grid item xs={12} md={9}>
                            <Box sx={{ textAlign: { xs: 'center', md: 'left' } }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, justifyContent: { xs: 'center', md: 'flex-start' } }}>
                                    <Typography variant="h3" sx={{ fontWeight: 700, color: 'primary.main' }}>
                                        {expert.name}
                                    </Typography>
                                    {expert.isVerified && (
                                        <Chip
                                            label="Verified"
                                            color="success"
                                            size="small"
                                            sx={{ fontWeight: 600 }}
                                        />
                                    )}
                                </Box>

                                <Typography variant="h5" color="text.secondary" sx={{ mb: 2 }}>
                                    {expert.profession}
                                </Typography>

                                <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 600 }}>
                                    {expert.bio}
                                </Typography>

                                <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: { xs: 'center', md: 'flex-start' } }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <StarIcon sx={{ color: 'warning.main' }} />
                                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                            {expert.rating}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            ({expert.reviewCount} reviews)
                                        </Typography>
                                    </Box>

                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <ScheduleIcon sx={{ color: 'primary.main' }} />
                                        <Typography variant="body2" color="text.secondary">
                                            {expert.totalSlots} slots created
                                        </Typography>
                                    </Box>

                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <PeopleIcon sx={{ color: 'success.main' }} />
                                        <Typography variant="body2" color="text.secondary">
                                            {expert.totalBookings} bookings
                                        </Typography>
                                    </Box>
                                </Box>
                            </Box>
                        </Grid>
                    </Grid>
                </Card>

                {/* Stats Cards */}
                <Grid container spacing={3} sx={{ mb: 4 }}>
                    <Grid size={{ xs: 6, md: 3 }}>
                        <Card sx={{ p: 3, textAlign: 'center' }}>
                            <StarIcon sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
                            <Typography variant="h4" sx={{ fontWeight: 700, color: 'warning.main' }}>
                                {expert.rating}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Average Rating
                            </Typography>
                        </Card>
                    </Grid>

                    <Grid size={{ xs: 6, md: 3 }}>
                        <Card sx={{ p: 3, textAlign: 'center' }}>
                            <PeopleIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
                            <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>
                                {expert.reviewCount}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Total Reviews
                            </Typography>
                        </Card>
                    </Grid>

                    <Grid size={{ xs: 6, md: 3 }}>
                        <Card sx={{ p: 3, textAlign: 'center' }}>
                            <ScheduleIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                            <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                                {expert.totalSlots}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Time Slots
                            </Typography>
                        </Card>
                    </Grid>

                    <Grid size={{ xs: 6, md: 3 }}>
                        <Card sx={{ p: 3, textAlign: 'center' }}>
                            <MoneyIcon sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
                            <Typography variant="h4" sx={{ fontWeight: 700, color: 'info.main' }}>
                                {expert.totalBookings}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Bookings
                            </Typography>
                        </Card>
                    </Grid>
                </Grid>

                {/* Reviews Section */}
                <Card sx={{ p: 4 }}>
                    <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
                        Reviews ({expert.reviewCount})
                    </Typography>

                    {reviews.length === 0 ? (
                        <Box sx={{ textAlign: 'center', py: 4 }}>
                            <Typography variant="body1" color="text.secondary">
                                No reviews yet. Be the first to book an appointment!
                            </Typography>
                        </Box>
                    ) : (
                        <Grid container spacing={3}>
                            {reviews.map((review) => (
                                <Grid size={{ xs: 12, md: 6 }} key={review.id}>
                                    <Card variant="outlined" sx={{ p: 3, height: '100%' }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                            <Box>
                                                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                                    {review.reviewer}
                                                </Typography>
                                                <Box sx={{ display: 'flex', gap: 0.5 }}>
                                                    {[...Array(5)].map((_, i) => (
                                                        <StarIcon
                                                            key={i}
                                                            sx={{
                                                                fontSize: 16,
                                                                color: i < review.rating ? 'warning.main' : 'text.disabled',
                                                            }}
                                                        />
                                                    ))}
                                                </Box>
                                            </Box>
                                            <Typography variant="body2" color="text.secondary">
                                                {review.timestamp}
                                            </Typography>
                                        </Box>

                                        <Typography variant="body2" color="text.secondary">
                                            {review.comment}
                                        </Typography>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    )}
                </Card>

                {/* CTA Section */}
                <Box sx={{ textAlign: 'center', mt: 4 }}>
                    <Button
                        variant="contained"
                        size="large"
                        sx={{
                            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                            '&:hover': {
                                background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                            },
                            fontWeight: 600,
                            borderRadius: 2,
                            px: 4,
                            py: 2,
                        }}
                    >
                        Book Appointment
                    </Button>
                </Box>
            </Container>
        </Box>
    );
};

export default ExpertProfile;



