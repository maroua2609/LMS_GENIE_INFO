import api from '../api/config';
import { AuthResponse, User, LoginRequest, RegisterRequest } from '../types';

const authService = {
  async login(email: string, mot_de_passe: string): Promise<AuthResponse> {
    const response = await api.post('/auth/login', { email, mot_de_passe });
    return response.data;
  },

  async register(nom: string, prenom: string, email: string, mot_de_passe: string): Promise<AuthResponse> {
    const response = await api.post('/auth/register', {
      nom,
      prenom,
      email,
      mot_de_passe,
    });
    return response.data;
  },

  async getCurrentUser(): Promise<User> {
    const response = await api.get('/auth/me');
    return response.data;
  },

  async refreshToken(): Promise<AuthResponse> {
    const refresh_token = localStorage.getItem('refresh_token');
    const response = await api.post('/auth/refresh', { refresh_token });
    return response.data;
  },

  async logout(): Promise<void> {
    await api.post('/auth/logout');
  },
};

export default authService;
