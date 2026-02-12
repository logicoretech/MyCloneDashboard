
import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Legend, LineChart, Line, AreaChart, Area 
} from 'recharts';
import { DataRecord } from '../types';

interface DashboardChartsProps {
  data: DataRecord[];
}

export const DashboardCharts: React.FC<DashboardChartsProps> = ({ data }) => {
  // Aggregate data for the line chart (Revenue vs Expenses over time)
  const sortedData = [...data].sort((a, b) => {
    const [ma, ya] = a.monthYear.split('/').map(Number);
    const [mb, yb] = b.monthYear.split('/').map(Number);
    return (ya * 12 + ma) - (yb * 12 + mb);
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
      {/* Revenue Trends */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-96">
        <h3 className="text-lg font-semibold text-gray-800 mb-6">Revenue Performance</h3>
        <ResponsiveContainer width="100%" height="85%">
          <AreaChart data={sortedData}>
            <defs>
              <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
            <XAxis dataKey="monthYear" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
            <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
            <Tooltip 
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            <Legend verticalAlign="top" height={36}/>
            <Area 
              type="monotone" 
              dataKey="dollarsCollected" 
              name="Collected" 
              stroke="#6366f1" 
              fillOpacity={1} 
              fill="url(#colorRev)" 
              strokeWidth={2}
            />
            <Area 
              type="monotone" 
              dataKey="potentialRevenue" 
              name="Potential" 
              stroke="#94a3b8" 
              strokeDasharray="5 5" 
              fill="transparent" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Net Profit Analysis */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-96">
        <h3 className="text-lg font-semibold text-gray-800 mb-6">Expense vs Net Revenue</h3>
        <ResponsiveContainer width="100%" height="85%">
          <BarChart data={sortedData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
            <XAxis dataKey="monthYear" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
            <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
            <Tooltip 
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            <Legend verticalAlign="top" height={36}/>
            <Bar dataKey="expenseIncurred" name="Expenses" fill="#f87171" radius={[4, 4, 0, 0]} />
            <Bar dataKey="netRevenue" name="Net Revenue" fill="#34d399" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
