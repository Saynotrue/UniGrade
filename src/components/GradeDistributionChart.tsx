import React from 'react';
import { PieChart } from 'lucide-react';
import { GradeScale } from '../types';

interface GradeDistributionChartProps {
  distribution: Record<string, number>;
  totalCourses: number;
  scale: GradeScale;
}

export const GradeDistributionChart: React.FC<GradeDistributionChartProps> = ({
  distribution,
  totalCourses,
  scale,
}) => {
  const grades = ['A+', 'A0', 'A-', 'B+', 'B0', 'B-', 'C+', 'C0', 'C-', 'D+', 'D0', 'D-', 'F', 'P'];

  const maxCount = Math.max(...grades.map((g) => distribution[g] || 0), 1);

  // Group stats
  const aCount =
    (distribution['A+'] || 0) + (distribution['A0'] || 0) + (distribution['A-'] || 0);
  const bCount =
    (distribution['B+'] || 0) + (distribution['B0'] || 0) + (distribution['B-'] || 0);
  const cCount =
    (distribution['C+'] || 0) + (distribution['C0'] || 0) + (distribution['C-'] || 0);
  const dCount =
    (distribution['D+'] || 0) + (distribution['D0'] || 0) + (distribution['D-'] || 0);
  const fCount = distribution['F'] || 0;
  const pCount = (distribution['P'] || 0) + (distribution['NP'] || 0);

  const getBarColor = (grade: string) => {
    if (grade.startsWith('A')) return 'bg-emerald-500 hover:bg-emerald-600 text-emerald-700';
    if (grade.startsWith('B')) return 'bg-indigo-500 hover:bg-indigo-600 text-indigo-700';
    if (grade.startsWith('C')) return 'bg-amber-500 hover:bg-amber-600 text-amber-700';
    if (grade.startsWith('D')) return 'bg-orange-500 hover:bg-orange-600 text-orange-700';
    if (grade === 'F') return 'bg-rose-500 hover:bg-rose-600 text-rose-700';
    return 'bg-slate-400 hover:bg-slate-500 text-slate-700';
  };

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
            <PieChart className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">성적 분포 시각화 (Grade Distribution)</h3>
            <p className="text-xs text-slate-500">전체 {totalCourses}개 등록 과목의 등급별 취득 빈도</p>
          </div>
        </div>

        {/* Group pills */}
        <div className="flex items-center gap-1.5 flex-wrap text-xs">
          <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-semibold border border-emerald-100">
            A계열: {aCount}개 ({totalCourses > 0 ? Math.round((aCount / totalCourses) * 100) : 0}%)
          </span>
          <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-semibold border border-indigo-100">
            B계열: {bCount}개 ({totalCourses > 0 ? Math.round((bCount / totalCourses) * 100) : 0}%)
          </span>
          {cCount > 0 && (
            <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 font-semibold border border-amber-100">
              C계열: {cCount}개
            </span>
          )}
          {fCount > 0 && (
            <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 font-semibold border border-rose-100">
              F: {fCount}개
            </span>
          )}
          {pCount > 0 && (
            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold">
              P/NP: {pCount}개
            </span>
          )}
        </div>
      </div>

      {/* Bar Chart Visualization */}
      <div className="pt-6 pb-2">
        <div className="flex items-end gap-2 h-36 px-2">
          {grades.map((grade) => {
            const count = distribution[grade] || 0;
            const heightPercent = totalCourses > 0 ? Math.max((count / maxCount) * 85, count > 0 ? 12 : 4) : 4;
            const pctOfTotal = totalCourses > 0 ? Math.round((count / totalCourses) * 100) : 0;

            return (
              <div key={grade} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                {/* Tooltip on hover */}
                {count > 0 && (
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 px-2 py-1 rounded bg-slate-800 text-white text-[10px] whitespace-nowrap pointer-events-none z-10 shadow-md">
                    {grade}: {count}과목 ({pctOfTotal}%)
                  </div>
                )}

                <span className="text-[11px] font-bold text-slate-600 mb-1 group-hover:text-indigo-600 transition-colors">
                  {count > 0 ? count : ''}
                </span>

                <div className="w-full max-w-[42px] bg-slate-100 rounded-t-lg overflow-hidden flex items-end h-[90px]">
                  <div
                    className={`w-full rounded-t-lg transition-all duration-500 ${getBarColor(grade).split(' ')[0]}`}
                    style={{ height: `${heightPercent}%` }}
                  />
                </div>

                <span className="text-xs font-bold text-slate-700 mt-2">
                  {grade}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
