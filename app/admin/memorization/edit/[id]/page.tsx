'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useRequireAuth } from '@/hooks/admin/useAuth';
import {
  getMemoProblemDataById,
  updateMemoProblemData,
  MemoProblemData,
} from '@/lib/admin/memoService';

function EditMemorizationContent() {
  const {
    user,
    loading: authLoading,
    isAuthenticated,
    shouldRender,
  } = useRequireAuth();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const problemId = params.id as string;
  const progressId = searchParams.get('progress_id');

  const [formData, setFormData] = useState({
    problem: '',
    answer: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (shouldRender && problemId) {
      fetchProblemData();
    }
  }, [shouldRender, problemId]);

  const fetchProblemData = async () => {
    try {
      setLoading(true);
      const problemData = await getMemoProblemDataById(Number(problemId));
      setFormData({
        problem: problemData.problem || '',
        answer: problemData.answer || '',
      });
      setError(null);
    } catch (error) {
      console.error('암기 문제 데이터 로딩 실패:', error);
      setError('암기 문제 데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.problem.trim() || !formData.answer.trim()) {
      alert('문제와 정답을 모두 입력해주세요.');
      return;
    }

    setSaving(true);
    try {
      await updateMemoProblemData(Number(problemId), {
        problem: formData.problem.trim(),
        answer: formData.answer.trim(),
      });

      alert('암기 문제가 성공적으로 수정되었습니다.');
      router.push(
        progressId ? `/admin/memorization/${progressId}` : '/admin/memorization'
      );
    } catch (error) {
      console.error('암기 문제 수정 실패:', error);
      setError('암기 문제 수정 중 오류가 발생했습니다.');
      alert('암기 문제 수정 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  // 로딩 중이거나 인증되지 않은 경우 로딩 화면 표시
  if (!shouldRender || loading) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-2 text-center text-gray-500">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">암기 문제 수정</h1>
          </div>
          <button
            onClick={() => router.back()}
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

        {/* 에러 상태 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* 수정 폼 */}
        <div className="bg-white shadow rounded-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                문제 (카드 앞면) *
              </label>
              <textarea
                value={formData.problem}
                onChange={(e) =>
                  setFormData({ ...formData, problem: e.target.value })
                }
                rows={4}
                placeholder="암기할 문제를 입력하세요..."
                className="block w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                정답 (카드 뒷면) *
              </label>
              <textarea
                value={formData.answer}
                onChange={(e) =>
                  setFormData({ ...formData, answer: e.target.value })
                }
                rows={5}
                placeholder="정답을 입력하세요..."
                className="block w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            {/* 버튼 영역 */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={
                  saving || !formData.problem.trim() || !formData.answer.trim()
                }
                className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                  !saving && formData.problem.trim() && formData.answer.trim()
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-gray-400 cursor-not-allowed'
                }`}
              >
                {saving ? '저장 중...' : '수정 완료'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function EditMemorizationPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <EditMemorizationContent />
    </Suspense>
  );
}
