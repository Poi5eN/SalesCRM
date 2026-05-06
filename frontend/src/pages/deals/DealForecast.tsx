import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import * as dealsApi from '@/api/deals.api.ts';
import { formatCurrency } from '@/utils/format.ts';
import { useAuth } from '@/hooks/useAuth.ts';

export function DealForecast() {
  const { tenant } = useAuth();
  const { data: forecastData, isLoading } = useQuery({
    queryKey: ['deals', 'forecast'],
    queryFn: () => dealsApi.getForecast(),
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white border border-slate-200 rounded-xl p-5 h-32 animate-pulse" />
        ))}
      </div>
    );
  }

  const forecast = forecastData?.data;
  if (!forecast) return null;

  const periods = [
    { key: 'thisMonth', label: 'This Month' },
    { key: 'nextMonth', label: 'Next Month' },
    { key: 'thisQuarter', label: 'This Quarter' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {periods.map(({ key, label }) => {
        const data = forecast[key];
        const chartData = [
          { name: 'Expected', value: data.expected, color: '#94a3b8' },
          { name: 'Weighted', value: data.weighted, color: '#f59e0b' },
          { name: 'Won', value: data.won, color: '#10b981' },
        ];

        return (
          <div key={key} className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-700">{label}</h3>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Expected</p>
                  <p className="text-sm font-semibold text-slate-800">{formatCurrency(data.expected, tenant?.currency)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Weighted</p>
                  <p className="text-sm font-semibold text-amber-600">{formatCurrency(data.weighted, tenant?.currency)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Won</p>
                  <p className="text-sm font-semibold text-emerald-600">{formatCurrency(data.won, tenant?.currency)}</p>
                </div>
              </div>
            </div>
            
            <div className="h-16 mt-4 -mx-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" hide />
                  <Tooltip 
                    cursor={{fill: 'transparent'}}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-slate-900 text-white text-xs py-1 px-2 rounded shadow-xl">
                            {payload[0].payload.name}: {formatCurrency(payload[0].value as number, tenant?.currency)}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={12}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        );
      })}
    </div>
  );
}
