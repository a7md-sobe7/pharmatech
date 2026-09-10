import React from 'react';
import { SimilarityLevel } from '../../types';

interface Props {
  level: SimilarityLevel;
  score?: number;
  showScore?: boolean;
}

export const SimilarityBadge: React.FC<Props> = ({ level, score, showScore = true }) => {
  let badgeStyle = '';
  let label: string = level;

  switch (level) {
    case 'VERY_HIGH':
      badgeStyle = 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300';
      label = 'Very High Match';
      break;
    case 'HIGH':
      badgeStyle = 'bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950/40 dark:text-blue-300';
      label = 'High Similarity';
      break;
    case 'MODERATE':
      badgeStyle = 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300';
      label = 'Moderate Match';
      break;
    case 'LOW':
      badgeStyle = 'bg-orange-50 text-orange-700 border-orange-300 dark:bg-orange-950/40 dark:text-orange-300';
      label = 'Low Similarity';
      break;
    default:
      badgeStyle = 'bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-800 dark:text-slate-300';
      label = 'Not Similar';
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${badgeStyle}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
      <span>{label}</span>
      {showScore && score !== undefined && (
        <span className="ml-1 opacity-80 font-mono">({score}%)</span>
      )}
    </span>
  );
};
