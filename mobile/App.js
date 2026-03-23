import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import DriverScreen from './screens/DriverScreen';
import AdminScreen from './screens/AdminScreen';
import API_URL from './config';

export default function App() {
  const [user, setUser] = useState(null); // { role, accessToken }
  const [authLoading, setAuthLoading] = useState(true);
  const [authView, setAuthView] = useState('login'); // 'login' or 'register'

  useEffect(() => {
    checkToken();
  }, []);

  const checkToken = async () => {
    try {
      const refreshToken = await AsyncStorage.getItem('refreshToken');
      if (refreshToken) {
        const res = await fetch(`${API_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken })
        });
        if (res.ok) {
          const data = await res.json();
          await AsyncStorage.setItem('accessToken', data.accessToken);
          setUser({ role: data.role, accessToken: data.accessToken, userId: data.userId });
        } else {
          await AsyncStorage.multiRemove(['accessToken', 'refreshToken']);
        }
      }
    } catch (e) {
      console.log('Token check error', e);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogin = async (data) => {
    await AsyncStorage.setItem('accessToken', data.accessToken);
    await AsyncStorage.setItem('refreshToken', data.refreshToken);
    setUser({ role: data.role, accessToken: data.accessToken, userId: data.userId });
  };

  const handleLogout = async () => {
    await AsyncStorage.multiRemove(['accessToken', 'refreshToken']);
    setUser(null);
    setAuthView('login');
  };

  if (authLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#1a1a2e', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#FFC107" />
      </View>
    );
  }

  if (!user) {
    if (authView === 'register') {
      return <RegisterScreen onLogin={handleLogin} onBackToLogin={() => setAuthView('login')} />;
    }
    return <LoginScreen onLogin={handleLogin} onRegister={() => setAuthView('register')} />;
  }

  if (user.role === 'admin') {
    return <AdminScreen onLogout={handleLogout} token={user.accessToken} />;
  }

  return <DriverScreen onLogout={handleLogout} token={user.accessToken} userId={user.userId} />;
}
