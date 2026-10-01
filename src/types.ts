export type GradeScale = '4.5' | '4.3';

export type CourseCategory = '전공필수' | '전공선택' | '교양필수' | '교양선택' | '일반선택';

export interface Course {
  id: string;
  name: string;
  credits: number;
  grade: string;
  category: CourseCategory;
  isRetake: boolean; // 재수강 여부
}

export interface Semester {
  id: string;
  name: string;
  courses: Course[];
}

export interface GradeOption {
  label: string;
  value: string;
  point: number;
  isPassFail?: boolean;
}

export const GRADE_OPTIONS_4_5: GradeOption[] = [
  { label: 'A+ (4.5)', value: 'A+', point: 4.5 },
  { label: 'A0 (4.3)', value: 'A0', point: 4.3 },
  { label: 'A- (4.0)', value: 'A-', point: 4.0 },
  { label: 'B+ (3.5)', value: 'B+', point: 3.5 },
  { label: 'B0 (3.3)', value: 'B0', point: 3.3 },
  { label: 'B- (3.0)', value: 'B-', point: 3.0 },
  { label: 'C+ (2.5)', value: 'C+', point: 2.5 },
  { label: 'C0 (2.3)', value: 'C0', point: 2.3 },
  { label: 'C- (2.0)', value: 'C-', point: 2.0 },
  { label: 'D+ (1.5)', value: 'D+', point: 1.5 },
  { label: 'D0 (1.3)', value: 'D0', point: 1.3 },
  { label: 'D- (1.0)', value: 'D-', point: 1.0 },
  { label: 'F (0.0)', value: 'F', point: 0.0 },
  { label: 'P (Pass)', value: 'P', point: 0, isPassFail: true },
  { label: 'NP (Non-Pass)', value: 'NP', point: 0, isPassFail: true },
];

export const GRADE_OPTIONS_4_3: GradeOption[] = [
  { label: 'A+ (4.3)', value: 'A+', point: 4.3 },
  { label: 'A0 (4.0)', value: 'A0', point: 4.0 },
  { label: 'A- (3.7)', value: 'A-', point: 3.7 },
  { label: 'B+ (3.3)', value: 'B+', point: 3.3 },
  { label: 'B0 (3.0)', value: 'B0', point: 3.0 },
  { label: 'B- (2.7)', value: 'B-', point: 2.7 },
  { label: 'C+ (2.3)', value: 'C+', point: 2.3 },
  { label: 'C0 (2.0)', value: 'C0', point: 2.0 },
  { label: 'C- (1.7)', value: 'C-', point: 1.7 },
  { label: 'D+ (1.3)', value: 'D+', point: 1.3 },
  { label: 'D0 (1.0)', value: 'D0', point: 1.0 },
  { label: 'D- (0.7)', value: 'D-', point: 0.7 },
  { label: 'F (0.0)', value: 'F', point: 0.0 },
  { label: 'P (Pass)', value: 'P', point: 0, isPassFail: true },
  { label: 'NP (Non-Pass)', value: 'NP', point: 0, isPassFail: true },
];

export const CATEGORY_OPTIONS: CourseCategory[] = [
  '전공필수',
  '전공선택',
  '교양필수',
  '교양선택',
  '일반선택',
];

export interface SemesterCalculation {
  semesterId: string;
  semesterName: string;
  totalRegisteredCredits: number;
  earnedCredits: number;
  gpaCredits: number;
  gpa: number;
  majorEarnedCredits: number;
  majorGpaCredits: number;
  majorGpa: number;
  generalEarnedCredits: number;
}

export interface OverallCalculation {
  totalRegisteredCredits: number;
  totalEarnedCredits: number;
  totalGpaCredits: number;
  overallGpa: number;
  majorEarnedCredits: number;
  majorGpaCredits: number;
  majorGpa: number;
  generalEarnedCredits: number;
  semesterStats: SemesterCalculation[];
  gradeDistribution: Record<string, number>;
  totalCoursesCount: number;
}
