import { useState } from 'react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function Login({ onLogin }) {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!phone || !password) {
      setError('Lütfen telefon ve şifre girin');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Giriş yapılamadı');
      }

      if (data.role !== 'admin') {
        throw new Error('Bu panele sadece yöneticiler girebilir');
      }

      onLogin(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--bg-dark)' }}>
      <div style={{ background: 'var(--bg-card)', padding: '40px', borderRadius: '16px', width: '100%', maxWidth: '400px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
        <h1 style={{ color: 'var(--accent)', textAlign: 'center', marginBottom: '8px' }}>🚕 GeoDurak</h1>
        <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '32px' }}>Yönetici Paneli Girişi</p>

        {error && <div style={{ background: 'rgba(244,67,54,0.1)', color: 'var(--danger)', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px', textAlign: 'center' }}>{error}</div>}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>Telefon Numarası</label>
            <input 
              type="text" 
              placeholder="05001234567" 
              value={phone} 
              onChange={e => setPhone(e.target.value)}
              disabled={loading}
              autoFocus
            />
          </div>

          <div className="form-group" style={{ marginBottom: '32px' }}>
            <label>Şifre</label>
            <div style={{ position: 'relative' }}>
              <input 
                type={showPass ? 'text' : 'password'} 
                placeholder="admin123" 
                value={password} 
                onChange={e => setPassword(e.target.value)}
                disabled={loading}
                style={{ paddingRight: '60px' }}
              />
              <button type="button" onClick={() => setShowPass(!showPass)} style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'var(--text-secondary)', cursor:'pointer', fontSize:13 }}>{showPass ? 'Gizle' : 'Göster'}</button>
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '14px', fontSize: '16px', opacity: loading ? 0.7 : 1 }}
            disabled={loading}
          >
            {loading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
          </button>
        </form>
      </div>
    </div>
  );
}
