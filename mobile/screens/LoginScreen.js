import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, SafeAreaView } from 'react-native';

export default function LoginScreen({ onLogin, onRegister }) {
  const [role, setRole] = useState('driver'); // 'driver' | 'admin'
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!phone || !password) {
      Alert.alert('Hata', 'Lütfen telefon ve şifre girin');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('http://192.168.1.10:3000/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password }),
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || 'Giriş yapılamadı');
      }

      if (data.role !== role) {
        throw new Error(role === 'driver' ? 'Sadece sürücüler bu bölümden girebilir' : 'Sadece yöneticiler bu bölümden girebilir');
      }

      onLogin(data);
    } catch (e) {
      Alert.alert('Giriş Başarısız', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.formContainer}>
        <Text style={styles.title}>🚕 GeoDurak</Text>
        <Text style={styles.subtitle}>Giriş Yap</Text>

        <View style={styles.roleTabs}>
          <TouchableOpacity 
            style={[styles.roleTab, role === 'driver' && styles.roleTabActive]}
            onPress={() => setRole('driver')}
          >
            <Text style={role === 'driver' ? styles.roleTabTextActive : styles.roleTabText}>Sürücü</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.roleTab, role === 'admin' && styles.roleTabActive]}
            onPress={() => setRole('admin')}
          >
            <Text style={role === 'admin' ? styles.roleTabTextActive : styles.roleTabText}>Yönetici</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Telefon Numarası</Text>
          <TextInput
            style={styles.input}
            placeholder="05XX XXX XX XX"
            placeholderTextColor="#666"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
            editable={!loading}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Şifre</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="••••••••"
              placeholderTextColor="#666"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
              editable={!loading}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
              <Text style={{color: '#aaa'}}>{showPassword ? 'Gizle' : 'Göster'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.btn, loading && styles.btnDisabled]} 
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>{role === 'admin' ? 'Yönetici Olarak Giriş Yap' : 'Giriş Yap'}</Text>
          )}
        </TouchableOpacity>
        
        {role === 'driver' && (
          <TouchableOpacity style={{marginTop: 24, alignItems: 'center'}} onPress={onRegister}>
            <Text style={{color: '#aaa', fontSize: 14}}>Hesabınız yok mu? <Text style={{color: '#FFC107', fontWeight: 'bold'}}>Kayıt Ol</Text></Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e', justifyContent: 'center' },
  formContainer: { padding: 30 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#FFC107', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#aaa', textAlign: 'center', marginBottom: 20 },
  roleTabs: { flexDirection: 'row', backgroundColor: '#0f0f23', borderRadius: 10, padding: 4, marginBottom: 24, borderWidth: 1, borderColor: '#2a2a3e' },
  roleTab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 8 },
  roleTabActive: { backgroundColor: '#FFC107' },
  roleTabText: { color: '#888', fontWeight: 'bold' },
  roleTabTextActive: { color: '#1a1a2e', fontWeight: 'bold' },
  inputGroup: { marginBottom: 20 },
  label: { color: '#ccc', fontSize: 13, marginBottom: 8 },
  input: { 
    backgroundColor: '#0f0f23', color: '#fff', padding: 16, 
    borderRadius: 10, fontSize: 16, borderWidth: 1, borderColor: '#2a2a3e' 
  },
  passwordContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#0f0f23', borderRadius: 10, borderWidth: 1, borderColor: '#2a2a3e' 
  },
  passwordInput: { flex: 1, color: '#fff', padding: 16, fontSize: 16 },
  eyeBtn: { padding: 16 },
  btn: { 
    backgroundColor: '#FFC107', padding: 16, borderRadius: 10, 
    alignItems: 'center', marginTop: 10 
  },
  btnDisabled: { opacity: 0.7 },
  btnText: { color: '#1a1a2e', fontSize: 16, fontWeight: 'bold' }
});
