import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, format, isSameMonth, isSameDay, isToday, parseISO } from 'date-fns';
import type { Task } from '@/types/api.types.ts';

interface TaskCalendarProps {
  tasks: Task[];
  onDateClick: (date: Date, tasks: Task[]) => void;
}

export function TaskCalendar({ tasks, onDateClick }: TaskCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentDate));
    const end = endOfWeek(endOfMonth(currentDate));
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  const tasksByDate = useMemo(() => {
    const map = new Map<string, Task[]>();
    tasks.forEach(t => {
      if (!t.dueAt) return;
      const d = format(new Date(t.dueAt), 'yyyy-MM-dd');
      if (!map.has(d)) map.set(d, []);
      map.get(d)!.push(t);
    });
    return map;
  }, [tasks]);

  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const goToday = () => setCurrentDate(new Date());

  const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[700px]">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 shrink-0">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold text-slate-800 w-48">{format(currentDate, 'MMMM yyyy')}</h2>
          <div className="flex items-center bg-white rounded-lg border border-slate-200 shadow-sm">
            <button onClick={prevMonth} className="p-1.5 hover:bg-slate-50 border-r border-slate-200 rounded-l-lg transition-colors">
              <ChevronLeft className="h-5 w-5 text-slate-600" />
            </button>
            <button onClick={goToday} className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
              Today
            </button>
            <button onClick={nextMonth} className="p-1.5 hover:bg-slate-50 border-l border-slate-200 rounded-r-lg transition-colors">
              <ChevronRight className="h-5 w-5 text-slate-600" />
            </button>
          </div>
        </div>
        
        <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-red-500" /> High Priority</div>
          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Medium</div>
          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-blue-400" /> Low</div>
        </div>
      </div>

      <div className="grid grid-cols-7 border-b border-slate-200 bg-white shrink-0">
        {WEEKDAYS.map(d => (
          <div key={d} className="px-2 py-3 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">
            {d}
          </div>
        ))}
      </div>

      <div className="flex-1 grid grid-cols-7 grid-rows-5 bg-slate-200 gap-px">
        {days.map((day, i) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const dayTasks = tasksByDate.get(dateStr) || [];
          const isCurrMonth = isSameMonth(day, currentDate);
          const isTodayDate = isToday(day);

          return (
            <div 
              key={i}
              onClick={() => onDateClick(day, dayTasks)}
              className={`min-h-0 bg-white p-2 flex flex-col transition-colors cursor-pointer hover:bg-indigo-50/30 ${
                !isCurrMonth ? 'bg-slate-50 text-slate-400' : 'text-slate-800'
              }`}
            >
              <div className="flex justify-between items-start mb-1 shrink-0">
                <span className={`text-xs font-semibold h-6 w-6 flex items-center justify-center rounded-full ${
                  isTodayDate ? 'bg-indigo-600 text-white shadow-sm' : ''
                }`}>
                  {format(day, 'd')}
                </span>
                {dayTasks.length > 0 && (
                  <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 rounded-sm">
                    {dayTasks.length}
                  </span>
                )}
              </div>

              <div className="flex-1 overflow-hidden space-y-1">
                {dayTasks.slice(0, 3).map(t => {
                  const color = t.priority === 'high' ? 'bg-red-500' : t.priority === 'medium' ? 'bg-amber-400' : 'bg-blue-400';
                  return (
                    <div key={t.id} className={`text-[10px] truncate px-1.5 py-0.5 rounded-sm border flex items-center gap-1 ${
                      t.status === 'completed' ? 'bg-slate-50 text-slate-400 border-slate-100 line-through' : 'bg-white border-slate-200 text-slate-700'
                    }`}>
                      {t.status === 'completed' ? <CheckCircle2 className="h-3 w-3 shrink-0" /> : <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${color}`} />}
                      <span className="truncate">{t.title}</span>
                    </div>
                  );
                })}
                {dayTasks.length > 3 && (
                  <div className="text-[10px] font-medium text-slate-400 pl-1">
                    +{dayTasks.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
