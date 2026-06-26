import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  GripVertical, Plus, Trash2, Edit2, Check, X,
  GitBranch, ArrowRightLeft, AlertCircle, Info
} from 'lucide-react';
import * as pipelineApi from '@/api/pipeline.api.ts';
import { Button } from '@/components/ui/Button.tsx';
import { useUIStore } from '@/store/ui.store.ts';

const COLORS = [
  '#6366f1', // Indigo
  '#3b82f6', // Blue
  '#06b6d4', // Cyan
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#ec4899', // Pink
  '#8b5cf6'  // Violet
];

export function PipelineStagesSettings() {
  const [type, setType] = useState<'lead' | 'deal'>('lead');
  const qc = useQueryClient();
  const { confirm } = useUIStore();

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [migrationModal, setMigrationModal] = useState<{ isOpen: boolean; stageId: string; stageName: string; count: number } | null>(null);

  const { data: stagesData, isLoading } = useQuery({
    queryKey: ['pipeline-stages', type],
    queryFn: () => pipelineApi.getStages({ type }),
  });

  const stages = (stagesData?.data || []).sort((a, b) => a.position - b.position);

  const reorderMutation = useMutation({
    mutationFn: (data: any) => pipelineApi.reorderStages(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pipeline-stages', type] });
      qc.invalidateQueries({ queryKey: ['leads'] });
      qc.invalidateQueries({ queryKey: ['deals'] });
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => pipelineApi.createStage(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pipeline-stages', type] });
      setIsAdding(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => pipelineApi.updateStage(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pipeline-stages', type] });
      setEditingId(null);
    },
  });

  const archiveMutation = useMutation({
    mutationFn: ({ id, targetStageId }: { id: string; targetStageId: string }) => pipelineApi.archiveStage(id, targetStageId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pipeline-stages', type] });
      setMigrationModal(null);
    },
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = stages.findIndex(s => s.id === active.id);
      const newIndex = stages.findIndex(s => s.id === over?.id);

      const newOrder = arrayMove(stages, oldIndex, newIndex);
      reorderMutation.mutate({
        stages: newOrder.map((s, i) => ({ id: s.id, position: i }))
      });
    }
  };

  const handleArchive = async (stage: any) => {
    // In a real app, we'd check lead/deal count from the backend
    // For this implementation, we'll assume a dummy count if not provided
    const count = (stage as any).recordsCount ?? 0;

    if (count > 0) {
      setMigrationModal({ isOpen: true, stageId: stage.id, stageName: stage.name, count });
    } else {
      if (await confirm({
        title: 'Archive Stage',
        message: `Are you sure you want to archive "${stage.name}"?`,
        confirmText: 'Archive',
        variant: 'danger'
      })) {
        archiveMutation.mutate({ id: stage.id, targetStageId: '' });
      }
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-6">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm">
            <GitBranch className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Pipeline Stages</h2>
            <p className="text-sm text-slate-500">Configure your sales workflow and deal progression.</p>
          </div>
        </div>
      </div>

      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit mb-8">
        <button
          onClick={() => setType('lead')}
          className={`px-6 py-2 text-sm font-bold rounded-lg transition-all ${type === 'lead' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Lead Stages
        </button>
        <button
          onClick={() => setType('deal')}
          className={`px-6 py-2 text-sm font-bold rounded-lg transition-all ${type === 'deal' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Deal Stages
        </button>
      </div>

      <div className="space-y-3">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={stages.map(s => s.id)} strategy={verticalListSortingStrategy}>
            {stages.map(stage => (
              <StageRow
                key={stage.id}
                stage={stage}
                isEditing={editingId === stage.id}
                onEdit={() => setEditingId(stage.id)}
                onCancel={() => setEditingId(null)}
                onSave={(data: any) => updateMutation.mutate({ id: stage.id, data })}
                onArchive={() => handleArchive(stage)}
                onToggleActive={(isActive: boolean) => updateMutation.mutate({ id: stage.id, data: { isActive } })}
              />
            ))}
          </SortableContext>
        </DndContext>

        {isAdding ? (
          <StageForm
            type={type}
            onCancel={() => setIsAdding(false)}
            onSave={(data: any) => createMutation.mutate({ ...data, type, position: stages.length })}
          />
        ) : (
          <button
            onClick={() => setIsAdding(true)}
            className="w-full flex items-center justify-center gap-2 py-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50 transition-all font-bold text-sm"
          >
            <Plus className="h-5 w-5" /> Add New {type === 'lead' ? 'Lead' : 'Deal'} Stage
          </button>
        )}
      </div>

      {migrationModal?.isOpen && (
        <MigrationModal
          isOpen={migrationModal.isOpen}
          stageId={migrationModal.stageId}
          stageName={migrationModal.stageName}
          count={migrationModal.count}
          stages={stages.filter(s => s.id !== migrationModal.stageId && s.isActive)}
          onClose={() => setMigrationModal(null)}
          onConfirm={(targetId: string) => archiveMutation.mutate({ id: migrationModal.stageId, targetStageId: targetId })}
        />
      )}
    </div>
  );
}

function StageRow({ stage, isEditing, onEdit, onCancel, onSave, onArchive, onToggleActive }: any) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: stage.id });
  const [name, setName] = useState(stage.name);
  const [color, setColor] = useState(stage.color || COLORS[0]);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
  };

  if (isEditing) {
    return (
      <div ref={setNodeRef} style={style} className="bg-indigo-50 border-2 border-indigo-200 rounded-2xl p-4 flex items-center gap-4 shadow-lg shadow-indigo-100">
        <div className="flex-1 flex items-center gap-4">
          <div className="flex gap-2">
            {COLORS.map(c => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`h-6 w-6 rounded-full border-2 transition-all ${color === c ? 'border-white ring-2 ring-indigo-400 scale-110' : 'border-transparent hover:scale-110'}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
          <input
            autoFocus
            value={name}
            onChange={e => setName(e.target.value)}
            className="flex-1 px-3 py-2 border border-indigo-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-200 bg-white"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => onSave({ name, color })}>
            <Check className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div ref={setNodeRef} style={style} className={`bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-4 transition-all group ${isDragging ? 'shadow-2xl ring-2 ring-indigo-500 scale-[1.02]' : 'hover:border-slate-300 hover:shadow-sm'}`}>
      <div className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600 px-1" {...attributes} {...listeners}>
        <GripVertical className="h-5 w-5" />
      </div>

      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="h-3 w-3 rounded-full flex-shrink-0" style={{ backgroundColor: stage.color || '#cbd5e1' }} />
        <span className="font-bold text-slate-800 truncate">{stage.name}</span>
        {stage.isDefault && <span className="text-[9px] font-black uppercase tracking-widest bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded leading-none">Default</span>}
        {stage.isSystem && <span className="text-[9px] font-black uppercase tracking-widest bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded leading-none">System</span>}
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
          <ArrowRightLeft className="h-3 w-3 text-slate-400" />
          <span className="text-xs font-black text-slate-500">{stage.recordsCount || 0}</span>
        </div>

        <div className="flex items-center gap-3">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={stage.isActive}
              onChange={e => onToggleActive(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
          </label>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={onEdit} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors">
              <Edit2 className="h-4 w-4" />
            </button>
            <button onClick={onArchive} className="p-2 hover:bg-red-50 rounded-lg text-slate-500 hover:text-red-600 transition-colors">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StageForm({ onCancel, onSave }: any) {
  const [name, setName] = useState('');
  const [color, setColor] = useState(COLORS[0]);

  return (
    <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-4 flex items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="flex-1 flex items-center gap-4">
        <div className="flex gap-2">
          {COLORS.map(c => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={`h-6 w-6 rounded-full border-2 transition-all ${color === c ? 'border-white ring-2 ring-indigo-400 scale-110' : 'border-transparent hover:scale-110'}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
        <input
          autoFocus
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Enter stage name..."
          className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-indigo-400 bg-white"
        />
      </div>
      <div className="flex items-center gap-2">
        <Button size="sm" onClick={() => name && onSave({ name, color })}>
          Save Stage
        </Button>
        <Button variant="outline" size="sm" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

function MigrationModal({ isOpen, stageId, stageName, count, stages, onClose, onConfirm }: any) {
  const [targetId, setTargetId] = useState(stages[0]?.id || '');

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-8">
          <div className="h-14 w-14 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
            <AlertCircle className="h-8 w-8" />
          </div>

          <h2 className="text-2xl font-black text-slate-900 mb-2">Move records before archiving</h2>
          <p className="text-slate-500 mb-8 leading-relaxed">
            There are <span className="font-black text-slate-900">{count} records</span> currently in the <span className="font-black text-slate-900">"{stageName}"</span> stage. Please select where to move them.
          </p>

          <div className="space-y-6">
            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Migrate all records to:</label>
              <select
                value={targetId}
                onChange={e => setTargetId(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-indigo-400 bg-white shadow-sm"
              >
                {stages.map((s: any) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div className="bg-amber-50 p-4 rounded-2xl flex gap-3 border border-amber-100">
              <Info className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 font-medium leading-relaxed">
                Archiving will hide this stage from all boards and forms. This action can be undone later from the archived stages view.
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 bg-slate-50 flex gap-3">
          <Button variant="outline" className="flex-1 py-4 font-bold" onClick={onClose}>
            Cancel
          </Button>
          <Button className="flex-1 py-4 font-bold shadow-lg" onClick={() => onConfirm(targetId)}>
            Migrate & Archive
          </Button>
        </div>
      </div>
    </div>
  );
}
