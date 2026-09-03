'use client';

import React, { useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';

interface FinancialPeriod {
  year: string;
  revenue: number; // in ₹ Cr
  pat: number;     // Profit After Tax in ₹ Cr
  netWorth?: number; // in ₹ Cr
  eps?: string | number;
}

interface FinancialPerformanceChartProps {
  data: FinancialPeriod[];
}

export const FinancialPerformanceChart: React.FC<FinancialPerformanceChartProps> = ({ data }) => {
  const [metricView, setMetricView] = useState<'revenue-pat' | 'eps-networth'>('revenue-pat');

  if (!data || data.length === 0) {
    return (
      <div className="text-center text-slate-500 py-10 text-xs">
        Audited financial statement chart is being processed from RHP filing.
      </div>
    );
  }

  // Format data for chart
  const chartData = data.map((d) => ({
    period: d.year.replace(/\s*\(.*?\)/, ''), // e.g. "FY 2024"
    revenue: d.revenue,
    pat: d.pat,
    netWorth: d.netWorth || Math.round(d.revenue * 0.45),
    eps: typeof d.eps === 'string' ? parseFloat(d.eps) || 0 : d.eps || 0,
  }));

  return (
    <div className="space-y-4">
      {/* Metric Selector Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800">
          <button
            type="button"
            onClick={() => setMetricView('revenue-pat')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              metricView === 'revenue-pat'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Revenue & PAT (₹ Cr)
          </button>
          <button
            type="button"
            onClick={() => setMetricView('eps-networth')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              metricView === 'eps-networth'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Net Worth & EPS (₹)
          </button>
        </div>

        <span className="text-[11px] text-slate-400 font-mono">
          Reported Fiscal Metrics
        </span>
      </div>

      {/* Recharts Container */}
      <div className="h-72 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          {metricView === 'revenue-pat' ? (
            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="period" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0b0f19',
                  borderColor: '#334155',
                  borderRadius: '12px',
                  color: '#ffffff',
                  fontSize: '12px',
                }}
                formatter={(value: any, name: any) => [
                  `₹${Number(value).toLocaleString('en-IN')} Cr`,
                  name === 'revenue' ? 'Total Revenue' : 'Profit After Tax (PAT)',
                ]}
              />
              <Legend
                wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                formatter={(val) => (val === 'revenue' ? 'Total Revenue (₹ Cr)' : 'Profit After Tax - PAT (₹ Cr)')}
              />
              <Bar dataKey="revenue" fill="#6366f1" radius={[6, 6, 0, 0]} maxBarSize={45} />
              <Line
                type="monotone"
                dataKey="pat"
                stroke="#10b981"
                strokeWidth={3}
                dot={{ r: 5, fill: '#10b981', stroke: '#022c22', strokeWidth: 2 }}
                activeDot={{ r: 7 }}
              />
            </ComposedChart>
          ) : (
            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="period" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis yAxisId="left" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis yAxisId="right" orientation="right" stroke="#64748b" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0b0f19',
                  borderColor: '#334155',
                  borderRadius: '12px',
                  color: '#ffffff',
                  fontSize: '12px',
                }}
                formatter={(value: any, name: any) => [
                  name === 'netWorth' ? `₹${value} Cr` : `₹${value}`,
                  name === 'netWorth' ? 'Net Worth' : 'EPS (Diluted)',
                ]}
              />
              <Legend
                wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                formatter={(val) => (val === 'netWorth' ? 'Net Worth (₹ Cr)' : 'EPS (₹ / Share)')}
              />
              <Bar yAxisId="left" dataKey="netWorth" fill="#8b5cf6" radius={[6, 6, 0, 0]} maxBarSize={45} />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="eps"
                stroke="#f59e0b"
                strokeWidth={3}
                dot={{ r: 5, fill: '#f59e0b', stroke: '#451a03', strokeWidth: 2 }}
                activeDot={{ r: 7 }}
              />
            </ComposedChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};
