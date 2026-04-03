export const AVATAR_COLORS = [
  '#1DA1F2', '#17BF63', '#794BC4', '#F45D22', '#E0245E',
  '#FFAD1F', '#009688', '#3F51B5', '#E91E63', '#00BCD4',
  '#673AB7', '#FF5722', '#2196F3', '#4CAF50',
];

export function getAvatarColor(str) {
  if (!str) return AVATAR_COLORS[0];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function formatTimeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'az önce';
  if (mins < 60) return `${mins}dk`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}sa`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}g`;
  return `${Math.floor(days / 7)}h`;
}
