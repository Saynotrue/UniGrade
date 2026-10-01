import React from 'react';
import { Award, BookOpen, GraduationCap, CheckCircle2, TrendingUp } from 'lucide-react';
import { GradeScale, OverallCalculation } from '../types';

interface SummaryCardsProps {
  stats: OverallCalculation;
  scale: GradeScale;
  targetGradCredits: number;
  targetMajorCredits: number;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({
  stats,
  scale,
  targetGradCredits,
  targetMajorCredits,
}) => {
  const maxGpa = scale === '4.5' ? 4.5 : 4.3;

  // Convert to 100-point scale approximation (standard Korean university formula)
  // Formula for 4.5: GPA * 10 + 55 (for GPA >= 2.0) or (GPA / 4.5) * 40 + 60
  const hundredScore =
    stats.overallGpa > 0
      ? scale === '4.5'
        ? Math.min(100, Math.round((stats.overallGpa / 4.5) * 40 + 60))
        : Math.min(100, Math.round((stats.overallGpa / 4.3) * 40 + 60))
      : 0;

  const gradProgressPercent = Math.min(
    100,
    Math.round((stats.totalEarnedCredits / (targetGradCredits || 130)) * 100)
  );

  const majorProgressPercent = Math.min(
    100,
    Math.round((stats.majorEarnedCredits / (targetMajorCredits || 60)) * 100)
  );

  // Honors status badge
  let honorsBadge = '';
  let honorsColor = 'text-slate-600 bg-slate-100';
  if (stats.overallGpa >= (scale === '4.5' ? 4.3 : 4.1)) {
    honorsBadge = '수석 / 최우등 (Summa Cum Laude)';
    honorsColor = 'text-emerald-700 bg-emerald-50 border border-emerald-200';
  } else if (stats.overallGpa >= (scale === '4.5' ? 4.0 : 3.8)) {
    honorsBadge = '우등 (Magna Cum Laude)';
    honorsColor = 'text-indigo-700 bg-indigo-50 border border-indigo-200';
  } else if (stats.overallGpa >= (scale === '4.5' ? 3.5 : 3.3)) {
    honorsBadge = '성적 우수 (Cum Laude)';
    honorsColor = 'text-blue-700 bg-blue-50 border border-blue-200';
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* 1. Overall GPA */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-indigo-500/10 to-transparent rounded-bl-full pointer-events-none" />
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold tracking-wider text-slate-500 uppercase flex items-center gap-1.5">
            <Award className="w-4 h-4 text-indigo-600" />
            전체 총 평점 (GPA)
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
            {scale} 만점
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            {stats.overallGpa.toFixed(2)}
          </span>
          <span className="text-sm font-semibold text-slate-400">/ {maxGpa.toFixed(1)}</span>
        </div>
        <div className="mt-2.5 flex items-center justify-between text-xs text-slate-500">
          <span>100점 환산: <strong className="text-slate-700 font-bold">{hundredScore}점</strong></span>
          <span>평점 반영: {stats.totalGpaCredits}학점</span>
        </div>
        {honorsBadge && (
          <div className={`mt-3 text-[11px] font-medium px-2 py-1 rounded-md inline-block ${honorsColor}`}>
            ⭐ {honorsBadge}
          </div>
        )}
      </div>

      {/* 2. Major GPA */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-violet-500/10 to-transparent rounded-bl-full pointer-events-none" />
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold tracking-wider text-slate-500 uppercase flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-violet-600" />
            전공 평점 (Major GPA)
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-violet-50 text-violet-700 border border-violet-100">
            전필 + 전선
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl sm:text-4xl font-extrabold text-violet-600 tracking-tight">
            {stats.majorGpa.toFixed(2)}
          </span>
          <span className="text-sm font-semibold text-slate-400">/ {maxGpa.toFixed(1)}</span>
        </div>
        <div className="mt-2.5">
          <div className="flex justify-between text-xs text-slate-500 mb-1">
            <span>전공 취득: <strong className="text-violet-700 font-bold">{stats.majorEarnedCredits}</strong> / {targetMajorCredits}학점</span>
            <span className="font-semibold text-violet-600">{majorProgressPercent}%</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-violet-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${majorProgressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* 3. Total Earned Credits & Graduation Progress */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-blue-500/10 to-transparent rounded-bl-full pointer-events-none" />
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold tracking-wider text-slate-500 uppercase flex items-center gap-1.5">
            <GraduationCap className="w-4 h-4 text-blue-600" />
            총 취득 학점
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-blue-50 text-blue-700 border border-blue-100">
            졸업 기준 {targetGradCredits}점
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            {stats.totalEarnedCredits}
          </span>
          <span className="text-sm font-semibold text-slate-400">/ {targetGradCredits}학점</span>
        </div>
        <div className="mt-2.5">
          <div className="flex justify-between text-xs text-slate-500 mb-1">
            <span>달성률</span>
            <span className="font-bold text-blue-600">{gradProgressPercent}%</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-600 to-indigo-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${gradProgressPercent}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            잔여 학점: {Math.max(0, targetGradCredits - stats.totalEarnedCredits)}학점 남음
          </p>
        </div>
      </div>

      {/* 4. Course Overview & General Credits */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-emerald-500/10 to-transparent rounded-bl-full pointer-events-none" />
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold tracking-wider text-slate-500 uppercase flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            이수 현황 요약
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
            총 {stats.totalCoursesCount}개 과목
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-1">
          <div className="bg-slate-50 rounded-xl p-2.5 text-center">
            <span className="text-[11px] text-slate-500 block">교양 이수</span>
            <strong className="text-base font-bold text-slate-800">{stats.generalEarnedCredits}학점</strong>
          </div>
          <div className="bg-slate-50 rounded-xl p-2.5 text-center">
            <span className="text-[11px] text-slate-500 block">총 신청 학점</span>
            <strong className="text-base font-bold text-slate-800">{stats.totalRegisteredCredits}학점</strong>
          </div>
        </div>
        <div className="mt-2.5 text-[11px] text-slate-500 flex items-center justify-between">
          <span>P/NP 과목: 학점인정 (GPA 제외)</span>
          <span className="text-indigo-600 font-semibold flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> 실시간 계산
          </span>
        </div>
      </div>
    </div>
  );
};
