import React from 'react';
import { TrendingUp } from 'lucide-react';
import { GradeScale, SemesterCalculation } from '../types';

interface GpaTrendChartProps {
  semesterStats: SemesterCalculation[];
  scale: GradeScale;
  overallGpa: number;
}

export const GpaTrendChart: React.FC<GpaTrendChartProps> = ({
  semesterStats,
  scale,
  overallGpa,
}) => {
  const maxGpa = scale === '4.5' ? 4.5 : 4.3;

  if (semesterStats.length === 0) return null;

  // Chart dimensions
  const height = 140;
  const paddingX = 40;
  const paddingY = 24;

  const validStats = semesterStats.filter((s) => s.gpaCredits > 0 || s.totalRegisteredCredits > 0);
  if (validStats.length === 0) return null;

  // Calculate coordinates
  const stepX = validStats.length > 1 ? (600 - paddingX * 2) / (validStats.length - 1) : 0;

  const getY = (gpa: number) => {
    const ratio = Math.max(0, Math.min(1, gpa / maxGpa));
    return height - paddingY - ratio * (height - paddingY * 2);
  };

  const points = validStats.map((stat, idx) => {
    const x = validStats.length > 1 ? paddingX + idx * stepX : 300;
    const y = getY(stat.gpa);
    const majorY = getY(stat.majorGpa);
    return { ...stat, x, y, majorY };
  });

  const pathD =
    points.length > 1
      ? points.reduce((acc, curr, idx) => `${acc} ${idx === 0 ? 'M' : 'L'} ${curr.x} ${curr.y}`, '')
      : '';

  const majorPathD =
    points.length > 1
      ? points.reduce(
          (acc, curr, idx) => `${acc} ${idx === 0 ? 'M' : 'L'} ${curr.x} ${curr.majorY}`,
          ''
        )
      : '';

  const avgY = getY(overallGpa);

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-violet-50 text-violet-600">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">학기별 성적 추이 (GPA Trend)</h3>
            <p className="text-xs text-slate-500">학기 진행에 따른 학기 평점 및 전공 평점 변화</p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-medium">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
            <span className="text-slate-600">학기 평점</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-violet-500"></span>
            <span className="text-slate-600">전공 평점</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 border-t-2 border-dashed border-slate-400"></span>
            <span className="text-slate-500">전체 누적 평균 ({overallGpa.toFixed(2)})</span>
          </div>
        </div>
      </div>

      <div className="w-full overflow-x-auto pt-2">
        <div className="min-w-[500px]">
          <svg viewBox="0 0 600 160" className="w-full h-44 overflow-visible">
            {/* Grid horizontal lines */}
            {[maxGpa, maxGpa * 0.75, maxGpa * 0.5].map((level, i) => {
              const y = getY(level);
              return (
                <g key={i}>
                  <line
                    x1={paddingX - 10}
                    y1={y}
                    x2={600 - paddingX + 10}
                    y2={y}
                    stroke="#f1f5f9"
                    strokeWidth="1"
                  />
                  <text
                    x={paddingX - 15}
                    y={y + 3}
                    textAnchor="end"
                    fontSize="10"
                    fill="#94a3b8"
                    fontWeight="500"
                  >
                    {level.toFixed(1)}
                  </text>
                </g>
              );
            })}

            {/* Average GPA Line */}
            {overallGpa > 0 && (
              <line
                x1={paddingX}
                y1={avgY}
                x2={600 - paddingX}
                y2={avgY}
                stroke="#94a3b8"
                strokeWidth="1.5"
                strokeDasharray="4 4"
              />
            )}

            {/* Major Line */}
            {points.length > 1 && (
              <path
                d={majorPathD}
                fill="none"
                stroke="#a855f7"
                strokeWidth="2"
                strokeDasharray="3 3"
                opacity="0.8"
              />
            )}

            {/* Overall Line */}
            {points.length > 1 && (
              <path
                d={pathD}
                fill="none"
                stroke="#4f46e5"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Points and labels */}
            {points.map((pt, i) => (
              <g key={i} className="group cursor-pointer">
                {/* Vertical hover indicator */}
                <line
                  x1={pt.x}
                  y1={paddingY}
                  x2={pt.x}
                  y2={height - paddingY}
                  stroke="#e2e8f0"
                  strokeWidth="1"
                  strokeDasharray="2 2"
                />

                {/* Major dot */}
                {pt.majorGpa > 0 && (
                  <circle
                    cx={pt.x}
                    cy={pt.majorY}
                    r="4"
                    fill="#a855f7"
                    stroke="#ffffff"
                    strokeWidth="1.5"
                  />
                )}

                {/* Overall dot */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r="5"
                  fill="#4f46e5"
                  stroke="#ffffff"
                  strokeWidth="2"
                  className="transition-transform group-hover:scale-125"
                />

                {/* GPA Value badge */}
                <rect
                  x={pt.x - 18}
                  y={pt.y - 24}
                  width="36"
                  height="18"
                  rx="4"
                  fill="#1e293b"
                />
                <text
                  x={pt.x}
                  y={pt.y - 12}
                  textAnchor="middle"
                  fontSize="10"
                  fontWeight="bold"
                  fill="#ffffff"
                >
                  {pt.gpa.toFixed(2)}
                </text>

                {/* Semester name */}
                <text
                  x={pt.x}
                  y={height - 6}
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight="600"
                  fill="#475569"
                >
                  {pt.semesterName.replace('학년 ', '-').replace('학기', '')}
                </text>
              </g>
            ))}
          </svg>
        </div>
      </div>
    </div>
  );
};
