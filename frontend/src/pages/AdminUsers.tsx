import React, { useState, useEffect } from 'react';
import { authService } from '@/services/auth';
import type { User, UserCreate, Role } from '@/types/auth';
import { DataTable, type Column } from '@/components/common/DataTable';
import { Badge } from '@/components/common/Badge';
import { UserCog, Plus, Shield, CheckCircle2, AlertCircle } from 'lucide-react';

export const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState<UserCreate>({
    email: '',
    password: '',
    full_name: '',
    role: 'DISTRICT_OFFICER',
    assigned_state: '',
    assigned_district: '',
    assigned_mp_name: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await authService.getUsers();
      setUsers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    try {
      await authService.createUser({
        ...form,
        assigned_state: form.assigned_state || null,
        assigned_district: form.assigned_district || null,
        assigned_mp_name: form.assigned_mp_name || null,
      });
      setSuccess(`User ${form.email} provisioned successfully.`);
      setShowModal(false);
      setForm({
        email: '',
        password: '',
        full_name: '',
        role: 'DISTRICT_OFFICER',
        assigned_state: '',
        assigned_district: '',
        assigned_mp_name: '',
      });
      loadUsers();
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to create user account.');
    }
  };

  const columns: Column<User>[] = [
    {
      header: 'ID',
      accessor: 'id',
      render: (u) => <span className="font-mono text-slate-500 text-xs">#{u.id}</span>,
    },
    {
      header: 'Official Name',
      accessor: 'full_name',
      render: (u) => <span className="font-bold text-slate-900">{u.full_name}</span>,
    },
    {
      header: 'Email / Username',
      accessor: 'email',
      render: (u) => <span className="font-mono text-xs text-slate-700">{u.email}</span>,
    },
    {
      header: 'Role',
      accessor: 'role',
      render: (u) => (
        <Badge
          variant={
            u.role === 'MINISTRY'
              ? 'high'
              : u.role === 'STATE_OFFICER'
              ? 'review'
              : u.role === 'DISTRICT_OFFICER'
              ? 'success'
              : 'info'
          }
        >
          {u.role}
        </Badge>
      ),
    },
    {
      header: 'Assigned Jurisdiction Scope',
      render: (u) => (
        <span className="text-xs text-slate-700">
          {u.role === 'MINISTRY'
            ? 'All-India National Oversight'
            : u.role === 'STATE_OFFICER'
            ? `State: ${u.assigned_state}`
            : u.role === 'DISTRICT_OFFICER'
            ? `District: ${u.assigned_district}, ${u.assigned_state}`
            : u.role === 'MP'
            ? `MP: ${u.assigned_mp_name}`
            : '—'}
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: 'is_active',
      render: (u) => (
        <Badge variant={u.is_active ? 'success' : 'neutral'} size="sm">
          {u.is_active ? 'ACTIVE' : 'REVOKED'}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-slate-900 text-white">
              <UserCog className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">Stakeholder User Administration</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Central MoSPI User Provisioning Console • PostgreSQL RLS Jurisdictional Management
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-all shadow"
        >
          <Plus className="w-4 h-4" />
          <span>Provision New Stakeholder</span>
        </button>
      </div>

      {success && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{success}</span>
        </div>
      )}

      <DataTable
        columns={columns}
        data={users}
        keyExtractor={(u) => u.id}
        isLoading={loading}
        emptyMessage="No users found in system."
      />

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
              <Shield className="w-4 h-4 text-amber-500" />
              Provision Stakeholder Account
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Create a new authenticated officer account with bound jurisdictional access.
            </p>

            {error && (
              <div className="mb-4 p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Official Name</label>
                <input
                  type="text"
                  required
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full border border-slate-300 rounded-lg px-3 py-1.5 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Government Email</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="officer@mplads.gov.in"
                  className="w-full border border-slate-300 rounded-lg px-3 py-1.5 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Initial Password (min 8 chars)</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••••••"
                  className="w-full border border-slate-300 rounded-lg px-3 py-1.5 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Administrative Role</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value as Role })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-1.5 focus:outline-none bg-white font-medium"
                >
                  <option value="MINISTRY">Central Ministry (MoSPI)</option>
                  <option value="STATE_OFFICER">State Nodal Officer</option>
                  <option value="DISTRICT_OFFICER">District Planning Officer</option>
                  <option value="MP">Member of Parliament</option>
                </select>
              </div>

              {(form.role === 'STATE_OFFICER' || form.role === 'DISTRICT_OFFICER') && (
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Assigned State</label>
                  <input
                    type="text"
                    required
                    value={form.assigned_state || ''}
                    onChange={(e) => setForm({ ...form, assigned_state: e.target.value })}
                    placeholder="e.g. Uttar Pradesh"
                    className="w-full border border-slate-300 rounded-lg px-3 py-1.5 focus:outline-none"
                  />
                </div>
              )}

              {form.role === 'DISTRICT_OFFICER' && (
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Assigned District</label>
                  <input
                    type="text"
                    required
                    value={form.assigned_district || ''}
                    onChange={(e) => setForm({ ...form, assigned_district: e.target.value })}
                    placeholder="e.g. PATNA"
                    className="w-full border border-slate-300 rounded-lg px-3 py-1.5 focus:outline-none uppercase"
                  />
                </div>
              )}

              {form.role === 'MP' && (
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Assigned MP Name</label>
                  <input
                    type="text"
                    required
                    value={form.assigned_mp_name || ''}
                    onChange={(e) => setForm({ ...form, assigned_mp_name: e.target.value })}
                    placeholder="e.g. SARABJEET SINGH KHALSA"
                    className="w-full border border-slate-300 rounded-lg px-3 py-1.5 focus:outline-none uppercase"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-1.5 text-slate-600 hover:text-slate-800 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold"
                >
                  Provision User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
