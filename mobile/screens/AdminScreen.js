import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, Platform, SafeAreaView, ScrollView, StatusBar, TextInput, Modal, ActivityIndicator } from 'react-native';
import { io } from 'socket.io-client';
import MapView, { Marker, Polygon } from 'react-native-maps';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://192.168.1.10:3000';
const STATION_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
const GEOFENCE = [
  { latitude: 41.01, longitude: 28.97 },
  { latitude: 41.01, longitude: 28.98 },
  { latitude: 41.02, longitude: 28.98 },
  { latitude: 41.02, longitude: 28.97 },
];

const STATUS_COLORS = { available: '#4CAF50', busy: '#F44336', offline: '#9E9E9E' };

export default function AdminScreen({ onLogout, token }) {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [drivers, setDrivers] = useState([]);
  const [queue, setQueue] = useState([]);
  const [trips, setTrips] = useState([]);
  const [hourlyStats, setHourlyStats] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  const [tripModal, setTripModal] = useState(false);
  const [tripForm, setTripForm] = useState({ customerName: '', customerPhone: '', destination: '' });

  useEffect(() => {
    const s = io(API_URL);
    setSocket(s);
    
    s.on('connect', () => setConnected(true));
    s.on('disconnect', () => setConnected(false));

    s.on('stateUpdate', (data) => {
      setDrivers(data.drivers || []);
      setQueue(data.queue || []);
    });

    s.on('admin:tripCreated', () => {
      fetchTrips();
      setTripModal(false);
    });

    s.emit('getState');
    fetchTrips();
    fetchHourlyStats();
    fetchStations();

    const interval = setInterval(() => { fetchTrips(); fetchHourlyStats(); }, 30000);
    return () => { s.disconnect(); clearInterval(interval); };
  }, [token]);

  const [stations, setStations] = useState([]);
  const fetchStations = async () => {
    try {
      const res = await fetch(`${API_URL}/stations/istanbul`);
      const data = await res.json();
      setStations(data);
    } catch (e) { console.log('Station fetch error', e) }
  };

  const fetchTrips = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/trips/today`, { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      setTrips(data);
    } catch (e) { console.error(e); }
  };

  const fetchHourlyStats = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/trips/hourly`, { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      setHourlyStats(data);
    } catch (e) { console.error(e); }
  };

  const removeFromQueue = (driverId) => socket?.emit('admin:removeFromQueue', { driverId });
  const reorderQueue = (fromIdx, toIdx) => {
    const newQ = [...queue];
    const [moved] = newQ.splice(fromIdx, 1);
    newQ.splice(toIdx, 0, moved);
    socket?.emit('admin:reorderQueue', { queue: newQ });
  };
  const createTrip = () => {
    socket?.emit('admin:createTrip', { stationId: STATION_ID, ...tripForm });
    setTripForm({ customerName: '', customerPhone: '', destination: '' });
  };
  const manualAssign = (tripId, driverId) => socket?.emit('admin:manualAssign', { tripId, driverId });

  const availableCount = drivers.filter(d => d.status === 'available').length;
  const busyCount = drivers.filter(d => d.status === 'busy').length;

  const renderDashboard = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { borderBottomColor: '#4CAF50' }]}><Text style={styles.statLabel}>Müsait</Text><Text style={styles.statValue}>{availableCount}</Text></View>
        <View style={[styles.statCard, { borderBottomColor: '#F44336' }]}><Text style={styles.statLabel}>Meşgul</Text><Text style={styles.statValue}>{busyCount}</Text></View>
        <View style={[styles.statCard, { borderBottomColor: '#FFC107' }]}><Text style={styles.statLabel}>Sırada</Text><Text style={styles.statValue}>{queue.length}</Text></View>
        <View style={[styles.statCard, { borderBottomColor: '#2196F3' }]}><Text style={styles.statLabel}>Seferler</Text><Text style={styles.statValue}>{trips.length}</Text></View>
      </View>

      <Text style={styles.sectionTitle}>Tüm Sürücüler ({drivers.length})</Text>
      {drivers.map(d => (
        <View key={d.id} style={styles.driverItem}>
          <View style={[styles.statusDotLg, { backgroundColor: STATUS_COLORS[d.status] }]} />
          <View style={{flex:1, marginLeft: 12}}>
            <Text style={styles.driverName}>{d.name} <Text style={{color:'#888', fontSize: 12}}>({d.licensePlate})</Text></Text>
            <Text style={styles.driverSub}>{queue.includes(d.id) ? `Sırada #${queue.indexOf(d.id)+1}` : (d.isInsideGeofence ? 'Sınır İçi' : 'Sınır Dışı')} </Text>
          </View>
        </View>
      ))}

      <View style={{marginTop: 40, marginBottom: 60}}>
        <TouchableOpacity style={[styles.btn, styles.btnDanger]} onPress={onLogout}>
          <Text style={{color:'#fff', fontWeight: 'bold', fontSize: 16}}>Güvenli Çıkış Yap</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderQueue = () => (
    <ScrollView style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Sıra Yönetimi ({queue.length})</Text>
      {queue.length === 0 && <Text style={styles.emptyText}>Bekleyen sürücü yok</Text>}
      {queue.map((driverId, i) => {
        const d = drivers.find(x => x.id === driverId);
        return (
          <View key={driverId} style={styles.queueItem}>
            <Text style={styles.queueNum}>{i + 1}</Text>
            <View style={{flex:1}}>
              <Text style={styles.driverName}>{d?.name || 'Bilinmiyor'}</Text>
              <Text style={styles.driverSub}>{d?.licensePlate}</Text>
            </View>
            <View style={{flexDirection:'row', gap:8}}>
              {i > 0 && <TouchableOpacity style={styles.actionBtn} onPress={() => reorderQueue(i, i-1)}><Text style={styles.actionBtnText}>↑</Text></TouchableOpacity>}
              {i < queue.length - 1 && <TouchableOpacity style={styles.actionBtn} onPress={() => reorderQueue(i, i+1)}><Text style={styles.actionBtnText}>↓</Text></TouchableOpacity>}
              <TouchableOpacity style={[styles.actionBtn, {backgroundColor: '#F44336'}]} onPress={() => removeFromQueue(driverId)}><Text style={{color:'#fff', fontWeight:'bold'}}>X</Text></TouchableOpacity>
            </View>
          </View>
        );
      })}
    </ScrollView>
  );

  const renderTrips = () => (
    <ScrollView style={styles.tabContent}>
      <TouchableOpacity style={[styles.btn, styles.btnSuccess, {marginBottom: 16}]} onPress={() => setTripModal(true)}>
        <Text style={styles.btnText}>+ Yeni Yolculuk</Text>
      </TouchableOpacity>
      
      {trips.length === 0 && <Text style={styles.emptyText}>Bugün yolculuk yok</Text>}
      {trips.map(t => {
        const d = drivers.find(x => x.id === t.driverId);
        return (
          <View key={t.id} style={styles.card}>
            <Text style={{color:'#FFC107', fontWeight:'bold', marginBottom:4}}>{t.status.toUpperCase()}</Text>
            <Text style={styles.cardValue}>Müşteri: {t.customerName || 'Anonim'}</Text>
            <Text style={styles.cardSub}>Hedef: {t.destination || '-'}</Text>
            <Text style={styles.cardSub}>Sürücü: {d?.name || '-'}</Text>
            {t.status === 'pending' && queue.length > 0 && (
              <TouchableOpacity style={[styles.btn, styles.btnPrimary, {marginTop:12, padding:8}]} onPress={() => manualAssign(t.id, queue[0])}>
                <Text style={styles.btnText}>Sıradaki İlk Kişiye Ata</Text>
              </TouchableOpacity>
            )}
          </View>
        );
      })}
    </ScrollView>
  );

  const [mapRegion, setMapRegion] = useState({ latitude: 41.015, longitude: 28.975, latitudeDelta: 0.1, longitudeDelta: 0.1 });

  const renderMap = () => {
    if (Platform.OS === 'web') return <View style={styles.center}><Text style={styles.emptyText}>Harita web'de kullanılamaz</Text></View>;

    const visibleStations = stations.filter(s => {
      const latDiff = Math.abs(s.latitude - mapRegion.latitude);
      const lngDiff = Math.abs(s.longitude - mapRegion.longitude);
      return latDiff <= mapRegion.latitudeDelta * 1.5 && lngDiff <= mapRegion.longitudeDelta * 1.5;
    });

    return (
      <MapView 
        style={{flex:1}} 
        initialRegion={{ latitude: 41.015, longitude: 28.975, latitudeDelta: 0.1, longitudeDelta: 0.1 }}
        onRegionChangeComplete={setMapRegion}
      >
        <Polygon coordinates={GEOFENCE} fillColor="rgba(33,150,243,0.15)" strokeColor="#2196F3" strokeWidth={2} />
        {visibleStations.map(s => (
          <Marker key={`st-${s.id}`} coordinate={{ latitude: s.latitude, longitude: s.longitude }} pinColor="blue" title={s.name} description="Taksi Durağı" />
        ))}
        {drivers.map((d) => (
          d.latitude && d.longitude ? (
            <Marker key={d.id} coordinate={{ latitude: d.latitude, longitude: d.longitude }} pinColor={queue.includes(d.id)?'#FFC107':STATUS_COLORS[d.status]||'#9E9E9E'} title={d.name} description={d.licensePlate} />
          ) : null
        ))}
      </MapView>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />
      <View style={styles.header}>
        <View style={{flexDirection:'row', alignItems:'center'}}>
          <Text style={styles.headerTitle}>👑 Yönetici Paneli</Text>
          <View style={[styles.statusDot, { backgroundColor: connected ? '#4CAF50' : '#F44336' }]} />
        </View>
      </View>

      <View style={styles.tabsRow}>
        {[{ key: 'dashboard', label: 'Özet' }, { key: 'queue', label: 'Sıra' }, { key: 'trips', label: 'Seferler' }, { key: 'map', label: 'Harita' }].map(t => (
          <TouchableOpacity key={t.key} style={[styles.topTab, activeTab===t.key && styles.topTabActive]} onPress={() => setActiveTab(t.key)}>
            <Text style={[styles.topTabText, activeTab===t.key && styles.topTabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={{flex:1}}>
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'queue' && renderQueue()}
        {activeTab === 'trips' && renderTrips()}
        {activeTab === 'map' && renderMap()}
      </View>

      <Modal visible={tripModal} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>+ Yeni Yolculuk Oluştur</Text>
            <TextInput style={styles.input} placeholderTextColor="#888" placeholder="Müşteri Adı" value={tripForm.customerName} onChangeText={t => setTripForm({...tripForm, customerName: t})} />
            <TextInput style={styles.input} placeholderTextColor="#888" placeholder="Telefon" value={tripForm.customerPhone} onChangeText={t => setTripForm({...tripForm, customerPhone: t})} keyboardType="phone-pad" />
            <TextInput style={styles.input} placeholderTextColor="#888" placeholder="Hedef (Varış)" value={tripForm.destination} onChangeText={t => setTripForm({...tripForm, destination: t})} />
            
            <View style={{flexDirection:'row', gap:10, marginTop:16}}>
              <TouchableOpacity style={[styles.btn, styles.btnSuccess, {flex:1}]} onPress={createTrip}><Text style={styles.btnText}>Oluştur</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.btn, styles.btnDanger, {flex:1}]} onPress={() => setTripModal(false)}><Text style={styles.btnText}>İptal</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: '#0f0f23' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#2196F3' },
  statusDot: { width: 12, height: 12, borderRadius: 6, marginLeft: 8 },
  tabsRow: { flexDirection: 'row', backgroundColor: '#0f0f23', paddingHorizontal: 10, paddingBottom: 10 },
  topTab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  topTabActive: { borderBottomColor: '#2196F3' },
  topTabText: { color: '#888', fontSize: 13 },
  topTabTextActive: { color: '#2196F3', fontWeight: 'bold' },
  tabContent: { flex: 1, padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff', marginBottom: 12, marginTop: 10 },
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  statCard: { width: '48%', backgroundColor: '#0f0f23', padding: 16, borderRadius: 12, marginBottom: 16, borderBottomWidth: 4, alignItems: 'center' },
  statLabel: { color: '#888', fontSize: 12, marginBottom: 4 },
  statValue: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  driverItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0f0f23', padding: 16, borderRadius: 12, marginBottom: 8 },
  statusDotLg: { width: 16, height: 16, borderRadius: 8 },
  driverName: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  driverSub: { color: '#aaa', fontSize: 13, marginTop: 4 },
  queueItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0f0f23', padding: 16, borderRadius: 12, marginBottom: 8 },
  queueNum: { fontSize: 20, color: '#2196F3', fontWeight: 'bold', width: 30 },
  actionBtn: { backgroundColor: '#3a3a4e', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 6 },
  actionBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
  card: { backgroundColor: '#0f0f23', padding: 16, borderRadius: 12, marginBottom: 16 },
  cardValue: { fontSize: 16, color: '#fff', fontWeight: 'bold', marginBottom: 4 },
  cardSub: { fontSize: 14, color: '#aaa', marginBottom: 4 },
  btn: { padding: 14, borderRadius: 8, alignItems: 'center' },
  btnPrimary: { backgroundColor: '#2196F3' },
  btnSuccess: { backgroundColor: '#4CAF50' },
  btnDanger: { backgroundColor: '#F44336' },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  emptyText: { color: '#888', textAlign: 'center', marginTop: 20, fontSize: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a1a2e' },
  input: { backgroundColor: '#0f0f23', color: '#fff', padding: 16, borderRadius: 10, fontSize: 16, borderWidth: 1, borderColor: '#2a2a3e', marginBottom: 12 },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#1a1a2e', padding: 24, borderRadius: 16, borderWidth: 1, borderColor: '#2a2a3e' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#4CAF50', marginBottom: 16, textAlign: 'center' },
});
