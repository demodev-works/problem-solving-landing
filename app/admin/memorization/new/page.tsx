'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useRequireAuth } from '@/hooks/admin/useAuth';
import {
  getMemoProgresses,
  getMemoProgressById,
  createMemoProblemData,
  MemoProgress,
} from '@/lib/admin/memoService';

interface MemoCard {
  id: number;
  question: string;
  answer: string;
}

function NewMemorizationContent() {
  const { shouldRender } = useRequireAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const progressId = searchParams.get('progress_id');

  const [formData, setFormData] = useState({
    memo_progress: '',
    progressName: '',
  });
  const [cards, setCards] = useState<MemoCard[]>([
    {
      id: 1,
      question: '',
      answer: '',
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [allProgressOptions, setAllProgressOptions] = useState<MemoProgress[]>(
    []
  );

  useEffect(() => {
    if (shouldRender) {
      fetchAllProgressOptions();
      if (progressId) {
        fetchProgressInfo(progressId);
      }
    }
  }, [shouldRender, progressId]);

  const fetchAllProgressOptions = async () => {
    try {
      const progressesData = await getMemoProgresses();
      setAllProgressOptions(
        progressesData.filter((p) => p.name && p.name.trim())
      );
    } catch (error) {
      console.error('암기 진도 옵션 조회 실패:', error);
      setError('암기 진도 목록을 불러오는데 실패했습니다.');
    }
  };

  const fetchProgressInfo = async (id: string) => {
    setLoading(true);
    try {
      const progressData = await getMemoProgressById(Number(id));
      setFormData({
        memo_progress: id,
        progressName: progressData.name || '암기 진도명 없음',
      });
      setError(null);
    } catch (error) {
      console.error('암기 진도 정보 조회 실패:', error);
      setError('암기 진도 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCard = () => {
    setCards([
      ...cards,
      {
        id: Math.max(...cards.map((c) => c.id)) + 1,
        question: '',
        answer: '',
      },
    ]);
  };

  const handleRemoveCard = (id: number) => {
    if (cards.length > 1) {
      setCards(cards.filter((c) => c.id !== id));
    }
  };

  const handleCardChange = (
    id: number,
    field: keyof MemoCard,
    value: string
  ) => {
    setCards(cards.map((c) => (c.id === id ? { ...c, [field]: value } : c)));
  };

  const handleSubmit = async () => {
    if (!isFormValid()) return;

    setSaving(true);
    try {
      // 각 카드를 암기 문제로 생성
      for (const card of cards) {
        const memoData = {
          memo_progress: Number(formData.memo_progress),
          problem: card.question.trim(),
          answer: card.answer.trim(),
        };

        await createMemoProblemData(memoData);
      }

      alert('암기 문제가 성공적으로 저장되었습니다.');
      router.push(
        progressId ? `/admin/memorization/${progressId}` : '/memorization'
      );
    } catch (error) {
      console.error('암기 문제 생성 실패:', error);
      setError('암기 문제 생성 중 오류가 발생했습니다.');
      alert('암기 문제 생성 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const isFormValid = () => {
    return (
      formData.memo_progress &&
      cards.every((c) => c.question.trim() && c.answer.trim())
    );
  };

  // 로딩 중이거나 인증되지 않은 경우 로딩 화면 표시
  if (!shouldRender) {
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
            <h1 className="text-2xl font-bold text-gray-900">
              새 암기 문제 추가
            </h1>
            {progressId && (
              <p className="mt-1 text-sm text-gray-500">
                암기 진도: {formData.progressName}
              </p>
            )}
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

        {loading && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
              <span className="text-sm text-blue-700">
                암기 진도 정보를 불러오는 중...
              </span>
            </div>
          </div>
        )}

        {/* 기본 정보 입력 */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">기본 정보</h2>
            {progressId && (
              <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                ✓ 암기 진도 정보에서 자동 설정됨
              </span>
            )}
          </div>
          {progressId && (
            <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-md">
              <p className="text-sm text-gray-600">
                선택된 암기 진도의 정보가 자동으로 설정되었습니다. 필요하다면
                아래 드롭다운에서 수정할 수 있습니다.
              </p>
            </div>
          )}
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                암기 진도 <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.memo_progress}
                onChange={(e) => {
                  const selectedProgress = allProgressOptions.find(
                    (p) => p.memo_progress_id === Number(e.target.value)
                  );
                  setFormData({
                    memo_progress: e.target.value,
                    progressName: selectedProgress?.name || '',
                  });
                }}
                className="block w-full pl-3 pr-10 py-2 text-base text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">암기 진도를 선택하세요</option>
                {allProgressOptions.map((progress) => (
                  <option
                    key={progress.memo_progress_id}
                    value={progress.memo_progress_id}
                  >
                    Day {progress.day} - {progress.name} (
                    {progress.difficulty === 'advanced' ? '심화' : '기본'})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 암기 카드 입력 */}
        <div className="space-y-4 mb-6">
          {cards.map((card, cIndex) => (
            <div key={card.id} className="bg-white shadow rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  카드 {cIndex + 1}
                </h3>
                {cards.length > 1 && (
                  <button
                    onClick={() => handleRemoveCard(card.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    문제 (카드 앞면)
                  </label>
                  <textarea
                    value={card.question}
                    onChange={(e) =>
                      handleCardChange(card.id, 'question', e.target.value)
                    }
                    rows={3}
                    placeholder="암기할 문제를 입력하세요..."
                    className="block w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    정답 (카드 뒷면)
                  </label>
                  <textarea
                    value={card.answer}
                    onChange={(e) =>
                      handleCardChange(card.id, 'answer', e.target.value)
                    }
                    rows={4}
                    placeholder="정답을 입력하세요..."
                    className="block w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 버튼 영역 */}
        <div className="flex justify-between">
          <button
            onClick={handleAddCard}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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
            카드 추가
          </button>

          <div className="flex gap-3">
            <button
              onClick={() => router.push('/admin/memorization')}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              취소
            </button>
            <button
              onClick={handleSubmit}
              disabled={!isFormValid() || saving}
              className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                isFormValid() && !saving
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : 'bg-gray-400 cursor-not-allowed'
              }`}
            >
              {saving ? '저장 중...' : '저장'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NewMemorizationPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <NewMemorizationContent />
    </Suspense>
  );
}
