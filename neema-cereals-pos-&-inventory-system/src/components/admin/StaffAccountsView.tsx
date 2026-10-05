import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Shield,
  User,
  Key,
  Phone,
  Mail,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Lock,
  Crown,
  RefreshCw,
  Copy,
  Edit
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { UserRole, UserAccount } from '../../types';

export const StaffAccountsView: React.FC = () => {
  const {
    users,
    createUserAccount,
    updateUserAccount,
    deleteUserAccount,
    isSuperAdmin,
    currentUser
  } = useApp();

  // Create Staff Form
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [name, setName] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [role, setRole] = useState<UserRole>('cashier');
  const [password, setPassword] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Edit / Reset Password Modal
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);
  const [newPassword, setNewPassword] = useState<string>('');
  const [editEmail, setEditEmail] = useState<string>('');
  const [editPhone, setEditPhone] = useState<string>('');
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);
  const [copiedNotification, setCopiedNotification] = useState<boolean>(false);

  const handleOpenResetModal = (u: UserAccount) => {
    setEditingUser(u);
    setNewPassword('');
    setEditEmail(u.email || '');
    setEditPhone(u.phone || '');
    setResetSuccess(null);
    setCopiedNotification(false);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!name.trim() || !username.trim() || !password.trim()) {
      setFormError('Please fill in Name, Username, and Password/PIN.');
      return;
    }

    const res = createUserAccount({
      name: name.trim(),
      username: username.trim(),
      email: email.trim() || undefined,
      role,
      password: password.trim(),
      phone: phone.trim() || undefined,
    });

    if (res.success) {
      setFormSuccess(
        `Successfully registered ${role.toUpperCase()} account for "${name}". They can now log in using username "${username}".`
      );
      setName('');
      setUsername('');
      setEmail('');
      setPassword('');
      setPhone('');
      setShowAddForm(false);
    } else {
      setFormError(res.error || 'Failed to create account.');
    }
  };

  const handleGenerateRandomPin = () => {
    const pin = Math.floor(100000 + Math.random() * 900000).toString();
    setNewPassword(pin);
  };

  const handleSaveUserDetails = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    const updates: Partial<UserAccount> = {};
    if (newPassword.trim()) {
      updates.password = newPassword.trim();
    }
    updates.email = editEmail.trim() || undefined;
    updates.phone = editPhone.trim() || undefined;

    updateUserAccount(editingUser.id, updates);
    setResetSuccess(`Credentials & details successfully updated for ${editingUser.name}.`);

    setTimeout(() => {
      setEditingUser(null);
      setNewPassword('');
      setResetSuccess(null);
    }, 1200);
  };

  const handleCopyNewPassword = () => {
    if (!newPassword) return;
    navigator.clipboard.writeText(newPassword);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2000);
  };

  const handleToggleStatus = (u: UserAccount) => {
    if (u.isSuperAdmin) return;
    const newStatus = u.status === 'active' ? 'suspended' : 'active';
    updateUserAccount(u.id, { status: newStatus });
  };

  const cashierCount = users.filter(u => u.role === 'cashier').length;
  const adminCount = users.filter(u => u.role === 'admin').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-stone-900 border border-stone-800 p-5 rounded-2xl">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-bold text-white flex items-center space-x-2">
              <Users className="w-5 h-5 text-amber-500" />
              <span>Staff Accounts &amp; Security Control</span>
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase flex items-center space-x-1">
              <Crown className="w-3 h-3 text-amber-400" />
              <span>Super Admin Wanjema Control</span>
            </span>
          </div>
          <p className="text-xs text-stone-400 mt-1">
            Super Admin Wanjema can create accounts, reset passwords if forgotten, configure emails for reports, and manage access
          </p>
        </div>

        <button
          onClick={() => {
            setShowAddForm(prev => !prev);
            setFormError(null);
            setFormSuccess(null);
          }}
          className="py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs transition shadow-lg shadow-amber-500/20 flex items-center justify-center space-x-1.5 self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>{showAddForm ? 'Hide Form' : 'Create New Account'}</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Total Staff</span>
          <p className="text-2xl font-black font-mono text-white mt-1">{users.length}</p>
          <p className="text-[11px] text-stone-400 mt-1">Authorized accounts</p>
        </div>

        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center space-x-1">
            <User className="w-3.5 h-3.5" />
            <span>Active Cashiers</span>
          </span>
          <p className="text-2xl font-black font-mono text-emerald-400 mt-1">{cashierCount}</p>
          <p className="text-[11px] text-stone-400 mt-1">POS &amp; counter access</p>
        </div>

        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center space-x-1">
            <Shield className="w-3.5 h-3.5" />
            <span>Admins (Report Emails)</span>
          </span>
          <p className="text-2xl font-black font-mono text-amber-400 mt-1">{adminCount}</p>
          <p className="text-[11px] text-stone-400 mt-1">Receive monthly reports</p>
        </div>

        <div className="bg-stone-900 border border-amber-500/40 rounded-2xl p-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center space-x-1">
            <Crown className="w-3.5 h-3.5" />
            <span>Super Administrator</span>
          </span>
          <p className="text-lg font-black text-white mt-1 truncate">Wanjema</p>
          <p className="text-[11px] text-amber-300 mt-1 truncate">mutongawanjema001@gmail.com</p>
        </div>
      </div>

      {/* Notifications */}
      {formSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-950/70 border border-emerald-500/50 text-emerald-300 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{formSuccess}</span>
        </div>
      )}

      {/* Create Account Form Modal/Card */}
      {showAddForm && (
        <div className="bg-stone-900 border-2 border-amber-500/40 rounded-2xl p-5 shadow-xl animate-in fade-in duration-200">
          <h3 className="text-sm font-bold uppercase tracking-wider text-amber-400 mb-4 flex items-center space-x-2">
            <UserPlus className="w-4 h-4" />
            <span>Create New Staff Account (Admin or Cashier)</span>
          </h3>

          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  Staff Full Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Mary Wanjiku"
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-stone-400 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  Login Username <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  autoCapitalize="none"
                  value={username}
                  onChange={e => setUsername(e.target.value.toLowerCase())}
                  placeholder="e.g. mary (used to sign in)"
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-stone-400 focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  Email Address {role === 'admin' && <span className="text-amber-400 font-normal">(Receives monthly reports)</span>}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="e.g. staff@neemacereals.com"
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-stone-400 focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  Phone Number (Optional)
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+254 700 000 000"
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-stone-400 focus:outline-none font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  System Role <span className="text-red-400">*</span>
                </label>
                <select
                  value={role}
                  onChange={e => setRole(e.target.value as UserRole)}
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="cashier">Cashier (Sales POS, Expenses, Purchases pending approval)</option>
                  <option value="admin">Store Admin (Full Manager Access + Receives Monthly Reports)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  Initial Password / PIN <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="e.g. 1234 or cashier2026"
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-stone-400 focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/50 text-red-300 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="py-2 px-4 rounded-xl border border-stone-700 text-stone-300 text-xs hover:bg-stone-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="py-2 px-5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs shadow-md"
              >
                Create Staff Account
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Staff Accounts Table */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-stone-800 bg-stone-950/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-bold text-xs uppercase tracking-wider text-white">
              Registered Store Personnel ({users.length})
            </h3>
            <p className="text-[11px] text-stone-400">
              Super Admin Wanjema can reset the password for any staff member at any time
            </p>
          </div>
          <span className="text-[10px] text-amber-400 font-medium">
            Admins automatically receive monthly financial reports via email
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-950 border-b border-stone-800 text-stone-400 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Staff Member</th>
                <th className="py-3 px-4">Username</th>
                <th className="py-3 px-4">Email (Reports)</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Super Admin Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800">
              {users.map(u => {
                const isSuper = u.isSuperAdmin || u.username.toLowerCase() === 'wanjema';

                return (
                  <tr key={u.id} className="hover:bg-stone-800/40 transition">
                    <td className="py-3.5 px-4 font-semibold text-white whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                            isSuper
                              ? 'bg-amber-500 text-stone-950'
                              : u.role === 'admin'
                              ? 'bg-amber-600 text-white'
                              : 'bg-emerald-600 text-white'
                          }`}
                        >
                          {isSuper ? <Crown className="w-4 h-4" /> : u.role === 'admin' ? <Shield className="w-4 h-4" /> : <User className="w-4 h-4" />}
                        </div>
                        <div>
                          <p className="font-bold text-white flex items-center space-x-1.5">
                            <span>{u.name}</span>
                            {isSuper && (
                              <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                Super Admin
                              </span>
                            )}
                          </p>
                          <span className="text-[10px] text-stone-400">
                            {u.phone || 'No phone'}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-amber-400 whitespace-nowrap">
                      @{u.username}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap font-mono text-stone-300">
                      {u.email ? (
                        <div className="flex items-center space-x-1 text-emerald-400">
                          <Mail className="w-3 h-3 shrink-0" />
                          <span>{u.email}</span>
                        </div>
                      ) : (
                        <span className="text-stone-400 italic">No email set</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {u.role === 'admin' ? (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-amber-950 border border-amber-700/60 text-amber-400 text-[10px] font-bold">
                          <Shield className="w-3 h-3" />
                          <span>Admin / Manager</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-700/60 text-emerald-400 text-[10px] font-bold">
                          <User className="w-3 h-3" />
                          <span>Cashier</span>
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleStatus(u)}
                        disabled={isSuper}
                        className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold border transition ${
                          u.status === 'active'
                            ? 'bg-emerald-950/70 border-emerald-700/60 text-emerald-400 hover:bg-emerald-900/50'
                            : 'bg-red-950/70 border-red-700/60 text-red-400 hover:bg-red-900/50'
                        } ${isSuper ? 'cursor-default' : 'cursor-pointer'}`}
                        title={isSuper ? 'Super Admin cannot be suspended' : 'Click to toggle status'}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            u.status === 'active' ? 'bg-emerald-400' : 'bg-red-400'
                          }`}
                        />
                        <span className="capitalize">{u.status}</span>
                      </button>
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center space-x-2">
                        {/* Reset Password / Edit Button */}
                        <button
                          onClick={() => handleOpenResetModal(u)}
                          className="py-1 px-2.5 rounded-lg bg-amber-500/20 hover:bg-amber-500 hover:text-stone-950 text-amber-300 border border-amber-500/30 text-[11px] font-bold flex items-center space-x-1 transition shadow-sm"
                          title="Reset Password / Security PIN for this user"
                        >
                          <Key className="w-3.5 h-3.5" />
                          <span>Reset Password</span>
                        </button>

                        {/* Delete Button */}
                        {!isSuper && (
                          <button
                            onClick={() => {
                              if (window.confirm(`Are you sure you want to delete ${u.name}'s account?`)) {
                                deleteUserAccount(u.id);
                              }
                            }}
                            className="p-1.5 rounded-lg bg-stone-800 hover:bg-red-600 hover:text-white text-stone-400 transition"
                            title="Delete Account"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* SUPER ADMIN PASSWORD RESET & DETAILS MODAL */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-stone-900 border-2 border-amber-500/60 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <h4 className="font-bold text-sm text-white flex items-center space-x-2">
                <Key className="w-4 h-4 text-amber-400" />
                <span>Super Admin: Reset User Password</span>
              </h4>
              <span className="text-[10px] uppercase font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                {editingUser.role}
              </span>
            </div>

            <div className="bg-stone-950 p-3 rounded-xl border border-stone-800 text-xs">
              <p className="text-stone-300">
                Staff Name: <strong className="text-white">{editingUser.name}</strong>
              </p>
              <p className="text-stone-400 font-mono mt-0.5">
                Username: <strong className="text-amber-400">@{editingUser.username}</strong>
              </p>
            </div>

            <form onSubmit={handleSaveUserDetails} className="space-y-3">
              {/* New Password or PIN */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-stone-200">
                    New Password / PIN for User
                  </label>
                  <div className="flex items-center space-x-2 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setNewPassword('1234')}
                      className="text-amber-400 hover:text-amber-300 underline"
                    >
                      PIN: 1234
                    </button>
                    <button
                      type="button"
                      onClick={handleGenerateRandomPin}
                      className="text-amber-400 hover:text-amber-300 underline flex items-center space-x-0.5"
                    >
                      <RefreshCw className="w-2.5 h-2.5" />
                      <span>Random PIN</span>
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Enter new password (or leave blank to keep current)"
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono font-bold focus:outline-none focus:border-amber-500"
                  />
                  {newPassword && (
                    <button
                      type="button"
                      onClick={handleCopyNewPassword}
                      className="absolute right-2.5 top-2 p-1 rounded-lg bg-stone-800 text-stone-300 hover:text-white"
                      title="Copy new password to share with user"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                {copiedNotification && (
                  <p className="text-[10px] text-emerald-400 mt-1">Copied to clipboard!</p>
                )}
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  Email Address {editingUser.role === 'admin' ? '(Receives Monthly Reports)' : ''}
                </label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={e => setEditEmail(e.target.value)}
                  placeholder="e.g. admin@neemacereals.com"
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={e => setEditPhone(e.target.value)}
                  placeholder="+254 700 000 000"
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none"
                />
              </div>

              {resetSuccess && (
                <div className="p-2.5 rounded-xl bg-emerald-950 border border-emerald-500 text-emerald-300 text-xs flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{resetSuccess}</span>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="flex-1 py-2.5 rounded-xl border border-stone-700 text-stone-300 text-xs hover:bg-stone-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs shadow-md"
                >
                  Save New Password &amp; Details
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
