import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Users, Mail, UserPlus, Shield, MoreVertical, 
  Slash, Trash2, Copy, Check, X, UserX 
} from 'lucide-react';
import { format } from 'date-fns';
import * as settingsApi from '@/api/settings.api.ts';
import { Button } from '@/components/ui/Button.tsx';
import { useUIStore } from '@/store/ui.store.ts';

export function TeamSettings() {
  const qc = useQueryClient();
  const { confirm } = useUIStore();
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteResult, setInviteResult] = useState<string | null>(null);

  const { data: usersData, isLoading } = useQuery({
    queryKey: ['team-members'],
    queryFn: () => settingsApi.getUsers(),
  });

  const { data: rolesData } = useQuery({
    queryKey: ['roles'],
    queryFn: () => settingsApi.getRoles(),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => settingsApi.updateUser(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['team-members'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: ({ id, reassignToId }: { id: string; reassignToId: string }) => settingsApi.deleteUser(id, { reassignToId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['team-members'] });
      qc.invalidateQueries({ queryKey: ['leads'] });
      qc.invalidateQueries({ queryKey: ['deals'] });
    },
  });

  const inviteMutation = useMutation({
    mutationFn: (data: any) => settingsApi.inviteUser(data),
    onSuccess: (res) => {
      setInviteResult(res.data.inviteLink);
    },
  });

  const users = Array.isArray(usersData?.data) 
    ? usersData.data 
    : (usersData?.data as any)?.data || [];
  const roles = rolesData?.data || [];

  const handleStatusToggle = (user: any) => {
    const newStatus = user.status === 'active' ? 'suspended' : 'active';
    updateMutation.mutate({ id: user.id, data: { status: newStatus } });
  };

  const handleDelete = async (user: any) => {
    // In a real app, we check counts of leads/deals assigned to this user
    const count = (user as any).activeRecordsCount ?? 0;
    
    if (count > 0) {
      // Reassignment flow
      const otherUsers = users.filter((u: any) => u.id !== user.id && u.status === 'active');
      if (otherUsers.length === 0) {
        alert("No other active users to reassign records to.");
        return;
      }
      
      // We'll use a simplified reassignment here, normally a custom modal
      if (await confirm({
        title: 'Reassign Records',
        message: `${user.firstName} has ${count} active records. These must be reassigned before removal.`,
        confirmText: 'Continue to Reassignment'
      })) {
        // Simplified: pick the first available user
        const targetUser = otherUsers[0];
        deleteMutation.mutate({ id: user.id, reassignToId: targetUser.id });
      }
    } else {
      if (await confirm({
        title: 'Remove User',
        message: `Are you sure you want to remove ${user.firstName} from the team?`,
        confirmText: 'Remove',
        variant: 'danger'
      })) {
        deleteMutation.mutate({ id: user.id, reassignToId: '' });
      }
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-6">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Team Members</h2>
            <p className="text-sm text-slate-500">Manage your team's access and roles.</p>
          </div>
        </div>
        <Button onClick={() => { setIsInviteOpen(true); setInviteResult(null); }}>
          <UserPlus className="h-4 w-4 mr-2" /> Invite Member
        </Button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-sm min-w-[600px]">
            <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Member</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Role</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Last Login</th>
              <th className="px-6 py-4 w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr><td colSpan={5} className="p-8 text-center text-slate-400">Loading team...</td></tr>
            ) : users.map((u: any) => (
              <tr key={u.id} className="hover:bg-slate-50 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-black border-2 border-white shadow-sm ring-1 ring-slate-100">
                      {u.firstName.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{u.firstName} {u.lastName}</p>
                      <p className="text-xs text-slate-500 flex items-center gap-1">
                        <Mail className="h-3 w-3" /> {u.email}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <select 
                    value={u.roleId || u.role} 
                    onChange={e => updateMutation.mutate({ id: u.id, data: { roleId: e.target.value } })}
                    className="text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-400 shadow-sm appearance-none cursor-pointer"
                  >
                    <option value="admin">Administrator</option>
                    <option value="manager">Manager</option>
                    <option value="user">User</option>
                    {roles.filter(r => !r.isSystem).map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                    u.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'
                  }`}>
                    {u.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-xs text-slate-500 font-medium">
                  {u.lastLoginAt ? format(new Date(u.lastLoginAt), 'MMM dd, HH:mm') : 'Never'}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => handleStatusToggle(u)}
                      className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
                      title={u.status === 'active' ? 'Suspend' : 'Activate'}
                    >
                      {u.status === 'active' ? <Slash className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                    </button>
                    <button 
                      onClick={() => handleDelete(u)}
                      className="p-2 hover:bg-red-50 rounded-lg text-slate-500 hover:text-red-600 transition-colors"
                      title="Remove"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      {isInviteOpen && (
        <InviteModal 
          isOpen={isInviteOpen}
          roles={roles}
          result={inviteResult}
          isInviting={inviteMutation.isPending}
          onClose={() => setIsInviteOpen(false)}
          onInvite={(data: any) => inviteMutation.mutate(data)}
        />
      )}
    </div>
  );
}

function InviteModal({ isOpen, roles, result, isInviting, onClose, onInvite }: any) {
  const [form, setForm] = useState({ email: '', firstName: '', lastName: '', roleId: 'user' });
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (result) {
      navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-8">
          <div className="h-14 w-14 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
            <UserPlus className="h-8 w-8" />
          </div>
          
          <h2 className="text-2xl font-black text-slate-900 mb-2">Invite team member</h2>
          <p className="text-slate-500 mb-8">Send an invitation to join your organization.</p>
          
          {result ? (
            <div className="space-y-6">
              <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100 flex flex-col items-center text-center">
                <div className="h-12 w-12 bg-white rounded-full flex items-center justify-center text-emerald-500 shadow-sm mb-4">
                  <Check className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-emerald-900">Invitation Link Generated</h3>
                <p className="text-sm text-emerald-700 mt-1 mb-6">Copy this link and send it to your team member.</p>
                
                <div className="w-full flex gap-2">
                  <input 
                    readOnly 
                    value={result} 
                    className="flex-1 px-4 py-3 bg-white border border-emerald-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none" 
                  />
                  <Button onClick={handleCopy} className={copied ? 'bg-emerald-600' : ''}>
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <Button variant="outline" className="w-full py-4 font-bold rounded-2xl" onClick={onClose}>
                Close
              </Button>
            </div>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); onInvite(form); }} className="space-y-6">
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input 
                    required 
                    type="email" 
                    value={form.email} 
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="teammate@company.com"
                    className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-indigo-400 shadow-sm transition-all" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">First Name</label>
                  <input 
                    required 
                    value={form.firstName} 
                    onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
                    placeholder="Jane"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-indigo-400 shadow-sm transition-all" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Last Name</label>
                  <input 
                    required 
                    value={form.lastName} 
                    onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))}
                    placeholder="Smith"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-indigo-400 shadow-sm transition-all" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Assign Role</label>
                <div className="relative">
                  <Shield className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <select 
                    value={form.roleId} 
                    onChange={e => setForm(f => ({ ...f, roleId: e.target.value }))}
                    className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-indigo-400 shadow-sm bg-white appearance-none transition-all"
                  >
                    <option value="admin">Administrator</option>
                    <option value="manager">Manager</option>
                    <option value="user">Standard User</option>
                    {roles.filter((r: any) => !r.isSystem).map((r: any) => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="outline" className="flex-1 py-4 font-bold rounded-2xl" onClick={onClose} type="button">
                  Cancel
                </Button>
                <Button className="flex-1 py-4 font-bold rounded-2xl shadow-indigo-100 shadow-lg" type="submit" isLoading={isInviting}>
                  Send Invitation
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
