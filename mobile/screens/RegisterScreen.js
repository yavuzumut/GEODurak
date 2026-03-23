import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, SafeAreaView, ScrollView } from 'react-native';

export default function RegisterScreen({ onLogin, onBackToLogin }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  
  const [stations, setStations] = useState([]);
  const [selectedStationId, setSelectedStationId] = useState('');
  const [loading, setLoading] = useState(false);
  const [stationsLoading, setStationsLoading] = useState(true);

  useEffect(() => {
    fetch('http://192.168.1.10:3000/stations')
      .then(res => res.json())
      .then(data => {
        setStations(data);
        if (data.length > 0) setSelectedStationId(data[0].id);
        setStationsLoading(false);
      })
      .catch(e => {
        console.log(e);
        Alert.alert('Hata', 'Durak listesi alınamadı');
        setStationsLoading(false);
      });
  }, []);

  const handleRegister = async () => {
    if (!name || !phone || !password || !licensePlate || !selectedStationId) {
      Alert.alert('Eksik Bilgi', 'Lütfen tüm alanları doldurun');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('http://192.168.1.10:3000/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, password, licensePlate, stationId: selectedStationId }),
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || 'Kayıt yapılamadı');
      }

      // Automatically login
      onLogin(data);
    } catch (e) {
      Alert.alert('Kayıt Başarısız', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.backBtn} onPress={onBackToLogin}>
          <Text style={styles.backBtnText}>← Geri Dön</Text>
        </TouchableOpacity>

        <Text style={styles.title}>🚕 GeoDurak</Text>
        <Text style={styles.subtitle}>Sürücü Kaydı</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Ad Soyad</Text>
          <TextInput
            style={styles.input}
            placeholder="Ali Yılmaz"
            placeholderTextColor="#666"
            value={name}
            onChangeText={setName}
            editable={!loading}
          />
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
          <Text style={styles.label}>Plaka No</Text>
          <TextInput
            style={styles.input}
            placeholder="34 TXX 123"
            placeholderTextColor="#666"
            autoCapitalize="characters"
            value={licensePlate}
            onChangeText={setLicensePlate}
            editable={!loading}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Şifre Belirleyin</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor="#666"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            editable={!loading}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Bağlı Olduğunuz Durak</Text>
          {stationsLoading ? (
            <ActivityIndicator color="#FFC107" />
          ) : (
            <View style={styles.pickerContainer}>
              {stations.map(station => (
                <TouchableOpacity 
                  key={station.id} 
                  style={[styles.pickerItem, selectedStationId === station.id && styles.pickerItemActive]}
                  onPress={() => setSelectedStationId(station.id)}
                >
                  <Text style={[styles.pickerItemText, selectedStationId === station.id && styles.pickerItemTextActive]}>
                    {station.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <TouchableOpacity 
          style={[styles.btn, loading && styles.btnDisabled]} 
          onPress={handleRegister}
          disabled={loading || stationsLoading}
        >
          {loading ? (
            <ActivityIndicator color="#1a1a2e" />
          ) : (
            <Text style={styles.btnText}>Kayıt Ol ve Sisteme Gir</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  scrollContainer: { padding: 30, paddingBottom: 60 },
  backBtn: { alignSelf: 'flex-start', marginBottom: 20 },
  backBtnText: { color: '#FFC107', fontSize: 16, fontWeight: 'bold' },
  title: { fontSize: 32, fontWeight: 'bold', color: '#FFC107', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#aaa', textAlign: 'center', marginBottom: 30 },
  inputGroup: { marginBottom: 16 },
  label: { color: '#ccc', fontSize: 13, marginBottom: 8 },
  input: { 
    backgroundColor: '#0f0f23', color: '#fff', padding: 16, 
    borderRadius: 10, fontSize: 16, borderWidth: 1, borderColor: '#2a2a3e' 
  },
  pickerContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  pickerItem: { backgroundColor: '#0f0f23', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#2a2a3e' },
  pickerItemActive: { backgroundColor: '#FFC107', borderColor: '#FFC107' },
  pickerItemText: { color: '#ccc' },
  pickerItemTextActive: { color: '#1a1a2e', fontWeight: 'bold' },
  btn: { 
    backgroundColor: '#FFC107', padding: 16, borderRadius: 10, 
    alignItems: 'center', marginTop: 20 
  },
  btnDisabled: { opacity: 0.7 },
  btnText: { color: '#1a1a2e', fontSize: 16, fontWeight: 'bold' }
});
