'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DataTable from '@/components/admin/DataTable';
import * as XLSX from 'xlsx';
import { useRequireAuth } from '@/hooks/admin/useAuth';
import {
  getProgresses,
  getProblems,
  deleteProgress,
  uploadProgressData,
  uploadProblemData,
  ProblemProgress,
  ProblemManagement,
  createProgress,
  createProblem,
  createProblemSelect,
  getProblemsByProgress,
} from '@/lib/admin/problemService';
import {
  getSubjectsWithDetails,
  getSubjects,
} from '@/lib/admin/subjectService';

type Difficulty = '기본' | '심화';

interface Problem {
  id: number;
  name: string;
  subject: string;
  questionCount: number;
  day: string; // 날짜 문자열
  difficulty: Difficulty;
}

interface Subject {
  subject_id: number;
  name: string;
}

export default function ProblemsPage() {
  const {
    user,
    loading: authLoading,
    isAuthenticated,
    shouldRender,
  } = useRequireAuth();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');

  const [problems, setProblems] = useState<Problem[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (shouldRender) {
      fetchData();
    }
  }, [shouldRender]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // 1. 과목 목록과 진도 목록을 동시에 가져오기
      const [subjectsData, progressesData] = await Promise.all([
        getSubjects(), // 과목 목록 먼저
        getProgresses(), // 진도 목록
      ]);

      // 2. 과목 ID → 과목명 매핑 테이블 생성
      const subjectMap: { [key: number]: string } = {};
      subjectsData.forEach((subject) => {
        subjectMap[subject.subject_id] = subject.name;
      });

      // 3. 유효한 진도 데이터만 필터링 (name이 있는 것들)
      const validProgresses = progressesData.filter(
        (progress) => progress.name && progress.name.trim()
      );

      // 4. 각 진도별 문제 수 조회
      const progressProblemsPromises = validProgresses.map(
        async (progress: ProblemProgress) => {
          try {
            const problems = await getProblemsByProgress(progress.progress_id);
            return { progressId: progress.progress_id, count: problems.length };
          } catch (error) {
            console.error(
              `진도 ${progress.progress_id} 문제 수 조회 실패:`,
              error
            );
            return { progressId: progress.progress_id, count: 0 };
          }
        }
      );

      const progressProblemsData = await Promise.all(progressProblemsPromises);
      const progressProblemsMap = progressProblemsData.reduce((acc, item) => {
        acc[item.progressId] = item.count;
        return acc;
      }, {} as { [key: number]: number });

      // 5. 진도 데이터를 Problem 형태로 변환하며 과목명 매핑
      const formattedProblems: Problem[] = validProgresses.map(
        (progress: ProblemProgress) => {
          return {
            id: progress.progress_id,
            name: progress.name,
            subject: progress.subject
              ? subjectMap[progress.subject] || '알 수 없음'
              : '과목 미지정',
            questionCount: progressProblemsMap[progress.progress_id] || 0,
            day: progress.day ? progress.day.toString() : '-',
            difficulty: progress.difficulty === 'advanced' ? '심화' : '기본',
          };
        }
      );

      setProblems(formattedProblems);
      setSubjects(
        subjectsData.map((s) => ({ subject_id: s.subject_id, name: s.name }))
      );
    } catch (error) {
      console.error('데이터 로딩 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProblems = problems.filter((problem) => {
    const matchesSearch = (problem.name || '')
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesSubject =
      selectedSubject === 'all' || problem.subject === selectedSubject;
    return matchesSearch && matchesSubject;
  });

  const handleProgressUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        // 수정된 업로드 로직 - upload/page.tsx와 동일한 로직 사용
        await uploadProgressDataWithMapping(jsonData as any);

        alert('진도표가 성공적으로 업로드되었습니다.');

        // 데이터 새로고침
        await fetchData();

        // 파일 입력 초기화
        e.target.value = '';
      } catch (error) {
        console.error('Progress Excel parsing error:', error);
        alert('진도표 파일 처리 중 오류가 발생했습니다.');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // 난이도 매핑
  const difficultyMap: { [key: string]: string } = {
    기본: 'basic',
    심화: 'advanced',
  };

  const uploadProgressDataWithMapping = async (data: any[]) => {
    const subjectsData = await getSubjects();

    for (const row of data) {
      const progressData: any = {};

      // 진도명 처리
      if (row.진도 && String(row.진도).trim()) {
        progressData.name = String(row.진도).trim();
      }

      // Day 처리
      if (row.day !== undefined && row.day !== null && row.day !== '') {
        const dayNumber = Number(row.day);
        if (!isNaN(dayNumber)) {
          progressData.day = dayNumber;
        }
      }

      // 난이도 처리
      if (row.난이도 && String(row.난이도).trim()) {
        const difficultyKey = String(row.난이도).trim();
        if (difficultyMap[difficultyKey]) {
          progressData.difficulty = difficultyMap[difficultyKey];
        }
      }

      // 과목 처리
      if (row.과목명 && String(row.과목명).trim()) {
        const subjectName = String(row.과목명).trim();
        const subject = subjectsData.find((s) => s.name === subjectName);
        if (subject) {
          progressData.subject = subject.subject_id;
        }
      }

      // 필수 필드 검증
      if (!progressData.name || !progressData.name.trim()) {
        continue;
      }

      await createProgress(progressData);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        // 수정된 업로드 로직 사용
        await uploadProblemDataWithMapping(jsonData as any);

        alert('문제가 성공적으로 업로드되었습니다.');
        // 데이터 새로고침
        await fetchData();

        // 파일 입력 초기화
        e.target.value = '';
      } catch (error) {
        console.error('Excel parsing error:', error);
        alert('파일 처리 중 오류가 발생했습니다.');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const uploadProblemDataWithMapping = async (data: any[]) => {
    const subjectsData = await getSubjects();
    const progressesData = await getProgresses();

    for (const [index, row] of data.entries()) {
      // 과목명으로 과목 ID 찾기
      const subjectName = row.subject || row.과목명 || row.과목;
      if (!subjectName) {
        continue;
      }

      const subject = subjectsData.find(
        (s) => s.name === String(subjectName).trim()
      );
      if (!subject) {
        continue;
      }

      // 진도명으로 진도 ID 찾기
      const progressName = row.progress || row.진도 || row.진도명;
      if (!progressName) {
        continue;
      }

      const progress = progressesData.find(
        (p) =>
          p.name === String(progressName).trim() &&
          p.subject === subject.subject_id
      );
      if (!progress) {
        continue;
      }

      // 문제 데이터 구성
      const problemData: any = {
        progress: progress.progress_id,
        answer: parseInt(String(row.answer || row.정답)),
        explanation: String(row.explanation || row.해설 || ''),
      };

      // 선택적 필드들
      const problemContent = row.problem || row.문제 || row.content;
      if (problemContent && String(problemContent).trim()) {
        problemData.content = String(problemContent).trim();
      }

      const difficulty = row.difficulty || row.난이도;
      if (difficulty && difficultyMap[String(difficulty).trim()]) {
        problemData.difficulty = difficultyMap[String(difficulty).trim()];
      }

      const source = row.source || row.출처;
      if (source && String(source).trim()) {
        problemData.source = String(source).trim();
      }

      const examYear = row.exam_year || row.시험연도 || row.연도;
      if (examYear) {
        problemData.exam_year = `${examYear}-01-01`;
      }

      // 문제 생성
      try {
        const createdProblem = await createProblem(problemData);

        // 선택지 생성 - 다양한 컬럼명 지원
        const choices = [
          row.choice1 || row.보기1,
          row.choice2 || row.보기2,
          row.choice3 || row.보기3,
          row.choice4 || row.보기4,
          row.choice5 || row.보기5,
        ].filter((choice) => choice && String(choice).trim());

        for (let i = 0; i < choices.length; i++) {
          await createProblemSelect({
            question_number: i + 1,
            content: String(choices[i]).trim(),
            problem_management: createdProblem.problem_management_id,
          });
        }
      } catch (error: any) {
        console.error(`문제 ${index + 1} 생성 실패:`, error.message);
        continue;
      }
    }
  };

  const headers = ['진도명', '과목명', '날짜', '난이도', '문제 수', '작업'];

  const renderRow = (problem: Problem) => (
    <>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        <button
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/admin/problems/${problem.id}`);
          }}
          className="text-blue-600 hover:text-blue-900 hover:underline text-left"
        >
          {problem.name}
        </button>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {problem.subject}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {problem.day}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm">
        <span
          className={`px-2 py-1 text-xs rounded-full ${
            problem.difficulty === '기본'
              ? 'bg-green-100 text-green-800'
              : 'bg-purple-100 text-purple-800'
          }`}
        >
          {problem.difficulty}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {problem.questionCount}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        <button
          className="text-blue-600 hover:text-blue-900 mr-3"
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/admin/problems/${problem.id}`);
          }}
        >
          관리
        </button>
        <button
          className="text-red-600 hover:text-red-900"
          onClick={async (e) => {
            e.stopPropagation();
            if (
              confirm(
                `"${problem.name}" 진도를 정말로 삭제하시겠습니까?\n\n관련된 모든 문제들도 함께 삭제될 수 있습니다.`
              )
            ) {
              try {
                await deleteProgress(problem.id);
                alert('진도가 삭제되었습니다.');
                await fetchData();
              } catch (error) {
                console.error('진도 삭제 실패:', error);
                alert('진도 삭제 중 오류가 발생했습니다.');
              }
            }
          }}
        >
          삭제
        </button>
      </td>
    </>
  );

  // 로딩 중이거나 인증되지 않은 경우 로딩 화면 표시
  if (!shouldRender) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-2 text-center text-gray-500">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">문제 관리</h1>

        {/* 검색 및 필터 영역 */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            {/* 검색 입력 */}
            <div className="flex-1">
              <label
                htmlFor="search"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                진도명 검색
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="진도명 검색..."
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
                <svg
                  className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>

            {/* 과목 선택 드롭다운 */}
            <div>
              <label
                htmlFor="subject"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                과목명
              </label>
              <select
                id="subject"
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="block w-full pl-3 pr-10 py-2 text-base text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">전체</option>
                {subjects.map((subject) => (
                  <option key={subject.subject_id} value={subject.name}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 새 진도 추가 버튼 */}
            <button
              onClick={() => router.push('/admin/progress/new')}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              <svg
                className="h-4 w-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              새 진도 추가
            </button>
          </div>

          {/* 진도표 엑셀 업로드 */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              엑셀 파일로 진도표 업로드
            </label>
            <div className="flex items-center gap-2">
              <input
                type="file"
                accept=".csv,.xlsx"
                className="block text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                onChange={handleProgressUpload}
              />
              <div className="text-xs text-gray-500">
                <div className="mb-1">
                  <strong>필수 헤더:</strong> day, 난이도(기본/심화), 과목(명),
                  진도(명)
                </div>
                <div className="text-blue-600">
                  💡 헤더명은 유연하게 인식됩니다 (예: day/Day/DAY, 진도/진도명)
                </div>
                <div className="text-green-600">
                  ✅ 여러 진도를 한 번에 추가할 수 있습니다
                </div>
              </div>
            </div>
          </div>

          {/* CSV 파일 업로드 */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              CSV 파일로 문제 업로드
            </label>
            <div className="flex items-center gap-2">
              <input
                type="file"
                accept=".csv,.xlsx"
                className="block text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                onChange={handleFileUpload}
              />
              <div className="text-xs text-gray-500">
                <div className="mb-1">
                  <strong>방법 1:</strong> 과목명, 진도명(또는 진도), 문제,
                  보기, 정답, 해설, 출처, 시험연도, 난이도(기본/심화)
                </div>
                <div>
                  <strong>방법 2:</strong> 과목명, 진도명(또는 진도), 문제,
                  보기1, 보기2, 보기3, 보기4, 보기5, 정답, 해설, 출처, 시험연도,
                  난이도(기본/심화)
                </div>
                <div className="mt-1 text-blue-600">
                  💡 진도명/진도, 보기 컬럼명은 유연하게 인식됩니다
                </div>
                <div className="text-green-600">
                  ✅ 필수: 과목명, 진도명(또는 진도), 문제, 정답
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 문제 목록 테이블 */}
        <div className="bg-white shadow rounded-lg">
          {loading ? (
            <div className="p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-500">문제 목록을 불러오는 중...</p>
            </div>
          ) : (
            <DataTable
              headers={headers}
              data={filteredProblems}
              renderRow={renderRow}
              onRowClick={(problem) =>
                router.push(`/admin/problems/${problem.id}`)
              }
            />
          )}
        </div>
      </div>
    </div>
  );
}
