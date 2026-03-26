
import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  colorClass: string;
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, icon, trend, colorClass }) => {
  return (
    <div className="bg-white px-5 py-6 rounded-xl shadow-sm border border-gray-100 flex items-start space-x-3">
      <div className={`p-2.5 rounded-lg ${colorClass} bg-opacity-10 text-xl flex-shrink-0`}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <h3 className="text-2xl font-bold text-gray-900 mt-1 leading-tight whitespace-nowrap">{value}</h3>
        {trend && (
          <p className={`text-xs mt-1 font-medium ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {trend.isPositive ? '↑' : '↓'} {trend.value}% vs last period
          </p>
        )}
      </div>
    </div>
  );
};
