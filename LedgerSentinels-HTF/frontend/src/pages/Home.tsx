import React from 'react';
import {
    Box,
    Typography,
    Button,
    Container,
    Grid,
    Card,
    CardContent,
    CardActions,
    Chip,
    useTheme,
    Fade,
} from '@mui/material';
import {
    Schedule as ScheduleIcon,
    Security as SecurityIcon,
    TrendingUp as TrendingUpIcon,
    People as PeopleIcon,
    Star as StarIcon,
    CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../contexts/WalletContext';

const Home: React.FC = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const { isConnected, chainId } = useWallet();

    const stats = [
        { label: 'Active Experts', value: '1,200+', icon: <PeopleIcon /> },
        { label: 'Bookings Made', value: '15,000+', icon: <ScheduleIcon /> },
        { label: 'Success Rate', value: '98.5%', icon: <TrendingUpIcon /> },
        { label: 'User Rating', value: '4.9/5', icon: <StarIcon /> },
    ];

    const features = [
        {
            title: 'Secure Booking',
            description: 'All appointments are secured with smart contracts and escrow payments.',
            icon: <SecurityIcon />,
            color: '#6366f1',
        },
        {
            title: 'Expert Verification',
            description: 'All experts are verified and rated by the community.',
            icon: <CheckCircleIcon />,
            color: '#10b981',
        },
        {
            title: 'Flexible Scheduling',
            description: 'Book appointments with verified experts in your preferred time slots.',
            icon: <ScheduleIcon />,
            color: '#f59e0b',
        },
        {
            title: 'Transparent Pricing',
            description: 'Clear pricing with no hidden fees. Pay only for what you book.',
            icon: <TrendingUpIcon />,
            color: '#8b5cf6',
        },
        {
            title: 'Community Driven',
            description: 'Built by the community, for the community. Decentralized and transparent.',
            icon: <PeopleIcon />,
            color: '#ef4444',
        },
        {
            title: 'Quality Assurance',
            description: 'Every expert is vetted and rated to ensure the highest quality service.',
            icon: <StarIcon />,
            color: '#06b6d4',
        },
    ];

    const isSepolia = chainId === 11155111;

    return (
        <Box>
            {/* Hero Section */}
            <Box
                sx={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    minHeight: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    position: 'relative',
                    overflow: 'hidden',
                }}
            >
                {/* Background Pattern */}
                <Box
                    sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'radial-gradient(circle at 20% 50%, rgba(120, 119, 198, 0.3) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.1) 0%, transparent 50%), radial-gradient(circle at 40% 80%, rgba(120, 119, 198, 0.2) 0%, transparent 50%)',
                    }}
                />

                <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
                    <Grid container spacing={6} alignItems="center">
                        <Grid item xs={12} md={6}>
                            <Fade in timeout={1000}>
                                <Box>
                                    <Typography
                                        variant="h1"
                                        sx={{
                                            fontWeight: 700,
                                            color: 'white',
                                            mb: 3,
                                            background: 'linear-gradient(135deg, #ffffff 0%, #e0e7ff 100%)',
                                            backgroundClip: 'text',
                                            WebkitBackgroundClip: 'text',
                                            WebkitTextFillColor: 'transparent',
                                        }}
                                    >
                                        Book Expert Appointments on Ethereum
                                    </Typography>

                                    <Typography
                                        variant="h5"
                                        sx={{
                                            color: 'rgba(255, 255, 255, 0.9)',
                                            mb: 4,
                                            lineHeight: 1.6,
                                        }}
                                    >
                                        Connect with verified experts, book time slots as NFTs, and pay securely through smart contracts.
                                        The future of appointment booking is here.
                                    </Typography>

                                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                                        <Button
                                            variant="contained"
                                            size="large"
                                            onClick={() => navigate('/marketplace')}
                                            sx={{
                                                background: 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)',
                                                color: 'white',
                                                px: 4,
                                                py: 2,
                                                fontSize: '1.1rem',
                                                fontWeight: 600,
                                                borderRadius: 3,
                                                boxShadow: '0 8px 25px rgba(245, 158, 11, 0.3)',
                                                '&:hover': {
                                                    background: 'linear-gradient(135deg, #d97706 0%, #ea580c 100%)',
                                                    boxShadow: '0 12px 35px rgba(245, 158, 11, 0.4)',
                                                    transform: 'translateY(-2px)',
                                                },
                                                transition: 'all 0.3s ease',
                                            }}
                                        >
                                            Browse Experts
                                        </Button>

                                        <Button
                                            variant="outlined"
                                            size="large"
                                            onClick={() => navigate('/signup')}
                                            sx={{
                                                borderColor: 'white',
                                                color: 'white',
                                                px: 4,
                                                py: 2,
                                                fontSize: '1.1rem',
                                                fontWeight: 600,
                                                borderRadius: 3,
                                                borderWidth: 2,
                                                '&:hover': {
                                                    borderColor: 'white',
                                                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                                    borderWidth: 2,
                                                },
                                            }}
                                        >
                                            Get Started
                                        </Button>
                                    </Box>
                                </Box>
                            </Fade>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <Fade in timeout={1500}>
                                <Box
                                    sx={{
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        minHeight: 400,
                                    }}
                                >
                                    <Box
                                        sx={{
                                            width: 300,
                                            height: 300,
                                            borderRadius: '50%',
                                            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.05) 100%)',
                                            backdropFilter: 'blur(10px)',
                                            border: '1px solid rgba(255, 255, 255, 0.1)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            animation: 'float 6s ease-in-out infinite',
                                            '@keyframes float': {
                                                '0%, 100%': { transform: 'translateY(0px)' },
                                                '50%': { transform: 'translateY(-20px)' },
                                            },
                                        }}
                                    >
                                        <ScheduleIcon sx={{ fontSize: 120, color: 'white', opacity: 0.8 }} />
                                    </Box>
                                </Box>
                            </Fade>
                        </Grid>
                    </Grid>
                </Container>
            </Box>

            {/* Stats Section */}
            <Box sx={{ py: 8, backgroundColor: 'background.paper' }}>
                <Container maxWidth="lg">
                    <Grid container spacing={4} justifyContent="center">
                        {stats.map((stat, index) => (
                            <Grid size={{ xs: 6, sm: 3 }} key={index}>
                                <Box
                                    sx={{
                                        textAlign: 'center',
                                        p: 3,
                                        borderRadius: 3,
                                        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%)',
                                        border: '1px solid rgba(99, 102, 241, 0.1)',
                                        transition: 'all 0.3s ease',
                                        '&:hover': {
                                            transform: 'translateY(-5px)',
                                            boxShadow: '0 10px 25px rgba(99, 102, 241, 0.15)',
                                        },
                                    }}
                                >
                                    <Box
                                        sx={{
                                            color: 'primary.main',
                                            mb: 2,
                                            display: 'flex',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        {stat.icon}
                                    </Box>
                                    <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main', mb: 1 }}>
                                        {stat.value}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {stat.label}
                                    </Typography>
                                </Box>
                            </Grid>
                        ))}
                    </Grid>
                </Container>
            </Box>

            {/* Features Section */}
            <Box sx={{ py: 8, backgroundColor: 'background.default' }}>
                <Container maxWidth="lg">
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
                            Why Choose Timely?
                        </Typography>
                        <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
                            Built on Ethereum blockchain, Timely offers secure, transparent, and decentralized appointment booking.
                        </Typography>
                    </Box>

                    <Grid container spacing={4}>
                        {features.map((feature, index) => (
                            <Grid size={{ xs: 12, md: 6, lg: 4 }} key={index}>
                                <Fade in timeout={1000 + index * 200}>
                                    <Card
                                        sx={{
                                            height: '100%',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            borderTop: `4px solid ${feature.color}`,
                                            '&:hover': {
                                                transform: 'translateY(-8px)',
                                                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
                                            },
                                            transition: 'all 0.3s ease',
                                        }}
                                    >
                                        <CardContent sx={{ flexGrow: 1, p: 3 }}>
                                            <Box
                                                sx={{
                                                    width: 60,
                                                    height: 60,
                                                    borderRadius: '50%',
                                                    background: `linear-gradient(135deg, ${feature.color}20 0%, ${feature.color}10 100%)`,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    mb: 3,
                                                    color: feature.color,
                                                }}
                                            >
                                                {feature.icon}
                                            </Box>
                                            <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
                                                {feature.title}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                {feature.description}
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Fade>
                            </Grid>
                        ))}
                    </Grid>
                </Container>
            </Box>

            {/* CTA Section */}
            <Box
                sx={{
                    py: 8,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    position: 'relative',
                    overflow: 'hidden',
                }}
            >
                <Box
                    sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'radial-gradient(circle at 30% 40%, rgba(255, 255, 255, 0.1) 0%, transparent 50%), radial-gradient(circle at 70% 60%, rgba(255, 255, 255, 0.05) 0%, transparent 50%)',
                    }}
                />

                <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
                    <Typography
                        variant="h2"
                        sx={{
                            fontWeight: 700,
                            color: 'white',
                            mb: 3,
                            background: 'linear-gradient(135deg, #ffffff 0%, #e0e7ff 100%)',
                            backgroundClip: 'text',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                        }}
                    >
                        Ready to Get Started?
                    </Typography>

                    <Typography
                        variant="h6"
                        sx={{
                            color: 'rgba(255, 255, 255, 0.9)',
                            mb: 4,
                            lineHeight: 1.6,
                        }}
                    >
                        Join thousands of users who are already booking appointments on the blockchain.
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap', mb: 4 }}>
                        <Button
                            variant="contained"
                            size="large"
                            onClick={() => navigate('/signup')}
                            sx={{
                                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                                color: 'white',
                                px: 4,
                                py: 2,
                                fontSize: '1.1rem',
                                fontWeight: 600,
                                borderRadius: 3,
                                boxShadow: '0 8px 25px rgba(99, 102, 241, 0.3)',
                                '&:hover': {
                                    background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                                    boxShadow: '0 12px 35px rgba(99, 102, 241, 0.4)',
                                    transform: 'translateY(-2px)',
                                },
                                transition: 'all 0.3s ease',
                            }}
                        >
                            Sign Up Now
                        </Button>

                        <Button
                            variant="outlined"
                            size="large"
                            onClick={() => navigate('/marketplace')}
                            sx={{
                                borderColor: 'white',
                                color: 'white',
                                px: 4,
                                py: 2,
                                fontSize: '1.1rem',
                                fontWeight: 600,
                                borderRadius: 3,
                                borderWidth: 2,
                                '&:hover': {
                                    borderColor: 'white',
                                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                    borderWidth: 2,
                                },
                            }}
                        >
                            Explore Marketplace
                        </Button>
                    </Box>

                    {/* Trust Indicators */}
                    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                        <Chip
                            label="🔒 Secure"
                            variant="outlined"
                            sx={{ color: 'white', borderColor: 'rgba(255, 255, 255, 0.3)' }}
                        />
                        <Chip
                            label="⚡ Fast"
                            variant="outlined"
                            sx={{ color: 'white', borderColor: 'rgba(255, 255, 255, 0.3)' }}
                        />
                        <Chip
                            label="🌐 Decentralized"
                            variant="outlined"
                            sx={{ color: 'white', borderColor: 'rgba(255, 255, 255, 0.3)' }}
                        />
                    </Box>
                </Container>
            </Box>
        </Box>
    );
};

export default Home;



