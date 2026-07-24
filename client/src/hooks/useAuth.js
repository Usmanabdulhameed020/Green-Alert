import { useCitizen } from '../contexts/CitizenContext';

export function useAuth() {
  const { user, logout, login, register, loading, token } = useCitizen();
  return {
    user,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isAgency: user?.role === 'agency',
    isCitizen: user?.role === 'citizen',
    logout,
    login,
    register,
    loading,
    token,
  };
}
