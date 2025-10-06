import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
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
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
} from '@mui/material';
import {
    Add as AddIcon,
    Schedule as ScheduleIcon,
    AttachMoney as MoneyIcon,
    People as PeopleIcon,
    Star as StarIcon,
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

const ExpertDashboard: React.FC = () => {
    const theme = useTheme();
    const { user } = useAuth();
    const { signer, isConnected } = useWallet();

    const [slots, setSlots] = useState<TimeSlot[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [newSlot, setNewSlot] = useState({
        startTime: '',
        endTime: '',
        price: '',
        profession: '',
        description: '',
    });

    useEffect(() => {
        if (isConnected && signer) {
            loadMySlots();
        }
    }, [isConnected, signer]);

    const loadMySlots = async () => {
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

                    if (slot.expert.toLowerCase() === user?.address.toLowerCase()) {
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
            console.error('Failed to load slots:', err);
            setError('Failed to load your time slots. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateSlot = async () => {
        if (!signer) {
            setError('Please connect your wallet to create a slot');
            return;
        }

        try {
            const contract = getContract(CONTRACT_ADDRESSES.TimeSlotNFT, TimeSlotNFT_ABI, signer);

            const startTime = Math.floor(new Date(newSlot.startTime).getTime() / 1000);
            const endTime = Math.floor(new Date(newSlot.endTime).getTime() / 1000);
            const price = ethers.parseEther(newSlot.price);

            const tx = await contract.createTimeSlot(
                startTime,
                endTime,
                price,
                newSlot.profession,
                newSlot.description
            );

            await tx.wait();

            // Reset form and close dialog
            setNewSlot({
                startTime: '',
                endTime: '',
                price: '',
                profession: '',
                description: '',
            });
            setCreateDialogOpen(false);

            // Reload slots
            loadMySlots();
        } catch (err) {
            console.error('Failed to create slot:', err);
            setError('Failed to create time slot. Please try again.');
        }
    };

    const handleRevokeSlot = async (tokenId: bigint) => {
        if (!signer) {
            setError('Please connect your wallet to revoke a slot');
            return;
        }

        try {
            const contract = getContract(CONTRACT_ADDRESSES.TimeSlotNFT, TimeSlotNFT_ABI, signer);
            const tx = await contract.revokeSlot(tokenId);
            await tx.wait();

            // Reload slots
            loadMySlots();
        } catch (err) {
            console.error('Failed to revoke slot:', err);
            setError('Failed to revoke time slot. Please try again.');
        }
    };

    const stats = {
        totalSlots: slots.length,
        bookedSlots: slots.filter(slot => slot.isBooked).length,
        availableSlots: slots.filter(slot => !slot.isBooked && !slot.isRevoked).length,
        totalEarnings: slots
            .filter(slot => slot.isBooked)
            .reduce((sum, slot) => sum + Number(formatEther(slot.price)), 0),
    };

    if (!isConnected) {
        return (
            <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Alert severity="info" sx={{ maxWidth: 400 }}>
                    Please connect your wallet to access the expert dashboard.
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
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                    <Box>
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
                            Expert Dashboard
                        </Typography>
                        <Typography variant="h6" color="text.secondary">
                            Manage your time slots and appointments
                        </Typography>
                    </Box>

                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => setCreateDialogOpen(true)}
                        sx={{
                            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                            '&:hover': {
                                background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                            },
                            fontWeight: 600,
                            borderRadius: 2,
                        }}
                    >
                        Create Slot
                    </Button>
                </Box>

                {/* Stats */}
                <Grid container spacing={3} sx={{ mb: 4 }}>
                    <Grid item xs={6} md={3}>
                        <Card sx={{ p: 3, textAlign: 'center' }}>
                            <ScheduleIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                            <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                                {stats.totalSlots}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Total Slots
                            </Typography>
                        </Card>
                    </Grid>

                    <Grid item xs={6} md={3}>
                        <Card sx={{ p: 3, textAlign: 'center' }}>
                            <PeopleIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
                            <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>
                                {stats.bookedSlots}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Booked Slots
                            </Typography>
                        </Card>
                    </Grid>

                    <Grid item xs={6} md={3}>
                        <Card sx={{ p: 3, textAlign: 'center' }}>
                            <StarIcon sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
                            <Typography variant="h4" sx={{ fontWeight: 700, color: 'info.main' }}>
                                {stats.availableSlots}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Available Slots
                            </Typography>
                        </Card>
                    </Grid>

                    <Grid item xs={6} md={3}>
                        <Card sx={{ p: 3, textAlign: 'center' }}>
                            <MoneyIcon sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
                            <Typography variant="h4" sx={{ fontWeight: 700, color: 'warning.main' }}>
                                {stats.totalEarnings.toFixed(2)}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Total Earnings (ETH)
                            </Typography>
                        </Card>
                    </Grid>
                </Grid>

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

                {/* Time Slots */}
                {!loading && (
                    <Grid container spacing={3}>
                        {slots.length === 0 ? (
                            <Grid item xs={12}>
                                <Card sx={{ p: 6, textAlign: 'center' }}>
                                    <ScheduleIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
                                    <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
                                        No time slots created yet
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                        Create your first time slot to start accepting appointments
                                    </Typography>
                                    <Button
                                        variant="contained"
                                        startIcon={<AddIcon />}
                                        onClick={() => setCreateDialogOpen(true)}
                                        sx={{
                                            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                                            '&:hover': {
                                                background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                                            },
                                            fontWeight: 600,
                                            borderRadius: 2,
                                        }}
                                    >
                                        Create Your First Slot
                                    </Button>
                                </Card>
                            </Grid>
                        ) : (
                            slots.map((slot) => {
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
                                                    {slot.isBooked && (
                                                        <Typography variant="body2" color="text.secondary">
                                                            <strong>Booked by:</strong> {slot.bookedBy.slice(0, 6)}...{slot.bookedBy.slice(-4)}
                                                        </Typography>
                                                    )}
                                                </Box>

                                                <Typography variant="body2" color="text.secondary">
                                                    {slot.description || 'No description provided.'}
                                                </Typography>
                                            </CardContent>

                                            <Box sx={{ p: 3, pt: 0 }}>
                                                {status === 'available' && (
                                                    <Button
                                                        variant="outlined"
                                                        color="error"
                                                        fullWidth
                                                        onClick={() => handleRevokeSlot(slot.tokenId)}
                                                        sx={{ fontWeight: 600, borderRadius: 2 }}
                                                    >
                                                        Revoke Slot
                                                    </Button>
                                                )}
                                            </Box>
                                        </Card>
                                    </Grid>
                                );
                            })
                        )}
                    </Grid>
                )}

                {/* Create Slot Dialog */}
                <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
                    <DialogTitle>Create New Time Slot</DialogTitle>
                    <DialogContent>
                        <Box sx={{ pt: 2 }}>
                            <TextField
                                fullWidth
                                label="Start Time"
                                type="datetime-local"
                                value={newSlot.startTime}
                                onChange={(e) => setNewSlot({ ...newSlot, startTime: e.target.value })}
                                sx={{ mb: 3 }}
                                InputLabelProps={{ shrink: true }}
                            />

                            <TextField
                                fullWidth
                                label="End Time"
                                type="datetime-local"
                                value={newSlot.endTime}
                                onChange={(e) => setNewSlot({ ...newSlot, endTime: e.target.value })}
                                sx={{ mb: 3 }}
                                InputLabelProps={{ shrink: true }}
                            />

                            <TextField
                                fullWidth
                                label="Price (ETH)"
                                type="number"
                                value={newSlot.price}
                                onChange={(e) => setNewSlot({ ...newSlot, price: e.target.value })}
                                sx={{ mb: 3 }}
                                inputProps={{ step: "0.001" }}
                            />

                            <TextField
                                fullWidth
                                label="Profession"
                                value={newSlot.profession}
                                onChange={(e) => setNewSlot({ ...newSlot, profession: e.target.value })}
                                sx={{ mb: 3 }}
                                placeholder="e.g., Doctor, Lawyer, Consultant"
                            />

                            <TextField
                                fullWidth
                                label="Description"
                                multiline
                                rows={3}
                                value={newSlot.description}
                                onChange={(e) => setNewSlot({ ...newSlot, description: e.target.value })}
                                placeholder="Describe your service and what clients can expect"
                            />
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
                        <Button
                            onClick={handleCreateSlot}
                            variant="contained"
                            sx={{
                                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                                '&:hover': {
                                    background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                                },
                                fontWeight: 600,
                            }}
                        >
                            Create Slot
                        </Button>
                    </DialogActions>
                </Dialog>
            </Container>
        </Box>
    );
};

export default ExpertDashboard;



