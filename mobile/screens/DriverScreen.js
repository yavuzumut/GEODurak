import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, Platform, SafeAreaView, ScrollView, StatusBar, Modal, ActivityIndicator } from 'react-native';
import * as Location from 'expo-location';
import { io } from 'socket.io-client';
import MapView, { Marker, Polygon } from 'react-native-maps';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://192.168.1.10:3000';
const TEST_UUID = '22222222-2222-2222-2222-222222222222'; // The true mock driver ID for test
const STATION_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

const GEOFENCE = [
  { latitude: 41.01, longitude: 28.97 },
  { latitude: 41.01, longitude: 28.98 },
  { latitude: 41.02, longitude: 28.98 },
  { latitude: 41.02, longitude: 28.97 },
];

const STATUS_COLORS = { available: '#4CAF50', busy: '#F44336', offline: '#9E9E9E' };
const STATUS_LABELS = { available: 'Müsait', busy: 'Meşgul', offline: 'Çevrimdışı' };

export default function DriverScreen({ onLogout, token, userId }) {
  const [location, setLocation] = useState(null);
  const [isInside, setIsInside] = useState(false);
  const [queuePosition, setQueuePosition] = useState(null);
  const [queueTotal, setQueueTotal] = useState(0);
  const [socket, setSocket] = useState(null);
  const [driverStatus, setDriverStatus] = useState('available');
  const [allDrivers, setAllDrivers] = useState([]);
  const [queue, setQueue] = useState([]);
  const [activeTrip, setActiveTrip] = useState(null);
  const [tripModal, setTripModal] = useState(false);
  const [pendingTrip, setPendingTrip] = useState(null);
  const [notifications, setNotifications] = useState([]);
  
  // Tabs: 'dashboard' | 'queue' | 'map' | 'notifications'
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stations, setStations] = useState([]);

  useEffect(() => {
    fetch(`${API_URL}/stations/istanbul`)
      .then(res => res.json())
      .then(data => setStations(data))
      .catch(e => console.log('Hata', e));

    const newSocket = io(API_URL);
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Driver Connected');
      newSocket.emit('register', { driverId: userId });
    });

    newSocket.on('locationUpdated', (data) => {
      setIsInside(data.isInsideGeofence);
      if (data.status) setDriverStatus(data.status);
    });

    newSocket.on('stateUpdate', (data) => {
      setAllDrivers(data.drivers || []);
      setQueue(data.queue || []);
      const pos = data.queue?.indexOf(userId);
      if (pos > -1) {
        setQueuePosition(pos + 1);
        setQueueTotal(data.queue.length);
      } else {
        setQueuePosition(null);
      }
    });

    newSocket.on('statusChanged', (data) => {
      setDriverStatus(data.status);
    });

    newSocket.on('tripAssigned', (trip) => {
      setPendingTrip(trip);
      setTripModal(true);
      addNotification('🚗 Yeni yolculuk ataması!');
    });

    newSocket.on('tripAccepted', (trip) => {
      setActiveTrip(trip);
      setTripModal(false);
    });

    newSocket.on('tripCompleted', () => {
      setActiveTrip(null);
      addNotification('✅ Yolculuk tamamlandı.');
    });

    newSocket.on('tripTimeout', (data) => {
      setTripModal(false);
      setPendingTrip(null);
      addNotification('⏰ ' + data.message);
    });

    newSocket.on('geofenceWarning', (data) => {
      if (data.type === 'warning') addNotification('⚠️ ' + data.message);
      else { Alert.alert('Uyarı', data.message); addNotification('❌ ' + data.message); }
    });

    newSocket.on('leftQueue', () => {
      setQueuePosition(null);
      addNotification('📋 Sıradan ayrıldınız.');
    });

    newSocket.on('error', (data) => Alert.alert('Hata', data.message));

    return () => newSocket.disconnect();
  }, []);

  useEffect(() => {
    let sub;
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Hata', 'Konum izni reddedildi!');
        return;
      }
      sub = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 5000, distanceInterval: 10 },
        (loc) => {
          setLocation(loc.coords);
          if (socket) {
            socket.emit('updateLocation', { driverId: userId, latitude: loc.coords.latitude, longitude: loc.coords.longitude });
          }
        },
      );
    })();
    return () => { if (sub && sub.remove) { try { sub.remove(); } catch(e){} } };
  }, [socket]);

  const addNotification = (msg) => setNotifications(p => [{ id: Date.now(), text: msg, time: new Date() }, ...p].slice(0, 20));
  const joinQueue = () => socket?.emit('joinQueue', { driverId: userId });
  const leaveQueue = () => socket?.emit('leaveQueue', { driverId: userId });
  const changeStatus = (status) => socket?.emit('changeStatus', { driverId: userId, status });
  const respondTrip = (accepted) => {
    if (pendingTrip) {
      socket?.emit('respondToTrip', { tripId: pendingTrip.id, driverId: userId, accepted });
      if (!accepted) { setTripModal(false); setPendingTrip(null); }
    }
  };
  const completeTrip = () => activeTrip && socket?.emit('completeTrip', { tripId: activeTrip.id, driverId: userId });

  const renderDashboard = () => (
    <ScrollView style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Durumunuz</Text>
      <View style={styles.statusRow}>
        {['available', 'busy', 'offline'].map((s) => (
          <TouchableOpacity key={s} style={[styles.statusBtn, { backgroundColor: STATUS_COLORS[s] }, driverStatus === s && styles.statusBtnActive]} onPress={() => changeStatus(s)}>
            <Text style={styles.statusBtnText}>{STATUS_LABELS[s]}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={[styles.card, { borderLeftColor: isInside ? '#4CAF50' : '#F44336' }]}>
        <Text style={styles.cardTitle}>Durak Sınırı</Text>
        <Text style={styles.cardValue}>{isInside ? '✅ Sınır İçindesiniz' : '❌ Sınır Dışındasınız'}</Text>
      </View>

      <View style={[styles.card, { borderLeftColor: '#2196F3' }]}>
        <Text style={styles.cardTitle}>Sıra Durumu</Text>
        {queuePosition ? (
          <>
            <Text style={styles.cardValue}>Sıranız: {queuePosition} / {queueTotal}</Text>
            <Text style={styles.cardSub}>Tahmini bekleme: ~{(queuePosition - 1) * 5} dk</Text>
            <TouchableOpacity style={[styles.btn, styles.btnDanger]} onPress={leaveQueue}>
              <Text style={styles.btnText}>Sıradan Ayrıl</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.cardValue}>Sırada değilsiniz</Text>
            <TouchableOpacity style={[styles.btn, styles.btnPrimary, (!isInside || driverStatus !== 'available') && styles.btnDisabled]} disabled={!isInside || driverStatus !== 'available'} onPress={joinQueue}>
              <Text style={styles.btnText}>Sıraya Gir</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {activeTrip && (
        <View style={[styles.card, { borderLeftColor: '#FF9800' }]}>
          <Text style={styles.cardTitle}>🚗 Aktif Yolculuk</Text>
          <Text style={styles.cardValue}>{activeTrip.destination || 'Hedef belirtilmemiş'}</Text>
          <Text style={styles.cardSub}>Müşteri: {activeTrip.customerName || 'Anonim'}</Text>
          <TouchableOpacity style={[styles.btn, { backgroundColor: '#4CAF50' }]} onPress={completeTrip}>
            <Text style={styles.btnText}>Yolculuğu Tamamla</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={{marginTop: 40, marginBottom: 60}}>
        <TouchableOpacity style={[styles.btn, styles.btnDanger]} onPress={onLogout}>
          <Text style={{color:'#fff', fontWeight: 'bold', fontSize: 16}}>Güvenli Çıkış Yap</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderQueueList = () => (
    <ScrollView style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Sıra Listesi ({queue.length})</Text>
      {queue.length === 0 && <Text style={styles.emptyText}>Bekleyen sürücü yok</Text>}
      {queue.map((driverId, i) => {
        const d = allDrivers.find((x) => x.id === driverId);
        return (
          <View key={driverId} style={[styles.queueItem, driverId === userId && styles.queueItemSelf]}>
            <Text style={styles.queueNum}>{i + 1}</Text>
            <View>
              <Text style={styles.queueName}>{d?.name || 'Bilinmiyor'}</Text>
              <Text style={styles.queuePlate}>{d?.licensePlate || ''}</Text>
            </View>
          </View>
        );
      })}
    </ScrollView>
  );

  const [mapRegion, setMapRegion] = useState({ latitude: 41.015, longitude: 28.975, latitudeDelta: 0.1, longitudeDelta: 0.1 });

  const renderMap = () => {
    if (Platform.OS === 'web') return <View style={styles.center}><Text style={styles.emptyText}>Harita web'de kullanılamaz</Text></View>;
    if (!location) return <View style={styles.center}><ActivityIndicator color="#FFC107" /><Text style={{color:'#666', marginTop:8}}>Konum aranıyor...</Text></View>;

    const visibleStations = stations.filter(s => {
      const latDiff = Math.abs(s.latitude - mapRegion.latitude);
      const lngDiff = Math.abs(s.longitude - mapRegion.longitude);
      return latDiff <= mapRegion.latitudeDelta * 1.5 && lngDiff <= mapRegion.longitudeDelta * 1.5;
    });

    return (
      <MapView 
        style={{flex:1}} 
        initialRegion={{ latitude: location.latitude, longitude: location.longitude, latitudeDelta: 0.1, longitudeDelta: 0.1 }} 
        onRegionChangeComplete={setMapRegion}
        showsUserLocation
      >
        <Polygon coordinates={GEOFENCE} fillColor="rgba(76,175,80,0.15)" strokeColor="#4CAF50" strokeWidth={2} />
        {visibleStations.map(s => (
          <Marker key={`st-${s.id}`} coordinate={{ latitude: s.latitude, longitude: s.longitude }} pinColor="blue" title={s.name} description="Taksi Durağı" />
        ))}
        {allDrivers.map((d) => (
          <Marker key={d.id} coordinate={{ latitude: d.latitude, longitude: d.longitude }} pinColor={queue.includes(d.id)?'#FFC107':STATUS_COLORS[d.status]||'#9E9E9E'} title={d.name} description={`${STATUS_LABELS[d.status]} | ${d.licensePlate}`} />
        ))}
      </MapView>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />
      <View style={styles.header}>
        <View style={{flexDirection:'row', alignItems:'center'}}>
          <Text style={styles.headerTitle}>🚕 Sürücü Paneli</Text>
          <View style={[styles.statusDot, { backgroundColor: STATUS_COLORS[driverStatus] }]} />
        </View>
      </View>

      <View style={styles.tabsRow}>
        {[
          { key: 'dashboard', label: 'Ana Panel' },
          { key: 'queue', label: 'Sıra' },
          { key: 'map', label: 'Harita' },
          { key: 'notifications', label: 'Bildirim' }
        ].map(t => (
          <TouchableOpacity key={t.key} style={[styles.topTab, activeTab===t.key && styles.topTabActive]} onPress={() => setActiveTab(t.key)}>
            <Text style={[styles.topTabText, activeTab===t.key && styles.topTabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={{flex:1}}>
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'queue' && renderQueueList()}
        {activeTab === 'map' && renderMap()}
        {activeTab === 'notifications' && (
          <ScrollView style={styles.tabContent}>
            {notifications.length === 0 ? <Text style={styles.emptyText}>Bildirim yok</Text> : notifications.map(n => (
              <View key={n.id} style={styles.notifItem}><Text style={styles.notifText}>{n.text}</Text><Text style={styles.notifTime}>{n.time.toLocaleTimeString('tr-TR')}</Text></View>
            ))}
          </ScrollView>
        )}
      </View>

      <Modal visible={tripModal} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>🚕 Yeni Yolculuk</Text>
            {pendingTrip && (
              <>
                <Text style={styles.modalText}>Müşteri: {pendingTrip.customerName || 'Anonim'}</Text>
                <Text style={styles.modalText}>Telefon: {pendingTrip.customerPhone || '-'}</Text>
                <Text style={styles.modalText}>Hedef: {pendingTrip.destination || 'Belirtilmedi'}</Text>
              </>
            )}
             <Text style={styles.modalWarn}>30 saniye içinde yanıtlamazsanız başka sürücüye atanır!</Text>
            <View style={{flexDirection:'row', gap:10}}>
              <TouchableOpacity style={[styles.btn, styles.btnPrimary, {flex:1}]} onPress={() => respondTrip(true)}><Text style={styles.btnText}>Kabul Et</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.btn, styles.btnDanger, {flex:1}]} onPress={() => respondTrip(false)}><Text style={styles.btnText}>Reddet</Text></TouchableOpacity>
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
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFC107' },
  statusDot: { width: 12, height: 12, borderRadius: 6, marginLeft: 8 },
  tabsRow: { flexDirection: 'row', backgroundColor: '#0f0f23', paddingHorizontal: 10, paddingBottom: 10 },
  topTab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  topTabActive: { borderBottomColor: '#FFC107' },
  topTabText: { color: '#888', fontSize: 13 },
  topTabTextActive: { color: '#FFC107', fontWeight: 'bold' },
  tabContent: { flex: 1, padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff', marginBottom: 12, marginTop: 10 },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  statusBtn: { flex: 1, padding: 12, borderRadius: 8, marginHorizontal: 4, alignItems: 'center', opacity: 0.5 },
  statusBtnActive: { opacity: 1, borderWidth: 2, borderColor: '#fff' },
  statusBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  card: { backgroundColor: '#0f0f23', padding: 16, borderRadius: 12, marginBottom: 16, borderLeftWidth: 4 },
  cardTitle: { fontSize: 14, color: '#aaa', marginBottom: 4 },
  cardValue: { fontSize: 18, color: '#fff', fontWeight: 'bold', marginBottom: 8 },
  cardSub: { fontSize: 13, color: '#888', marginBottom: 12 },
  btn: { padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  btnPrimary: { backgroundColor: '#FFC107' },
  btnDanger: { backgroundColor: '#F44336' },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: '#1a1a2e', fontWeight: 'bold', fontSize: 16 },
  queueItem: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#0f0f23', borderRadius: 8, marginBottom: 8 },
  queueItemSelf: { borderColor: '#FFC107', borderWidth: 1 },
  queueNum: { fontSize: 24, fontWeight: 'bold', color: '#FFC107', marginRight: 16, width: 30 },
  queueName: { fontSize: 16, color: '#fff', fontWeight: '500' },
  queuePlate: { fontSize: 14, color: '#aaa' },
  notifItem: { backgroundColor: '#0f0f23', padding: 16, borderRadius: 8, marginBottom: 8 },
  notifText: { color: '#fff', fontSize: 14 },
  notifTime: { color: '#666', fontSize: 12, marginTop: 4, alignSelf: 'flex-end' },
  emptyText: { color: '#888', textAlign: 'center', marginTop: 20, fontSize: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a1a2e' },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#1a1a2e', padding: 24, borderRadius: 16, borderWidth: 1, borderColor: '#2a2a3e' },
  modalTitle: { fontSize: 24, fontWeight: 'bold', color: '#FFC107', marginBottom: 16, textAlign: 'center' },
  modalText: { fontSize: 16, color: '#fff', marginBottom: 8 },
  modalWarn: { color: '#F44336', marginVertical: 16, textAlign: 'center', fontSize: 13 }
});
