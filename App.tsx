
import React, { useState, useEffect, useMemo } from 'react';
import { DataRecord, LoadingStatus } from './types';
import { StatCard } from './components/StatCard';
import { DashboardCharts } from './components/DashboardCharts';
import { getFinancialInsight } from './services/geminiService';

// Helper to parse currency strings like "$1,250.00" or null values into numbers
const parseCurrency = (val: any): number => {
  if (val === null || val === undefined || val === '') return 0;
  if (typeof val === 'number') return val;
  // Remove currency symbols, commas, and other non-numeric chars except decimal and minus
  const cleaned = val.toString().replace(/[^\d.-]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
};

// Fallback generator if the Make.com connection fails or has no data
const generateMockData = (): DataRecord[] => {
  const names = ['Acme Corp', 'Globex', 'Soylent Corp', 'Initech', 'Umbrella Co'];
  const months = ['01/2024', '02/2024', '03/2024', '04/2024', '05/2024'];
  const data: DataRecord[] = [];

  names.forEach(name => {
    months.forEach(month => {
      const pot = Math.floor(Math.random() * 15000) + 5000;
      const inv = pot * 0.85;
      const coll = inv * (0.7 + Math.random() * 0.3);
      const exp = Math.floor(Math.random() * 4000) + 500;
      data.push({
        id: Math.random().toString(36).substr(2, 9),
        name,
        potentialRevenue: pot,
        invoiceAmount: inv,
        dollarsCollected: coll,
        expenseIncurred: exp,
        netRevenue: coll - exp,
        monthYear: month
      });
    });
  });
  return data;
};

const App: React.FC = () => {
  const [rawData, setRawData] = useState<DataRecord[]>([]);
  const [status, setStatus] = useState<LoadingStatus>(LoadingStatus.IDLE);
  const [aiInsight, setAiInsight] = useState<string>('Analyzing financial trends...');
  const [usingMockData, setUsingMockData] = useState<boolean>(false);
  
  // Filters
  const [filterName, setFilterName] = useState<string>('All');
  const [filterMonth, setFilterMonth] = useState<string>('All');

  useEffect(() => {
    const fetchData = async () => {
      setStatus(LoadingStatus.LOADING);
      
      const MAKE_WEBHOOK_URL = "https://hook.us1.make.com/dks9bbgha9nluaappy0bopbv3anwmgsb"; 

      try {
        const response = await fetch(MAKE_WEBHOOK_URL, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          }
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const data = await response.json();
        
        // Ensure we handle both single object and array responses
        const dataArray = Array.isArray(data) ? data : [data];

        if (dataArray.length === 0) throw new Error("Empty data set returned");

        // Map the specific keys provided in the user's sample
        const formattedData: DataRecord[] = dataArray.map((item: any) => {
          const pot = parseCurrency(item['Potential Revenue']);
          const inv = parseCurrency(item['Invoice Amount']);
          const coll = parseCurrency(item['Dollars Collected']);
          const exp = parseCurrency(item['Expense Incurred']);
          const net = item['Net Revenue'] !== null ? parseCurrency(item['Net Revenue']) : (coll - exp);

          return {
            id: item['Opportunity ID'] || item.id || item.key || Math.random().toString(36).substr(2, 9),
            name: item.Name || item.name || 'Unknown Entity',
            potentialRevenue: pot,
            invoiceAmount: inv,
            dollarsCollected: coll,
            expenseIncurred: exp,
            netRevenue: net,
            monthYear: item['MM/YYYY'] || item.monthYear || '01/2024'
          };
        });

        setRawData(formattedData);
        setUsingMockData(false);
        setStatus(LoadingStatus.SUCCESS);
      } catch (e) {
        console.warn("Real data fetch failed or returned empty. Using mock data for UI visualization.", e);
        setRawData(generateMockData());
        setUsingMockData(true);
        setStatus(LoadingStatus.SUCCESS);
      }
    };
    
    fetchData();
  }, []);

  // Update AI insights whenever data loads
  useEffect(() => {
    if (rawData.length > 0 && status === LoadingStatus.SUCCESS) {
      getFinancialInsight(rawData.slice(0, 15)).then(setAiInsight);
    }
  }, [rawData, status]);

  const uniqueNames = useMemo(() => ['All', ...new Set(rawData.map(r => r.name))].sort(), [rawData]);
  const uniqueMonths = useMemo(() => ['All', ...new Set(rawData.map(r => r.monthYear))].sort((a, b) => {
    if (a === 'All') return -1;
    if (b === 'All') return 1;
    const [ma, ya] = a.split('/').map(Number);
    const [mb, yb] = b.split('/').map(Number);
    return (ya * 12 + ma) - (yb * 12 + mb);
  }), [rawData]);

  const filteredData = useMemo(() => {
    return rawData.filter(r => {
      const nameMatch = filterName === 'All' || r.name === filterName;
      const monthMatch = filterMonth === 'All' || r.monthYear === filterMonth;
      return nameMatch && monthMatch;
    });
  }, [rawData, filterName, filterMonth]);

  const stats = useMemo(() => {
    const s = filteredData.reduce((acc, curr) => ({
      totalPotentialRevenue: acc.totalPotentialRevenue + curr.potentialRevenue,
      totalInvoiceAmount: acc.totalInvoiceAmount + curr.invoiceAmount,
      totalDollarsCollected: acc.totalDollarsCollected + curr.dollarsCollected,
      totalExpenseIncurred: acc.totalExpenseIncurred + curr.expenseIncurred,
      totalNetRevenue: acc.totalNetRevenue + curr.netRevenue,
    }), {
      totalPotentialRevenue: 0,
      totalInvoiceAmount: 0,
      totalDollarsCollected: 0,
      totalExpenseIncurred: 0,
      totalNetRevenue: 0,
    });

    return {
      ...s,
      collectionRate: s.totalInvoiceAmount > 0 ? (s.totalDollarsCollected / s.totalInvoiceAmount) * 100 : 0
    };
  }, [filteredData]);

  if (status === LoadingStatus.LOADING) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 font-medium">Syncing with Make.com Data Store...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fcfcfd] pb-12">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 py-4 md:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-indigo-200 shadow-lg">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 leading-tight">GHL Financial Insights</h1>
              {usingMockData && <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Demo Visualization</span>}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1">Client / Opportunity</span>
              <select 
                value={filterName}
                onChange={(e) => setFilterName(e.target.value)}
                className="bg-white border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 block w-48 p-2 shadow-sm outline-none transition-all cursor-pointer"
              >
                {uniqueNames.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1">Month Selector</span>
              <select 
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                className="bg-white border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 block w-32 p-2 shadow-sm outline-none transition-all cursor-pointer"
              >
                {uniqueMonths.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        
        {/* Connection Notice */}
        {usingMockData && (
          <div className="mb-6 bg-amber-50 border border-amber-100 p-4 rounded-2xl flex items-start space-x-3 shadow-sm">
            <svg className="w-5 h-5 text-amber-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-800">Connection status: Webhook fallback</p>
              <p className="text-xs text-amber-700 mt-1">Make sure the scenario returns an array of objects. We're looking for keys like <code>"Name"</code>, <code>"Potential Revenue"</code>, and <code>"MM/YYYY"</code>.</p>
            </div>
          </div>
        )}

        {/* AI Insight Section */}
        <div className="mb-8 bg-white border border-gray-100 p-5 rounded-2xl shadow-sm flex items-center relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500"></div>
          <div className="mr-5 bg-indigo-50 p-3 rounded-xl text-indigo-600 group-hover:scale-105 transition-transform duration-500">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Executive Business Intelligence</p>
              <div className="flex space-x-1">
                <div className="w-1 h-1 rounded-full bg-indigo-400 animate-pulse"></div>
                <div className="w-1 h-1 rounded-full bg-indigo-400 animate-pulse [animation-delay:0.2s]"></div>
                <div className="w-1 h-1 rounded-full bg-indigo-400 animate-pulse [animation-delay:0.4s]"></div>
              </div>
            </div>
            <p className="text-gray-700 font-medium leading-relaxed italic">"{aiInsight}"</p>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
          <StatCard 
            label="Potential" 
            value={`$${stats.totalPotentialRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
            colorClass="text-indigo-600"
          />
          <StatCard 
            label="Invoiced" 
            value={`$${stats.totalInvoiceAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}
            colorClass="text-slate-600"
          />
          <StatCard 
            label="Collected" 
            value={`$${stats.totalDollarsCollected.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
            colorClass="text-emerald-600"
          />
          <StatCard 
            label="Expenses" 
            value={`$${stats.totalExpenseIncurred.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
            colorClass="text-rose-600"
          />
          <StatCard 
            label="Net Profit" 
            value={`$${stats.totalNetRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>}
            colorClass="text-blue-600"
          />
          <StatCard 
            label="Efficiency" 
            value={`${stats.collectionRate.toFixed(1)}%`}
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /></svg>}
            colorClass="text-violet-600"
          />
        </div>

        {/* Visual Analytics */}
        <DashboardCharts data={filteredData} />

        {/* Detailed Transactions */}
        <div className="mt-8 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/20">
            <h3 className="text-sm font-bold text-gray-800">Entity Performance Ledger</h3>
            <div className="flex items-center space-x-2">
               <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2.5 py-1.5 rounded-lg font-bold uppercase tracking-wide">
                 {filteredData.length} Records Shown
               </span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-[10px] text-gray-400 uppercase tracking-widest bg-white">
                <tr>
                  <th className="px-6 py-4 border-b border-gray-50">Entity Name</th>
                  <th className="px-6 py-4 text-right border-b border-gray-50">Potential</th>
                  <th className="px-6 py-4 text-right border-b border-gray-50">Invoiced</th>
                  <th className="px-6 py-4 text-right border-b border-gray-50">Collected</th>
                  <th className="px-6 py-4 text-right border-b border-gray-50">Expenses</th>
                  <th className="px-6 py-4 text-right font-black border-b border-gray-50">Net</th>
                  <th className="px-6 py-4 text-center border-b border-gray-50">Month</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredData.length > 0 ? filteredData.map((record) => (
                  <tr key={record.id} className="hover:bg-indigo-50/30 transition-colors group">
                    <td className="px-6 py-4 font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">{record.name}</td>
                    <td className="px-6 py-4 text-right text-gray-500">${record.potentialRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="px-6 py-4 text-right text-gray-500">${record.invoiceAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="px-6 py-4 text-right text-emerald-600 font-bold font-mono">${record.dollarsCollected.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="px-6 py-4 text-right text-rose-500 font-mono">${record.expenseIncurred.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="px-6 py-4 text-right font-black text-gray-900 font-mono">
                      <span className={record.netRevenue >= 0 ? 'text-gray-900' : 'text-rose-600'}>
                        ${record.netRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-gray-100 text-gray-600 border border-gray-200">
                        {record.monthYear}
                      </span>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                      No records found matching your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
