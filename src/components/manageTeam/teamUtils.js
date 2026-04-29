export const avatarColors = [
  'bg-blue-100 text-blue-700',
  'bg-violet-100 text-violet-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
  'bg-cyan-100 text-cyan-700',
  'bg-orange-100 text-orange-700',
  'bg-teal-100 text-teal-700',
];

export const getInitials = (name = '') =>
  name.split(' ').filter(Boolean).map((p) => p[0]?.toUpperCase()).join('').slice(0, 2) || '?';

export const getUserDisplayName = (user) =>
  `${user.name?.first || ''} ${user.name?.last || ''}`.trim() || user.authentication?.userName || 'Unknown';

export const buildInitialTeam = (project) => {
  if (Array.isArray(project?.teamMembers) && project.teamMembers.length > 0) {
    return project.teamMembers.slice(0, 20).map((m, i) => ({
      id: m._id || m.id || `member-${i}`,
      userId: m._id || m.id || null,
      name: m.name || `${m.firstName || ''} ${m.lastName || ''}`.trim() || 'Unknown',
      role: m.role || m.designation || '',
      colorIndex: i % avatarColors.length,
    }));
  }
  return [];
};
