import React, { useState } from 'react';
import {
    Box,
    Typography,
    TextField,
    Button,
    Card,
    CardContent,
    Container,
    Link,
    Alert,
    CircularProgress,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    FormControlLabel,
    Checkbox,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useWallet } from '../contexts/WalletContext';

const Signup: React.FC = () => {
    const navigate = useNavigate();
    const { signup, isLoading } = useAuth();
    const { isConnected } = useWallet();

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        userType: 'customer' as 'customer' | 'expert',
        profession: '',
        bio: '',
        agreeToTerms: false,
    });
    const [error, setError] = useState<string | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSelectChange = (e: any) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.checked,
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!formData.agreeToTerms) {
            setError('Please agree to the terms and conditions');
            return;
        }

        try {
            await signup(formData);
            navigate('/');
        } catch (err) {
            setError('Signup failed. Please try again.');
        }
    };

    if (!isConnected) {
        return (
            <Box
                sx={{
                    minHeight: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                }}
            >
                <Container maxWidth="sm">
                    <Card sx={{ p: 4 }}>
                        <Alert severity="info">
                            Please connect your wallet first to create an account.
                        </Alert>
                    </Card>
                </Container>
            </Box>
        );
    }

    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                py: 4,
            }}
        >
            <Container maxWidth="sm">
                <Card
                    sx={{
                        p: 4,
                        borderRadius: 3,
                        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
                    }}
                >
                    <CardContent>
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
                                Join Timely
                            </Typography>
                            <Typography variant="body1" color="text.secondary">
                                Create your account to start booking appointments
                            </Typography>
                        </Box>

                        {error && (
                            <Alert severity="error" sx={{ mb: 3 }}>
                                {error}
                            </Alert>
                        )}

                        <Box component="form" onSubmit={handleSubmit}>
                            <TextField
                                fullWidth
                                label="Full Name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                sx={{ mb: 3 }}
                            />

                            <TextField
                                fullWidth
                                label="Email"
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                sx={{ mb: 3 }}
                            />

                            <FormControl fullWidth sx={{ mb: 3 }}>
                                <InputLabel>Account Type</InputLabel>
                                <Select
                                    name="userType"
                                    value={formData.userType}
                                    label="Account Type"
                                    onChange={handleSelectChange}
                                >
                                    <MenuItem value="customer">Customer</MenuItem>
                                    <MenuItem value="expert">Expert</MenuItem>
                                </Select>
                            </FormControl>

                            {formData.userType === 'expert' && (
                                <>
                                    <TextField
                                        fullWidth
                                        label="Profession"
                                        name="profession"
                                        value={formData.profession}
                                        onChange={handleChange}
                                        required
                                        sx={{ mb: 3 }}
                                        placeholder="e.g., Doctor, Lawyer, Consultant"
                                    />

                                    <TextField
                                        fullWidth
                                        label="Bio"
                                        name="bio"
                                        value={formData.bio}
                                        onChange={handleChange}
                                        multiline
                                        rows={3}
                                        sx={{ mb: 3 }}
                                        placeholder="Tell us about yourself and your expertise"
                                    />
                                </>
                            )}

                            <FormControlLabel
                                control={
                                    <Checkbox
                                        name="agreeToTerms"
                                        checked={formData.agreeToTerms}
                                        onChange={handleCheckboxChange}
                                        required
                                    />
                                }
                                label={
                                    <Typography variant="body2" color="text.secondary">
                                        I agree to the{' '}
                                        <Link href="#" sx={{ color: 'primary.main' }}>
                                            Terms and Conditions
                                        </Link>{' '}
                                        and{' '}
                                        <Link href="#" sx={{ color: 'primary.main' }}>
                                            Privacy Policy
                                        </Link>
                                    </Typography>
                                }
                                sx={{ mb: 3 }}
                            />

                            <Button
                                type="submit"
                                fullWidth
                                variant="contained"
                                size="large"
                                disabled={isLoading}
                                sx={{
                                    mb: 3,
                                    py: 1.5,
                                    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                                    '&:hover': {
                                        background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                                    },
                                    fontWeight: 600,
                                    borderRadius: 2,
                                }}
                            >
                                {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Create Account'}
                            </Button>

                            <Box sx={{ textAlign: 'center' }}>
                                <Typography variant="body2" color="text.secondary">
                                    Already have an account?{' '}
                                    <Link
                                        component="button"
                                        type="button"
                                        onClick={() => navigate('/login')}
                                        sx={{
                                            color: 'primary.main',
                                            textDecoration: 'none',
                                            fontWeight: 600,
                                            '&:hover': {
                                                textDecoration: 'underline',
                                            },
                                        }}
                                    >
                                        Sign in here
                                    </Link>
                                </Typography>
                            </Box>
                        </Box>
                    </CardContent>
                </Card>
            </Container>
        </Box>
    );
};

export default Signup;



