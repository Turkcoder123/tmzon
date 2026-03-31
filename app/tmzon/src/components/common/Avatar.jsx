import React from 'react';
import styles from './Avatar.module.css';

export default function Avatar({ src, username = '?', size = 40 }) {
  const initials = username ? username.slice(0, 2).toUpperCase() : '?';
  return (
    <div className={styles.avatar} style={{ width: size, height: size, fontSize: size * 0.4 }}>
      {src ? (
        <img src={src} alt={username} className={styles.img} />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}
