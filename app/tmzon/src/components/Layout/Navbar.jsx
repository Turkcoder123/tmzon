import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Avatar from '../common/Avatar';
import styles from './Navbar.module.css';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className={styles.nav}>
      <div className={styles.inner}>
        {/* Logo */}
        <NavLink to="/" className={styles.logo}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="var(--color-primary)">
            <path d="M23.954 4.569a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.691 8.094 4.066 6.13 1.64 3.161a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.061a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.937 4.937 0 004.604 3.417 9.868 9.868 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.054 0 13.999-7.496 13.999-13.986 0-.209 0-.42-.015-.63a9.936 9.936 0 002.46-2.548l-.047-.02z" />
          </svg>
          <span>Tmzon</span>
        </NavLink>

        {/* Links */}
        <div className={styles.links}>
          <NavLink to="/" end className={({ isActive }) => [styles.link, isActive ? styles.active : ''].join(' ')}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
            </svg>
            <span>Ana Sayfa</span>
          </NavLink>

          {user && (
            <NavLink to={`/profile/${user.username}`} className={({ isActive }) => [styles.link, isActive ? styles.active : ''].join(' ')}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
              </svg>
              <span>Profil</span>
            </NavLink>
          )}
        </div>

        {/* User / Auth */}
        <div className={styles.actions}>
          {user ? (
            <div className={styles.userMenu}>
              <NavLink to={`/profile/${user.username}`} className={styles.userInfo}>
                <Avatar src={user.avatar} username={user.username} size={36} />
                <span className={styles.username}>@{user.username}</span>
              </NavLink>
              <button className={styles.logoutBtn} onClick={handleLogout} title="Çıkış">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" />
                </svg>
              </button>
            </div>
          ) : (
            <div className={styles.authLinks}>
              <NavLink to="/login" className={styles.loginBtn}>Giriş Yap</NavLink>
              <NavLink to="/register" className={styles.registerBtn}>Kayıt Ol</NavLink>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
