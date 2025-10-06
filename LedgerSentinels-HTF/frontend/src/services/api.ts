const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

interface ApiResponse<T = any> {
    success: boolean;
    message?: string;
    data?: T;
    error?: string;
}

interface User {
    id: string;
    address: string;
    name: string;
    email: string;
    userType: 'customer' | 'expert';
    isExpert: boolean;
    isVerified: boolean;
    isActive: boolean;
    profileImage?: string;
    bio?: string;
    profession?: string;
}

interface LoginRequest {
    email: string;
    password: string;
    walletAddress?: string;
    signature?: string;
}

interface RegisterRequest {
    name: string;
    email: string;
    password: string;
    userType: 'customer' | 'expert';
    walletAddress?: string;
    profession?: string;
    bio?: string;
}

class ApiService {
    private baseURL: string;
    private token: string | null = null;

    constructor() {
        this.baseURL = API_BASE_URL;
        this.token = localStorage.getItem('authToken');
    }

    private async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<ApiResponse<T>> {
        const url = `${this.baseURL}${endpoint}`;

        const config: RequestInit = {
            headers: {
                'Content-Type': 'application/json',
                ...(this.token && { Authorization: `Bearer ${this.token}` }),
                ...options.headers,
            },
            ...options,
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Request failed');
            }

            return data;
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    // Authentication methods
    async login(credentials: LoginRequest): Promise<{ user: User; token: string; refreshToken: string }> {
        const response = await this.request<{ user: User; token: string; refreshToken: string }>(
            '/api/auth/login',
            {
                method: 'POST',
                body: JSON.stringify(credentials),
            }
        );

        if (response.success && response.data) {
            this.token = response.data.token;
            localStorage.setItem('authToken', response.data.token);
            localStorage.setItem('refreshToken', response.data.refreshToken);
            return response.data;
        }

        throw new Error(response.message || 'Login failed');
    }

    async register(userData: RegisterRequest): Promise<{ user: User; token: string; refreshToken: string }> {
        const response = await this.request<{ user: User; token: string; refreshToken: string }>(
            '/api/auth/register',
            {
                method: 'POST',
                body: JSON.stringify(userData),
            }
        );

        if (response.success && response.data) {
            this.token = response.data.token;
            localStorage.setItem('authToken', response.data.token);
            localStorage.setItem('refreshToken', response.data.refreshToken);
            return response.data;
        }

        throw new Error(response.message || 'Registration failed');
    }

    async logout(): Promise<void> {
        const refreshToken = localStorage.getItem('refreshToken');

        try {
            await this.request('/api/auth/logout', {
                method: 'POST',
                body: JSON.stringify({ refreshToken }),
            });
        } catch (error) {
            console.warn('Logout request failed:', error);
        } finally {
            this.token = null;
            localStorage.removeItem('authToken');
            localStorage.removeItem('refreshToken');
        }
    }

    async refreshToken(): Promise<{ token: string; refreshToken: string }> {
        const refreshToken = localStorage.getItem('refreshToken');

        if (!refreshToken) {
            throw new Error('No refresh token available');
        }

        const response = await this.request<{ token: string; refreshToken: string }>(
            '/api/auth/refresh-token',
            {
                method: 'POST',
                body: JSON.stringify({ refreshToken }),
            }
        );

        if (response.success && response.data) {
            this.token = response.data.token;
            localStorage.setItem('authToken', response.data.token);
            localStorage.setItem('refreshToken', response.data.refreshToken);
            return response.data;
        }

        throw new Error(response.message || 'Token refresh failed');
    }

    async getProfile(): Promise<User> {
        const response = await this.request<{ user: User }>('/api/auth/profile');

        if (response.success && response.data) {
            return response.data.user;
        }

        throw new Error(response.message || 'Failed to fetch profile');
    }

    async updateProfile(userData: Partial<User>): Promise<User> {
        const response = await this.request<{ user: User }>('/api/auth/profile', {
            method: 'PUT',
            body: JSON.stringify(userData),
        });

        if (response.success && response.data) {
            return response.data.user;
        }

        throw new Error(response.message || 'Profile update failed');
    }

    // Time slot methods
    async getTimeSlots(): Promise<any[]> {
        const response = await this.request<{ timeSlots: any[] }>('/api/time-slots');

        if (response.success && response.data) {
            return response.data.timeSlots;
        }

        throw new Error(response.message || 'Failed to fetch time slots');
    }

    async createTimeSlot(timeSlotData: any): Promise<any> {
        const response = await this.request<{ timeSlot: any }>('/api/time-slots', {
            method: 'POST',
            body: JSON.stringify(timeSlotData),
        });

        if (response.success && response.data) {
            return response.data.timeSlot;
        }

        throw new Error(response.message || 'Failed to create time slot');
    }

    async bookTimeSlot(tokenId: string, bookingData: any): Promise<any> {
        const response = await this.request<{ booking: any }>(`/api/time-slots/${tokenId}/book`, {
            method: 'POST',
            body: JSON.stringify(bookingData),
        });

        if (response.success && response.data) {
            return response.data.booking;
        }

        throw new Error(response.message || 'Failed to book time slot');
    }

    // Expert methods
    async getExpertProfile(expertAddress: string): Promise<any> {
        const response = await this.request<{ expert: any }>(`/api/expert/${expertAddress}`);

        if (response.success && response.data) {
            return response.data.expert;
        }

        throw new Error(response.message || 'Failed to fetch expert profile');
    }

    async createExpertProfile(profileData: any): Promise<any> {
        const response = await this.request<{ expert: any }>('/api/expert/profile', {
            method: 'POST',
            body: JSON.stringify(profileData),
        });

        if (response.success && response.data) {
            return response.data.expert;
        }

        throw new Error(response.message || 'Failed to create expert profile');
    }

    async updateExpertProfile(profileData: any): Promise<any> {
        const response = await this.request<{ expert: any }>('/api/expert/profile', {
            method: 'PUT',
            body: JSON.stringify(profileData),
        });

        if (response.success && response.data) {
            return response.data.expert;
        }

        throw new Error(response.message || 'Failed to update expert profile');
    }

    // Health check
    async healthCheck(): Promise<{ status: string; version: string }> {
        const response = await this.request<{ status: string; version: string }>('/api/health');

        if (response.success && response.data) {
            return response.data;
        }

        throw new Error('Health check failed');
    }

    // Set token manually (for wallet-based auth)
    setToken(token: string) {
        this.token = token;
        localStorage.setItem('authToken', token);
    }

    // Clear token
    clearToken() {
        this.token = null;
        localStorage.removeItem('authToken');
        localStorage.removeItem('refreshToken');
    }
}

export const apiService = new ApiService();
export default apiService;
