import {
  Course,
  GRADE_OPTIONS_4_3,
  GRADE_OPTIONS_4_5,
  GradeScale,
  OverallCalculation,
  Semester,
  SemesterCalculation,
} from '../types';

export function getGradePoint(grade: string, scale: GradeScale): number | null {
  const options = scale === '4.5' ? GRADE_OPTIONS_4_5 : GRADE_OPTIONS_4_3;
  const found = options.find((opt) => opt.value === grade);
  if (!found) return null;
  if (found.isPassFail) return null; // P/NP don't contribute to GPA
  return found.point;
}

export const MAX_COURSE_CREDITS = 30;

/** "3", "0.5", "2학점" 같은 입력을 학점 숫자로 변환. 유효하지 않으면 null */
export function parseCredits(input: string): number | null {
  const value = parseFloat(String(input).trim());
  if (!Number.isFinite(value) || value <= 0 || value > MAX_COURSE_CREDITS) return null;
  return Math.round(value * 10) / 10;
}

export function isPassFailGrade(grade: string): boolean {
  return grade === 'P' || grade === 'NP';
}

export function calculateSemester(
  semester: Semester,
  scale: GradeScale,
  includeFInGpa: boolean = true
): SemesterCalculation {
  let totalRegisteredCredits = 0;
  let earnedCredits = 0;
  let gpaCredits = 0;
  let totalGradePoints = 0;

  let majorEarnedCredits = 0;
  let majorGpaCredits = 0;
  let majorGradePoints = 0;

  let generalEarnedCredits = 0;

  for (const course of semester.courses) {
    const credits = course.credits || 0;
    totalRegisteredCredits += credits;

    const isF = course.grade === 'F';
    const isNP = course.grade === 'NP';
    const isP = course.grade === 'P';

    // Earned credits: exclude F and NP, include P
    if (!isF && !isNP) {
      earnedCredits += credits;
      if (course.category.startsWith('전공')) {
        majorEarnedCredits += credits;
      } else if (course.category.startsWith('교양')) {
        generalEarnedCredits += credits;
      }
    }

    // GPA calculations: P and NP are excluded
    if (!isPassFailGrade(course.grade)) {
      if (!isF || includeFInGpa) {
        const point = getGradePoint(course.grade, scale) ?? 0;
        gpaCredits += credits;
        totalGradePoints += point * credits;

        if (course.category.startsWith('전공')) {
          majorGpaCredits += credits;
          majorGradePoints += point * credits;
        }
      }
    }
  }

  const gpa = gpaCredits > 0 ? Number((totalGradePoints / gpaCredits).toFixed(2)) : 0;
  const majorGpa = majorGpaCredits > 0 ? Number((majorGradePoints / majorGpaCredits).toFixed(2)) : 0;

  return {
    semesterId: semester.id,
    semesterName: semester.name,
    totalRegisteredCredits,
    earnedCredits,
    gpaCredits,
    gpa,
    majorEarnedCredits,
    majorGpaCredits,
    majorGpa,
    generalEarnedCredits,
  };
}

export function calculateOverall(
  semesters: Semester[],
  scale: GradeScale,
  includeFInGpa: boolean = true
): OverallCalculation {
  let totalRegisteredCredits = 0;
  let totalEarnedCredits = 0;
  let totalGpaCredits = 0;
  let totalGradePoints = 0;

  let majorEarnedCredits = 0;
  let majorGpaCredits = 0;
  let majorGradePoints = 0;

  let generalEarnedCredits = 0;
  let totalCoursesCount = 0;

  const gradeDistribution: Record<string, number> = {
    'A+': 0,
    A0: 0,
    'A-': 0,
    'B+': 0,
    B0: 0,
    'B-': 0,
    'C+': 0,
    C0: 0,
    'C-': 0,
    'D+': 0,
    D0: 0,
    'D-': 0,
    F: 0,
    P: 0,
    NP: 0,
  };

  const semesterStats: SemesterCalculation[] = [];

  for (const sem of semesters) {
    const semStat = calculateSemester(sem, scale, includeFInGpa);
    semesterStats.push(semStat);

    totalRegisteredCredits += semStat.totalRegisteredCredits;
    totalEarnedCredits += semStat.earnedCredits;
    totalGpaCredits += semStat.gpaCredits;

    // Accumulate total grade points directly to maintain maximum float precision
    for (const c of sem.courses) {
      totalCoursesCount++;
      if (c.grade in gradeDistribution) {
        gradeDistribution[c.grade]++;
      } else {
        gradeDistribution[c.grade] = 1;
      }

      const isF = c.grade === 'F';
      if (!isPassFailGrade(c.grade)) {
        if (!isF || includeFInGpa) {
          const point = getGradePoint(c.grade, scale) ?? 0;
          totalGradePoints += point * c.credits;

          if (c.category.startsWith('전공')) {
            majorGradePoints += point * c.credits;
          }
        }
      }
    }

    majorEarnedCredits += semStat.majorEarnedCredits;
    majorGpaCredits += semStat.majorGpaCredits;
    generalEarnedCredits += semStat.generalEarnedCredits;
  }

  const overallGpa = totalGpaCredits > 0 ? Number((totalGradePoints / totalGpaCredits).toFixed(2)) : 0;
  const majorGpa = majorGpaCredits > 0 ? Number((majorGradePoints / majorGpaCredits).toFixed(2)) : 0;

  return {
    totalRegisteredCredits,
    totalEarnedCredits,
    totalGpaCredits,
    overallGpa,
    majorEarnedCredits,
    majorGpaCredits,
    majorGpa,
    generalEarnedCredits,
    semesterStats,
    gradeDistribution,
    totalCoursesCount,
  };
}

/**
 * Generate CSV string with UTF-8 BOM (\uFEFF) to guarantee Excel Korean compatibility
 */
export function exportToCsv(
  semesters: Semester[],
  scale: GradeScale,
  includeFInGpa: boolean = true
): string {
  const overall = calculateOverall(semesters, scale, includeFInGpa);
  const rows: string[] = [];

  // UTF-8 BOM
  const BOM = '\uFEFF';

  // Summary headers
  rows.push('# [UniGrade 학점 계산기 성적 요약]');
  rows.push(`학점 기준,${scale} 만점,전체 평점,${overall.overallGpa.toFixed(2)},전공 평점,${overall.majorGpa.toFixed(2)},총 취득학점,${overall.totalEarnedCredits}`);
  rows.push('');

  // Course table header
  rows.push('학기,과목명,이수학점,성적,평점,이수구분,재수강여부');

  for (const sem of semesters) {
    for (const c of sem.courses) {
      const pt = getGradePoint(c.grade, scale);
      const ptStr = pt !== null ? pt.toFixed(1) : '-';
      const cleanSem = sem.name.replace(/,/g, ' ');
      const cleanName = c.name.replace(/,/g, ' ');
      const retakeStr = c.isRetake ? '재수강' : '일반';
      rows.push(`${cleanSem},${cleanName},${c.credits},${c.grade},${ptStr},${c.category},${retakeStr}`);
    }
  }

  return BOM + rows.join('\r\n');
}

/**
 * Download CSV helper
 */
export function downloadCsvFile(content: string, filename: string = '성적내역_학점계산기.csv') {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Parse uploaded CSV file into Semester[] array
 */
export function parseCsv(csvText: string): Semester[] {
  // Strip BOM if present
  let cleanText = csvText;
  if (cleanText.charCodeAt(0) === 0xfeff) {
    cleanText = cleanText.slice(1);
  }

  const lines = cleanText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const semesterMap: Map<string, Course[]> = new Map();

  let headerIndex = -1;
  let semIdx = 0;
  let nameIdx = 1;
  let creditIdx = 2;
  let gradeIdx = 3;
  let catIdx = 5;
  let retakeIdx = 6;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith('#')) continue; // Skip comments/metadata

    const cols = line.split(',').map((c) => c.trim().replace(/^["']|["']$/g, ''));
    if (cols.length < 4) continue;

    // Detect header row
    if (cols.includes('과목명') || cols.includes('성적') || cols.includes('학기')) {
      headerIndex = i;
      semIdx = cols.findIndex((c) => c.includes('학기'));
      if (semIdx === -1) semIdx = 0;
      nameIdx = cols.findIndex((c) => c.includes('과목명') || c.includes('과목'));
      if (nameIdx === -1) nameIdx = 1;
      creditIdx = cols.findIndex((c) => c.includes('학점') && !c.includes('총'));
      if (creditIdx === -1) creditIdx = 2;
      gradeIdx = cols.findIndex((c) => c.includes('성적') || c.includes('등급'));
      if (gradeIdx === -1) gradeIdx = 3;
      catIdx = cols.findIndex((c) => c.includes('구분'));
      retakeIdx = cols.findIndex((c) => c.includes('재수강'));
      continue;
    }

    if (headerIndex !== -1 && i > headerIndex) {
      const semName = cols[semIdx] || '1학년 1학기';
      const name = cols[nameIdx] || '미지정 과목';
      const credits = parseCredits(cols[creditIdx] ?? '') ?? 3;
      let grade = (cols[gradeIdx] || 'A0').toUpperCase();
      // Normalize grade string
      if (grade === 'A') grade = 'A0';
      if (grade === 'B') grade = 'B0';
      if (grade === 'C') grade = 'C0';
      if (grade === 'D') grade = 'D0';

      let category: any = '전공필수';
      if (catIdx !== -1 && cols[catIdx]) {
        const catVal = cols[catIdx];
        if (catVal.includes('선택') && catVal.includes('전공')) category = '전공선택';
        else if (catVal.includes('필수') && catVal.includes('전공')) category = '전공필수';
        else if (catVal.includes('필수') && catVal.includes('교양')) category = '교양필수';
        else if (catVal.includes('선택') && catVal.includes('교양')) category = '교양선택';
        else if (catVal.includes('일반')) category = '일반선택';
      }

      let isRetake = false;
      if (retakeIdx !== -1 && cols[retakeIdx]) {
        const retakeVal = cols[retakeIdx].toLowerCase();
        if (retakeVal === '재수강' || retakeVal === 'y' || retakeVal === 'true' || retakeVal === '예') {
          isRetake = true;
        }
      }

      const course: Course = {
        id: `imported-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        name,
        credits,
        grade,
        category,
        isRetake,
      };

      if (!semesterMap.has(semName)) {
        semesterMap.set(semName, []);
      }
      semesterMap.get(semName)!.push(course);
    }
  }

  const result: Semester[] = [];
  semesterMap.forEach((courses, name) => {
    result.push({
      id: `sem-imp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name,
      courses,
    });
  });

  return result;
}

/**
 * Generate Standalone Single index.html File
 * Produces an offline single-file index.html with inline CSS and JS,
 * exactly fulfilling the user's specification for a single index.html file that can run locally!
 */
export function generateStandaloneHtml(
  semesters: Semester[],
  scale: GradeScale = '4.5'
): string {
  const jsonSemesters = JSON.stringify(semesters, null, 2);

  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>UniGrade - 대학생 학점 계산기 및 성적 관리</title>
  <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40' width='40' height='40' fill='none'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0%25' y1='100%25' x2='100%25' y2='0%25'%3E%3Cstop offset='0%25' stop-color='%234f46e5'/%3E%3Cstop offset='50%25' stop-color='%234338ca'/%3E%3Cstop offset='100%25' stop-color='%237c3aed'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect x='1' y='1' width='38' height='38' rx='12' fill='url(%23g)'/%3E%3Cg transform='translate(8, 8)' stroke='%23ffffff' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z'/%3E%3Cpath d='M22 10v6'/%3E%3Cpath d='M6 12.5V16a6 3 0 0 0 12 0v-3.5'/%3E%3C/g%3E%3C/svg%3E" />
  <style>
    :root {
      --primary: #4f46e5;
      --primary-hover: #4338ca;
      --primary-light: #eef2ff;
      --violet: #7c3aed;
      --slate-50: #f8fafc;
      --slate-100: #f1f5f9;
      --slate-200: #e2e8f0;
      --slate-600: #475569;
      --slate-700: #334155;
      --slate-800: #1e293b;
      --slate-900: #0f172a;
      --success: #10b981;
      --danger: #ef4444;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Pretendard', sans-serif; }
    body { background-color: #f8fafc; color: #1e293b; line-height: 1.5; padding: 24px 16px; }
    .container { max-width: 1100px; margin: 0 auto; }
    .header { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; margin-bottom: 24px; gap: 16px; padding-bottom: 20px; border-bottom: 1px solid var(--slate-200); }
    .title-group h1 { font-size: 26px; font-weight: 800; background: linear-gradient(135deg, #4f46e5, #7c3aed); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .title-group p { font-size: 14px; color: var(--slate-600); margin-top: 4px; }
    .btn-group { display: flex; gap: 8px; flex-wrap: wrap; }
    .btn { padding: 8px 14px; font-size: 13px; font-weight: 600; border-radius: 8px; border: 1px solid var(--slate-200); background: white; cursor: pointer; transition: all 0.2s; display: inline-flex; align-items: center; gap: 6px; }
    .btn:hover { background: var(--slate-50); border-color: #cbd5e1; }
    .btn-primary { background: var(--primary); color: white; border-color: var(--primary); }
    .btn-primary:hover { background: var(--primary-hover); }
    .btn-danger { color: var(--danger); border-color: #fecaca; }
    .btn-danger:hover { background: #fef2f2; }
    
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-bottom: 28px; }
    .stat-card { background: white; border-radius: 12px; padding: 20px; border: 1px solid #e2e8f0; box-shadow: 0 2px 4px rgba(0,0,0,0.02); }
    .stat-label { font-size: 13px; font-weight: 600; color: var(--slate-600); margin-bottom: 8px; }
    .stat-value { font-size: 32px; font-weight: 800; color: var(--slate-900); }
    .stat-sub { font-size: 12px; color: #64748b; margin-top: 6px; }
    .progress-bar-bg { width: 100%; height: 8px; background: var(--slate-100); border-radius: 9999px; overflow: hidden; margin-top: 10px; }
    .progress-bar-fill { height: 100%; background: linear-gradient(90deg, #4f46e5, #7c3aed); border-radius: 9999px; transition: width 0.3s; }
    
    .chart-card { background: white; border-radius: 12px; padding: 20px; border: 1px solid #e2e8f0; margin-bottom: 28px; }
    .chart-title { font-size: 16px; font-weight: 700; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center; }
    .dist-bars { display: flex; gap: 8px; align-items: flex-end; height: 120px; padding-top: 10px; }
    .dist-col { flex: 1; display: flex; flex-direction: column; align-items: center; height: 100%; justify-content: flex-end; }
    .dist-bar { width: 100%; max-width: 44px; border-radius: 6px 6px 0 0; background: #6366f1; transition: height 0.3s; }
    .dist-label { font-size: 12px; font-weight: 600; margin-top: 6px; color: var(--slate-700); }
    .dist-count { font-size: 11px; color: #64748b; margin-bottom: 4px; }
    
    .semester-section { margin-bottom: 24px; background: white; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.02); }
    .semester-header { background: #f8fafc; padding: 16px 20px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; flex-wrap: wrap; gap: 12px; }
    .semester-title { font-size: 17px; font-weight: 700; color: var(--slate-900); }
    .semester-badges { display: flex; gap: 10px; font-size: 13px; font-weight: 600; }
    .badge { padding: 4px 10px; border-radius: 6px; background: var(--primary-light); color: var(--primary); }
    
    .table-container { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; text-align: left; font-size: 14px; }
    th { background: #ffffff; padding: 12px 16px; font-weight: 600; color: #64748b; font-size: 12px; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; }
    td { padding: 12px 16px; border-bottom: 1px solid #f1f5f9; color: var(--slate-800); }
    tr:last-child td { border-bottom: none; }
    
    .add-row-form { padding: 16px 20px; background: #fafafa; border-top: 1px solid #e2e8f0; display: grid; grid-template-columns: 2fr 1fr 1fr 1fr auto auto; gap: 8px; align-items: center; }
    input, select { padding: 8px 10px; font-size: 13px; border: 1px solid #cbd5e1; border-radius: 6px; outline: none; background: white; }
    input:focus, select:focus { border-color: var(--primary); ring: 2px solid var(--primary-light); }
    .checkbox-wrap { display: flex; align-items: center; gap: 6px; font-size: 12px; color: #475569; white-space: nowrap; }
    
    @media (max-width: 768px) {
      .add-row-form { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <div class="container">
    <header class="header">
      <div class="title-group">
        <h1>UniGrade 학점 계산기</h1>
        <p>대학생을 위한 실시간 학점 및 성적 관리 웹 대시보드</p>
      </div>
      <div class="btn-group">
        <button class="btn" onclick="exportCsv()">📊 엑셀 CSV 내보내기</button>
        <button class="btn" onclick="document.getElementById('csvFileInput').click()">📁 CSV 불러오기</button>
        <input type="file" id="csvFileInput" accept=".csv" style="display:none;" onchange="importCsv(event)" />
        <button class="btn btn-primary" onclick="addNewSemester()">+ 학기 추가</button>
        <button class="btn btn-danger" onclick="resetData()">초기화</button>
      </div>
    </header>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">전체 총 평점 (GPA)</div>
        <div class="stat-value" id="overallGpa">0.00</div>
        <div class="stat-sub" id="overallGpaSub">4.50 만점 기준</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">전공 평점 (Major GPA)</div>
        <div class="stat-value" id="majorGpa" style="color: #7c3aed;">0.00</div>
        <div class="stat-sub" id="majorGpaSub">전공 이수 학점: 0점</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">총 취득 학점 / 졸업 기준 (130학점)</div>
        <div class="stat-value" id="earnedCredits">0</div>
        <div class="progress-bar-bg">
          <div class="progress-bar-fill" id="gradProgress" style="width: 0%;"></div>
        </div>
        <div class="stat-sub" id="gradPercent">달성률: 0%</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">등록 과목 수 / 신청 학점</div>
        <div class="stat-value" id="totalCourses">0과목</div>
        <div class="stat-sub" id="registeredCredits">신청 학점: 0학점</div>
      </div>
    </div>

    <div class="chart-card">
      <div class="chart-title">
        <span>성적 분포 요약</span>
        <span style="font-size: 13px; font-weight: normal; color: #64748b;" id="chartSummaryText"></span>
      </div>
      <div class="dist-bars" id="distBars"></div>
    </div>

    <div id="semestersContainer"></div>
  </div>

  <script>
    let appData = ${jsonSemesters};
    const GRADE_POINTS_4_5 = {
      'A+': 4.5, 'A0': 4.3, 'A-': 4.0, 'B+': 3.5, 'B0': 3.3, 'B-': 3.0,
      'C+': 2.5, 'C0': 2.3, 'C-': 2.0, 'D+': 1.5, 'D0': 1.3, 'D-': 1.0,
      'F': 0.0, 'P': null, 'NP': null
    };

    function saveToStorage() {
      try {
        localStorage.setItem('unigrade_offline_data', JSON.stringify(appData));
      } catch (e) {
        console.error(e);
      }
    }

    function loadFromStorage() {
      try {
        const saved = localStorage.getItem('unigrade_offline_data');
        if (saved) {
          appData = JSON.parse(saved);
        }
      } catch (e) {
        console.error(e);
      }
    }

    function calculateStats() {
      let totalRegistered = 0;
      let totalEarned = 0;
      let totalGpaCredits = 0;
      let totalGradePoints = 0;

      let majorEarned = 0;
      let majorGpaCredits = 0;
      let majorGradePoints = 0;

      let totalCourses = 0;
      const dist = { 'A+': 0, 'A0': 0, 'A-': 0, 'B+': 0, 'B0': 0, 'B-': 0, 'C+': 0, 'C0': 0, 'C-': 0, 'D+': 0, 'D0': 0, 'D-': 0, 'F': 0, 'P': 0, 'NP': 0 };

      appData.forEach(sem => {
        sem.courses.forEach(c => {
          totalCourses++;
          const cr = Number(c.credits) || 0;
          totalRegistered += cr;
          if (dist[c.grade] !== undefined) dist[c.grade]++;

          const isF = c.grade === 'F';
          const isNP = c.grade === 'NP';
          const isP = c.grade === 'P';

          if (!isF && !isNP) {
            totalEarned += cr;
            if (c.category.includes('전공')) majorEarned += cr;
          }

          if (GRADE_POINTS_4_5[c.grade] !== null) {
            const pt = GRADE_POINTS_4_5[c.grade] || 0;
            totalGpaCredits += cr;
            totalGradePoints += pt * cr;
            if (c.category.includes('전공')) {
              majorGpaCredits += cr;
              majorGradePoints += pt * cr;
            }
          }
        });
      });

      const overallGpa = totalGpaCredits > 0 ? (totalGradePoints / totalGpaCredits).toFixed(2) : '0.00';
      const majorGpa = majorGpaCredits > 0 ? (majorGradePoints / majorGpaCredits).toFixed(2) : '0.00';

      document.getElementById('overallGpa').textContent = overallGpa;
      document.getElementById('majorGpa').textContent = majorGpa;
      document.getElementById('majorGpaSub').textContent = '전공 취득 학점: ' + majorEarned + '학점';
      document.getElementById('earnedCredits').textContent = totalEarned + '학점';
      document.getElementById('totalCourses').textContent = totalCourses + '과목';
      document.getElementById('registeredCredits').textContent = '신청 학점: ' + totalRegistered + '학점';

      const gradPct = Math.min(Math.round((totalEarned / 130) * 100), 100);
      document.getElementById('gradProgress').style.width = gradPct + '%';
      document.getElementById('gradPercent').textContent = '달성률: ' + gradPct + '% (130학점 기준)';

      renderChart(dist, totalCourses);
    }

    function renderChart(dist, total) {
      const container = document.getElementById('distBars');
      container.innerHTML = '';
      const grades = ['A+', 'A0', 'A-', 'B+', 'B0', 'B-', 'C+', 'C0', 'C-', 'D+', 'D0', 'D-', 'F', 'P'];
      const maxCount = Math.max(...grades.map(g => dist[g] || 0), 1);

      grades.forEach(g => {
        const count = dist[g] || 0;
        const heightPct = Math.round((count / maxCount) * 90);
        const col = document.createElement('div');
        col.className = 'dist-col';

        let color = '#4f46e5';
        if (g.startsWith('A')) color = '#10b981';
        else if (g.startsWith('B')) color = '#6366f1';
        else if (g.startsWith('C')) color = '#f59e0b';
        else if (g.startsWith('D')) color = '#f97316';
        else if (g === 'F') color = '#ef4444';
        else color = '#64748b';

        col.innerHTML = \`
          <span class="dist-count">\${count > 0 ? count + '개' : ''}</span>
          <div class="dist-bar" style="height: \${Math.max(heightPct, 4)}%; background: \${color};"></div>
          <span class="dist-label">\${g}</span>
        \`;
        container.appendChild(col);
      });
    }

    function renderSemesters() {
      const container = document.getElementById('semestersContainer');
      container.innerHTML = '';

      appData.forEach((sem, semIdx) => {
        let semCredits = 0;
        let semEarned = 0;
        let semGpaCredits = 0;
        let semPoints = 0;

        sem.courses.forEach(c => {
          const cr = Number(c.credits) || 0;
          semCredits += cr;
          if (c.grade !== 'F' && c.grade !== 'NP') semEarned += cr;
          if (GRADE_POINTS_4_5[c.grade] !== null) {
            semGpaCredits += cr;
            semPoints += (GRADE_POINTS_4_5[c.grade] || 0) * cr;
          }
        });

        const semGpa = semGpaCredits > 0 ? (semPoints / semGpaCredits).toFixed(2) : '0.00';

        const card = document.createElement('div');
        card.className = 'semester-section';
        card.innerHTML = \`
          <div class="semester-header">
            <span class="semester-title">\${sem.name}</span>
            <div class="semester-badges">
              <span class="badge">평점: \${semGpa} / 4.5</span>
              <span class="badge" style="background: #f1f5f9; color: #475569;">취득: \${semEarned}학점</span>
              <button class="btn btn-danger" style="padding: 2px 8px; font-size: 11px;" onclick="deleteSemester(\${semIdx})">학기 삭제</button>
            </div>
          </div>
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>과목명</th>
                  <th>구분</th>
                  <th>학점</th>
                  <th>성적</th>
                  <th>재수강</th>
                  <th style="text-align: right;">관리</th>
                </tr>
              </thead>
              <tbody>
                \${sem.courses.map((c, cIdx) => \`
                  <tr>
                    <td style="font-weight: 600;">\${c.name}</td>
                    <td>\${c.category}</td>
                    <td>\${c.credits}학점</td>
                    <td><span style="font-weight: 700; color: #4f46e5;">\${c.grade}</span></td>
                    <td>\${c.isRetake ? '<span style="color: #ea580c; font-size: 12px; font-weight: 600;">재수강</span>' : '-'}</td>
                    <td style="text-align: right;">
                      <button class="btn btn-danger" style="padding: 2px 6px; font-size: 11px;" onclick="deleteCourse(\${semIdx}, \${cIdx})">삭제</button>
                    </td>
                  </tr>
                \`).join('')}
              </tbody>
            </table>
          </div>
          <div class="add-row-form">
            <input type="text" id="courseName_\${semIdx}" placeholder="과목명 입력" />
            <select id="courseCategory_\${semIdx}">
              <option value="전공필수">전공필수</option>
              <option value="전공선택">전공선택</option>
              <option value="교양필수">교양필수</option>
              <option value="교양선택">교양선택</option>
              <option value="일반선택">일반선택</option>
            </select>
            <input type="text" inputmode="decimal" id="courseCredits_\${semIdx}" value="3" placeholder="학점 (예: 3, 0.5)" style="width: 110px;">
            <select id="courseGrade_\${semIdx}">
              <option value="A+">A+ (4.5)</option>
              <option value="A0">A0 (4.3)</option>
              <option value="A-">A- (4.0)</option>
              <option value="B+">B+ (3.5)</option>
              <option value="B0">B0 (3.3)</option>
              <option value="B-">B- (3.0)</option>
              <option value="C+">C+ (2.5)</option>
              <option value="C0">C0 (2.3)</option>
              <option value="C-">C- (2.0)</option>
              <option value="D+">D+ (1.5)</option>
              <option value="D0">D0 (1.3)</option>
              <option value="D-">D- (1.0)</option>
              <option value="F">F (0.0)</option>
              <option value="P">P (Pass)</option>
              <option value="NP">NP (Non-Pass)</option>
            </select>
            <label class="checkbox-wrap">
              <input type="checkbox" id="courseRetake_\${semIdx}"> 재수강
            </label>
            <button class="btn btn-primary" onclick="addCourse(\${semIdx})">+ 추가</button>
          </div>
        \`;
        container.appendChild(card);
      });
    }

    function addCourse(semIdx) {
      const nameInput = document.getElementById('courseName_' + semIdx);
      const name = nameInput.value.trim();
      if (!name) {
        alert('과목명을 입력해 주세요.');
        nameInput.focus();
        return;
      }
      const category = document.getElementById('courseCategory_' + semIdx).value;
      const creditsInput = document.getElementById('courseCredits_' + semIdx);
      const credits = Math.round(parseFloat(creditsInput.value) * 10) / 10;
      if (!(credits > 0 && credits <= 30)) {
        alert('이수학점은 0보다 크고 30 이하인 숫자로 입력해주세요. (예: 3, 0.5)');
        creditsInput.focus();
        return;
      }
      const grade = document.getElementById('courseGrade_' + semIdx).value;
      const isRetake = document.getElementById('courseRetake_' + semIdx).checked;

      appData[semIdx].courses.push({
        id: 'c_' + Date.now(),
        name,
        category,
        credits,
        grade,
        isRetake
      });

      nameInput.value = '';
      saveToStorage();
      renderSemesters();
      calculateStats();
    }

    function deleteCourse(semIdx, cIdx) {
      if (confirm('해당 과목을 삭제하시겠습니까?')) {
        appData[semIdx].courses.splice(cIdx, 1);
        saveToStorage();
        renderSemesters();
        calculateStats();
      }
    }

    function deleteSemester(semIdx) {
      if (confirm(appData[semIdx].name + ' 전체를 삭제하시겠습니까?')) {
        appData.splice(semIdx, 1);
        saveToStorage();
        renderSemesters();
        calculateStats();
      }
    }

    function addNewSemester() {
      const nextNum = appData.length + 1;
      const year = Math.ceil(nextNum / 2);
      const term = (nextNum % 2 === 1) ? 1 : 2;
      const defName = year + '학년 ' + term + '학기';
      const name = prompt('추가할 학기 이름을 입력하세요:', defName);
      if (name && name.trim()) {
        appData.push({
          id: 'sem_' + Date.now(),
          name: name.trim(),
          courses: []
        });
        saveToStorage();
        renderSemesters();
        calculateStats();
      }
    }

    function resetData() {
      if (confirm('모든 성적 데이터를 초기화하시겠습니까?')) {
        appData = [];
        saveToStorage();
        renderSemesters();
        calculateStats();
      }
    }

    function exportCsv() {
      let csv = '\\uFEFF'; // BOM
      csv += '학기,과목명,이수학점,성적,이수구분,재수강여부\\r\\n';
      appData.forEach(sem => {
        sem.courses.forEach(c => {
          csv += \`\${sem.name},\${c.name},\${c.credits},\${c.grade},\${c.category},\${c.isRetake ? '재수강' : '일반'}\\r\\n\`;
        });
      });
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = '대학_학점계산기_성적내역.csv';
      a.click();
    }

    function importCsv(event) {
      const file = event.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = function(e) {
        let text = e.target.result;
        if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);
        const lines = text.split(/\\r?\\n/).filter(Boolean);
        const newSemMap = {};
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(',').map(s => s.trim());
          if (cols.length >= 4) {
            const semName = cols[0] || '1학년 1학기';
            if (!newSemMap[semName]) newSemMap[semName] = [];
            newSemMap[semName].push({
              id: 'c_' + Math.random().toString(36).substr(2, 8),
              name: cols[1],
              credits: parseFloat(cols[2]) > 0 ? parseFloat(cols[2]) : 3,
              grade: cols[3],
              category: cols[4] || '전공필수',
              isRetake: cols[5] === '재수강'
            });
          }
        }
        if (Object.keys(newSemMap).length > 0) {
          appData = Object.keys(newSemMap).map((name, idx) => ({
            id: 'sem_' + idx,
            name,
            courses: newSemMap[name]
          }));
          saveToStorage();
          renderSemesters();
          calculateStats();
          alert('성공적으로 CSV 데이터를 불러왔습니다!');
        } else {
          alert('유효한 CSV 성적 데이터 행을 찾을 수 없습니다.');
        }
      };
      reader.readAsText(file, 'utf-8');
    }

    window.onload = function() {
      loadFromStorage();
      renderSemesters();
      calculateStats();
    };
  </script>
</body>
</html>`;
}
