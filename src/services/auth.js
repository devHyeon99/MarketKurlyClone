import { defaultAuthData } from '@/constants';

export const initializeAuth = () => {
  const authData = localStorage.getItem('auth');
  if (!authData) {
    localStorage.setItem('auth', JSON.stringify(defaultAuthData));
  }
};
