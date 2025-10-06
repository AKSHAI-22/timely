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
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Chip,
    useTheme,
    CircularProgress,
    Alert,
} from '@mui/material';
import {
    Schedule as ScheduleIcon,
    Person as PersonIcon,
    AttachMoney as MoneyIcon,
    FilterList as FilterIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../contexts/WalletContext';
import { useAuth } from '../contexts/AuthContext';
import {
    getContract,
    CONTRACT_ADDRESSES,
    TimeSlotNFT_ABI,
    formatEther,
    formatAddress,
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

const Marketplace: React.FC = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const { provider, signer, isConnected } = useWallet();
    const { isAuthenticated } = useAuth();

    const [slots, setSlots] = useState<TimeSlot[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [professionFilter, setProfessionFilter] = useState('');
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');

    const professions = [
        'Doctor',
        'Lawyer',
        'Consultant',
        'Teacher',
        'Coach',
        'Designer',
        'Developer',
        'Other',
    ];

    useEffect(() => {
        if (isConnected && provider) {
            loadTimeSlots();
        }
    }, [isConnected, provider]);

    const loadTimeSlots = async () => {
        try {
            setLoading(true);
            setError(null);

            if (!provider) {
                throw new Error('Provider not available');
            }

            const contract = getContract(CONTRACT_ADDRESSES.TimeSlotNFT, TimeSlotNFT_ABI, provider);
            const totalSupply = await contract.totalSupply();

            const slotsData: TimeSlot[] = [];

            // Load first 20 slots for demo
            const maxSlots = Math.min(Number(totalSupply), 20);

            for (let i = 0; i < maxSlots; i++) {
                try {
                    const tokenId = await contract.tokenByIndex(i);
                    const slot = await contract.getTimeSlot(tokenId);
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
                } catch (err) {
                    console.warn(`Failed to load slot ${i}:`, err);
                }
            }

            setSlots(slotsData);
        } catch (err) {
            console.error('Failed to load time slots:', err);
            setError('Failed to load time slots. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleBookSlot = async (tokenId: bigint, price: bigint) => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }

        if (!signer) {
            setError('Please connect your wallet to book a slot');
            return;
        }

        try {
            const contract = getContract(CONTRACT_ADDRESSES.TimeSlotNFT, TimeSlotNFT_ABI, signer);
            const tx = await contract.bookSlot(tokenId, { value: price });
            await tx.wait();

            // Reload slots
            loadTimeSlots();

            navigate(`/booking/${tokenId.toString()}`);
        } catch (err) {
            console.error('Failed to book slot:', err);
            setError('Failed to book slot. Please try again.');
        }
    };

    const filteredSlots = slots.filter(slot => {
        const matchesSearch = slot.profession.toLowerCase().includes(searchTerm.toLowerCase()) ||
            slot.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesProfession = !professionFilter || slot.profession === professionFilter;
        const matchesMinPrice = !minPrice || Number(formatEther(slot.price)) >= Number(minPrice);
        const matchesMaxPrice = !maxPrice || Number(formatEther(slot.price)) <= Number(maxPrice);

        return matchesSearch && matchesProfession && matchesMinPrice && matchesMaxPrice;
    });

    if (!isConnected) {
        return (
            <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Alert severity="info" sx={{ maxWidth: 400 }}>
                    Please connect your wallet to view the marketplace.
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
                        Expert Marketplace
                    </Typography>
                    <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
                        Discover and book appointments with verified experts. All transactions are secured on the blockchain.
                    </Typography>
                </Box>

                {/* Filters */}
                <Card sx={{ mb: 4, p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                        <FilterIcon sx={{ mr: 1, color: 'primary.main' }} />
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            Filter & Search
                        </Typography>
                    </Box>

                    <Grid container spacing={3} alignItems="center">
                        <Grid item xs={12} sm={6} md={3}>
                            <TextField
                                fullWidth
                                label="Search"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search by profession or description"
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: 2,
                                    },
                                }}
                            />
                        </Grid>

                        <Grid item xs={12} sm={6} md={3}>
                            <FormControl fullWidth>
                                <InputLabel>Profession</InputLabel>
                                <Select
                                    value={professionFilter}
                                    label="Profession"
                                    onChange={(e) => setProfessionFilter(e.target.value)}
                                    sx={{
                                        borderRadius: 2,
                                    }}
                                >
                                    <MenuItem value="">All Professions</MenuItem>
                                    {professions.map((prof) => (
                                        <MenuItem key={prof} value={prof}>
                                            {prof}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12} sm={6} md={3}>
                            <TextField
                                fullWidth
                                label="Min Price (ETH)"
                                type="number"
                                value={minPrice}
                                onChange={(e) => setMinPrice(e.target.value)}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: 2,
                                    },
                                }}
                            />
                        </Grid>

                        <Grid item xs={12} sm={6} md={3}>
                            <TextField
                                fullWidth
                                label="Max Price (ETH)"
                                type="number"
                                value={maxPrice}
                                onChange={(e) => setMaxPrice(e.target.value)}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: 2,
                                    },
                                }}
                            />
                        </Grid>
                    </Grid>
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

                {/* Time Slots Grid */}
                {!loading && (
                    <Grid container spacing={3}>
                        {filteredSlots.length === 0 ? (
                            <Grid item xs={12}>
                                <Box sx={{ textAlign: 'center', py: 8 }}>
                                    <Typography variant="h6" color="text.secondary">
                                        No time slots found matching your criteria.
                                    </Typography>
                                </Box>
                            </Grid>
                        ) : (
                            filteredSlots.map((slot) => {
                                const status = getSlotStatus(slot);
                                const statusColor = getSlotStatusColor(status);
                                const statusText = getSlotStatusText(status);

                                return (
                                    <Grid item xs={12} md={6} lg={4} key={slot.tokenId.toString()}>
                                        <Card
                                            sx={{
                                                height: '100%',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                borderTop: `4px solid ${status === 'available' ? theme.palette.success.main :
                                                        status === 'booked' ? theme.palette.info.main :
                                                            theme.palette.error.main
                                                    }`,
                                                '&:hover': {
                                                    transform: 'translateY(-4px)',
                                                    boxShadow: '0 12px 24px rgba(0, 0, 0, 0.15)',
                                                },
                                                transition: 'all 0.3s ease',
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
                                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                        <ScheduleIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                                                        <Typography variant="body2" color="text.secondary">
                                                            {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                                                        </Typography>
                                                    </Box>

                                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                        <PersonIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                                                        <Typography variant="body2" color="text.secondary">
                                                            Expert: {formatAddress(slot.expert)}
                                                        </Typography>
                                                    </Box>

                                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                        <MoneyIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                                                        <Typography
                                                            variant="h6"
                                                            sx={{
                                                                fontWeight: 600,
                                                                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                                                                backgroundClip: 'text',
                                                                WebkitBackgroundClip: 'text',
                                                                WebkitTextFillColor: 'transparent',
                                                            }}
                                                        >
                                                            {formatEther(slot.price)} ETH
                                                        </Typography>
                                                    </Box>
                                                </Box>

                                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                                    {slot.description || 'No description provided.'}
                                                </Typography>
                                            </CardContent>

                                            <CardActions sx={{ p: 3, pt: 0 }}>
                                                <Button
                                                    variant="contained"
                                                    fullWidth
                                                    onClick={() => handleBookSlot(slot.tokenId, slot.price)}
                                                    disabled={status !== 'available'}
                                                    sx={{
                                                        background: status === 'available'
                                                            ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'
                                                            : 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)',
                                                        '&:hover': {
                                                            background: status === 'available'
                                                                ? 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)'
                                                                : 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)',
                                                        },
                                                        fontWeight: 600,
                                                        borderRadius: 2,
                                                    }}
                                                >
                                                    {status === 'available' ? 'Book Slot' : statusText}
                                                </Button>
                                            </CardActions>
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

export default Marketplace;



