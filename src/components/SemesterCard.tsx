import React, { useState } from 'react';
import {
  Trash2,
  Plus,
  Edit2,
  Check,
  X,
  RotateCcw,
  BookOpen,
  Award,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  CATEGORY_OPTIONS,
  Course,
  CourseCategory,
  GRADE_OPTIONS_4_3,
  GRADE_OPTIONS_4_5,
  GradeScale,
  Semester,
} from '../types';
import { calculateSemester, getGradePoint, parseCredits } from '../utils/calculator';

interface SemesterCardProps {
  semester: Semester;
  /** 학기 통계 계산용 원본 학기 (필터링으로 과목이 줄어든 경우에도 전체 기준 GPA 표시) */
  statsSemester?: Semester;
  scale: GradeScale;
  includeFInGpa: boolean;
  onUpdateSemesterName: (id: string, newName: string) => void;
  onDeleteSemester: (id: string) => void;
  onAddCourse: (semesterId: string, course: Omit<Course, 'id'>) => void;
  onUpdateCourse: (semesterId: string, course: Course) => void;
  onDeleteCourse: (semesterId: string, courseId: string) => void;
}

export const SemesterCard: React.FC<SemesterCardProps> = ({
  semester,
  statsSemester,
  scale,
  includeFInGpa,
  onUpdateSemesterName,
  onDeleteSemester,
  onAddCourse,
  onUpdateCourse,
  onDeleteCourse,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(semester.name);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // New course form state
  const [newName, setNewName] = useState('');
  const [newCredits, setNewCredits] = useState('3');
  const [newGrade, setNewGrade] = useState<string>('A+');
  const [newCategory, setNewCategory] = useState<CourseCategory>('전공필수');
  const [newIsRetake, setNewIsRetake] = useState(false);

  // Editing course state
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [editCourseData, setEditCourseData] = useState<Course | null>(null);
  const [editCredits, setEditCredits] = useState('');

  const newCreditsValue = parseCredits(newCredits);
  const editCreditsValue = parseCredits(editCredits);

  const semStats = calculateSemester(statsSemester ?? semester, scale, includeFInGpa);
  const gradeOptions = scale === '4.5' ? GRADE_OPTIONS_4_5 : GRADE_OPTIONS_4_3;

  const handleSaveTitle = () => {
    if (titleValue.trim()) {
      onUpdateSemesterName(semester.id, titleValue.trim());
      setIsEditingTitle(false);
    }
  };

  const handleAddCourseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || newCreditsValue === null) return;

    onAddCourse(semester.id, {
      name: newName.trim(),
      credits: newCreditsValue,
      grade: newGrade,
      category: newCategory,
      isRetake: newIsRetake,
    });

    setNewName('');
    setNewIsRetake(false);
  };

  const startEditCourse = (course: Course) => {
    setEditingCourseId(course.id);
    setEditCourseData({ ...course });
    setEditCredits(String(course.credits));
  };

  const saveEditCourse = () => {
    if (editCourseData && editCourseData.name.trim() && editCreditsValue !== null) {
      onUpdateCourse(semester.id, { ...editCourseData, credits: editCreditsValue });
      setEditingCourseId(null);
      setEditCourseData(null);
    }
  };

  const getGradeBadgeColor = (grade: string) => {
    if (grade.startsWith('A')) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (grade.startsWith('B')) return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    if (grade.startsWith('C')) return 'bg-amber-50 text-amber-700 border-amber-200';
    if (grade.startsWith('D')) return 'bg-orange-50 text-orange-700 border-orange-200';
    if (grade === 'F') return 'bg-rose-50 text-rose-700 border-rose-200';
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  const getCategoryBadgeColor = (category: CourseCategory) => {
    switch (category) {
      case '전공필수':
        return 'bg-violet-100 text-violet-800 font-semibold';
      case '전공선택':
        return 'bg-indigo-100 text-indigo-800';
      case '교양필수':
        return 'bg-sky-100 text-sky-800';
      case '교양선택':
        return 'bg-teal-100 text-teal-800';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-sm transition-all mb-5 overflow-hidden">
      {/* Header */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-50 to-indigo-50/30 border-b border-slate-200/70 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          {isEditingTitle ? (
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={titleValue}
                onChange={(e) => setTitleValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle()}
                className="px-2.5 py-1 text-base font-bold border border-indigo-400 rounded-lg outline-none bg-white text-slate-800 ring-2 ring-indigo-100"
                autoFocus
              />
              <button
                type="button"
                onClick={handleSaveTitle}
                className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors"
                title="저장"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setTitleValue(semester.name);
                  setIsEditingTitle(false);
                }}
                className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-md transition-colors"
                title="취소"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold text-slate-800 tracking-tight">
                {semester.name}
              </h3>
              <button
                type="button"
                onClick={() => setIsEditingTitle(true)}
                className="text-slate-400 hover:text-indigo-600 p-1 rounded transition-colors"
                title="학기 이름 수정"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200/70 text-slate-600 font-medium">
            {semester.courses.length}과목
          </span>
        </div>

        {/* Semester Stats Badges */}
        <div className="flex items-center gap-2 flex-wrap text-xs sm:text-sm">
          <div className="flex items-center gap-1 px-3 py-1 rounded-xl bg-white border border-indigo-200 shadow-2xs font-bold text-indigo-700">
            <Award className="w-3.5 h-3.5 text-indigo-600" />
            <span>학기 평점:</span>
            <span className="text-sm font-extrabold text-indigo-900">
              {semStats.gpa.toFixed(2)}
            </span>
            <span className="text-[11px] text-indigo-400 font-normal">/ {scale}</span>
          </div>

          <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white border border-violet-200 shadow-2xs text-xs font-semibold text-violet-700">
            <BookOpen className="w-3.5 h-3.5 text-violet-600" />
            <span>전공: {semStats.majorGpa.toFixed(2)}</span>
          </div>

          <div className="px-2.5 py-1 rounded-xl bg-white border border-slate-200 shadow-2xs text-xs text-slate-600 font-medium">
            취득 <strong className="text-slate-900 font-bold">{semStats.earnedCredits}</strong>학점
            <span className="text-[11px] text-slate-400 ml-1">
              (신청 {semStats.totalRegisteredCredits})
            </span>
          </div>

          <div className="flex items-center gap-1 ml-1">
            <button
              type="button"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-white rounded-lg transition-colors"
              title={isCollapsed ? '펼치기' : '접기'}
            >
              {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={() => onDeleteSemester(semester.id)}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
              title="학기 삭제"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {!isCollapsed && (
        <div>
          {/* Courses Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-2.5 px-4">과목명</th>
                  <th className="py-2.5 px-3">이수 구분</th>
                  <th className="py-2.5 px-3 text-center">학점</th>
                  <th className="py-2.5 px-3 text-center">성적 (등급)</th>
                  <th className="py-2.5 px-3 text-center">평점 환산</th>
                  <th className="py-2.5 px-3 text-center">재수강</th>
                  <th className="py-2.5 px-4 text-right">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {semester.courses.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-xs text-slate-400">
                      등록된 과목이 없습니다. 아래 빠른 입력창에서 과목을 추가해 보세요.
                    </td>
                  </tr>
                ) : (
                  semester.courses.map((course) => {
                    const isEditing = editingCourseId === course.id;
                    const point = getGradePoint(course.grade, scale);

                    if (isEditing && editCourseData) {
                      return (
                        <tr key={course.id} className="bg-indigo-50/40">
                          <td className="py-2 px-4">
                            <input
                              type="text"
                              value={editCourseData.name}
                              onChange={(e) =>
                                setEditCourseData({ ...editCourseData, name: e.target.value })
                              }
                              className="w-full px-2 py-1 text-sm bg-white border border-indigo-300 rounded outline-none"
                              placeholder="과목명"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <select
                              value={editCourseData.category}
                              onChange={(e) =>
                                setEditCourseData({
                                  ...editCourseData,
                                  category: e.target.value as CourseCategory,
                                })
                              }
                              className="px-2 py-1 text-xs bg-white border border-indigo-300 rounded outline-none"
                            >
                              {CATEGORY_OPTIONS.map((cat) => (
                                <option key={cat} value={cat}>
                                  {cat}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="py-2 px-3 text-center">
                            <input
                              type="text"
                              inputMode="decimal"
                              value={editCredits}
                              onChange={(e) => setEditCredits(e.target.value)}
                              placeholder="예: 3, 0.5"
                              title="이수학점 (0보다 크고 30 이하)"
                              className={`w-16 px-2 py-1 text-xs text-center bg-white border rounded outline-none ${
                                editCreditsValue === null ? 'border-rose-400' : 'border-indigo-300'
                              }`}
                            />
                          </td>
                          <td className="py-2 px-3 text-center">
                            <select
                              value={editCourseData.grade}
                              onChange={(e) =>
                                setEditCourseData({ ...editCourseData, grade: e.target.value })
                              }
                              className="px-2 py-1 text-xs bg-white border border-indigo-300 rounded outline-none font-bold text-indigo-700"
                            >
                              {gradeOptions.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="py-2 px-3 text-center text-xs text-slate-500">-</td>
                          <td className="py-2 px-3 text-center">
                            <input
                              type="checkbox"
                              checked={editCourseData.isRetake}
                              onChange={(e) =>
                                setEditCourseData({
                                  ...editCourseData,
                                  isRetake: e.target.checked,
                                })
                              }
                              className="w-4 h-4 text-indigo-600 rounded"
                            />
                          </td>
                          <td className="py-2 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={saveEditCourse}
                                className="p-1 text-emerald-600 hover:bg-emerald-100 rounded"
                                title="저장"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingCourseId(null)}
                                className="p-1 text-slate-400 hover:bg-slate-200 rounded"
                                title="취소"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    }

                    return (
                      <tr
                        key={course.id}
                        className="hover:bg-slate-50/60 transition-colors group"
                      >
                        <td className="py-3 px-4 font-semibold text-slate-800">
                          <div className="flex items-center gap-2">
                            <span>{course.name}</span>
                            {course.isRetake && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 flex items-center gap-0.5">
                                <RotateCcw className="w-2.5 h-2.5" /> 재수강
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-md text-xs ${getCategoryBadgeColor(
                              course.category
                            )}`}
                          >
                            {course.category}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-slate-700">
                          {course.credits}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-lg text-xs font-extrabold border ${getGradeBadgeColor(
                              course.grade
                            )}`}
                          >
                            {course.grade}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center text-xs font-medium text-slate-500">
                          {point !== null ? (
                            <span className="font-bold text-slate-700">{point.toFixed(1)}</span>
                          ) : (
                            <span className="text-slate-400">P/NP</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center">
                          {course.isRetake ? (
                            <span className="text-xs text-amber-600 font-bold">O</span>
                          ) : (
                            <span className="text-xs text-slate-300">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                            <button
                              type="button"
                              onClick={() => startEditCourse(course)}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                              title="과목 수정"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onDeleteCourse(semester.id, course.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                              title="과목 삭제"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Quick Course Add Form */}
          <form
            onSubmit={handleAddCourseSubmit}
            className="p-3.5 bg-slate-50/80 border-t border-slate-200/70 flex flex-wrap items-center gap-2.5"
          >
            <div className="flex-1 min-w-[180px]">
              <input
                type="text"
                placeholder="과목명 입력 (예: 데이터통신, 경영학개론)"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full px-3 py-1.5 text-sm bg-white border border-slate-300 rounded-lg outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all placeholder:text-slate-400 text-slate-800"
              />
            </div>

            <div className="w-28">
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as CourseCategory)}
                className="w-full px-2 py-1.5 text-xs bg-white border border-slate-300 rounded-lg outline-none focus:border-indigo-500 text-slate-700 font-medium cursor-pointer"
              >
                {CATEGORY_OPTIONS.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="w-20">
              <input
                type="text"
                inputMode="decimal"
                value={newCredits}
                onChange={(e) => setNewCredits(e.target.value)}
                placeholder="학점 (예: 0.5)"
                title="이수학점 (0보다 크고 30 이하)"
                className={`w-full px-2 py-1.5 text-xs bg-white border rounded-lg outline-none text-slate-700 font-medium ${
                  newCredits && newCreditsValue === null
                    ? 'border-rose-400 focus:border-rose-500'
                    : 'border-slate-300 focus:border-indigo-500'
                }`}
              />
            </div>

            <div className="w-28">
              <select
                value={newGrade}
                onChange={(e) => setNewGrade(e.target.value)}
                className="w-full px-2 py-1.5 text-xs bg-white border border-slate-300 rounded-lg outline-none focus:border-indigo-500 font-bold text-indigo-700 cursor-pointer"
              >
                {gradeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <label className="flex items-center gap-1.5 text-xs text-slate-600 font-medium cursor-pointer select-none px-2 py-1 rounded hover:bg-slate-200/50">
              <input
                type="checkbox"
                checked={newIsRetake}
                onChange={(e) => setNewIsRetake(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded border-slate-300"
              />
              <span>재수강</span>
            </label>

            <button
              type="submit"
              disabled={!newName.trim() || newCreditsValue === null}
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              과목 추가
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
