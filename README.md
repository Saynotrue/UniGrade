# UniGrade - 대학생 학점 계산기

학기별/전공별 GPA 계산, 성적 분포·추이 차트, 목표 학점 시뮬레이터, CSV 내보내기/불러오기를 지원하는 성적 관리 웹앱입니다. 데이터는 브라우저 localStorage에 저장됩니다.

**배포 주소:** https://saynotrue.github.io/UniGrade/

## 학점 기준 (4.5 만점)

| A+ | A0 | A- | B+ | B0 | B- | C+ | C0 | C- | D+ | D0 | D- | F |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 4.5 | 4.3 | 4.0 | 3.5 | 3.3 | 3.0 | 2.5 | 2.3 | 2.0 | 1.5 | 1.3 | 1.0 | 0 |

4.3 만점 기준도 상단 토글로 전환할 수 있습니다.

## 로컬 실행

```bash
npm install
npm run dev      # http://localhost:3000
```

## 배포 (GitHub Pages)

```bash
npm run build
# dist/ 내용을 gh-pages 브랜치에 push
```
