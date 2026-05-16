import React from 'react';

type BadgeProps = {
  status: 'KRITIS' | 'TINGGI' | 'SEDANG' | 'RENDAH' | 'DARURAT' | 'TIDAK INVASIF' | string;
  className?: string;
};

export function Badge({ status, className = '' }: BadgeProps) {
  const getBadgeStyle = () => {
    switch (status) {
      case 'DARURAT':
      case 'KRITIS':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'TINGGI':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'SEDANG':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'RENDAH':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'TIDAK INVASIF':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${getBadgeStyle()} ${className}`}>
      {status}
    </span>
  );
}
