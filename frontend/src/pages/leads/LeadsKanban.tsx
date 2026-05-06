import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors,
  type DragEndEvent, type DragStartEvent,
} from '@dnd-kit/core';
import { useDroppable } from '@dnd-kit/core';
import { useDraggable } from '@dnd-kit/core';
import { Plus } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { Lead } from '@/types/api.types.ts';
import * as leadsApi from '@/api/leads.api.ts';
import { formatCurrency } from '@/utils/format.ts';
import { KanbanCard } from '@/components/ui/KanbanCard.tsx';

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
    const targetStageId = (over.id as string).replace('stage-', '');

    const sourceCol = localColumns.find(c => c.leads.some(l => l.id === leadId));
    if (!sourceCol || sourceCol.stage.id === targetStageId) return;

    // Optimistic update
    setLocalColumns(prev => {
      const sourceLead = prev.flatMap(c => c.leads).find(l => l.id === leadId);
      if (!sourceLead) return prev;
      return prev.map(col => {
        if (col.stage.id === sourceCol.stage.id) {
          return { ...col, leads: col.leads.filter(l => l.id !== leadId), totalCount: col.totalCount - 1, totalValue: col.totalValue - Number(sourceLead.estimatedValue || 0) };
        }
        if (col.stage.id === targetStageId) {
          const updatedLead = { ...sourceLead, stageId: targetStageId };
          return { ...col, leads: [...col.leads, updatedLead], totalCount: col.totalCount + 1, totalValue: col.totalValue + Number(sourceLead.estimatedValue || 0) };
        }
        return col;
      });
    });

    moveMutation.mutate({ leadId, stageId: targetStageId });
  };

  const activeLead = findActiveLead();

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex gap-6 overflow-x-auto pb-8 min-h-[calc(100vh-280px)] custom-scrollbar">
        {localColumns.map(col => (
          <KanbanColumnComponent
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
          <div className="opacity-90 rotate-2 scale-105 shadow-2xl">
            <KanbanCard 
              title={activeLead.title}
              subtitle={activeLead.contact ? `${activeLead.contact.firstName} ${activeLead.contact.lastName || ''}` : activeLead.company?.name}
              priority={activeLead.priority as any}
              value={Number(activeLead.estimatedValue || 0)}
              currency={activeLead.currency}
              score={activeLead.score}
              tags={activeLead.tags}
              lastActivity={activeLead.lastActivityAt ? formatDistanceToNow(new Date(activeLead.lastActivityAt), { addSuffix: true }) : undefined}
            />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}

function KanbanColumnComponent({ column, onCardClick, onAddLead, currency }: {
  column: KanbanColumn;
  onCardClick: (lead: Lead) => void;
  onAddLead: (stageId: string) => void;
  currency: string;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `stage-${column.stage.id}` });

  return (
    <div className="flex-shrink-0 w-80 flex flex-col group/col">
      {/* Column header */}
      <div className="flex items-center justify-between mb-4 px-2">
        <div className="flex items-center gap-3">
          <div className="h-2 w-2 rounded-full shadow-[0_0_8px] shadow-current" style={{ backgroundColor: column.stage.color || '#6366f1', color: column.stage.color || '#6366f1' }} />
          <span className="font-black text-xs uppercase tracking-widest text-slate-900 dark:text-white">{column.stage.name}</span>
          <Badge variant="default" className="bg-slate-100 dark:bg-slate-800 border-none text-[10px]">{column.totalCount}</Badge>
        </div>
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{formatCurrency(column.totalValue, currency)}</span>
      </div>

      {/* Cards container */}
      <div
        ref={setNodeRef}
        className={`flex-1 flex flex-col gap-3 p-3 rounded-3xl border-2 transition-all duration-200 ${
          isOver 
            ? 'bg-indigo-50/50 dark:bg-indigo-900/10 border-indigo-200 dark:border-indigo-800 ring-4 ring-indigo-500/5' 
            : 'bg-slate-50/50 dark:bg-slate-900/30 border-transparent'
        }`}
      >
        {column.leads.map(lead => (
          <DraggableCard key={lead.id} lead={lead} onClick={onCardClick} currency={currency} />
        ))}

        <button
          onClick={() => onAddLead(column.stage.id)}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-200 dark:hover:border-indigo-800 hover:bg-white dark:hover:bg-slate-800 transition-all font-bold text-xs opacity-0 group-hover/col:opacity-100"
        >
          <Plus className="h-4 w-4" />
          Add Lead
        </button>
      </div>
    </div>
  );
}

function DraggableCard({ lead, onClick, currency }: { lead: Lead; onClick: (lead: Lead) => void; currency: string }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: lead.id });

  return (
    <div ref={setNodeRef} className={`${isDragging ? 'opacity-30 grayscale-[0.5]' : ''} transition-opacity`}>
      <div {...attributes} {...listeners}>
        <KanbanCard 
          title={lead.title}
          subtitle={lead.contact ? `${lead.contact.firstName} ${lead.contact.lastName || ''}` : lead.company?.name}
          priority={lead.priority as any}
          value={Number(lead.estimatedValue || 0)}
          currency={lead.currency}
          score={lead.score}
          tags={lead.tags}
          lastActivity={lead.lastActivityAt ? formatDistanceToNow(new Date(lead.lastActivityAt), { addSuffix: true }) : undefined}
          onClick={() => onClick(lead)}
        />
      </div>
    </div>
  );
}

function Badge({ children, variant = 'default', className }: any) {
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest leading-none ${
      variant === 'default' ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' : ''
    } ${className}`}>
      {children}
    </span>
  );
}
