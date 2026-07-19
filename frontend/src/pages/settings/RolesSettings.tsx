import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Shield, Plus, Lock, Check, Trash2, ShieldCheck, AlertCircle } from 'lucide-react';
import * as settingsApi from '@/api/settings.api.ts';
import { Button } from '@/components/ui/Button.tsx';
import { useUIStore } from '@/store/ui.store.ts';

const RESOURCES = [
  'Leads', 'Deals', 'Contacts', 'Companies', 
  'Tasks', 'Communications', 'Products', 'Proposals', 
  'Reports', 'Settings'
];

const ACTIONS = ['create', 'read', 'update', 'delete', 'export'];

export function RolesSettings() {
  const qc = useQueryClient();
  const { confirm } = useUIStore();
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [isAddingRole, setIsAddingRole] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');

  const { data: rolesData, isLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: () => settingsApi.getRoles(),
  });

  const roles = rolesData?.data || [];
  const selectedRole = roles.find(r => r.id === selectedRoleId) || roles[0];

  useEffect(() => {
    if (!selectedRoleId && roles.length > 0) {
      setSelectedRoleId(roles[0].id);
    }
  }, [roles, selectedRoleId]);

  const createMutation = useMutation({
    mutationFn: (data: any) => settingsApi.createRole(data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['roles'] });
      setIsAddingRole(false);
      setNewRoleName('');
      setSelectedRoleId(res.data.id);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => settingsApi.deleteRole(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['roles'] });
      setSelectedRoleId(roles[0]?.id || null);
    },
  });

  const updatePermissionsMutation = useMutation({
    mutationFn: ({ id, permissions }: { id: string; permissions: any[] }) => 
      settingsApi.updateRolePermissions(id, permissions),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['roles'] }),
  });

  const handleTogglePermission = (resource: string, action: string, checked: boolean) => {
    if (!selectedRole || selectedRole.isSystem) return;

    const currentPermissions = selectedRole.permissions || [];
    let newPermissions;

    if (checked) {
      newPermissions = [...currentPermissions, { resource: resource.toLowerCase(), action }];
    } else {
      newPermissions = currentPermissions.filter(
        p => !(p.resource === resource.toLowerCase() && p.action === action)
      );
    }

    updatePermissionsMutation.mutate({ 
      id: selectedRole.id, 
      permissions: newPermissions.map(p => ({ resource: p.resource, action: p.action })) 
    });
  };

  const handleDeleteRole = async (role: any) => {
    if (await confirm({
      title: 'Delete Role',
      message: `Are you sure you want to delete the "${role.name}" role? This will affect all members assigned to this role.`,
      variant: 'danger'
    })) {
      deleteMutation.mutate(role.id);
    }
  };

  if (isLoading) return <div className="p-8 text-center text-slate-500">Loading roles...</div>;

  return (
    <div className="flex flex-col lg:flex-row h-full min-h-[600px]">
      {/* Left: Role List */}
      <div className="w-full lg:w-64 border-b lg:border-b-0 lg:border-r border-[var(--border)] p-6 flex flex-col shrink-0">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Roles</h3>
          <button 
            onClick={() => setIsAddingRole(true)}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-1 overflow-y-auto pr-2">
          {isAddingRole && (
            <div className="mb-4 animate-in fade-in slide-in-from-top-2 duration-200">
              <input 
                autoFocus
                value={newRoleName}
                onChange={e => setNewRoleName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && newRoleName && createMutation.mutate({ name: newRoleName })}
                placeholder="Role name..."
                className="w-full px-3 py-2 border border-indigo-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-100 mb-2"
              />
              <div className="flex gap-1">
                <Button size="sm" className="flex-1 py-1 text-xs" onClick={() => createMutation.mutate({ name: newRoleName })}>Add</Button>
                <Button variant="outline" size="sm" className="flex-1 py-1 text-xs" onClick={() => setIsAddingRole(false)}>Cancel</Button>
              </div>
            </div>
          )}

          {roles.map((role: any) => (
            <button
              key={role.id}
              onClick={() => setSelectedRoleId(role.id)}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-bold transition-all group ${
                selectedRoleId === role.id 
                  ? 'bg-[var(--sidebar-item-active-bg)] text-[var(--sidebar-text-active)] shadow-sm border border-[var(--border)]' 
                  : 'text-[var(--text-secondary)] hover:bg-[var(--sidebar-item-active-bg)]/50 hover:text-[var(--text-primary)]'
              }`}
            >
              <div className="flex items-center gap-2.5 truncate">
                {role.isSystem ? <Lock className="h-3.5 w-3.5 text-slate-400" /> : <Shield className="h-3.5 w-3.5 text-indigo-400" />}
                <span className="truncate">{role.name}</span>
              </div>
              {!role.isSystem && selectedRoleId === role.id && (
                <button 
                  onClick={(e) => { e.stopPropagation(); handleDeleteRole(role); }}
                  className="opacity-0 group-hover:opacity-100 hover:text-red-600 transition-all p-1"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Right: Permission Matrix */}
      <div className="flex-1 p-4 sm:p-8 overflow-y-auto">
        {!selectedRole ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <ShieldCheck className="h-16 w-16 mb-4 text-slate-100" />
            <p className="font-bold">Select a role to manage permissions</p>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-2xl font-black text-slate-900">{selectedRole.name}</h2>
                  {selectedRole.isSystem && (
                    <span className="text-[10px] font-black uppercase tracking-widest bg-slate-100 text-slate-500 px-2 py-0.5 rounded border border-slate-200">System Role</span>
                  )}
                </div>
                <p className="text-slate-500 text-sm font-medium">{selectedRole.description || 'Manage access levels for this role.'}</p>
              </div>
            </div>

            {selectedRole.isSystem && (
              <div className="mb-8 p-4 bg-amber-50 rounded-2xl flex gap-3 border border-amber-100 shadow-sm">
                <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-amber-900 font-black uppercase tracking-widest mb-1">Read-Only Role</p>
                  <p className="text-xs text-amber-700 font-medium leading-relaxed">
                    This is a system-defined role. Permissions for system roles are fixed and cannot be modified.
                  </p>
                </div>
              </div>
            )}

            <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-3xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left min-w-[700px]">
                  <thead className="bg-[var(--content-bg)] border-b border-[var(--border)]">
                  <tr>
                    <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Resource</th>
                    {ACTIONS.map(action => (
                      <th key={action} className="px-4 py-4 text-center text-xs font-black text-slate-500 uppercase tracking-widest">{action}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {RESOURCES.map(res => (
                    <tr key={res} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-800 text-sm">{res}</td>
                      {ACTIONS.map(action => {
                        const isChecked = selectedRole.permissions?.some(
                          (p: any) => p.resource === res.toLowerCase() && p.action === action
                        );
                        return (
                          <td key={action} className="px-4 py-4 text-center">
                            <label className={`inline-flex items-center justify-center cursor-pointer ${selectedRole.isSystem ? 'opacity-40 cursor-not-allowed' : ''}`}>
                              <input 
                                type="checkbox" 
                                className="sr-only peer"
                                checked={isChecked}
                                disabled={selectedRole.isSystem || updatePermissionsMutation.isPending}
                                onChange={(e) => handleTogglePermission(res, action, e.target.checked)}
                              />
                              <div className={`h-6 w-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                                isChecked 
                                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-100' 
                                  : 'bg-white border-slate-200 text-transparent'
                              }`}>
                                <Check className="h-4 w-4 stroke-[3px]" />
                              </div>
                            </label>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
