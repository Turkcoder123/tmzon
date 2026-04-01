import React, { useState } from 'react';
import { postsApi } from '../../api/posts';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../common/Button';
import Input from '../common/Input';
import styles from './PostForm.module.css';
import Avatar from '../common/Avatar';

export default function PostForm({ onCreated }) {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    setLoading(true);
    setError('');
    try {
      const post = await postsApi.create({ content: content.trim() });
      setContent('');
      onCreated?.(post);
    } catch (err) {
      setError(err.message || 'Gönderi oluşturulamadı');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.row}>
        <Avatar src={user.avatar} username={user.username} size={44} />
        <textarea
          className={styles.textarea}
          placeholder="Ne düşünüyorsun?"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
          maxLength={2000}
        />
      </div>
      {error && <p className={styles.error}>{error}</p>}
      <div className={styles.footer}>
        <span className={styles.charCount}>{content.length}/2000</span>
        <Button type="submit" loading={loading} disabled={!content.trim()}>
          Paylaş
        </Button>
      </div>
    </form>
  );
}
