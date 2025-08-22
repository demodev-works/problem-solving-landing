'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  getSubjectById,
  getSubjectMajors,
  getSubjectProgresses,
  getPrepareMajors,
  updateSubject,
  updateSubjectMajors,
  PrepareMajor,
  ProblemProgress,
} from '@/lib/admin/subjectService';

interface Subject {
  subject_id: number;
  name: string;
  prepare_majors: PrepareMajor[];
  progresses: ProblemProgress[];
}

export default function EditSubjectPage() {
  const router = useRouter();
  const params = useParams();
  const subjectId = params.id as string;

  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [subject, setSubject] = useState<Subject | null>(null);
  const [prepareMajors, setPrepareMajors] = useState<PrepareMajor[]>([]);
  const [subjectName, setSubjectName] = useState('');
  const [selectedMajors, setSelectedMajors] = useState<number[]>([]);

  useEffect(() => {
    if (subjectId) {
      fetchSubjectInfo();
      fetchPrepareMajors();
    }
  }, [subjectId]);

  const fetchSubjectInfo = async () => {
    try {
      // 과목 기본 정보 조회
      const subjectData = await getSubjectById(parseInt(subjectId));
      if (!subjectData) {
        setFetchLoading(false);
        return;
      }

      // 과목 관련 전공 조회
      const majors = await getSubjectMajors(parseInt(subjectId));

      const subject: Subject = {
        subject_id: subjectData.subject_id,
        name: subjectData.name,
        prepare_majors: majors,
        progresses: [], // 수정 페이지에서는 진도 정보 불필요
      };

      setSubject(subject);
      setSubjectName(subject.name);
      setSelectedMajors(
        subject.prepare_majors.map((pm) => pm.prepare_major_id)
      );
    } catch (error) {
      console.error('과목 정보 로딩 실패:', error);
    } finally {
      setFetchLoading(false);
    }
  };

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
      // 1. 과목명 수정
      await updateSubject(parseInt(subjectId), subjectName.trim());

      // 2. 과목-전공 연결 수정
      await updateSubjectMajors(parseInt(subjectId), selectedMajors);

      alert('과목이 성공적으로 수정되었습니다.');
      router.push('/admin/subjects');
    } catch (error) {
      console.error('과목 수정 실패:', error);
      alert('과목 수정 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="max-w-2xl mx-auto">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-2 text-center text-gray-500">
            과목 정보를 불러오는 중...
          </p>
        </div>
      </div>
    );
  }

  if (!subject) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="max-w-2xl mx-auto">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600">
              과목을 찾을 수 없습니다
            </h1>
            <button
              onClick={() => router.push('/admin/subjects')}
              className="mt-4 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              과목 목록으로 돌아가기
            </button>
          </div>
        </div>
      </div>
    );
  }

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
          <h1 className="text-2xl font-bold text-gray-900 mb-6">과목 수정</h1>

          {/* 현재 진도 목록 표시 */}
          {subject.progresses && subject.progresses.length > 0 && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
              <h3 className="text-sm font-medium text-blue-900 mb-2">
                현재 등록된 진도 ({subject.progresses.length}개)
              </h3>
              <div className="space-y-1">
                {subject.progresses.map((progress) => (
                  <div
                    key={progress.progress_id}
                    className="text-sm text-blue-800 flex items-center space-x-2"
                  >
                    <span className="bg-blue-100 px-2 py-1 rounded text-xs">
                      Day {progress.day}
                    </span>
                    <span>{progress.name}</span>
                    <span
                      className={`px-1.5 py-0.5 text-xs rounded-full ${
                        progress.difficulty === 'advanced'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {progress.difficulty === 'advanced' ? '심화' : '기본'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

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
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
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
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
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
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
              >
                {loading ? '수정 중...' : '과목 수정'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
