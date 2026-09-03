'use client';

import React from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface GmpTrendChartProps {
  data: { date: string; gmp: number }[];
}

export const GmpTrendChart: React.FC<GmpTrendChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return <div className="text-center text-slate-500 py-10 text-sm">GMP history not available yet.</div>;
  }

  return (
    <div className="h-64 w-full pt-4">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickLine={false} />
          <YAxis stroke="#64748b" fontSize={12} tickLine={false} />
          <Tooltip
            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc' }}
            formatter={(value: any) => [`+₹${value}`, 'GMP Premium']}
          />
          <Line
            type="monotone"
            dataKey="gmp"
            stroke="#10b981"
            strokeWidth={3}
            dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#022c22' }}
            activeDot={{ r: 6, fill: '#34d399' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
