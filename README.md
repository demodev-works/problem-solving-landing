# 문제 풀이 앱 관리자 시스템

문제 해결 학습 플랫폼을 위한 관리자 시스템입니다. 수강생 관리, 문제 관리, 문의 처리 등 다양한 관리 기능을 제공합니다.

## 주요 기능

- **수강생 관리**: 수강생 목록 조회, 진도율/성취율 관리
- **문제 관리**: 문제 리스트 관리, 엑셀 업로드 기능
- **문의 관리**: 일반 문의 및 질문 답변 처리
- **콘텐츠 관리**: 팝업, 공지사항 관리
- **오류신고**: 사용자 오류신고 처리

## 기술 스택

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **UI Components**: Custom Components
- **State Management**: React Hooks

## 프로젝트 구조

```
├── app/                          # Next.js App Router
│   ├── layout.tsx                # 공통 레이아웃 (사이드바, 상단바 포함)
│   ├── page.tsx                  # 메인 페이지 (수강생 관리로 리다이렉트)
│   ├── students/                 # 수강생 관리
│   │   ├── page.tsx              # 수강생 목록 (검색, 필터링 기능)
│   │   └── [id]/page.tsx         # 수강생 상세 (진도율, 성취율 표시)
│   ├── questions/                # 문제 관리
│   │   ├── page.tsx              # 문제 리스트
│   │   └── upload/page.tsx       # 엑셀 or 직접 추가
│   ├── inquiries/                # 일반 문의 관리
│   │   ├── page.tsx              # 목록
│   │   └── [id]/page.tsx         # 답변 입력 or 보기
│   ├── qna/                      # 질문 관리
│   │   ├── page.tsx              # 목록
│   │   └── [id]/page.tsx         # 답변 입력 or 보기
│   ├── popups/                   # 팝업 관리
│   │   └── page.tsx
│   ├── notices/                  # 공지사항 관리
│   │   └── page.tsx
│   ├── error-reports/           # 오류신고
│   │   ├── page.tsx
│   │   └── [id]/page.tsx
│   └── login/page.tsx           # 관리자 로그인
├── components/                  # 공통 UI 컴포넌트
│   ├── Sidebar.tsx              # 사이드바 네비게이션
│   ├── Topbar.tsx               # 상단바 (제목, 로그아웃)
│   ├── DataTable.tsx            # 데이터 테이블 컴포넌트
│   ├── Tag.tsx                  # 태그 컴포넌트
│   └── Modal.tsx                # 모달 컴포넌트
├── lib/                         # 유틸리티 및 설정
│   ├── supabaseClient.ts        # Supabase 연결 설정
│   └── utils.ts                 # 진도율 색상 계산, 날짜 포맷팅 등
├── types/                       # TypeScript 타입 정의
│   └── index.ts                 # Student, Question, Progress 등
└── styles/                      # 스타일 파일
    └── globals.css              # 전역 CSS 스타일
```

## 주요 컴포넌트 설명

### 📁 app/
- **layout.tsx**: 전체 레이아웃을 담당하며 사이드바와 상단바를 포함
- **page.tsx**: 메인 페이지로 수강생 관리 페이지로 자동 리다이렉트
- **students/**: 수강생 관리 기능
  - 목록 페이지: 검색, 필터링 기능이 있는 테이블 형태
  - 상세 페이지: 진도율과 성취율을 색상으로 구분하여 표시

### 📁 components/
- **Sidebar.tsx**: 메뉴 네비게이션, 현재 페이지 하이라이트
- **Topbar.tsx**: 시스템 제목과 로그아웃 버튼
- **DataTable.tsx**: 재사용 가능한 데이터 테이블 컴포넌트
- **Tag.tsx**: 다양한 색상과 크기의 태그 컴포넌트
- **Modal.tsx**: 모달 다이얼로그 컴포넌트

### 📁 lib/
- **supabaseClient.ts**: Supabase 데이터베이스 연결 설정
- **utils.ts**: 진도율 색상 계산, 날짜 포맷팅 등 유틸리티 함수

### 📁 types/
- **index.ts**: Student, Question, Progress 등 TypeScript 인터페이스 정의

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 환경 설정

프로젝트 루트에 `.env.local` 파일을 생성하고 다음 환경 변수를 설정하세요:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
NEXT_PUBLIC_APP_NAME=문제 풀이 앱 관리자 시스템
```

## 주요 기능 상세

### 수강생 관리
- 수강생 목록 조회 및 검색
- 진도율과 성취율 시각적 표시
- 색상 구분: 80% 이상(녹색), 50-80%(주황색), 50% 미만(빨간색)

### 문제 관리
- 문제 목록 관리
- 엑셀 파일 업로드 기능
- 직접 문제 추가 기능

### 문의 관리
- 일반 문의 및 질문 목록 조회
- 답변 작성 및 관리
- 상태별 필터링

## 개발 가이드

### 새로운 페이지 추가
1. `app/` 폴더에 새로운 디렉토리 생성
2. `page.tsx` 파일 생성
3. `components/Sidebar.tsx`에 메뉴 항목 추가

### 컴포넌트 추가
1. `components/` 폴더에 새 컴포넌트 파일 생성
2. TypeScript 인터페이스 정의
3. 재사용 가능하도록 props 설계

### 타입 정의
1. `types/index.ts`에 새로운 인터페이스 추가
2. 필요한 경우 별도 타입 파일 생성


