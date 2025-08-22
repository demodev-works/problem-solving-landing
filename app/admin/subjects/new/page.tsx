'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  getPrepareMajors,
  createSubject,
  createUserCategory,
  PrepareMajor,
} from '@/lib/admin/subjectService';

export default function NewSubjectPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [prepareMajors, setPrepareMajors] = useState<PrepareMajor[]>([]);
  const [subjectName, setSubjectName] = useState('');
  const [selectedMajors, setSelectedMajors] = useState<number[]>([]);

  useEffect(() => {
    fetchPrepareMajors();
  }, []);

  const fetchPrepareMajors = async () => {
    try {
      const data = await getPrepareMajors();
      setPrepareMajors(data);
    } catch (error) {
      console.error('전공 목록 로딩 실패:', error);
    }
  };

  const handleMajorToggle = (majorId: number) => {
    setSelectedMajors((prev) =>
      prev.includes(majorId)
        ? prev.filter((id) => id !== majorId)
        : [...prev, majorId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!subjectName.trim()) {
      alert('과목명을 입력해주세요.');
      return;
    }

    if (selectedMajors.length === 0) {
      alert('최소 하나의 전공을 선택해주세요.');
      return;
    }

    setLoading(true);

    try {
      // 1. 과목 생성
      const newSubject = await createSubject(subjectName.trim());

      // 2. 과목-전공 연결 생성 (개별적으로)
      for (const majorId of selectedMajors) {
        await createUserCategory(newSubject.subject_id, majorId);
      }

      alert('과목이 성공적으로 추가되었습니다.');
      router.push('/admin/subjects');
    } catch (error) {
      console.error('과목 추가 실패:', error);
      alert('과목 추가 중 오류가 발생했습니다.');
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
            새 과목 추가
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 과목명 입력 */}
            <div>
              <label
                htmlFor="subjectName"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                과목명 *
              </label>
              <input
                type="text"
                id="subjectName"
                value={subjectName}
                onChange={(e) => setSubjectName(e.target.value)}
                placeholder="과목명을 입력하세요"
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            {/* 전공 선택 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                관련 전공 선택 * (최소 1개)
              </label>
              <div className="grid grid-cols-2 gap-3">
                {prepareMajors.map((major) => (
                  <div
                    key={major.prepare_major_id}
                    className="flex items-center"
                  >
                    <input
                      type="checkbox"
                      id={`major-${major.prepare_major_id}`}
                      checked={selectedMajors.includes(major.prepare_major_id)}
                      onChange={() => handleMajorToggle(major.prepare_major_id)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label
                      htmlFor={`major-${major.prepare_major_id}`}
                      className="ml-2 block text-sm text-gray-900 cursor-pointer"
                    >
                      {major.name}
                    </label>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-sm text-gray-500">
                선택된 전공: {selectedMajors.length}개
              </p>
            </div>

            {/* 버튼 영역 */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? '추가 중...' : '과목 추가'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
