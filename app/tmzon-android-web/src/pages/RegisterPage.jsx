import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '../api/client';
import { saveSession } from '../utils/session';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!username.trim()) {
      setError('Kullanıcı adı gerekli');
      return;
    }
    if (!email.trim()) {
      setError('E-posta gerekli');
      return;
    }
    if (!password) {
      setError('Parola gerekli');
      return;
    }

    setLoading(true);
    try {
      const data = await register(username.trim(), email.trim(), password);
      saveSession(data.token, data.user._id, data.user.username);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message || 'Kayıt başarısız');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">TmZon</h1>
        <p className="auth-subtitle">Yeni hesap oluşturun</p>

        {error && <div className="error-banner">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="username">Kullanıcı Adı</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="kullanici_adi"
              autoComplete="username"
            />
          </div>

          <div className="input-group">
            <label htmlFor="email">E-posta</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ornek@email.com"
              autoComplete="email"
            />
          </div>

          <div className="input-group">
            <label htmlFor="password">Parola</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="En az 6 karakter"
              autoComplete="new-password"
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Kayıt yapılıyor...' : 'Kayıt Ol'}
          </button>
        </form>

        <p className="auth-link">
          Zaten hesabınız var mı? <Link to="/login">Giriş Yap</Link>
        </p>
      </div>
    </div>
  );
}
