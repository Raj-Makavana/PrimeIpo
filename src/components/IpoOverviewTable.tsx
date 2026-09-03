'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { IpoData } from '@/lib/api-fetcher';
import { StatusBadge } from '@/components/StatusBadge';
import { GmpBadge } from '@/components/GmpBadge';
import { SubscriptionBadge } from '@/components/SubscriptionBadge';
import { RegistrarBadge } from '@/components/RegistrarBadge';
import { CompanyLogo } from '@/components/CompanyLogo';
import { formatDate } from '@/components/IpoCard';
import {
  Table,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  Building2,
  Calendar,
  TrendingUp,
  Sparkles,
  CheckSquare,
  ChevronRight,
  Filter,
  Layers,
  Info,
} from 'lucide-react';

interface IpoOverviewTableProps {
  ipos: IpoData[];
  onCheckAllotment?: (ipo: IpoData) => void;
}

type SortField =
  | 'name'
  | 'gmp'
  | 'gmpPct'
  | 'subscription'
  | 'issueSize'
  | 'openDate'
  | 'closeDate'
  | 'allotmentDate'
  | 'listingDate'
  | 'status';
type SortOrder = 'asc' | 'desc';

export const IpoOverviewTable: React.FC<IpoOverviewTableProps> = ({ ipos }) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'upcoming' | 'listed' | 'closed'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'mainboard' | 'sme'>('all');
  const [sortField, setSortField] = useState<SortField>('openDate');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const filteredAndSortedIpos = useMemo(() => {
    return ipos
      .filter((ipo) => {
        const matchesSearch =
          ipo.companyName.toLowerCase().includes(search.toLowerCase()) ||
          ipo.symbol.toLowerCase().includes(search.toLowerCase()) ||
          ipo.sector.toLowerCase().includes(search.toLowerCase()) ||
          ipo.registrar.toLowerCase().includes(search.toLowerCase());

        const matchesStatus = statusFilter === 'all' || ipo.status === statusFilter;
        const matchesType = typeFilter === 'all' || ipo.type === typeFilter;

        return matchesSearch && matchesStatus && matchesType;
      })
      .sort((a, b) => {
        let valA: any;
        let valB: any;

        switch (sortField) {
          case 'name':
            valA = a.companyName.toLowerCase();
            valB = b.companyName.toLowerCase();
            break;
          case 'gmp':
            valA = a.gmpCurrent || 0;
            valB = b.gmpCurrent || 0;
            break;
          case 'gmpPct':
            valA = a.gmpPct || 0;
            valB = b.gmpPct || 0;
            break;
          case 'subscription':
            valA = a.subscriptionTotal || 0;
            valB = b.subscriptionTotal || 0;
            break;
          case 'issueSize':
            valA = a.issueSize || 0;
            valB = b.issueSize || 0;
            break;
          case 'openDate':
            valA = new Date(a.openDate || '1970-01-01').getTime();
            valB = new Date(b.openDate || '1970-01-01').getTime();
            break;
          case 'closeDate':
            valA = new Date(a.closeDate || '1970-01-01').getTime();
            valB = new Date(b.closeDate || '1970-01-01').getTime();
            break;
          case 'allotmentDate':
            valA = new Date(a.allotmentDate || '1970-01-01').getTime();
            valB = new Date(b.allotmentDate || '1970-01-01').getTime();
            break;
          case 'listingDate':
            valA = new Date(a.listingDate || '1970-01-01').getTime();
            valB = new Date(b.listingDate || '1970-01-01').getTime();
            break;
          case 'status':
            valA = a.status;
            valB = b.status;
            break;
          default:
            valA = 0;
            valB = 0;
        }

        if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
  }, [ipos, search, statusFilter, typeFilter, sortField, sortOrder]);

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3.5 h-3.5 text-slate-500 opacity-60 group-hover:opacity-100" />;
    }
    return sortOrder === 'asc' ? (
      <ArrowUp className="w-3.5 h-3.5 text-indigo-400" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-indigo-400" />
    );
  };

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <div className="glass-card rounded-3xl p-4 sm:p-6 border border-slate-800 bg-slate-950/80 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Table className="w-5 h-5 text-indigo-400" />
              <h3 className="text-lg sm:text-xl font-black text-white">IPO Market Master Overview</h3>
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800 text-xs font-bold">
                {filteredAndSortedIpos.length} Companies
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 font-mono">
              Complete real-time timeline, live market GMP, bidding demand &amp; issue data
            </p>
          </div>

          {/* Quick Search */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search table..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-700/80 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
          {/* Status Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-900/90 p-1 rounded-2xl border border-slate-800">
            {(['all', 'open', 'upcoming', 'listed', 'closed'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${
                  statusFilter === st
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {st === 'all' ? 'All Status' : st}
              </button>
            ))}
          </div>

          {/* Type Segment Filter */}
          <div className="flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-2xl border border-slate-800">
            {(['all', 'mainboard', 'sme'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition-all ${
                  typeFilter === t
                    ? 'bg-violet-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="glass-card rounded-3xl border border-slate-800 bg-slate-950/90 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            {/* Table Header */}
            <thead className="bg-slate-900/95 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[11px] select-none">
              <tr>
                <th
                  onClick={() => handleSort('name')}
                  className="p-4 cursor-pointer hover:text-white transition-colors group"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Company &amp; Sector</span>
                    {renderSortIcon('name')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('status')}
                  className="p-4 cursor-pointer hover:text-white transition-colors group"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Status</span>
                    {renderSortIcon('status')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('openDate')}
                  className="p-4 cursor-pointer hover:text-white transition-colors group"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Open Date</span>
                    {renderSortIcon('openDate')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('closeDate')}
                  className="p-4 cursor-pointer hover:text-white transition-colors group"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Close Date</span>
                    {renderSortIcon('closeDate')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('allotmentDate')}
                  className="p-4 cursor-pointer hover:text-white transition-colors group"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Allot. Date</span>
                    {renderSortIcon('allotmentDate')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('listingDate')}
                  className="p-4 cursor-pointer hover:text-white transition-colors group"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Listing Date</span>
                    {renderSortIcon('listingDate')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('gmp')}
                  className="p-4 cursor-pointer hover:text-white transition-colors group"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Live GMP (₹ &amp; %)</span>
                    {renderSortIcon('gmp')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('subscription')}
                  className="p-4 cursor-pointer hover:text-white transition-colors group"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Total Sub.</span>
                    {renderSortIcon('subscription')}
                  </div>
                </th>
                <th className="p-4">Price Band &amp; Lot</th>
                <th
                  onClick={() => handleSort('issueSize')}
                  className="p-4 cursor-pointer hover:text-white transition-colors group"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Issue Size</span>
                    {renderSortIcon('issueSize')}
                  </div>
                </th>
                <th className="p-4">Registrar</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-slate-800/60">
              {filteredAndSortedIpos.length === 0 ? (
                <tr>
                  <td colSpan={12} className="p-12 text-center text-slate-500 space-y-2">
                    <Building2 className="w-8 h-8 mx-auto text-slate-600" />
                    <p className="text-sm font-semibold text-slate-400">No IPOs found</p>
                    <p className="text-xs text-slate-600">Try changing your search terms or filters</p>
                  </td>
                </tr>
              ) : (
                filteredAndSortedIpos.map((ipo) => {
                  const minInvest = ipo.priceBandHigh * ipo.lotSize;
                  return (
                    <tr
                      key={ipo.id}
                      className="hover:bg-slate-900/50 transition-colors group"
                    >
                      {/* Company Info */}
                      <td className="p-4">
                        <Link href={`/ipo/${ipo.id}`} className="flex items-center gap-3">
                          <CompanyLogo
                            symbol={ipo.symbol}
                            name={ipo.companyName}
                            logoUrl={ipo.logoUrl}
                            size="sm"
                          />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-white text-sm group-hover:text-indigo-300 transition-colors">
                                {ipo.companyName}
                              </span>
                              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded uppercase bg-indigo-950/80 text-indigo-300 border border-indigo-800/80">
                                {ipo.type}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-400 block truncate max-w-[200px]">
                              {ipo.sector} • Symbol: {ipo.symbol}
                            </span>
                          </div>
                        </Link>
                      </td>

                      {/* Status */}
                      <td className="p-4">
                        <StatusBadge status={ipo.status} />
                      </td>

                      {/* Open Date */}
                      <td className="p-4">
                        <span className="text-slate-200 font-semibold block font-mono text-xs whitespace-nowrap">
                          {formatDate(ipo.openDate)}
                        </span>
                      </td>

                      {/* Close Date */}
                      <td className="p-4">
                        <span className="text-slate-200 font-semibold block font-mono text-xs whitespace-nowrap">
                          {formatDate(ipo.closeDate)}
                        </span>
                      </td>

                      {/* Allotment Date */}
                      <td className="p-4">
                        <span className="text-emerald-400 font-semibold block font-mono text-xs whitespace-nowrap">
                          {formatDate(ipo.allotmentDate)}
                        </span>
                      </td>

                      {/* Listing Date */}
                      <td className="p-4">
                        <span className="text-purple-400 font-semibold block font-mono text-xs whitespace-nowrap">
                          {formatDate(ipo.listingDate)}
                        </span>
                      </td>

                      {/* Live GMP */}
                      <td className="p-4">
                        <div className="space-y-1">
                          <GmpBadge gmp={ipo.gmpCurrent} gmpPct={ipo.gmpPct} />
                          {ipo.status === 'listed' && (
                            <span className="text-[10px] text-purple-400 block font-medium">
                              Listed Gain: +{ipo.listingGainPct || ipo.gmpPct}%
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Total Subscription Only */}
                      <td className="p-4">
                        <SubscriptionBadge total={ipo.subscriptionTotal} />
                      </td>

                      {/* Price Band & Lot */}
                      <td className="p-4">
                        <div className="space-y-0.5">
                          <span className="font-bold text-white block">
                            {ipo.priceBandHigh > 0
                              ? ipo.priceBandLow === ipo.priceBandHigh
                                ? `₹${ipo.priceBandHigh}`
                                : `₹${ipo.priceBandLow} – ₹${ipo.priceBandHigh}`
                              : 'TBA'}
                          </span>
                          <span className="text-[11px] text-slate-400 block">
                            {ipo.lotSize} Shares{' '}
                            {minInvest > 0 && (
                              <span className="text-slate-500">(₹{minInvest.toLocaleString('en-IN')})</span>
                            )}
                          </span>
                        </div>
                      </td>

                      {/* Issue Size */}
                      <td className="p-4">
                        <div className="space-y-0.5">
                          <span className="font-bold text-indigo-300 block">
                            {ipo.issueSize > 0 ? `₹${ipo.issueSize} Cr` : 'TBA'}
                          </span>
                          <span className="text-[10px] text-slate-500 block">
                            FV: ₹{ipo.faceValue || 10}
                          </span>
                        </div>
                      </td>

                      {/* Registrar */}
                      <td className="p-4">
                        <RegistrarBadge registrar={ipo.registrar} />
                      </td>

                      {/* Action */}
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/ipo/${ipo.id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors shadow-sm shadow-indigo-600/20"
                          >
                            <span>Details</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Summary Info */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-900/60 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Info className="w-3.5 h-3.5 text-indigo-400" />
            <span>
              Real-time IPO market data, subscription numbers, and GMP trends updated automatically.
            </span>
          </div>
          <span className="font-mono text-[11px]">
            Showing {filteredAndSortedIpos.length} of {ipos.length} total IPOs
          </span>
        </div>
      </div>
    </div>
  );
};
