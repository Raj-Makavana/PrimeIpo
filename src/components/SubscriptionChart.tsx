'use client';

import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from 'recharts';

interface SubscriptionChartProps {
  qib: number;
  nii: number;
  retail: number;
  employee: number;
}

export const SubscriptionChart: React.FC<SubscriptionChartProps> = ({ qib, nii, retail, employee }) => {
  const data = [
    { category: 'QIB', sub: qib, color: '#3b82f6' },
    { category: 'NII / HNI', sub: nii, color: '#8b5cf6' },
    { category: 'Retail', sub: retail, color: '#10b981' },
    { category: 'Employee', sub: employee, color: '#f59e0b' },
  ];

  return (
    <div className="h-64 w-full pt-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="category" stroke="#64748b" fontSize={12} tickLine={false} />
          <YAxis stroke="#64748b" fontSize={12} tickLine={false} />
          <Tooltip
            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc' }}
            formatter={(value: any) => [`${value}×`, 'Times Subscribed']}
          />
          <Bar dataKey="sub" radius={[6, 6, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
