import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/common/Logo.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useApi } from '../hooks/useApi.js';
import { applyTheme } from '../theme/tokens.js';

export default function SuperAdmin() {
  const { get, post, put } = useApi();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'EMPLOYEE', // SUPER_ADMIN vs BUSINESS_USER (which defaults to EMPLOYEE globally)
    assignments: {}, // maps businessId -> role (ADMIN, MANAGER, EMPLOYEE, NONE)
  });

  // Force neutral theme for Super Admin console
  useEffect(() => {
    applyTheme('neutral');
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [usersRes, bizRes] = await Promise.all([
        get('/api/super-admin/users'),
        get('/api/auth/businesses'),
      ]);
      setUsers(usersRes.data || []);
      setBusinesses(bizRes.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load administration data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAdd = () => {
    const initialAssignments = {};
    businesses.forEach((b) => {
      initialAssignments[b.id] = 'NONE';
    });
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'EMPLOYEE',
      assignments: initialAssignments,
    });
    setShowAddModal(true);
  };

  const handleOpenEdit = (u) => {
    setSelectedUser(u);
    const initialAssignments = {};
    businesses.forEach((b) => {
      const existing = u.businesses?.find((ub) => ub.businessId === b.id);
      initialAssignments[b.id] = existing ? existing.role : 'NONE';
    });
    setFormData({
      name: u.name,
      email: u.email,
      password: '',
      role: u.role,
      status: u.status,
      assignments: initialAssignments,
    });
    setShowEditModal(true);
  };

  const handleAssignmentChange = (bizId, roleValue) => {
    setFormData((prev) => ({
      ...prev,
      assignments: {
        ...prev.assignments,
        [bizId]: roleValue,
      },
    }));
  };

  const handleSaveAdd = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    // Prepare assignments array
    const assignmentsList = Object.entries(formData.assignments)
      .filter(([_, role]) => role !== 'NONE')
      .map(([businessId, role]) => ({ businessId, role }));

    try {
      await post('/api/super-admin/users', {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        assignments: assignmentsList,
      });
      setSuccess('User registered successfully');
      setShowAddModal(false);
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to create user');
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const assignmentsList = Object.entries(formData.assignments)
      .filter(([_, role]) => role !== 'NONE')
      .map(([businessId, role]) => ({ businessId, role }));

    try {
      await put(`/api/super-admin/users/${selectedUser.id}`, {
        name: formData.name,
        email: formData.email,
        password: formData.password || undefined,
        role: formData.role,
        status: formData.status,
        assignments: assignmentsList,
      });
      setSuccess('User updated successfully');
      setShowEditModal(false);
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to update user');
    }
  };

  return (
    <div className="min-h-screen bg-surface text-on-surface font-body flex flex-col antialiased relative">
      <header className="bg-surface-container-lowest border-b border-outline-variant flex justify-between items-center w-full px-6 h-16 sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <Logo />
          <span className="text-lg font-bold text-on-surface font-headline tracking-tight hidden md:inline">Super Admin Panel</span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/select-business')}
            className="flex items-center gap-1.5 p-2 sm:px-3 sm:py-1.5 border border-outline-variant rounded-full text-xs font-semibold hover:bg-surface-container-low transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            <span className="hidden sm:inline">Business Switcher</span>
          </button>
          <div className="h-8 w-px bg-outline-variant hidden sm:block"></div>
          <button
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="text-xs text-on-surface-variant hover:text-error transition-colors font-semibold"
          >
            Logout
          </button>
          <div className="h-8 w-px bg-outline-variant hidden sm:block"></div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-on-surface-variant font-medium hidden sm:inline">
              {user?.name || 'Super Admin'}
            </span>
            <div className="h-8 w-8 rounded-full bg-primary-container flex items-center justify-center border border-outline-variant">
              <span className="material-symbols-outlined text-sm text-on-primary-container">admin_panel_settings</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main administration canvas */}
      <main className="flex-1 p-6 lg:p-10 max-w-7xl mx-auto w-full space-y-6">
        {/* Alerts */}
        {error && (
          <div className="bg-error-container/20 border border-error/30 text-on-error-container p-3 rounded-lg text-sm text-left flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-error">error</span>
            {error}
          </div>
        )}
        {success && (
          <div className="bg-primary-container/20 border border-primary/30 text-on-primary-container p-3 rounded-lg text-sm text-left flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-primary">check_circle</span>
            {success}
          </div>
        )}

        {/* Bento stats cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant shadow-sm flex items-center justify-between">
            <div className="text-left">
              <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Total Users</span>
              <div className="text-3xl font-black mt-1">{users.length}</div>
            </div>
            <div className="w-12 h-12 bg-primary-container/30 text-primary rounded-lg flex items-center justify-center">
              <span className="material-symbols-outlined text-[28px]">group</span>
            </div>
          </div>

          <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant shadow-sm flex items-center justify-between">
            <div className="text-left">
              <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Active Staff</span>
              <div className="text-3xl font-black mt-1">
                {users.filter((u) => u.status === 'ACTIVE').length}
              </div>
            </div>
            <div className="w-12 h-12 bg-green-500/10 text-green-700 rounded-lg flex items-center justify-center">
              <span className="material-symbols-outlined text-[28px]">verified_user</span>
            </div>
          </div>

          <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant shadow-sm flex items-center justify-between">
            <div className="text-left">
              <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Businesses</span>
              <div className="text-3xl font-black mt-1">{businesses.length}</div>
            </div>
            <div className="w-12 h-12 bg-orange-500/10 text-orange-700 rounded-lg flex items-center justify-center">
              <span className="material-symbols-outlined text-[28px]">storefront</span>
            </div>
          </div>
        </div>

        {/* Users administration card */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-outline-variant flex justify-between items-center bg-surface-container-lowest">
            <h2 className="text-base font-bold font-headline">User Directory</h2>
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-1.5 px-4 py-2 bg-primary text-on-primary text-sm font-semibold rounded-lg hover:opacity-90 active:scale-[0.98] transition-all shadow-sm"
            >
              <span className="material-symbols-outlined text-[18px]">person_add</span>
              Register User
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-container text-on-surface-variant font-medium border-b border-outline-variant uppercase text-xs tracking-wider">
                <tr>
                  <th className="px-6 py-3">User info</th>
                  <th className="px-6 py-3">Global role</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Business permissions</th>
                  <th className="px-6 py-3 w-20"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/40 text-on-surface font-medium">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-on-surface-variant">
                      Loading user database...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-on-surface-variant">
                      No users registered.
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id} className="hover:bg-surface-container-low/30 transition-colors">
                      <td className="px-6 py-4 text-left">
                        <div className="font-bold text-sm">{u.name}</div>
                        <div className="text-xs text-on-surface-variant font-mono">{u.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            u.role === 'SUPER_ADMIN'
                              ? 'bg-primary-container text-on-primary-container'
                              : 'bg-surface-variant text-on-surface-variant'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-black ${
                            u.status === 'ACTIVE'
                              ? 'bg-green-500/10 text-green-700'
                              : 'bg-error-container/20 text-on-error-container'
                          }`}
                        >
                          {u.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-left">
                        {u.role === 'SUPER_ADMIN' ? (
                          <span className="text-xs text-primary font-bold">All Access (Global Admin)</span>
                        ) : u.businesses?.length === 0 ? (
                          <span className="text-xs text-on-surface-variant italic">No access assigned</span>
                        ) : (
                          <div className="flex flex-col gap-1">
                            {u.businesses?.map((ub) => {
                              const bizName = businesses.find((b) => b.id === ub.businessId)?.name || 'Unknown Business';
                              return (
                                <div key={ub.id} className="text-xs flex items-center gap-1.5">
                                  <span className="material-symbols-outlined text-[14px] text-primary">store</span>
                                  <span className="font-semibold">{bizName}</span>
                                  <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 bg-surface-container-high rounded border border-outline-variant/30 text-on-surface-variant">
                                    {ub.role}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleOpenEdit(u)}
                          className="flex items-center gap-1 text-xs px-2.5 py-1 border border-outline-variant rounded hover:bg-surface-container-low transition-colors"
                        >
                          <span className="material-symbols-outlined text-[14px]">edit</span>
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-lg max-w-lg w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-outline-variant flex justify-between items-center">
              <h3 className="font-headline font-bold text-base">Register New Account</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-on-surface-variant hover:text-on-surface p-1 rounded-full hover:bg-surface-container-low"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveAdd} className="p-6 space-y-4 text-left">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-on-surface-variant uppercase">Full name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 bg-surface border border-outline-variant rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                    placeholder="John Doe"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-on-surface-variant uppercase">Email address</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 bg-surface border border-outline-variant rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                    placeholder="john@gohite.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-on-surface-variant uppercase">Password</label>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                    className="w-full px-3 py-2 bg-surface border border-outline-variant rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                    placeholder="••••••••"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-on-surface-variant uppercase">Global role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData((prev) => ({ ...prev, role: e.target.value }))}
                    className="w-full px-3 py-2 bg-surface border border-outline-variant rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                  >
                    <option value="EMPLOYEE">Business User (Staff)</option>
                    <option value="SUPER_ADMIN">Super Admin (Global System Access)</option>
                  </select>
                </div>
              </div>

              {formData.role !== 'SUPER_ADMIN' && (
                <div className="border-t border-outline-variant pt-4 space-y-3">
                  <h4 className="text-xs font-bold text-on-surface-variant uppercase">Business Role Assignments</h4>
                  <div className="space-y-3">
                    {businesses.map((b) => (
                      <div key={b.id} className="flex items-center justify-between p-2.5 bg-surface-container rounded-lg border border-outline-variant/30">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-primary text-[18px]">store</span>
                          <span className="text-xs font-bold">{b.name}</span>
                        </div>
                        <select
                          value={formData.assignments[b.id] || 'NONE'}
                          onChange={(e) => handleAssignmentChange(b.id, e.target.value)}
                          className="text-xs bg-surface border border-outline-variant rounded px-2 py-1 outline-none"
                        >
                          <option value="NONE">No Access</option>
                          <option value="ADMIN">Admin</option>
                          <option value="MANAGER">Manager</option>
                          <option value="EMPLOYEE">Employee</option>
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="border-t border-outline-variant pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-outline-variant rounded-lg text-sm font-semibold hover:bg-surface-container"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-on-primary rounded-lg text-sm font-semibold hover:opacity-90 active:scale-[0.98]"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-lg max-w-lg w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-outline-variant flex justify-between items-center">
              <h3 className="font-headline font-bold text-base">Edit User Account</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-on-surface-variant hover:text-on-surface p-1 rounded-full hover:bg-surface-container-low"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4 text-left">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-on-surface-variant uppercase">Full name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 bg-surface border border-outline-variant rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-on-surface-variant uppercase">Email address</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 bg-surface border border-outline-variant rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-on-surface-variant uppercase">Password (leave blank to keep)</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                    className="w-full px-3 py-2 bg-surface border border-outline-variant rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                    placeholder="••••••••"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-on-surface-variant uppercase">Global role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData((prev) => ({ ...prev, role: e.target.value }))}
                    className="w-full px-3 py-2 bg-surface border border-outline-variant rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                    disabled={selectedUser?.id === user?.id}
                  >
                    <option value="EMPLOYEE">Business User (Staff)</option>
                    <option value="SUPER_ADMIN">Super Admin (Global System Access)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-on-surface-variant uppercase">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value }))}
                    className="w-full px-3 py-2 bg-surface border border-outline-variant rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                    disabled={selectedUser?.id === user?.id}
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
              </div>

              {formData.role !== 'SUPER_ADMIN' && (
                <div className="border-t border-outline-variant pt-4 space-y-3">
                  <h4 className="text-xs font-bold text-on-surface-variant uppercase">Business Role Assignments</h4>
                  <div className="space-y-3">
                    {businesses.map((b) => (
                      <div key={b.id} className="flex items-center justify-between p-2.5 bg-surface-container rounded-lg border border-outline-variant/30">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-primary text-[18px]">store</span>
                          <span className="text-xs font-bold">{b.name}</span>
                        </div>
                        <select
                          value={formData.assignments[b.id] || 'NONE'}
                          onChange={(e) => handleAssignmentChange(b.id, e.target.value)}
                          className="text-xs bg-surface border border-outline-variant rounded px-2 py-1 outline-none"
                        >
                          <option value="NONE">No Access</option>
                          <option value="ADMIN">Admin</option>
                          <option value="MANAGER">Manager</option>
                          <option value="EMPLOYEE">Employee</option>
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="border-t border-outline-variant pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-outline-variant rounded-lg text-sm font-semibold hover:bg-surface-container"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-on-primary rounded-lg text-sm font-semibold hover:opacity-90 active:scale-[0.98]"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
