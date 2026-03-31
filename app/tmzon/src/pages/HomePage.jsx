import React, { useState, useEffect } from 'react';
import { postsApi } from '../api/posts';
import { useAuth } from '../contexts/AuthContext';
import PostForm from '../components/Post/PostForm';
import PostCard from '../components/Post/PostCard';
import styles from './HomePage.module.css';

export default function HomePage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('all'); // 'all' | 'feed'

  const fetchPosts = async () => {
    setLoading(true);
    setError('');
    try {
      const data = tab === 'feed' && user ? await postsApi.getFeed() : await postsApi.getAll();
      setPosts(data);
    } catch (err) {
      setError('Gönderiler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [tab]);

  const handleCreated = (newPost) => {
    setPosts((prev) => [newPost, ...prev]);
  };

  const handleDelete = (deletedId) => {
    setPosts((prev) => prev.filter((p) => p._id !== deletedId));
  };

  return (
    <div>
      {user && (
        <div className={styles.tabs}>
          <button
            className={[styles.tab, tab === 'all' ? styles.activeTab : ''].join(' ')}
            onClick={() => setTab('all')}
          >
            Keşfet
          </button>
          <button
            className={[styles.tab, tab === 'feed' ? styles.activeTab : ''].join(' ')}
            onClick={() => setTab('feed')}
          >
            Takip Edilenler
          </button>
        </div>
      )}

      <PostForm onCreated={handleCreated} />

      {loading && (
        <div className={styles.loadingWrap}>
          <div className={styles.spinner} />
        </div>
      )}

      {error && <p className={styles.error}>{error}</p>}

      {!loading && posts.length === 0 && (
        <div className={styles.empty}>
          <p>Henüz gönderi yok.</p>
          {tab === 'feed' && <p>Birini takip etmeyi deneyin!</p>}
        </div>
      )}

      <div className={styles.feed}>
        {posts.map((post) => (
          <PostCard key={post._id} post={post} onDelete={handleDelete} />
        ))}
      </div>
    </div>
  );
}
