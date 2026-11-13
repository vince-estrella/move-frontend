// Login / logout through the MOVE backend. Passwords are checked and hashed on the server.
import { getSession, setSession } from './db';
import { apiLogin, apiSignup, setToken, syncFromApi } from './api';

export async function signup({ name, email, password }) {
  if (!email.trim() || !password) throw new Error('Enter your email and a password.');
  if (password.length < 6) throw new Error('Password needs at least 6 characters.');
  await apiSignup({ name, email, password });
  syncFromApi().catch(() => {});
}

export async function login({ email, password }) {
  await apiLogin({ email, password });
  syncFromApi().catch(() => {});
}

export const logout = () => {
  setToken(null);
  setSession(null);
};
export const isLoggedIn = () => !!getSession();
