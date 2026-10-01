import React, { useState } from 'react';
import { Upload, X, FileText, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { Semester } from '../types';
import { parseCsv } from '../utils/calculator';

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (semesters: Semester[], mode: 'replace' | 'append') => void;
}

export const CsvImportModal: React.FC<CsvImportModalProps> = ({
  isOpen,
  onClose,
  onImport,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [parsedSemesters, setParsedSemesters] = useState<Semester[] | null>(null);
  const [importMode, setImportMode] = useState<'replace' | 'append'>('replace');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    setFile(selected);
    setErrorMsg(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const result = parseCsv(text);
        if (result.length === 0) {
          setErrorMsg('유효한 과목 데이터를 파싱할 수 없습니다. CSV 파일 형식을 확인해 주세요.');
          setParsedSemesters(null);
        } else {
          setParsedSemesters(result);
          setErrorMsg(null);
        }
      } catch (err: any) {
        setErrorMsg('CSV 파일을 분석하는 도중 오류가 발생했습니다: ' + err.message);
        setParsedSemesters(null);
      }
    };
    reader.readAsText(selected, 'utf-8');
  };

  const totalImportedCourses = parsedSemesters
    ? parsedSemesters.reduce((acc, sem) => acc + sem.courses.length, 0)
    : 0;

  const handleConfirm = () => {
    if (parsedSemesters && parsedSemesters.length > 0) {
      onImport(parsedSemesters, importMode);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 relative max-h-[90vh] flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
            <Upload className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">엑셀 / CSV 성적 데이터 불러오기</h3>
            <p className="text-xs text-slate-500">기존에 내보냈거나 작성한 .csv 파일을 업로드하여 성적을 복원합니다</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-1 space-y-4">
          {/* File Picker */}
          <label className="border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-50/50 hover:bg-indigo-50/30">
            <FileText className="w-10 h-10 text-indigo-500 mb-2" />
            <span className="text-sm font-bold text-slate-800">
              {file ? file.name : '클릭하여 CSV 파일 선택'}
            </span>
            <span className="text-xs text-slate-500 mt-1">.csv (쉼표로 구분된 파일 지원)</span>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>

          {/* Error display */}
          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Parsed summary preview */}
          {parsedSemesters && (
            <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-2xl">
              <div className="flex items-center gap-2 mb-2 text-emerald-800 font-bold text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>데이터 파싱 성공!</span>
              </div>
              <p className="text-xs text-emerald-700">
                총 <strong>{parsedSemesters.length}개 학기</strong>, <strong>{totalImportedCourses}개 과목</strong>이 확인되었습니다.
              </p>

              {/* Semester preview list */}
              <div className="mt-3 flex flex-wrap gap-1.5">
                {parsedSemesters.map((s, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 bg-white border border-emerald-200 rounded-lg text-[11px] font-semibold text-emerald-900 shadow-2xs"
                  >
                    {s.name} ({s.courses.length}과목)
                  </span>
                ))}
              </div>

              {/* Import mode selection */}
              <div className="mt-4 pt-3 border-t border-emerald-200/80">
                <span className="text-xs font-bold text-slate-700 block mb-2">반영 방식 선택:</span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <label
                    className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-all ${
                      importMode === 'replace'
                        ? 'bg-white border-indigo-600 ring-2 ring-indigo-100 font-bold text-indigo-900'
                        : 'bg-white/80 border-slate-200 text-slate-600'
                    }`}
                  >
                    <input
                      type="radio"
                      name="importMode"
                      checked={importMode === 'replace'}
                      onChange={() => setImportMode('replace')}
                      className="text-indigo-600"
                    />
                    <span>새로 덮어쓰기 (권장)</span>
                  </label>
                  <label
                    className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-all ${
                      importMode === 'append'
                        ? 'bg-white border-indigo-600 ring-2 ring-indigo-100 font-bold text-indigo-900'
                        : 'bg-white/80 border-slate-200 text-slate-600'
                    }`}
                  >
                    <input
                      type="radio"
                      name="importMode"
                      checked={importMode === 'append'}
                      onChange={() => setImportMode('append')}
                      className="text-indigo-600"
                    />
                    <span>기존 데이터 뒤에 추가</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Guide table format */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600">
            <span className="font-bold text-slate-700 block mb-1">💡 CSV 권장 열(Column) 구성</span>
            <p className="text-[11px] text-slate-500 mb-2">
              <code>학기, 과목명, 이수학점, 성적(A+, A0 등), 이수구분(전공필수/교양 등), 재수강여부</code>
            </p>
            <p className="text-[11px] text-slate-500">
              * 본 웹 앱에서 [엑셀 CSV 내보내기]로 저장한 파일은 완벽하게 호환됩니다.
            </p>
          </div>
        </div>

        {/* Footer buttons */}
        <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            취소
          </button>
          <button
            type="button"
            disabled={!parsedSemesters || parsedSemesters.length === 0}
            onClick={handleConfirm}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <span>데이터 적용하기</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
