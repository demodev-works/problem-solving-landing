'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createMemoProgress } from '@/lib/admin/memoService';

export default function NewMemorizationProgressPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [progressName, setProgressName] = useState('');
  const [day, setDay] = useState<number | ''>('');
  const [difficulty, setDifficulty] = useState<'basic' | 'advanced'>('basic');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!progressName.trim()) {
      alert('진도명을 입력해주세요.');
      return;
    }

    if (!day) {
      alert('Day를 입력해주세요.');
      return;
    }

    // Day 값 검증
    if (day < 1 || day > 365) {
      alert('Day는 1부터 365 사이의 숫자를 입력해주세요.');
      return;
    }

    setLoading(true);

    try {
      await createMemoProgress({
        name: progressName.trim(),
        day: day as number,
        difficulty,
      });

      alert('암기 진도가 성공적으로 추가되었습니다.');
      router.push('/admin/memorization');
    } catch (error) {
      console.error('암기 진도 추가 실패:', error);
      alert('암기 진도 추가 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
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
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            새 암기 진도 추가
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 진도명 입력 */}
            <div>
              <label
                htmlFor="progressName"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                진도명 *
              </label>
              <input
                type="text"
                id="progressName"
                value={progressName}
                onChange={(e) => setProgressName(e.target.value)}
                placeholder="예: 10강 합성함수(상)-1"
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                required
              />
            </div>

            {/* Day 입력 */}
            <div>
              <label
                htmlFor="day"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Day *
              </label>
              <input
                type="number"
                id="day"
                value={day}
                onChange={(e) =>
                  setDay(e.target.value ? parseInt(e.target.value) : '')
                }
                placeholder="예: 1, 2, 3..."
                min="1"
                max="365"
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                required
              />
              <p className="mt-1 text-sm text-gray-500">
                메모 진도의 Day를 입력해주세요 (1~365)
              </p>
            </div>

            {/* 난이도 선택 */}
            <div>
              <label
                htmlFor="difficulty"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                난이도 *
              </label>
              <select
                id="difficulty"
                value={difficulty}
                onChange={(e) =>
                  setDifficulty(e.target.value as 'basic' | 'advanced')
                }
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                required
              >
                <option value="basic">기본</option>
                <option value="advanced">심화</option>
              </select>
            </div>

            {/* 버튼 영역 */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
              >
                {loading ? '추가 중...' : '암기 진도 추가'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
