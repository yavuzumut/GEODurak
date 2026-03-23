import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import Login from './Login';
import './index.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [drivers, setDrivers] = useState([]);
  const [queue, setQueue] = useState([]);
  const [trips, setTrips] = useState([]);
  const [hourlyStats, setHourlyStats] = useState([]);
  const [tab, setTab] = useState('dashboard');
  const [tripModal, setTripModal] = useState(false);
  const [tripForm, setTripForm] = useState({ customerName: '', customerPhone: '', destination: '' });

  useEffect(() => {
    checkToken();
  }, []);

  const checkToken = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        const res = await fetch(`${API}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken })
        });
        if (res.ok) {
          const data = await res.json();
          localStorage.setItem('accessToken', data.accessToken);
          setUser({ role: data.role });
        } else {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        }
      }
    } catch (e) {
      console.log('Token check error', e);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogin = (data) => {
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    setUser({ role: data.role });
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
    if (socket) socket.disconnect();
  };

  useEffect(() => {
    if (!user) return;

    const s = io(API);
    setSocket(s);

    s.on('connect', () => setConnected(true));
    s.on('disconnect', () => setConnected(false));

    s.on('stateUpdate', (data) => {
      setDrivers(data.drivers || []);
      setQueue(data.queue || []);
    });

    s.on('admin:tripCreated', () => {
      fetchTrips();
      fetchHourlyStats();
      setTripModal(false);
    });

    s.on('admin:tripCancelled', () => {
      fetchTrips();
      fetchHourlyStats();
    });

    s.on('admin:forcedOffline', () => {
      s.emit('getState');
    });

    // Initial fetch
    s.emit('getState');
    fetchTrips();
    fetchHourlyStats();

    const interval = setInterval(() => {
      fetchTrips();
      fetchHourlyStats();
    }, 30000);

    return () => { s.disconnect(); clearInterval(interval); };
  }, [user]);

  const fetchTrips = async () => {
    try {
      const res = await fetch(`${API}/admin/trips/today`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }
      });
      const data = await res.json();
      setTrips(data);
    } catch (e) { console.error(e); }
  };

  const fetchHourlyStats = async () => {
    try {
      const res = await fetch(`${API}/admin/trips/hourly`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }
      });
      const data = await res.json();
      setHourlyStats(data);
    } catch (e) { console.error(e); }
  };

  const removeFromQueue = (driverId) => {
    socket?.emit('admin:removeFromQueue', { driverId });
  };

  const reorderQueue = (fromIdx, toIdx) => {
    const newQueue = [...queue];
    const [moved] = newQueue.splice(fromIdx, 1);
    newQueue.splice(toIdx, 0, moved);
    socket?.emit('admin:reorderQueue', { queue: newQueue });
  };

  const createTrip = () => {
    socket?.emit('admin:createTrip', {
      stationId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      ...tripForm,
    });
    setTripForm({ customerName: '', customerPhone: '', destination: '' });
  };

  const manualAssign = (tripId, driverId) => {
    socket?.emit('admin:manualAssign', { tripId, driverId });
  };

  const cancelTrip = (tripId) => {
    if (window.confirm('Bu yolculuğu iptal etmek istediğinize emin misiniz?')) {
      socket?.emit('admin:cancelTrip', { tripId });
    }
  };

  const forceOffline = (driverId) => {
    if (window.confirm('Bu sürücüyü çevrimdışı yapmak istediğinize emin misiniz?')) {
      socket?.emit('admin:forceOffline', { driverId });
    }
  };

  const deleteDriver = async (driverId) => {
    if (window.confirm('Bu sürücüyü sistemden kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz!')) {
      await fetch(`${API}/admin/drivers/${driverId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` },
      });
      socket?.emit('getState');
    }
  };

  const deleteTrip = async (tripId) => {
    if (window.confirm('Bu yolculuğu sistemden kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz!')) {
      await fetch(`${API}/admin/trips/${tripId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` },
      });
      fetchTrips();
    }
  };

  const availableCount = drivers.filter(d => d.status === 'available').length;
  const busyCount = drivers.filter(d => d.status === 'busy').length;
  const offlineCount = drivers.filter(d => d.status === 'offline').length;

  if (authLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--bg-dark)', color: 'var(--accent)' }}>
        <h2>Yükleniyor...</h2>
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  const renderDashboard = () => (
    <>
      <div className="stats-row">
        <div className="stat-card success"><div className="label">Müsait Sürücü</div><div className="value">{availableCount}</div></div>
        <div className="stat-card danger"><div className="label">Meşgul Sürücü</div><div className="value">{busyCount}</div></div>
        <div className="stat-card warning"><div className="label">Sırada Bekleyen</div><div className="value">{queue.length}</div></div>
        <div className="stat-card info"><div className="label">Bugünkü Yolculuk</div><div className="value">{trips.length}</div></div>
      </div>

      <div className="table-container">
        <div className="table-header">
          <h2>🚕 Tüm Sürücüler</h2>
        </div>
        <table>
          <thead>
            <tr><th>Ad</th><th>Plaka</th><th>Durum</th><th>Sırada</th><th>Konum</th><th>İşlem</th></tr>
          </thead>
          <tbody>
            {drivers.map(d => (
              <tr key={d.id}>
                <td>{d.name}</td>
                <td>{d.licensePlate}</td>
                <td><span className={`badge ${d.status}`}>{d.status === 'available' ? 'Müsait' : d.status === 'busy' ? 'Meşgul' : 'Çevrimdışı'}</span></td>
                <td>{queue.includes(d.id) ? <span className="badge in-queue">#{queue.indexOf(d.id) + 1}</span> : '-'}</td>
                <td style={{fontSize:12, color:'#888'}}>{d.latitude?.toFixed(4)}, {d.longitude?.toFixed(4)}</td>
                <td style={{display:'flex', gap:4, flexWrap:'wrap'}}>
                  {d.status !== 'offline' && (
                    <button className="btn btn-danger btn-sm" onClick={() => forceOffline(d.id)}>Çıkar</button>
                  )}
                  <button className="btn btn-danger btn-sm" style={{opacity:0.75}} onClick={() => deleteDriver(d.id)}>Sil</button>
                </td>
              </tr>
            ))}
            {drivers.length === 0 && <tr><td colSpan="6" style={{textAlign:'center', padding:30, color:'#888'}}>Henüz sürücü yok</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );

  const renderQueue = () => (
    <>
      <div className="table-container">
        <div className="table-header">
          <h2>📋 Sıra Yönetimi</h2>
          <span style={{color:'var(--text-secondary)'}}>Toplam: {queue.length} sürücü</span>
        </div>
      </div>

      <div className="queue-list">
        {queue.map((driverId, i) => {
          const d = drivers.find(x => x.id === driverId);
          return (
            <div key={driverId} className="queue-item">
              <span className="queue-num">{i + 1}</span>
              <div style={{flex:1}}>
                <div className="queue-name">{d?.name || 'Bilinmiyor'}</div>
                <div className="queue-plate">{d?.licensePlate || ''}</div>
              </div>
              <div style={{display:'flex', gap:8}}>
                {i > 0 && <button className="btn btn-primary btn-sm" onClick={() => reorderQueue(i, i-1)}>↑</button>}
                {i < queue.length - 1 && <button className="btn btn-primary btn-sm" onClick={() => reorderQueue(i, i+1)}>↓</button>}
                <button className="btn btn-danger btn-sm" onClick={() => removeFromQueue(driverId)}>Kaldır</button>
              </div>
            </div>
          );
        })}
        {queue.length === 0 && <div style={{textAlign:'center', padding:40, color:'#888'}}>Sırada kimse yok</div>}
      </div>
    </>
  );

  const renderTrips = () => (
    <>
      <div className="table-container">
        <div className="table-header">
          <h2>🚗 Yolculuk Yönetimi</h2>
          <button className="btn btn-success" onClick={() => setTripModal(true)}>+ Yeni Yolculuk</button>
        </div>
        <table>
          <thead>
            <tr><th>Müşteri</th><th>Hedef</th><th>Durum</th><th>Sürücü</th><th>Tarih</th><th>İşlem</th></tr>
          </thead>
          <tbody>
            {trips.map(t => {
              const d = drivers.find(x => x.id === t.driverId);
              return (
                <tr key={t.id}>
                  <td>{t.customerName || 'Anonim'}</td>
                  <td>{t.destination || '-'}</td>
                  <td><span className={`badge ${t.status}`}>{t.status}</span></td>
                  <td>{d?.name || (t.driverId ? t.driverId.slice(0,8) + '...' : '-')}</td>
                  <td style={{fontSize:12}}>{new Date(t.createdAt).toLocaleTimeString('tr-TR')}</td>
                  <td style={{display:'flex', gap:4, flexWrap:'wrap'}}>
                    {t.status === 'pending' && queue.length > 0 && (
                      <button className="btn btn-warning btn-sm" onClick={() => manualAssign(t.id, queue[0])}>Ata</button>
                    )}
                    {t.status !== 'completed' && t.status !== 'cancelled' && (
                      <button className="btn btn-danger btn-sm" onClick={() => cancelTrip(t.id)}>İptal</button>
                    )}
                    <button className="btn btn-danger btn-sm" style={{opacity:0.75}} onClick={() => deleteTrip(t.id)}>Sil</button>
                  </td>
                </tr>
              );
            })}
            {trips.length === 0 && <tr><td colSpan="6" style={{textAlign:'center', padding:30, color:'#888'}}>Bugün yolculuk yok</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );

  const renderAnalytics = () => {
    const maxCount = Math.max(...hourlyStats.map(s => Number(s.count)), 1);
    return (
      <>
        <div className="stats-row">
          <div className="stat-card info"><div className="label">Bugünkü Toplam</div><div className="value">{trips.length}</div></div>
          <div className="stat-card success"><div className="label">Tamamlanan</div><div className="value">{trips.filter(t=>t.status==='completed').length}</div></div>
          <div className="stat-card danger"><div className="label">İptal Edilen</div><div className="value">{trips.filter(t=>t.status==='cancelled').length}</div></div>
          <div className="stat-card warning"><div className="label">Aktif Sürücü</div><div className="value">{drivers.filter(d=>d.status!=='offline').length}</div></div>
        </div>

        <div className="chart-container">
          <h3 style={{marginBottom:16}}>📊 Saatlik Yolculuk Dağılımı</h3>
          {hourlyStats.length > 0 ? hourlyStats.map(s => (
            <div key={s.hour} className="chart-bar-row">
              <span className="chart-label">{String(s.hour).padStart(2,'0')}:00</span>
              <div className="chart-bar" style={{width: `${(s.count / maxCount) * 100}%`}} />
              <span className="chart-value">{s.count}</span>
            </div>
          )) : <div style={{textAlign:'center', color:'#888', padding:30}}>Henüz veri yok</div>}
        </div>

        <div className="table-container">
          <div className="table-header"><h2>🏆 Sürücü Aktivitesi</h2></div>
          <table>
            <thead><tr><th>Ad</th><th>Plaka</th><th>Durum</th><th>Geofence</th></tr></thead>
            <tbody>
              {drivers.map(d => (
                <tr key={d.id}>
                  <td>{d.name}</td>
                  <td>{d.licensePlate}</td>
                  <td><span className={`badge ${d.status}`}>{d.status === 'available' ? 'Müsait' : d.status === 'busy' ? 'Meşgul' : 'Çevrimdışı'}</span></td>
                  <td>{d.isInsideGeofence ? '✅ İçeride' : '❌ Dışarıda'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    );
  };

  return (
    <>
      <div className="header">
        <h1>🚕 GeoDurak Admin</h1>
        <div className="status">
          <div className="dot" style={{background: connected ? 'var(--success)' : 'var(--danger)'}} />
          {connected ? 'Bağlı' : 'Bağlantı Kesildi'}
          <button className="btn btn-danger btn-sm" style={{marginLeft: 16}} onClick={handleLogout}>Çıkış Yap</button>
        </div>
      </div>

      <div className="tabs">
        {[
          {key:'dashboard', label:'📊 Dashboard'},
          {key:'queue', label:`📋 Sıra (${queue.length})`},
          {key:'trips', label:`🚗 Yolculuklar (${trips.length})`},
          {key:'analytics', label:'📈 Analitik'},
        ].map(t => (
          <button key={t.key} className={tab === t.key ? 'active' : ''} onClick={() => setTab(t.key)}>{t.label}</button>
        ))}
      </div>

      <div className="content">
        {tab === 'dashboard' && renderDashboard()}
        {tab === 'queue' && renderQueue()}
        {tab === 'trips' && renderTrips()}
        {tab === 'analytics' && renderAnalytics()}
      </div>

      {/* Create Trip Modal */}
      {tripModal && (
        <div className="modal-overlay" onClick={() => setTripModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>🚗 Yeni Yolculuk Oluştur</h2>
            <div className="form-group">
              <label>Müşteri Adı</label>
              <input value={tripForm.customerName} onChange={e => setTripForm({...tripForm, customerName: e.target.value})} placeholder="Müşteri adı..." />
            </div>
            <div className="form-group">
              <label>Telefon</label>
              <input value={tripForm.customerPhone} onChange={e => setTripForm({...tripForm, customerPhone: e.target.value})} placeholder="05XX..." />
            </div>
            <div className="form-group">
              <label>Hedef (Varış Noktası)</label>
              <input value={tripForm.destination} onChange={e => setTripForm({...tripForm, destination: e.target.value})} placeholder="Hedef adresi..." />
            </div>
            <div className="modal-actions">
              <button className="btn btn-success" onClick={createTrip} style={{flex:1}}>Oluştur & Ata</button>
              <button className="btn btn-danger" onClick={() => setTripModal(false)}>İptal</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default App;
