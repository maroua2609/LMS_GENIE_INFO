import { useState, useEffect } from 'react';
import api from '../api/config';
import { User, LoginResponse } from '../types';

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (nom: string, prenom: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const useAuth = (): AuthState => {
  const [authState, setAuthState] = useState<{
    isAuthenticated: boolean;
    user: User | null;
    isLoading: boolean;
  }>({
    isAuthenticated: false,
    user: null,
    isLoading: true,
  });

  // Vérifier si l'utilisateur est déjà connecté au chargement
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const userStr = localStorage.getItem('user');

    if (token && userStr) {
      try {
        const user: User = JSON.parse(userStr);
        setAuthState({
          isAuthenticated: true,
          user,
          isLoading: false,
        });
      } catch {
        localStorage.removeItem('user');
        localStorage.removeItem('access_token');
        setAuthState({
          isAuthenticated: false,
          user: null,
          isLoading: false,
        });
      }
    } else {
      setAuthState({
        isAuthenticated: false,
        user: null,
        isLoading: false,
      });
    }
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    const response = await api.post<LoginResponse>('/auth/login', {
      email,
      mot_de_passe: password,
    });

    localStorage.setItem('access_token', response.data.access_token);
    localStorage.setItem('refresh_token', response.data.refresh_token);

    // Récupérer les infos utilisateur
    const userRes = await api.get<User>('/auth/me');
    localStorage.setItem('user', JSON.stringify(userRes.data));
    localStorage.setItem('user_role', userRes.data.role);

    setAuthState({
      isAuthenticated: true,
      user: userRes.data,
      isLoading: false,
    });
  };

  const register = async (
    nom: string,
    prenom: string,
    email: string,
    password: string
  ): Promise<void> => {
    // Appel API pour créer un compte
    await api.post('/auth/register', {
      nom,
      prenom,
      email,
      mot_de_passe: password,
      role: 'etudiant',
    });

    // Connexion automatique après inscription
    await login(email, password);
  };

  const logout = (): void => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    localStorage.removeItem('user_role');
    setAuthState({
      isAuthenticated: false,
      user: null,
      isLoading: false,
    });
  };

  return {
    ...authState,
    login,
    register,
    logout,
  };
};