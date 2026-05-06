import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, RotateCcw, AlertCircle, CheckCircle2, ChevronRight, GripVertical, Power } from 'lucide-react';
import * as leadScoringApi from '@/api/leadScoring.api.ts';
import { Button } from '@/components/ui/Button.tsx';
import type { ScoringRule } from '@/api/leadScoring.api.ts';

export function LeadScoringSettings() {
  const qc = useQueryClient();
  const [localRules, setLocalRules] = useState<ScoringRule[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  const { data: rulesData, isLoading } = useQuery({
    queryKey: ['lead-scoring-rules'],
    queryFn: () => leadScoringApi.getRules(),
  });

  useEffect(() => {
    if (rulesData?.data) {
      setLocalRules(rulesData.data);
    }
  }, [rulesData]);

  const updateMutation = useMutation({
    mutationFn: (rules: ScoringRule[]) => leadScoringApi.updateRules(rules),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['lead-scoring-rules'] });
      setHasChanges(false);
    },
  });

  const resetMutation = useMutation({
    mutationFn: () => leadScoringApi.resetRules(),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['lead-scoring-rules'] });
      setLocalRules(res.data);
      setHasChanges(false);
    },
  });

  const handleRuleChange = (id: string, updates: Partial<ScoringRule>) => {
    setLocalRules(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
    setHasChanges(true);
  };

  const calculatePreviewScore = () => {
    // Example Mock Lead: Referral, High Priority, Has Email, No Phone
    const mockLead = {
      email: 'jane@example.com',
      priority: 'high',
      source: 'referral',
      companyId: '123',
      communicationCount: 1,
      lastActivityAt: new Date().toISOString(),
    };

    let score = 0;
    localRules.forEach(rule => {
      if (!rule.isActive) return;
      if (rule.id === 'has_email' && mockLead.email) score += rule.points;
      if (rule.id === 'priority_high' && mockLead.priority === 'high') score += rule.points;
      if (rule.id === 'source_referral' && mockLead.source === 'referral') score += rule.points;
      if (rule.id === 'has_company' && mockLead.companyId) score += rule.points;
      if (rule.id === 'had_communication' && mockLead.communicationCount > 0) score += rule.points;
      if (rule.id === 'recent_activity') score += rule.points; // Always true for mock
    });

    return Math.min(score, 100);
  };

  if (isLoading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;

  const previewScore = calculatePreviewScore();

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Intelligence Scoring Engine</h2>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Configure weights for lead prioritization</p>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => resetMutation.mutate()}
            className="rounded-xl border-slate-200 font-black uppercase tracking-widest text-[10px]"
          >
            <RotateCcw className="h-3 w-3 mr-2" /> Reset Defaults
          </Button>
          <Button 
            size="sm" 
            disabled={!hasChanges} 
            onClick={() => updateMutation.mutate(localRules)}
            isLoading={updateMutation.isPending}
            className="rounded-xl shadow-lg shadow-indigo-500/20 font-black uppercase tracking-widest text-[10px]"
          >
            <Save className="h-3 w-3 mr-2" /> Commit Rules
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-3">
          {localRules.map((rule) => (
            <div 
              key={rule.id}
              className={`group flex items-center gap-4 p-4 rounded-2xl border transition-all ${rule.isActive ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm' : 'bg-slate-50 dark:bg-slate-950 border-transparent opacity-60'}`}
            >
              <div className="cursor-grab text-slate-300 group-hover:text-slate-400">
                <GripVertical className="h-5 w-5" />
              </div>
              
              <button 
                onClick={() => handleRuleChange(rule.id, { isActive: !rule.isActive })}
                className={`h-10 w-10 rounded-xl flex items-center justify-center transition-colors ${rule.isActive ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600' : 'bg-slate-200 dark:bg-slate-800 text-slate-400'}`}
              >
                <Power className="h-5 w-5" />
              </button>

              <div className="flex-1">
                <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{rule.label}</h4>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 font-mono">{rule.condition}</p>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Weight</span>
                <input 
                  type="number"
                  value={rule.points}
                  onChange={(e) => handleRuleChange(rule.id, { points: parseInt(e.target.value) || 0 })}
                  className="w-16 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-black text-center focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 rounded-3xl p-8 border border-slate-800 shadow-2xl sticky top-24">
            <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6 flex items-center">
              <ChevronRight className="h-4 w-4 mr-1 text-indigo-500" /> Scoring Simulation
            </h3>

            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mock Entity Score</p>
                  <p className="text-4xl font-black text-white">{previewScore}<span className="text-slate-600 text-lg">/100</span></p>
                </div>
                <div className={`h-16 w-16 rounded-2xl flex items-center justify-center border-4 ${previewScore > 70 ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-500' : 'border-indigo-500/50 bg-indigo-500/10 text-indigo-500'}`}>
                  {previewScore > 70 ? <CheckCircle2 className="h-8 w-8" /> : <AlertCircle className="h-8 w-8" />}
                </div>
              </div>

              <div className="space-y-2">
                <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-700 ease-out ${previewScore > 70 ? 'bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.4)]' : 'bg-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.4)]'}`}
                    style={{ width: `${previewScore}%` }}
                  />
                </div>
                <div className="flex justify-between">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Cold</span>
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Qualified</span>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-800 space-y-4">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Entity Context:</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-slate-800/50 rounded-xl">
                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Source</p>
                    <p className="text-xs font-bold text-white mt-1">Referral</p>
                  </div>
                  <div className="p-3 bg-slate-800/50 rounded-xl">
                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Priority</p>
                    <p className="text-xs font-bold text-white mt-1">High</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
