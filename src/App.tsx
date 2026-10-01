import React, { useState, useEffect, useMemo } from 'react';
import {
  GraduationCap,
  Download,
  Upload,
  Plus,
  RefreshCw,
  Sliders,
  FileCode,
  Target,
  Sparkles,
  BookOpen,
  Search,
  Filter,
  CheckCircle,
  HelpCircle,
  BarChart2,
} from 'lucide-react';
import { Course, GradeScale, Semester } from './types';
import { INITIAL_SEMESTERS } from './data/sampleData';
import {
  calculateOverall,
  downloadCsvFile,
  exportToCsv,
  generateStandaloneHtml,
} from './utils/calculator';
import { SummaryCards } from './components/SummaryCards';
import { GradeDistributionChart } from './components/GradeDistributionChart';
import { GpaTrendChart } from './components/GpaTrendChart';
import { SemesterCard } from './components/SemesterCard';
import { TargetGpaModal } from './components/TargetGpaModal';
import { CsvImportModal } from './components/CsvImportModal';
import { ToastContainer, ToastMessage } from './components/Toast';

const STORAGE_KEY_SEMESTERS = 'unigrade_semesters_v1';
const STORAGE_KEY_SETTINGS = 'unigrade_settings_v1';

const DEFAULT_GRAD_CREDITS = 130;
const DEFAULT_MAJOR_CREDITS = 60;

interface SavedSettings {
  scale?: GradeScale;
  includeFInGpa?: boolean;
  targetGradCredits?: number;
  targetMajorCredits?: number;
}

const loadSettings = (): SavedSettings => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object') return parsed;
    }
  } catch (e) {
    console.error(e);
  }
  return {};
};

export default function App() {
  // Main Data States
  const [semesters, setSemesters] = useState<Semester[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SEMESTERS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return INITIAL_SEMESTERS;
  });

  // Settings
  const [savedSettings] = useState(loadSettings);

  const [scale, setScale] = useState<GradeScale>(
    savedSettings.scale === '4.3' ? '4.3' : '4.5'
  );
  const [includeFInGpa, setIncludeFInGpa] = useState<boolean>(
    typeof savedSettings.includeFInGpa === 'boolean' ? savedSettings.includeFInGpa : true
  );
  const [targetGradCredits, setTargetGradCredits] = useState<number>(
    Number(savedSettings.targetGradCredits) || DEFAULT_GRAD_CREDITS
  );
  const [targetMajorCredits, setTargetMajorCredits] = useState<number>(
    Number(savedSettings.targetMajorCredits) || DEFAULT_MAJOR_CREDITS
  );

  // Modals & UI States
  const [isTargetModalOpen, setIsTargetModalOpen] = useState(false);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: 'success' | 'error' | 'info', text: string) => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 5);
    setToasts((prev) => [...prev, { id, type, text }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // LocalStorage Auto-save
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SEMESTERS, JSON.stringify(semesters));
    } catch (e) {
      console.error('Failed to save semesters to localStorage', e);
    }
  }, [semesters]);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY_SETTINGS,
        JSON.stringify({ scale, includeFInGpa, targetGradCredits, targetMajorCredits })
      );
    } catch (e) {
      console.error('Failed to save settings to localStorage', e);
    }
  }, [scale, includeFInGpa, targetGradCredits, targetMajorCredits]);

  // Calculations
  const stats = useMemo(() => {
    return calculateOverall(semesters, scale, includeFInGpa);
  }, [semesters, scale, includeFInGpa]);

  // Semester Operations
  const handleAddSemester = (customName?: string) => {
    let newName = customName;
    if (!newName) {
      const count = semesters.length + 1;
      const year = Math.ceil(count / 2);
      const term = count % 2 === 1 ? 1 : 2;
      newName = `${year}학년 ${term}학기`;
    }

    const newSemester: Semester = {
      id: `sem-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: newName,
      courses: [],
    };

    setSemesters((prev) => [...prev, newSemester]);
    addToast('success', `'${newName}'가 추가되었습니다.`);
  };

  const handleUpdateSemesterName = (id: string, newName: string) => {
    setSemesters((prev) =>
      prev.map((s) => (s.id === id ? { ...s, name: newName } : s))
    );
    addToast('info', '학기 이름이 변경되었습니다.');
  };

  const handleDeleteSemester = (id: string) => {
    const target = semesters.find((s) => s.id === id);
    if (!target) return;

    if (window.confirm(`정말로 '${target.name}'와 포함된 모든 과목을 삭제하시겠습니까?`)) {
      setSemesters((prev) => prev.filter((s) => s.id !== id));
      addToast('info', `'${target.name}'가 삭제되었습니다.`);
    }
  };

  // Course Operations
  const handleAddCourse = (semesterId: string, courseData: Omit<Course, 'id'>) => {
    const newCourse: Course = {
      ...courseData,
      id: `course-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };

    setSemesters((prev) =>
      prev.map((s) =>
        s.id === semesterId ? { ...s, courses: [...s.courses, newCourse] } : s
      )
    );
    addToast('success', `'${courseData.name}' 과목이 추가되었습니다.`);
  };

  const handleUpdateCourse = (semesterId: string, updatedCourse: Course) => {
    setSemesters((prev) =>
      prev.map((s) =>
        s.id === semesterId
          ? {
              ...s,
              courses: s.courses.map((c) => (c.id === updatedCourse.id ? updatedCourse : c)),
            }
          : s
      )
    );
    addToast('info', '과목 정보가 수정되었습니다.');
  };

  const handleDeleteCourse = (semesterId: string, courseId: string) => {
    setSemesters((prev) =>
      prev.map((s) =>
        s.id === semesterId
          ? { ...s, courses: s.courses.filter((c) => c.id !== courseId) }
          : s
      )
    );
    addToast('info', '과목이 삭제되었습니다.');
  };

  // CSV Export & Import
  const handleExportCsv = () => {
    if (semesters.length === 0 || stats.totalCoursesCount === 0) {
      addToast('error', '내보낼 성적 데이터가 없습니다.');
      return;
    }

    const csvContent = exportToCsv(semesters, scale, includeFInGpa);
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    downloadCsvFile(csvContent, `대학_성적내역_${scale}만점_${dateStr}.csv`);
    addToast('success', '성적 내역이 엑셀 호환 CSV 파일로 다운로드되었습니다.');
  };

  const handleImportCsv = (importedSemesters: Semester[], mode: 'replace' | 'append') => {
    if (mode === 'replace') {
      setSemesters(importedSemesters);
    } else {
      setSemesters((prev) => [...prev, ...importedSemesters]);
    }
    const count = importedSemesters.reduce((acc, s) => acc + s.courses.length, 0);
    addToast('success', `${count}개 과목 성적 데이터를 성공적으로 불러왔습니다!`);
  };

  // Standalone HTML Download
  const handleDownloadStandaloneHtml = () => {
    const htmlCode = generateStandaloneHtml(semesters, scale);
    const blob = new Blob([htmlCode], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'index.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addToast('success', '오프라인에서 바로 실행 가능한 단일 index.html 파일이 저장되었습니다!');
  };

  // Reset to Sample Data
  const handleResetToSample = () => {
    if (window.confirm('기본 대학생 샘플 성적 데이터로 재설정하시겠습니까? 현재 입력된 내용은 덮어씌워집니다.')) {
      setSemesters(INITIAL_SEMESTERS);
      addToast('info', '샘플 데이터가 복원되었습니다.');
    }
  };

  // Full Clear
  const handleClearAll = () => {
    if (window.confirm('모든 학기 및 성적 데이터를 완전히 초기화하시겠습니까?')) {
      setSemesters([]);
      addToast('info', '모든 성적 데이터가 초기화되었습니다.');
    }
  };

  // Filtered Semesters
  const isFiltering = searchKeyword.trim() !== '' || filterCategory !== 'ALL';

  const filteredSemesters = useMemo(() => {
    if (!isFiltering) {
      return semesters;
    }

    const kw = searchKeyword.toLowerCase().trim();
    return semesters
      .map((sem) => {
        const matchingCourses = sem.courses.filter((c) => {
          const matchKw = !kw || c.name.toLowerCase().includes(kw);
          const matchCat =
            filterCategory === 'ALL' ||
            (filterCategory === 'MAJOR' && c.category.startsWith('전공')) ||
            (filterCategory === 'GEN' && c.category.startsWith('교양')) ||
            c.category === filterCategory;
          return matchKw && matchCat;
        });
        return {
          ...sem,
          courses: matchingCourses,
        };
      })
      .filter((sem) => sem.courses.length > 0);
  }, [semesters, searchKeyword, filterCategory, isFiltering]);

  // 필터링 중에도 학기 통계는 전체 과목 기준으로 계산하기 위한 원본 조회용 맵
  const semesterById = useMemo(
    () => new Map(semesters.map((s) => [s.id, s])),
    [semesters]
  );

  return (
    <div className="min-h-screen bg-slate-50/60 text-slate-800 antialiased font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-3.5 shadow-2xs">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Logo & App Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
                  UniGrade
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                  학점 계산기
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                실시간 학기별/전공별 성적 계산 및 시뮬레이션
              </p>
            </div>
          </div>

          {/* Scale Selector & Major Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* 4.5 / 4.3 Scale Toggle */}
            <div className="flex items-center bg-slate-100/90 p-1 rounded-xl border border-slate-200 text-xs font-bold">
              <button
                type="button"
                onClick={() => setScale('4.5')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  scale === '4.5'
                    ? 'bg-white text-indigo-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                4.5 만점
              </button>
              <button
                type="button"
                onClick={() => setScale('4.3')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  scale === '4.3'
                    ? 'bg-white text-indigo-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                4.3 만점
              </button>
            </div>

            {/* Target GPA Simulator */}
            <button
              type="button"
              onClick={() => setIsTargetModalOpen(true)}
              className="px-3 py-1.5 bg-violet-50 hover:bg-violet-100 text-violet-700 border border-violet-200 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Target className="w-3.5 h-3.5 text-violet-600" />
              <span>목표 학점 계산기</span>
            </button>

            {/* CSV Export */}
            <button
              type="button"
              onClick={handleExportCsv}
              className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
              title="한글 깨짐 없는 UTF-8 BOM 엑셀 CSV 파일 다운로드"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden md:inline">엑셀 CSV</span> 내보내기
            </button>

            {/* CSV Import */}
            <button
              type="button"
              onClick={() => setIsCsvModalOpen(true)}
              className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Upload className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden md:inline">CSV</span> 불러오기
            </button>

            {/* Settings Toggle */}
            <button
              type="button"
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              className={`p-2 rounded-xl border text-xs transition-all cursor-pointer ${
                isSettingsOpen
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                  : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600'
              }`}
              title="설정 및 추가 기능"
            >
              <Sliders className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Settings Panel (Collapsible) */}
      {isSettingsOpen && (
        <div className="bg-white border-b border-indigo-100 shadow-sm px-4 sm:px-8 py-4 animate-in slide-in-from-top-2 duration-200">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block text-slate-500 font-semibold mb-1">
                  졸업 목표 기준 학점
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="100"
                    max="180"
                    value={targetGradCredits || ''}
                    onChange={(e) => setTargetGradCredits(parseInt(e.target.value, 10) || 0)}
                    onBlur={() => {
                      if (!targetGradCredits) setTargetGradCredits(DEFAULT_GRAD_CREDITS);
                    }}
                    className="w-24 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-800"
                  />
                  <span className="text-slate-500">학점 (일반 130~140)</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-500 font-semibold mb-1">
                  전공 목표 이수 학점
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="30"
                    max="120"
                    value={targetMajorCredits || ''}
                    onChange={(e) => setTargetMajorCredits(parseInt(e.target.value, 10) || 0)}
                    onBlur={() => {
                      if (!targetMajorCredits) setTargetMajorCredits(DEFAULT_MAJOR_CREDITS);
                    }}
                    className="w-24 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-800"
                  />
                  <span className="text-slate-500">학점 (단일 60/복수전공 등)</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-500 font-semibold mb-1">
                  F학점 GPA 반영 옵션
                </label>
                <label className="flex items-center gap-2 cursor-pointer mt-1">
                  <input
                    type="checkbox"
                    checked={includeFInGpa}
                    onChange={(e) => setIncludeFInGpa(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded"
                  />
                  <span className="font-semibold text-slate-700">F학점 평점 포함 (공식 표준)</span>
                </label>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
              <button
                type="button"
                onClick={handleDownloadStandaloneHtml}
                className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                title="단일 HTML 파일 다운로드"
              >
                <FileCode className="w-3.5 h-3.5 text-emerald-600" />
                단일 index.html 파일 다운로드
              </button>

              <button
                type="button"
                onClick={handleResetToSample}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3 text-slate-500" />
                샘플 데이터 로드
              </button>

              <button
                type="button"
                onClick={handleClearAll}
                className="px-3 py-1.5 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-semibold transition-colors"
              >
                전체 초기화
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Dashboard Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-6">
        {/* KPI Top Cards */}
        <SummaryCards
          stats={stats}
          scale={scale}
          targetGradCredits={targetGradCredits}
          targetMajorCredits={targetMajorCredits}
        />

        {/* Visual Charts Grid: Distribution + Trend */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <GradeDistributionChart
            distribution={stats.gradeDistribution}
            totalCourses={stats.totalCoursesCount}
            scale={scale}
          />
          <GpaTrendChart
            semesterStats={stats.semesterStats}
            scale={scale}
            overallGpa={stats.overallGpa}
          />
        </div>

        {/* Action & Filter Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="등록된 과목명 검색 (예: 알고리즘, 미적분)"
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:bg-white transition-all text-slate-800"
              />
            </div>

            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none text-slate-700 font-medium cursor-pointer"
            >
              <option value="ALL">전체 과목 보기</option>
              <option value="MAJOR">전공 과목만</option>
              <option value="GEN">교양 과목만</option>
              <option value="전공필수">전공필수만</option>
              <option value="전공선택">전공선택만</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleAddSemester()}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>새 학기 추가</span>
            </button>
          </div>
        </div>

        {/* Semesters List */}
        <div>
          {filteredSemesters.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-slate-300">
              <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-700 mb-1">
                {isFiltering ? '검색 결과와 일치하는 과목이 없습니다.' : '등록된 학기가 없습니다.'}
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                {isFiltering
                  ? '검색어를 변경하거나 필터를 초기화해 보세요.'
                  : '새 학기를 추가하거나 우측 상단 [설정]에서 샘플 데이터를 불러와 보세요.'}
              </p>
              {!isFiltering && (
                <button
                  type="button"
                  onClick={() => handleAddSemester()}
                  className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl shadow-xs"
                >
                  + 첫 학기 추가하기
                </button>
              )}
            </div>
          ) : (
            filteredSemesters.map((semester) => (
              <SemesterCard
                key={semester.id}
                semester={semester}
                statsSemester={semesterById.get(semester.id)}
                scale={scale}
                includeFInGpa={includeFInGpa}
                onUpdateSemesterName={handleUpdateSemesterName}
                onDeleteSemester={handleDeleteSemester}
                onAddCourse={handleAddCourse}
                onUpdateCourse={handleUpdateCourse}
                onDeleteCourse={handleDeleteCourse}
              />
            ))
          )}
        </div>
      </main>

      {/* Target GPA Simulator Modal */}
      <TargetGpaModal
        isOpen={isTargetModalOpen}
        onClose={() => setIsTargetModalOpen(false)}
        stats={stats}
        scale={scale}
        targetGradCredits={targetGradCredits}
      />

      {/* CSV Import Modal */}
      <CsvImportModal
        isOpen={isCsvModalOpen}
        onClose={() => setIsCsvModalOpen(false)}
        onImport={handleImportCsv}
      />

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}
