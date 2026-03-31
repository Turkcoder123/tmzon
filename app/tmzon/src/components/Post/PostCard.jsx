import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { postsApi } from '../../api/posts';
import { useAuth } from '../../contexts/AuthContext';
import Avatar from '../common/Avatar';
import CommentSection from './CommentSection';
import styles from './PostCard.module.css';

function formatDate(iso) {
  const d = new Date(iso);
  const now = new Date();
  const diff = Math.floor((now - d) / 1000);
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}dk`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}sa`;
  return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
}

export default function PostCard({ post, onDelete }) {
  const { user } = useAuth();
  const [likes, setLikes] = useState(post.likes?.length ?? 0);
  const [liked, setLiked] = useState(user ? post.likes?.some((id) => id === user._id || id?._id === user._id) : false);
  const [showComments, setShowComments] = useState(false);
  const [commentCount, setCommentCount] = useState(post.comments?.length ?? 0);
  const [likeLoading, setLikeLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isOwner = user && post.author && (post.author._id === user._id || post.author._id === user._id);

  const handleLike = async () => {
    if (!user || likeLoading) return;
    setLikeLoading(true);
    try {
      const data = await postsApi.toggleLike(post._id);
      setLikes(data.likes);
      setLiked(data.liked);
    } catch {
      // ignore
    } finally {
      setLikeLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Bu gönderiyi silmek istediğinizden emin misiniz?')) return;
    setDeleting(true);
    try {
      await postsApi.delete(post._id);
      onDelete?.(post._id);
    } catch {
      setDeleting(false);
    }
  };

  return (
    <article className={styles.card}>
      <div className={styles.header}>
        <Link to={`/profile/${post.author?.username}`} className={styles.authorLink}>
          <Avatar src={post.author?.avatar} username={post.author?.username} size={44} />
          <div className={styles.authorInfo}>
            <span className={styles.authorName}>{post.author?.username}</span>
            <span className={styles.date}>{formatDate(post.createdAt)}</span>
          </div>
        </Link>
        {isOwner && (
          <button className={styles.deleteBtn} onClick={handleDelete} disabled={deleting} title="Sil">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
            </svg>
          </button>
        )}
      </div>

      <p className={styles.content}>{post.content}</p>

      <div className={styles.actions}>
        <button
          className={[styles.actionBtn, liked ? styles.liked : ''].join(' ')}
          onClick={handleLike}
          disabled={!user}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill={liked ? 'var(--color-danger)' : 'none'} stroke="currentColor" strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
          </svg>
          <span>{likes}</span>
        </button>

        <button
          className={styles.actionBtn}
          onClick={() => setShowComments((v) => !v)}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
          </svg>
          <span>{commentCount}</span>
        </button>
      </div>

      {showComments && (
        <CommentSection
          postId={post._id}
          initialComments={post.comments || []}
          onCountChange={setCommentCount}
        />
      )}
    </article>
  );
}
