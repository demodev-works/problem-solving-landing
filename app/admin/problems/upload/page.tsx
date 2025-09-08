'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useRequireAuth } from '@/hooks/admin/useAuth';
import {
  createProgress,
  // createProblem,
  // createProblemSelect,
  bulkCreateProblems,
  bulkCreateProblemSelects,
  getProgresses,
  ProblemProgress,
  ProblemManagement,
  ProblemSelect,
} from '@/lib/admin/problemService';
import { getSubjects } from '@/lib/admin/subjectService';
import * as XLSX from 'xlsx';

interface ExcelProgressRow {
  day: string | number | null; // 엑셀에서는 숫자, 문자열, null 등 다양한 형태가 될 수 있음
  난이도: string | null;
  과목명: string | null;
  진도: string | null;
}

interface ExcelProblemRow {
  subject: string;
  progress: string;
  problem: string;
  choice1?: string;
  choice2?: string;
  choice3?: string;
  choice4?: string;
  choice5?: string;
  answer: string | number;
  explanation?: string;
  source?: string;
  exam_year?: string | number;
  difficulty?: string;
  순서?: string | number;
}

export default function QuestionUploadPage() {
  const { shouldRender } = useRequireAuth();
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [uploadType, setUploadType] = useState<'progress' | 'problem'>(
    'progress'
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // 난이도 매핑
  const difficultyMap: { [key: string]: string } = {
    기본: 'basic',
    심화: 'advanced',
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
      setSuccess(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('파일을 선택해주세요.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      let jsonData: Record<string, unknown>[];

      if (file.name.endsWith('.csv')) {
        // CSV 파일 처리
        const text = await file.text();
        const workbook = XLSX.read(text, { type: 'string' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        jsonData = XLSX.utils.sheet_to_json(worksheet);
      } else {
        // Excel 파일 처리
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        jsonData = XLSX.utils.sheet_to_json(worksheet);
      }

      if (uploadType === 'progress') {
        await uploadProgressData(jsonData as unknown as ExcelProgressRow[]);
      } else {
        await uploadProblemData(jsonData as unknown as ExcelProblemRow[]);
      }

      setSuccess(
        `${jsonData.length}개의 ${
          uploadType === 'progress' ? '진도' : '문제'
        }가 성공적으로 업로드되었습니다.`
      );
    } catch (error) {
      console.error('업로드 실패:', error);
      setError('업로드 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const uploadProgressData = async (data: ExcelProgressRow[]) => {
    const subjects = await getSubjects();

    for (const row of data) {
      const progressData: Record<string, string | number> = {};

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
        const subject = subjects.find((s) => s.name === subjectName);
        if (subject) {
          progressData.subject = subject.subject_id;
        }
      }

      // 필수 필드 검증
      if (!progressData.name || typeof progressData.name !== 'string' || !progressData.name.trim()) {
        continue;
      }

      await createProgress(progressData as unknown as Omit<ProblemProgress, "progress_id">);
    }
  };

  const uploadProblemData = async (data: ExcelProblemRow[]) => {
    const subjects = await getSubjects();
    const progresses = await getProgresses();

    const validProblems: Record<string, unknown>[] = [];
    const problemSelectsMap: { [key: number]: Record<string, unknown>[] } = {};

    // 모든 문제 데이터를 검증하고 배열에 수집
    for (const [index, row] of data.entries()) {
      // 과목명으로 과목 ID 찾기
      const subject = subjects.find((s) => s.name === row.subject);
      if (!subject) {
        continue;
      }

      // 진도명으로 진도 ID 찾기
      const progress = progresses.find(
        (p) => p.name === row.progress && p.subject === subject.subject_id
      );
      if (!progress) {
        continue;
      }

      // 백엔드 API 스펙에 맞춢 문제 생성 데이터 구성
      const problemData: Record<string, unknown> = {
        progress: progress.progress_id,
        answer: parseInt(row.answer.toString()),
        explanation: row.explanation || '',
      };

      // 선택적 필드들
      if (row.problem && row.problem.trim()) {
        problemData.content = row.problem.trim();
      }

      if (row.difficulty && difficultyMap[row.difficulty]) {
        problemData.difficulty = difficultyMap[row.difficulty];
      }

      if (row.source && row.source.trim()) {
        problemData.source = row.source.trim();
      }

      if (row.exam_year) {
        problemData.exam_year = `${row.exam_year}-01-01`;
      }

      if (row.순서 !== undefined && row.순서 !== null && row.순서 !== '') {
        const sequenceNumber = Number(row.순서);
        if (!isNaN(sequenceNumber)) {
          problemData.sequence = sequenceNumber;
        }
      }

      validProblems.push(problemData);

      // 선택지 데이터 준비
      const choices = [
        row.choice1,
        row.choice2,
        row.choice3,
        row.choice4,
        row.choice5,
      ].filter((choice) => choice && choice.trim());
      const selectData = choices.map((choice, i) => ({
        question_number: i + 1,
        content: choice!,
      }));

      if (selectData.length > 0) {
        problemSelectsMap[index] = selectData;
      }
    }

    // Bulk로 모든 문제 생성
    if (validProblems.length > 0) {
      const createdProblems = await bulkCreateProblems(validProblems as unknown as Omit<ProblemManagement, "progress_details" | "problem_management_id" | "selects">[]);

      // 생성된 문제들의 선택지를 Bulk로 생성
      const allSelects: Record<string, unknown>[] = [];
      createdProblems.forEach((problem, index) => {
        if (problemSelectsMap[index]) {
          const selects = problemSelectsMap[index].map((select) => ({
            question_number: select.question_number,
            content: select.content,
            problem_management: problem.problem_management_id,
          }));
          allSelects.push(...selects);
        }
      });

      if (allSelects.length > 0) {
        await bulkCreateProblemSelects(allSelects as unknown as Omit<ProblemSelect, "problem_select_id">[]);
      }
    }
  };

  // 로딩 중이거나 인증되지 않은 경우 로딩 화면 표시
  if (!shouldRender) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-2 text-gray-500">로딩 중...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">엑셀 파일 업로드</h1>
          <button
            onClick={() => router.push('/admin/problems')}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* 업로드 타입 선택 */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            업로드 타입 선택
          </h2>
          <div className="flex space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                value="progress"
                checked={uploadType === 'progress'}
                onChange={(e) =>
                  setUploadType(e.target.value as 'progress' | 'problem')
                }
                className="mr-2"
              />
              진도 업로드
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="problem"
                checked={uploadType === 'problem'}
                onChange={(e) =>
                  setUploadType(e.target.value as 'progress' | 'problem')
                }
                className="mr-2"
              />
              문제 업로드
            </label>
          </div>
        </div>

        {/* 파일 업로드 */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">파일 선택</h2>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <input
              type="file"
              accept={
                uploadType === 'progress' ? '.xlsx,.xls' : '.csv,.xlsx,.xls'
              }
              onChange={handleFileChange}
              className="mb-4"
            />
            {file && (
              <p className="text-sm text-gray-600">선택된 파일: {file.name}</p>
            )}
          </div>
        </div>

        {/* 에러/성공 메시지 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
            <p className="text-green-600">{success}</p>
          </div>
        )}

        {/* 업로드 형식 안내 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-medium text-blue-900 mb-2">
            {uploadType === 'progress' ? '진도 업로드' : '문제 업로드'} 형식
          </h3>
          {uploadType === 'progress' ? (
            <div>
              <p className="text-blue-800 mb-2">
                엑셀 파일은 다음 열을 포함해야 합니다:
              </p>
              <ul className="list-disc list-inside text-blue-700 text-sm space-y-1">
                <li>
                  <strong>day</strong>: 진도 일차 (숫자, 예: 1, 2, 3...)
                </li>
                <li>
                  <strong>난이도</strong>: 난이도 (기본/심화)
                </li>
                <li>
                  <strong>과목명</strong>: 과목명 (예: 테스트 과목)
                </li>
                <li>
                  <strong>진도</strong>: 진도명 (예: 3장(생명체의 구성분자들)-1)
                </li>
              </ul>
            </div>
          ) : (
            <div>
              <p className="text-blue-800 mb-2">
                CSV/엑셀 파일은 다음 열을 포함해야 합니다:
              </p>
              <ul className="list-disc list-inside text-blue-700 text-sm space-y-1">
                <li>
                  <strong>source</strong>: 출처 (선택사항)
                </li>
                <li>
                  <strong>exam_year</strong>: 시험연도 (선택사항, 숫자)
                </li>
                <li>
                  <strong>difficulty</strong>: 난이도 (기본/심화)
                </li>
                <li>
                  <strong>subject</strong>: 과목명 (예: 테스트 과목)
                </li>
                <li>
                  <strong>progress</strong>: 진도명 (예: 3장(생명체의
                  구성분자들)-1)
                </li>
                <li>
                  <strong>problem</strong>: 문제 내용
                </li>
                <li>
                  <strong>explanation</strong>: 해설
                </li>
                <li>
                  <strong>answer</strong>: 정답 번호 (1, 2, 3, 4, 5)
                </li>
                <li>
                  <strong>choice1, choice2, choice3, choice4, choice5</strong>:
                  보기 (최소 2개, 최대 5개)
                </li>
                <li>
                  <strong>순서</strong>: 문제 순서 (선택사항, 숫자)
                </li>
              </ul>
            </div>
          )}
        </div>

        {/* 업로드 버튼 */}
        <div className="flex justify-end">
          <button
            onClick={handleUpload}
            disabled={!file || loading}
            className={`px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
              file && !loading
                ? 'bg-blue-600 hover:bg-blue-700'
                : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            {loading ? '업로드 중...' : '업로드'}
          </button>
        </div>
      </div>
    </div>
  );
}
