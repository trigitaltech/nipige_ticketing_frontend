const AVATAR_PALETTE = [
  '#6366F1', '#8B5CF6', '#EC4899', '#F43F5E', '#EF4444',
  '#F97316', '#F59E0B', '#10B981', '#14B8A6', '#06B6D4',
  '#0EA5E9', '#3B82F6', '#7C3AED', '#DB2777', '#059669',
];

export const getAvatarColor = (key) => {
  const str = String(key ?? '');
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = (hash * 31 + str.charCodeAt(i)) | 0;
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length];
};

export const getInitials = (label) => {
  if (!label) return '?';
  const parts = String(label).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export const getAssigneeDisplay = (assignee) => {
  if (!assignee) return null;
  const name = assignee.name || assignee.username || assignee.email || '';
  if (!name) return null;
  return {
    name,
    initial: getInitials(name),
    color: getAvatarColor(name),
  };
};
