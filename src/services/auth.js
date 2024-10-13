import { defaultAuthData } from '@/constants';

export const initializeAuth = () => {
  const authData = localStorage.getItem('auth');
  if (!authData) {
    localStorage.setItem('auth', JSON.stringify(defaultAuthData));
  }
};

export const getAuth = () => {
  const auth = JSON.parse(localStorage.getItem('auth') || '{}');
  const { isAuth, user } = auth;

  return { isAuth, user };
};
