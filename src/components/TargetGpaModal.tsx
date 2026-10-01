import React, { useState } from 'react';
import { Target, X, Calculator, Sparkles, AlertCircle, CheckCircle } from 'lucide-react';
import { GradeScale, OverallCalculation } from '../types';

interface TargetGpaModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: OverallCalculation;
  scale: GradeScale;
  targetGradCredits: number;
}

export const TargetGpaModal: React.FC<TargetGpaModalProps> = ({
  isOpen,
  onClose,
  stats,
  scale,
  targetGradCredits,
}) => {
  const maxGpa = scale === '4.5' ? 4.5 : 4.3;

  const [desiredGpa, setDesiredGpa] = useState<number>(4.0);
  const [plannedRemainingCredits, setPlannedRemainingCredits] = useState<number>(
    Math.max(15, targetGradCredits - stats.totalEarnedCredits)
  );

  if (!isOpen) return null;

  // Calculation:
  // Current grade points sum = stats.totalGpaCredits * stats.overallGpa
  // Target total grade points = (stats.totalGpaCredits + plannedRemainingCredits) * desiredGpa
  // Required remaining grade points = Target total - current
  // Required GPA per credit = Required remaining / plannedRemainingCredits

  const currentGradePoints = stats.totalGpaCredits * stats.overallGpa;
  const targetTotalGpaCredits = stats.totalGpaCredits + plannedRemainingCredits;
  const targetTotalGradePoints = targetTotalGpaCredits * desiredGpa;
  const neededRemainingGradePoints = targetTotalGradePoints - currentGradePoints;

  const requiredGpa =
    plannedRemainingCredits > 0
      ? neededRemainingGradePoints / plannedRemainingCredits
      : 0;

  const isAlreadyAchieved = stats.overallGpa >= desiredGpa && stats.totalEarnedCredits >= targetGradCredits;
  const isImpossible = requiredGpa > maxGpa;
  const isZeroOrNegative = requiredGpa <= 0;

  let advice = '';
  if (isImpossible) {
    advice = `남은 ${plannedRemainingCredits}학점을 모두 만점(${maxGpa})으로 이수해도 목표 평점(${desiredGpa.toFixed(2)})에 도달하기 어렵습니다. 목표 평점을 조금 조정하거나 재수강을 통한 평점 세탁을 고려해 보세요!`;
  } else if (isZeroOrNegative) {
    advice = `이미 현재 평점이 매우 높아 남은 학점을 F 없이만 수료해도 목표 평점(${desiredGpa.toFixed(2)})을 안전하게 달성할 수 있습니다!`;
  } else if (requiredGpa >= (scale === '4.5' ? 4.3 : 4.1)) {
    advice = `남은 ${plannedRemainingCredits}학점 동안 거의 모든 과목에서 A+ 수준의 최고 학점을 받아야 달성 가능합니다.`;
  } else if (requiredGpa >= (scale === '4.5' ? 3.8 : 3.6)) {
    advice = `남은 ${plannedRemainingCredits}학점 동안 평균 A0~A+ 학점 취득을 유지하면 충분히 목표 달성이 가능합니다!`;
  } else if (requiredGpa >= (scale === '4.5' ? 3.3 : 3.1)) {
    advice = `남은 ${plannedRemainingCredits}학점 동안 B+ ~ A0 수준을 유지하면 안정적으로 목표를 이룰 수 있습니다.`;
  } else {
    advice = `남은 ${plannedRemainingCredits}학점 동안 B0 이상만 유지해도 목표 평점을 손쉽게 달성할 수 있습니다.`;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">목표 학점(Target GPA) 시뮬레이터</h3>
            <p className="text-xs text-slate-500">원하는 졸업 목표 평점을 위해 필요한 잔여 학점별 성적 예측</p>
          </div>
        </div>

        {/* Inputs */}
        <div className="space-y-4 mb-6">
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
            <div className="flex justify-between items-center mb-1 text-xs font-semibold text-slate-600">
              <span>현재 누적 평점 및 취득 학점</span>
              <span className="text-indigo-600 font-bold">{stats.overallGpa.toFixed(2)} / {maxGpa.toFixed(1)}</span>
            </div>
            <p className="text-xs text-slate-500">
              취득 {stats.totalEarnedCredits}학점 (평점 반영: {stats.totalGpaCredits}학점)
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              원하는 목표 졸업 평점 (최대 {maxGpa.toFixed(1)})
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                step="0.05"
                min="1.0"
                max={maxGpa}
                value={desiredGpa}
                onChange={(e) => setDesiredGpa(parseFloat(e.target.value) || 0)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl font-bold text-base text-slate-800 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
              />
              <div className="flex gap-1.5">
                {[3.5, 3.8, 4.0, 4.3].filter((g) => g <= maxGpa).map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setDesiredGpa(val)}
                    className={`px-2.5 py-2 text-xs font-bold rounded-lg border transition-colors ${
                      desiredGpa === val
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                    }`}
                  >
                    {val.toFixed(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              앞으로 취득할 남은 학점 (기본: {Math.max(0, targetGradCredits - stats.totalEarnedCredits)}학점)
            </label>
            <input
              type="number"
              min="1"
              max="150"
              value={plannedRemainingCredits}
              onChange={(e) => setPlannedRemainingCredits(parseInt(e.target.value, 10) || 0)}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl font-bold text-base text-slate-800 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
            />
          </div>
        </div>

        {/* Result Card */}
        <div
          className={`p-4 rounded-2xl border ${
            isImpossible
              ? 'bg-rose-50 border-rose-200 text-rose-900'
              : 'bg-indigo-50/70 border-indigo-200 text-indigo-950'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
              필요한 잔여 평균 평점
            </span>
            {isImpossible ? (
              <span className="text-xs font-bold text-rose-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" /> 달성 불가
              </span>
            ) : (
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                <CheckCircle className="w-4 h-4" /> 달성 가능
              </span>
            )}
          </div>

          <div className="text-3xl font-extrabold mb-1">
            {isImpossible ? (
              <span className="text-rose-600">{requiredGpa.toFixed(2)} (초과)</span>
            ) : isZeroOrNegative ? (
              <span className="text-emerald-600">이미 달성 완료</span>
            ) : (
              <span className="text-indigo-600">{requiredGpa.toFixed(2)} <span className="text-sm font-semibold text-slate-500">/ {maxGpa.toFixed(1)}</span></span>
            )}
          </div>

          <p className="text-xs leading-relaxed text-slate-600 mt-2">
            {advice}
          </p>
        </div>

        <div className="mt-5 text-right">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            확인 및 닫기
          </button>
        </div>
      </div>
    </div>
  );
};
