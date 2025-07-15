import { ACCESS_TOKEN, REFRESH_TOKEN } from "@/constants";
import api from "./api";


export const login = async (username:string, password:string) => {
  try {
    const { data } = await api.post('/api/auth/token/', { username, password });
    // Store tokens
    localStorage.setItem(ACCESS_TOKEN, data.access);
    localStorage.setItem(REFRESH_TOKEN, data.refresh);
    if(data) window.location.href ='/'
    return data;
  } catch (error:any) {
    const errorMessage = error.response?.data?.detail || 'Login failed';
    console.error(errorMessage)
  }
};

export const refreshToken = async () => {
  try {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN);
    if (!refreshToken) throw new Error('No refresh token available');
    
    const { data } = await api.post('/api/auth/token/refresh/', { refresh: refreshToken });
    
    // Update stored access token
    localStorage.setItem(ACCESS_TOKEN, data.access);
    
    return data;
  } catch (error:any) {
    const errorMessage = error.response?.data?.detail || 'Token refresh failed';
    throw new Error(errorMessage);
  }
};

export const register = async (username:string, email:string, password:string, password2:string, firstName = '', lastName = '') => {
  try {
    const { data } = await api.post<User>('/api/auth/register/', {
      username,
      email,
      password,
      password2,
      first_name: firstName,
      last_name: lastName
    });

    return data;
  } catch (error:any) {
     console.log(error)
    }
};

// export const verifyEmail = async (key:string) => {
//   try {
//     const { data } = await api.post('/auth/registration/verify-email/', { key });
//     return data;
//   } catch (error) {
//     const errorMessage = error.response?.data?.detail || 'Email verification failed';
//     throw new Error(errorMessage);
//   }
// };

export const logout = () => {
  localStorage.removeItem(ACCESS_TOKEN);
  localStorage.removeItem(REFRESH_TOKEN);
  delete api.defaults.headers.Authorization;
};

export const getCurrentUser = async () => {
  try {
    const { data } = await api.get('/api/auth/user/');
    return data;
  } catch (error) {
    
    throw new Error('Failed to fetch user data');
  }
};

export default api;