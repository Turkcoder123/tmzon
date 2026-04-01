import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { postsApi } from '../../api/posts';
import { useAuth } from '../../contexts/AuthContext';
import Avatar from '../common/Avatar';
import styles from './CommentSection.module.css';

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function CommentSection({ postId, initialComments, onCountChange }) {
  const { user } = useAuth();
  const [comments, setComments] = useState(initialComments);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setLoading(true);
    try {
      const comment = await postsApi.addComment(postId, { content: text.trim() });
      const updated = [...comments, comment];
      setComments(updated);
      onCountChange?.(updated.length);
      setText('');
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (commentId) => {
    try {
      await postsApi.deleteComment(postId, commentId);
      const updated = comments.filter((c) => c._id !== commentId);
      setComments(updated);
      onCountChange?.(updated.length);
    } catch {
      // ignore
    }
  };

  return (
    <div className={styles.section}>
      {comments.map((c) => (
        <div key={c._id} className={styles.comment}>
          <Link to={`/profile/${c.author?.username}`}>
            <Avatar src={c.author?.avatar} username={c.author?.username} size={32} />
          </Link>
          <div className={styles.commentBody}>
            <div className={styles.commentHeader}>
              <Link to={`/profile/${c.author?.username}`} className={styles.commentAuthor}>
                {c.author?.username}
              </Link>
              <span className={styles.commentDate}>{formatDate(c.createdAt)}</span>
              {user && c.author && (c.author._id === user._id || c.author === user._id) && (
                <button className={styles.deleteComment} onClick={() => handleDelete(c._id)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                  </svg>
                </button>
              )}
            </div>
            <p className={styles.commentContent}>{c.content}</p>
          </div>
        </div>
      ))}

      {user && (
        <form onSubmit={handleSubmit} className={styles.form}>
          <Avatar src={user.avatar} username={user.username} size={32} />
          <input
            className={styles.input}
            placeholder="Yorum yaz..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={500}
          />
          <button type="submit" className={styles.submitBtn} disabled={!text.trim() || loading}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </button>
        </form>
      )}
    </div>
  );
}
