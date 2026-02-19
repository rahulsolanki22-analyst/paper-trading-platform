import { login } from '../api/authApi';
import useAuthStore from '../store/authStore';

export const autoLoginDemo = async () => {
  try {
    const response = await login('demo', 'demo123');
    useAuthStore.getState().setAuth(response.access_token, {
      id: response.user_id,
      username: response.username
    });
    return response;
  } catch (error) {
    console.error('Auto-login failed:', error);
    throw error;
  }
};
