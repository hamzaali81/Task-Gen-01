import api from './axios';

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
}

export interface Workspace {
  id: string;
  name: string;
  role?: string;
}

export interface LoginResponse {
  access_token: string;
  user: User;
  workspaces: Workspace[];
}

export interface RegisterDto {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export const authService = {
  register: async (data: RegisterDto): Promise<LoginResponse> => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  login: async (data: LoginDto): Promise<LoginResponse> => {
    const response = await api.post('/auth/login', data);
    return response.data;
  },

  getProfile: async (): Promise<User> => {
    const response = await api.get('/auth/profile');
    return response.data;
  },
};
