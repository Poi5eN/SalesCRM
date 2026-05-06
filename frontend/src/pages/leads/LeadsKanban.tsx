import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors,
  type DragEndEvent, type DragStartEvent,
} from '@dnd-kit/core';
import { useDroppable } from '@dnd-kit/core';
import { useDraggable } from '@dnd-kit/core';
import { Plus, GripVertical } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { Lead } from '@/types/api.types.ts';
import * as leadsApi from '@/api/leads.api.ts';
import { formatCurrency } from '@/utils/format.ts';
import { getPriorityDotColor, getScoreColor } from './leadUtils.ts';

interface KanbanColumn {
  stage: { id: string; name: string; color?: string };
  leads: Lead[];
  totalCount: number;
  totalValue: number;
}

interface LeadsKanbanProps {
  columns: KanbanColumn[];
  onCardClick: (lead: Lead) => void;
  onAddLead: (stageId: string) => void;
  currency?: string;
}

export function LeadsKanban({ columns, onCardClick, onAddLead, currency = 'INR' }: LeadsKanbanProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [localColumns, setLocalColumns] = useState(columns);
  const qc = useQueryClient();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  // Sync local state when prop changes
  if (JSON.stringify(columns.map(c => c.stage.id)) !== JSON.stringify(localColumns.map(c => c.stage.id))) {
    setLocalColumns(columns);
  }

  const moveMutation = useMutation({
    mutationFn: ({ leadId, stageId }: { leadId: string; stageId: string }) =>
      leadsApi.updateLead(leadId, { stageId }),
    onError: () => {
      // rollback: restore from server
      qc.invalidateQueries({ queryKey: ['leads', 'board'] });
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['leads', 'board'] }),
  });

  const findActiveLead = (): Lead | undefined => {
    if (!activeId) return undefined;
    for (const col of localColumns) {
      const lead = col.leads.find(l => l.id === activeId);
      if (lead) return lead;
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const leadId = active.id as string;
    // over.id can be a stageId (droppable column) or a leadId (droppable card)
    // We'll use stageId format "stage-{id}" for column drops
    const targetStageId = (over.id as string).startsWith('stage-')
      ? (over.id as string).replace('stage-', '')
      : findLeadStage(over.id as string);

    if (!targetStageId) return;

    const sourceCol = localColumns.find(c => c.leads.some(l => l.id === leadId));
    if (!sourceCol || sourceCol.stage.id === targetStageId) return;

    // Optimistic update
    setLocalColumns(prev => {
      const sourceLead = prev.flatMap(c => c.leads).find(l => l.id === leadId);
      if (!sourceLead) return prev;
      return prev.map(col => {
        if (col.stage.id === sourceCol.stage.id) {
          return { ...col, leads: col.leads.filter(l => l.id !== leadId), totalCount: col.totalCount - 1 };
        }
        if (col.stage.id === targetStageId) {
          const updatedLead = { ...sourceLead, stageId: targetStageId };
          return { ...col, leads: [...col.leads, updatedLead], totalCount: col.totalCount + 1 };
        }
        return col;
      });
    });

    moveMutation.mutate({ leadId, stageId: targetStageId });
  };

  const findLeadStage = (leadId: string): string | undefined => {
    return localColumns.find(c => c.leads.some(l => l.id === leadId))?.stage.id;
  };

  const activeLead = findActiveLead();

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: 'calc(100vh - 260px)' }}>
        {localColumns.map(col => (
          <KanbanColumn
            key={col.stage.id}
            column={col}
            onCardClick={onCardClick}
            onAddLead={onAddLead}
            currency={currency}
          />
        ))}
      </div>

      <DragOverlay>
        {activeLead && (
          <div className="opacity-90 rotate-1 scale-105">
            <LeadCard lead={activeLead} onClick={() => {}} currency={currency} isDragging />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}

function KanbanColumn({ column, onCardClick, onAddLead, currency }: {
  column: KanbanColumn;
  onCardClick: (lead: Lead) => void;
  onAddLead: (stageId: string) => void;
  currency: string;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `stage-${column.stage.id}` });

  return (
    <div className="flex-shrink-0 w-72 flex flex-col">
      {/* Column header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: column.stage.color ?? '#6366f1' }} />
          <span className="font-bold text-sm text-slate-800">{column.stage.name}</span>
          <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-full">{column.totalCount}</span>
        </div>
        <span className="text-xs font-semibold text-slate-500">{formatCurrency(column.totalValue, currency)}</span>
      </div>

      {/* Cards */}
      <div
        ref={setNodeRef}
        className={`flex-1 space-y-2 p-2 rounded-xl min-h-[200px] transition-colors ${isOver ? 'bg-indigo-50 ring-2 ring-indigo-300' : 'bg-slate-100/60'}`}
      >
        {column.leads.map(lead => (
          <DraggableCard key={lead.id} lead={lead} onClick={onCardClick} currency={currency} />
        ))}

        {/* Add lead button */}
        <button
          onClick={() => onAddLead(column.stage.id)}
          className="w-full flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold text-slate-400 hover:text-indigo-600 hover:bg-white rounded-lg border-2 border-dashed border-transparent hover:border-indigo-200 transition-all"
        >
          <Plus className="h-3.5 w-3.5" />
          Add lead
        </button>
      </div>
    </div>
  );
}

function DraggableCard({ lead, onClick, currency }: { lead: Lead; onClick: (lead: Lead) => void; currency: string }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: lead.id });

  return (
    <div ref={setNodeRef} className={isDragging ? 'opacity-0' : ''}>
      <LeadCard lead={lead} onClick={onClick} currency={currency} dragListeners={listeners} dragAttributes={attributes} />
    </div>
  );
}

interface LeadCardProps {
  lead: Lead;
  onClick: (lead: Lead) => void;
  currency: string;
  isDragging?: boolean;
  dragListeners?: any;
  dragAttributes?: any;
}

function LeadCard({ lead, onClick, currency, isDragging, dragListeners, dragAttributes }: LeadCardProps) {
  const stale = (lead as any).isStale;
  const score = lead.score ?? 0;

  return (
    <div
      onClick={() => !isDragging && onClick(lead)}
      className={`bg-white rounded-xl border shadow-sm cursor-pointer hover:shadow-md transition-all select-none ${stale ? 'border-l-2 border-l-amber-400 border-r border-t border-b border-slate-200' : 'border-slate-200'}`}
    >
      <div className="p-3">
        {/* Drag handle + title */}
        <div className="flex items-start gap-1.5 mb-2">
          <div
            {...dragListeners}
            {...dragAttributes}
            className="mt-0.5 text-slate-300 hover:text-slate-500 cursor-grab active:cursor-grabbing flex-shrink-0"
            onClick={e => e.stopPropagation()}
          >
            <GripVertical className="h-4 w-4" />
          </div>
          <p className="text-sm font-semibold text-slate-900 leading-snug line-clamp-2">{lead.title}</p>
        </div>

        {/* Contact / Company */}
        <div className="flex items-center gap-1.5 mb-2 ml-5">
          {lead.contact && (
            <div className="h-5 w-5 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 text-[9px] font-bold flex-shrink-0">
              {lead.contact.firstName.charAt(0)}
            </div>
          )}
          <p className="text-xs text-slate-500 truncate">
            {lead.contact ? `${lead.contact.firstName} ${lead.contact.lastName ?? ''}` : lead.company?.name ?? '—'}
          </p>
        </div>

        {/* Score bar */}
        <div className="flex items-center gap-1.5 ml-5 mb-2">
          <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${getScoreColor(score)}`} style={{ width: `${score}%` }} />
          </div>
          <span className="text-[10px] font-bold text-slate-400">{score}</span>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between ml-5">
          <div className="flex items-center gap-1.5">
            <div className={`h-2 w-2 rounded-full ${getPriorityDotColor(lead.priority)}`} />
            <span className="text-[10px] font-semibold text-slate-500 capitalize">{lead.priority}</span>
          </div>

          {lead.estimatedValue ? (
            <span className="text-xs font-bold text-slate-700">{formatCurrency(lead.estimatedValue, currency)}</span>
          ) : null}
        </div>
      </div>

      {/* Assignee + days */}
      {(lead.assignedTo || lead.lastActivityAt) && (
        <div className="border-t border-slate-100 px-3 py-2 flex items-center justify-between">
          {lead.assignedTo && (
            <div className="flex items-center gap-1.5">
              <div className="h-5 w-5 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-[9px] font-bold flex-shrink-0">
                {lead.assignedTo.firstName.charAt(0)}
              </div>
              <span className="text-[10px] text-slate-500">{lead.assignedTo.firstName}</span>
            </div>
          )}
          {lead.lastActivityAt && (
            <span className={`text-[10px] ${stale ? 'text-amber-500 font-semibold' : 'text-slate-400'}`}>
              {formatDistanceToNow(new Date(lead.lastActivityAt), { addSuffix: true })}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
