import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'sonner';
import { fetchUsers } from '../redux/userSlice';
import { getProjectMembersAPI, addProjectMembersAPI, removeProjectMemberAPI } from '../services/projectApi';
import { Button } from '@/components/ui/button';
import MemberCard from '../components/manageTeam/MemberCard';
import AddMemberModal from '../components/manageTeam/AddMemberModal';
import { avatarColors, getUserDisplayName, buildInitialTeam } from '../components/manageTeam/teamUtils';

const ManageTeamPage = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { projects } = useSelector((state) => state.projects);
  const { users } = useSelector((state) => state.users);

  const project = projects.find((p) => String(p._id || p.id) === String(projectId));
  const projectName = project?.name || project?.projectName || 'Untitled Project';
  const leadName = project?.lead?.name || project?.lead || project?.projectLead?.name || 'N/A';

  const [teamList, setTeamList] = useState([]);
  const [membersLoading, setMembersLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [addingLoading, setAddingLoading] = useState(false);

  useEffect(() => {
    if (!users || users.length === 0) dispatch(fetchUsers());
  }, [dispatch, users]);

  useEffect(() => {
    const fetchMembers = async () => {
      setMembersLoading(true);
      try {
        const res = await getProjectMembersAPI(projectId);
        const raw = res?.data?.members || [];
        setTeamList(
          raw.map((m, i) => ({
            id: m.id || `member-${i}`,
            userId: m.id,
            name: m.name || 'Unknown',
            role: m.role || '',
            email: m.email || '',
            phone: m.phone || '',
            colorIndex: i % avatarColors.length,
          }))
        );
      } catch {
        setTeamList(buildInitialTeam(project));
      } finally {
        setMembersLoading(false);
      }
    };
    fetchMembers();
  }, [projectId, project, leadName]);

  const alreadyAddedIds = new Set(teamList.map((m) => m.userId).filter(Boolean));
  const availableUsers = Array.isArray(users) ? users.filter((u) => !alreadyAddedIds.has(u._id)) : [];

  const filtered = teamList.filter(
    (m) =>
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.role.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleAdd = async (selectedUserIds, role) => {
    const usersToAdd = selectedUserIds.map((id) => users.find((u) => u._id === id)).filter(Boolean);
    if (usersToAdd.length === 0) return;
    const resolvedRole = role || 'Team Member';

    const members = usersToAdd.map((user) => ({
      id: user._id,
      name: getUserDisplayName(user),
      email: user.authentication?.email || '',
      phone: user.phone || '',
      userType: 'EMPLOYEE',
      role: resolvedRole,
    }));

    setAddingLoading(true);
    try {
      await addProjectMembersAPI(projectId, members);
      setTeamList((prev) => [
        ...prev,
        ...usersToAdd.map((user, i) => ({
          id: `member-new-${Date.now()}-${i}`,
          userId: user._id,
          name: getUserDisplayName(user),
          role: resolvedRole,
          colorIndex: (prev.length + i) % avatarColors.length,
        })),
      ]);
      setShowAddModal(false);
      toast.success(
        usersToAdd.length === 1
          ? `${getUserDisplayName(usersToAdd[0])} added to the team`
          : `${usersToAdd.length} members added to the team`,
      );
    } catch {
      toast.error('Failed to add members. Please try again.');
    } finally {
      setAddingLoading(false);
    }
  };

  const handleRemove = async (id) => {
    const member = teamList.find((m) => m.id === id);
    try {
      if (member?.userId) await removeProjectMemberAPI(projectId, member.userId);
      setTeamList((prev) => prev.filter((m) => m.id !== id));
      toast.success('Member removed from the team');
    } catch {
      toast.error('Failed to remove member. Please try again.');
    }
  };

  const handleRoleSave = (id, role) => {
    setTeamList((prev) => prev.map((m) => (m.id === id ? { ...m, role } : m)));
  };

  return (
    <div className="h-full overflow-auto bg-slate-50">
      <div className="px-8 py-7 max-[768px]:px-4">

        {/* Breadcrumb */}
        <div className="flex items-center gap-3 mb-1">
          <button
            onClick={() => navigate(`/projects/${projectId}`)}
            className="w-9 h-9 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
            aria-label="Back to project"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <span className="hover:text-blue-600 cursor-pointer transition-colors" onClick={() => navigate('/projects')}>Projects</span>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 18l6-6-6-6" /></svg>
            <span className="hover:text-blue-600 cursor-pointer transition-colors truncate max-w-[160px]" onClick={() => navigate(`/projects/${projectId}`)}>{projectName}</span>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 18l6-6-6-6" /></svg>
            <span className="text-slate-600 font-medium">Manage Team</span>
          </div>
        </div>

        {/* Toolbar */}
        <div className="grid grid-cols-3 items-center mt-5 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Team Members</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {teamList.length} member{teamList.length !== 1 ? 's' : ''} · {projectName}
            </p>
          </div>
          <div className="flex justify-center">
            <div className="relative w-96">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8" strokeWidth="2" />
                <path strokeLinecap="round" strokeWidth="2" d="M21 21l-4.35-4.35" />
              </svg>
              <input
                type="text"
                placeholder="Search…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-800 placeholder-slate-400 outline-none focus:border-blue-400 transition-colors shadow-sm"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button
              onClick={() => setShowAddModal(true)}
              className="!bg-[#5449D6] border-transparent hover:!bg-[#5449D6] hover:brightness-110"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Member
            </Button>
          </div>
        </div>

        {/* Add member modal */}
        {showAddModal && (
          <AddMemberModal
            projectName={projectName}
            availableUsers={availableUsers}
            loading={addingLoading}
            onAdd={handleAdd}
            onClose={() => setShowAddModal(false)}
          />
        )}

        {/* Member grid */}
        {membersLoading ? (
          <div className="text-center py-20 text-slate-400">
            <svg className="w-8 h-8 mx-auto mb-3 animate-spin opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" strokeWidth="2" strokeDasharray="60" strokeDashoffset="20" />
            </svg>
            <p className="text-sm">Loading members…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <svg className="w-10 h-10 mx-auto mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a4 4 0 00-5-3.87M9 20H4v-2a4 4 0 015-3.87m6-4a4 4 0 11-8 0 4 4 0 018 0zm6 4a4 4 0 00-3-3.87" />
            </svg>
            <p className="text-sm font-medium">No members found</p>
          </div>
        ) : (
          <div className="grid grid-cols-6 gap-4 max-[1024px]:grid-cols-4 max-[768px]:grid-cols-3 max-[500px]:grid-cols-2">
            {filtered.map((member) => (
              <MemberCard
                key={member.id}
                member={member}
                onRemove={handleRemove}
                onRoleSave={handleRoleSave}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageTeamPage;
