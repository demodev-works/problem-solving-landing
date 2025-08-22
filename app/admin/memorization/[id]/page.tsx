'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import DataTable from '@/components/admin/DataTable';
import { useRequireAuth } from '@/hooks/admin/useAuth';
import {
  getMemoProgressById,
  getMemoProblemDataByProgress,
  deleteMemoProblemData,
  updateMemoProblemData,
  MemoProgress,
  MemoProblemData,
} from '@/lib/admin/memoService';

interface MemoProblemDisplay {
  id: number;
  problem: string;
  answer: string;
}

export default function MemorizationDetailPage() {
  const {
    user,
    loading: authLoading,
    isAuthenticated,
    shouldRender,
  } = useRequireAuth();
  const router = useRouter();
  const params = useParams();
  const progressId = params.id as string;

  const [problems, setProblems] = useState<MemoProblemDisplay[]>([]);
  const [progressInfo, setProgressInfo] = useState<MemoProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingProblem, setEditingProblem] =
    useState<MemoProblemDisplay | null>(null);
  const [editForm, setEditForm] = useState({ problem: '', answer: '' });

  useEffect(() => {
    if (shouldRender && progressId) {
      fetchProgressDetail();
      fetchProgressProblems();
    }
  }, [shouldRender, progressId]);

  const fetchProgressDetail = async () => {
    try {
      const progressData = await getMemoProgressById(Number(progressId));
      setProgressInfo(progressData);
      setError(null);
    } catch (error) {
      console.error('암기 진도 정보 로딩 실패:', error);
      setError('암기 진도 정보를 불러오는데 실패했습니다.');
    }
  };

  const fetchProgressProblems = async () => {
    try {
      setLoading(true);
      const problemsData = await getMemoProblemDataByProgress(
        Number(progressId)
      );

      // 데이터를 Display 형태로 변환
      const formattedProblems: MemoProblemDisplay[] = problemsData.map(
        (data: MemoProblemData) => ({
          id: data.memo_data_id,
          problem: data.problem || '문제 내용 없음',
          answer: data.answer || '정답 내용 없음',
        })
      );

      setProblems(formattedProblems);
      setError(null);
    } catch (error) {
      console.error('암기 문제 목록 로딩 실패:', error);
      setError('암기 문제 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProblem = async (problemId: number) => {
    if (confirm('정말로 이 암기 문제를 삭제하시겠습니까?')) {
      try {
        await deleteMemoProblemData(problemId);
        alert('암기 문제가 삭제되었습니다.');
        await fetchProgressProblems();
      } catch (error) {
        console.error('암기 문제 삭제 실패:', error);
        alert('암기 문제 삭제 중 오류가 발생했습니다.');
      }
    }
  };

  const handleEditProblem = (problem: MemoProblemDisplay) => {
    setEditingProblem(problem);
    setEditForm({ problem: problem.problem, answer: problem.answer });
  };

  const handleSaveEdit = async () => {
    if (!editingProblem) return;

    try {
      await updateMemoProblemData(editingProblem.id, {
        problem: editForm.problem.trim(),
        answer: editForm.answer.trim(),
      });

      alert('암기 문제가 수정되었습니다.');
      setEditingProblem(null);
      setEditForm({ problem: '', answer: '' });
      await fetchProgressProblems();
    } catch (error) {
      console.error('암기 문제 수정 실패:', error);
      alert('암기 문제 수정 중 오류가 발생했습니다.');
    }
  };

  const handleCancelEdit = () => {
    setEditingProblem(null);
    setEditForm({ problem: '', answer: '' });
  };

  const headers = ['문제', '정답', '작업'];

  const renderRow = (problem: MemoProblemDisplay) => (
    <>
      <td className="px-6 py-4 text-sm text-gray-900">
        <div className="max-w-md truncate" title={problem.problem}>
          {problem.problem}
        </div>
      </td>
      <td className="px-6 py-4 text-sm text-gray-500">
        <div className="max-w-xs truncate" title={problem.answer}>
          {problem.answer}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        <button
          className="text-blue-600 hover:text-blue-900 mr-3"
          onClick={() => handleEditProblem(problem)}
        >
          수정
        </button>
        <button
          className="text-red-600 hover:text-red-900"
          onClick={() => handleDeleteProblem(problem.id)}
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
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-2 text-gray-500">
              암기 진도 정보를 불러오는 중...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
          >
            <svg
              className="w-4 h-4 mr-1"
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
            뒤로 가기
          </button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {progressInfo?.name || '암기 진도명 없음'}
              </h1>
              <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                <span>Day {progressInfo?.day || '-'}</span>
                <span
                  className={`px-2 py-1 text-xs rounded-full ${
                    progressInfo?.difficulty === 'advanced'
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-green-100 text-green-800'
                  }`}
                >
                  {progressInfo?.difficulty === 'advanced' ? '심화' : '기본'}
                </span>
              </div>
            </div>

            {/* 새 암기 문제 추가 버튼 */}
            <button
              onClick={() =>
                router.push(`/admin/memorization/new?progress_id=${progressId}`)
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
              새 암기 문제 추가
            </button>
          </div>
        </div>

        {/* 에러 상태 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* 수정 모달 */}
        {editingProblem && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  암기 문제 수정
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      문제
                    </label>
                    <textarea
                      value={editForm.problem}
                      onChange={(e) =>
                        setEditForm({ ...editForm, problem: e.target.value })
                      }
                      rows={4}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      정답
                    </label>
                    <textarea
                      value={editForm.answer}
                      onChange={(e) =>
                        setEditForm({ ...editForm, answer: e.target.value })
                      }
                      rows={4}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={handleCancelEdit}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    disabled={
                      !editForm.problem.trim() || !editForm.answer.trim()
                    }
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    저장
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 암기 문제 목록 */}
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
                암기 문제가 없습니다
              </h3>
              <p className="text-gray-500 mb-4">
                이 암기 진도에 등록된 암기 문제가 없습니다. 새 암기 문제를
                추가해보세요.
              </p>
              <button
                onClick={() =>
                  router.push(`/admin/memorization/new?progress_id=${progressId}`)
                }
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                첫 번째 암기 문제 추가하기
              </button>
            </div>
          ) : (
            <DataTable
              headers={headers}
              data={problems}
              renderRow={renderRow}
              onRowClick={(problem) =>
                router.push(
                  `/admin/memorization/edit/${problem.id}?progress_id=${progressId}`
                )
              }
            />
          )}
        </div>
      </div>
    </div>
  );
}
