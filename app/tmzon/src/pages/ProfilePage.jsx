import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usersApi } from '../api/users';
import { postsApi } from '../api/posts';
import { useAuth } from '../contexts/AuthContext';
import Avatar from '../components/common/Avatar';
import Button from '../components/common/Button';
import PostCard from '../components/Post/PostCard';
import Input from '../components/common/Input';
import styles from './ProfilePage.module.css';

export default function ProfilePage() {
  const { username } = useParams();
  const { user: currentUser, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editBio, setEditBio] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editError, setEditError] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  const isOwnProfile = currentUser && currentUser.username === username;

  useEffect(() => {
    loadProfile();
  }, [username]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const [profileData, postsData] = await Promise.all([
        usersApi.getProfile(username),
        postsApi.getByUser(username),
      ]);
      setProfile(profileData);
      setPosts(postsData);
      if (currentUser) {
        setIsFollowing(
          profileData.followers?.some(
            (f) => f._id === currentUser._id || f === currentUser._id
          )
        );
      }
    } catch {
      navigate('/404');
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!currentUser || followLoading) return;
    setFollowLoading(true);
    try {
      const data = await usersApi.toggleFollow(username);
      setIsFollowing(data.following);
      setProfile((p) => ({
        ...p,
        followers: data.following
          ? [...(p.followers || []), { _id: currentUser._id, username: currentUser.username }]
          : (p.followers || []).filter((f) => f._id !== currentUser._id),
      }));
    } catch {
      // ignore
    } finally {
      setFollowLoading(false);
    }
  };

  const openEdit = () => {
    setEditBio(profile.bio || '');
    setEditAvatar(profile.avatar || '');
    setEditUsername(profile.username || '');
    setEditError('');
    setEditMode(true);
  };

  const handleEditSave = async (e) => {
    e.preventDefault();
    setEditError('');
    setEditLoading(true);
    try {
      const updated = await usersApi.updateMe({
        bio: editBio,
        avatar: editAvatar,
        username: editUsername,
      });
      setProfile(updated);
      setEditMode(false);
      await refreshUser();
      if (editUsername !== username) {
        navigate(`/profile/${editUsername}`, { replace: true });
      }
    } catch (err) {
      setEditError(err.message || 'Güncelleme başarısız');
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeletePost = (deletedId) => {
    setPosts((prev) => prev.filter((p) => p._id !== deletedId));
  };

  if (loading) {
    return (
      <div className={styles.loadingWrap}>
        <div className={styles.spinner} />
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div>
      {/* Profile Header */}
      <div className={styles.header}>
        <div className={styles.avatarWrap}>
          <Avatar src={profile.avatar} username={profile.username} size={80} />
        </div>

        <div className={styles.info}>
          <div className={styles.nameRow}>
            <h1 className={styles.username}>@{profile.username}</h1>
            {isOwnProfile ? (
              <Button variant="secondary" size="sm" onClick={openEdit}>
                Profili Düzenle
              </Button>
            ) : currentUser ? (
              <Button
                variant={isFollowing ? 'secondary' : 'primary'}
                size="sm"
                loading={followLoading}
                onClick={handleFollow}
              >
                {isFollowing ? 'Takibi Bırak' : 'Takip Et'}
              </Button>
            ) : null}
          </div>

          {profile.bio && <p className={styles.bio}>{profile.bio}</p>}

          <div className={styles.stats}>
            <div className={styles.stat}>
              <span className={styles.statNum}>{posts.length}</span>
              <span className={styles.statLabel}>Gönderi</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statNum}>{profile.followers?.length ?? 0}</span>
              <span className={styles.statLabel}>Takipçi</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statNum}>{profile.following?.length ?? 0}</span>
              <span className={styles.statLabel}>Takip</span>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editMode && (
        <div className={styles.modalOverlay} onClick={() => setEditMode(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>Profili Düzenle</h2>
            <form onSubmit={handleEditSave} className={styles.editForm}>
              <Input
                label="Kullanıcı Adı"
                value={editUsername}
                onChange={(e) => setEditUsername(e.target.value)}
                required
                minLength={3}
              />
              <Input
                label="Biyografi"
                textarea
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                placeholder="Kendinizden bahsedin..."
                maxLength={160}
              />
              <Input
                label="Avatar URL"
                type="url"
                value={editAvatar}
                onChange={(e) => setEditAvatar(e.target.value)}
                placeholder="https://..."
              />
              {editError && <p className={styles.editError}>{editError}</p>}
              <div className={styles.editActions}>
                <Button type="button" variant="secondary" onClick={() => setEditMode(false)}>
                  İptal
                </Button>
                <Button type="submit" loading={editLoading}>
                  Kaydet
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Posts */}
      <div className={styles.postsSection}>
        <h2 className={styles.postsTitle}>Gönderiler</h2>
        {posts.length === 0 ? (
          <div className={styles.empty}>
            <p>Henüz gönderi yok.</p>
          </div>
        ) : (
          <div className={styles.postList}>
            {posts.map((post) => (
              <PostCard key={post._id} post={post} onDelete={handleDeletePost} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
