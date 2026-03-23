import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const CREDENTIALS_KEY = 'user_credentials';

const setTokens = async (accessToken, refreshToken) => {
    await AsyncStorage.setItem(TOKEN_KEY, accessToken);
    await AsyncStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
};

const getAccessToken = async () => {
    return await AsyncStorage.getItem(TOKEN_KEY);
};

const getRefreshToken = async () => {
    return await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
};

const clearTokens = async () => {
    await AsyncStorage.removeItem(TOKEN_KEY);
    await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
    await AsyncStorage.removeItem(CREDENTIALS_KEY);
};

const isTokenExpired = async () => {
    const token = await getAccessToken();
    if (!token) return true;
    // Implement logic to check token expiry 
    // For example, decode the token and check exp claim
    return false; // Placeholder
};

export { setTokens, getAccessToken, getRefreshToken, clearTokens, isTokenExpired };