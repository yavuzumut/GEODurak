import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const API_URL = 'https://example.com/api'; // Replace with your API URL

class AuthService {
  async login(username, password) {
    try {
      const response = await axios.post(`${API_URL}/login`, { username, password });
      const { token } = response.data;
      await this.storeToken(token);
      return token;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async refreshToken() {
    try {
      const response = await axios.post(`${API_URL}/refresh`);
      const { token } = response.data;
      await this.storeToken(token);
      return token;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async logout() {
    try {
      await AsyncStorage.removeItem('token');
    } catch (error) {
      throw new Error('Error during logout');
    }
  }

  async retrieveToken() {
    try {
      const token = await AsyncStorage.getItem('token');
      return token;
    } catch (error) {
      throw new Error('Error retrieving token');
    }
  }

  async storeToken(token) {
    try {
      await AsyncStorage.setItem('token', token);
    } catch (error) {
      throw new Error('Error storing token');
    }
  }

  handleError(error) {
    if (error.response) {
      // The request was made and the server responded with a status code
      return new Error(`Error: ${error.response.data.message} (Status: ${error.response.status})`);
    } else if (error.request) {
      // The request was made but no response was received
      return new Error('Error: Network error, no response from server');
    } else {
      // Something happened in setting up the request that triggered an error
      return new Error(`Error: ${error.message}`);
    }
  }
}

export default new AuthService();