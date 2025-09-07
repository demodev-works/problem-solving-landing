'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import DataTable from '@/components/admin/DataTable';
import {
  getProblemsByProgress,
  getProgressById,
  deleteProblem,
  ProblemManagement,
  ProblemProgress,
} from '@/lib/admin/problemService';
import { useRequireAuth } from '@/hooks/admin/useAuth';

export default function ProgressDetailPage() {
  const { shouldRender } = useRequireAuth();
  const router = useRouter();
  const params = useParams();
  const progressId = params.id as string;

  const [problems, setProblems] = useState<ProblemManagement[]>([]);
  const [progress, setProgress] = useState<ProblemProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (shouldRender && progressId) {
      fetchProgressDetail();
      fetchProgressProblems();
    }
  }, [shouldRender, progressId]);

  const fetchProgressDetail = async () => {
    try {
      const progressData = await getProgressById(Number(progressId));
      setProgress(progressData);
      setError(null);
    } catch (error) {
      console.error('진도 정보 로딩 실패:', error);
      setError('진도 정보를 불러오는데 실패했습니다.');
    }
  };

  const fetchProgressProblems = async () => {
    try {
      setLoading(true);
      const problemsData = await getProblemsByProgress(Number(progressId));
      setProblems(problemsData);
      setError(null);
    } catch (error) {
      console.error('문제 목록 로딩 실패:', error);
      setError('문제 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProblem = async (problemId: number) => {
    if (confirm('정말로 이 문제를 삭제하시겠습니까?')) {
      try {
        await deleteProblem(problemId);
        alert('문제가 삭제되었습니다.');
        await fetchProgressProblems();
      } catch (error) {
        console.error('문제 삭제 실패:', error);
        alert('문제 삭제 중 오류가 발생했습니다.');
      }
    }
  };

  const headers = ['문제 내용', '정답', '난이도', '출처', '시험연도', '작업'];

  const renderRow = (problem: ProblemManagement) => (
    <>
      <td className="px-6 py-4 text-sm text-gray-900">
        <div className="max-w-md truncate">{problem.content}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {problem.answer}번
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm">
        <span
          className={`px-2 py-1 text-xs rounded-full ${
            problem.difficulty === 'advanced'
              ? 'bg-purple-100 text-purple-800'
              : 'bg-blue-100 text-blue-800'
          }`}
        >
          {problem.difficulty === 'advanced' ? '심화' : '기본'}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {problem.source || '-'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {problem.exam_year ? problem.exam_year.split('-')[0] : '-'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        <button
          className="text-blue-600 hover:text-blue-900 mr-3"
          onClick={() =>
            router.push(
              `/admin/problems/edit/${problem.problem_management_id}?progress_id=${progressId}`
            )
          }
        >
          수정
        </button>
        <button
          className="text-red-600 hover:text-red-900"
          onClick={() => handleDeleteProblem(problem.problem_management_id)}
        >
          삭제
        </button>
      </td>
    </>
  );

  // 로딩 중이거나 인증되지 않은 경우 로딩 화면 표시
  if (!shouldRender || loading) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-500">진도 정보를 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <button
              onClick={() => router.push('/admin/problems')}
              className="flex items-center text-gray-500 hover:text-gray-700 mb-2"
            >
              <svg
                className="h-4 w-4 mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              문제 관리로 돌아가기
            </button>
            <h1 className="text-2xl font-bold text-gray-900">
              {progress?.name || '진도명 없음'}
            </h1>
            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
              <span>
                과목: {progress?.subject_details?.name || '과목 정보 없음'}
              </span>
              <span>Day {progress?.day}</span>
              <span
                className={`px-2 py-1 text-xs rounded-full ${
                  progress?.difficulty === 'advanced'
                    ? 'bg-purple-100 text-purple-800'
                    : 'bg-blue-100 text-blue-800'
                }`}
              >
                {progress?.difficulty === 'advanced' ? '심화' : '기본'}
              </span>
            </div>
          </div>

          {/* 새 문제 추가 버튼 */}
          <button
            onClick={() =>
              router.push(`/admin/problems/new?progress_id=${progressId}`)
            }
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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
            새 문제 추가
          </button>
        </div>

        {/* 에러 상태 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* 문제 목록 */}
        <div className="bg-white shadow rounded-lg">
          {problems.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-gray-400 mb-4">
                <svg
                  className="h-12 w-12 mx-auto"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">
                문제가 없습니다
              </h3>
              <p className="text-gray-500 mb-4">
                이 진도에 등록된 문제가 없습니다. 새 문제를 추가해보세요.
              </p>
              <button
                onClick={() =>
                  router.push(`/admin/problems/new?progress_id=${progressId}`)
                }
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                첫 번째 문제 추가하기
              </button>
            </div>
          ) : (
            <DataTable
              headers={headers}
              data={problems}
              renderRow={renderRow}
              onRowClick={(problem) =>
                router.push(
                  `/admin/problems/edit/${problem.problem_management_id}?progress_id=${progressId}`
                )
              }
            />
          )}
        </div>
      </div>
    </div>
  );
}
