'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DataTable from '@/components/admin/DataTable';
import {
  getSubjectsWithDetails,
  deleteSubject,
  SubjectWithDetails,
} from '@/lib/admin/subjectService';
import { updateProgress, ProblemProgress } from '@/lib/admin/problemService';
import { useRequireAuth } from '@/hooks/admin/useAuth';

interface Subject extends SubjectWithDetails {}

export default function SubjectsPage() {
  const { shouldRender } = useRequireAuth();
  const router = useRouter();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedRows, setExpandedRows] = useState<number[]>([]);
  const [editingProgress, setEditingProgress] =
    useState<ProblemProgress | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    day: 0,
    difficulty: 'basic' as 'basic' | 'advanced',
  });

  useEffect(() => {
    if (shouldRender) {
      fetchSubjects();
    }
  }, [shouldRender]);

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const data = await getSubjectsWithDetails();
      setSubjects(data);
      setError(null);
    } catch (error) {
      console.error('과목 목록 로딩 실패:', error);
      setError('과목 데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSubject = async (
    subjectId: number,
    subjectName: string
  ) => {
    if (
      !confirm(
        `"${subjectName}" 과목을 정말로 삭제하시겠습니까?\n\n관련된 진도와 문제들도 함께 삭제될 수 있습니다.`
      )
    ) {
      return;
    }

    try {
      await deleteSubject(subjectId);
      alert('과목이 성공적으로 삭제되었습니다.');
      await fetchSubjects();
    } catch (error) {
      console.error('과목 삭제 실패:', error);
      alert('과목 삭제 중 오류가 발생했습니다.');
    }
  };

  const handleEditProgress = (progress: ProblemProgress) => {
    setEditingProgress(progress);
    setEditForm({
      name: progress.name,
      day: progress.day,
      difficulty: progress.difficulty,
    });
  };

  const handleSaveProgress = async () => {
    if (!editingProgress) return;

    try {
      await updateProgress(editingProgress.progress_id, {
        name: editForm.name.trim(),
        day: editForm.day,
        difficulty: editForm.difficulty,
      });

      alert('진도가 성공적으로 수정되었습니다.');
      setEditingProgress(null);
      await fetchSubjects();
    } catch (error) {
      console.error('진도 수정 실패:', error);
      alert('진도 수정 중 오류가 발생했습니다.');
    }
  };

  const handleCancelEdit = () => {
    setEditingProgress(null);
    setEditForm({ name: '', day: 0, difficulty: 'basic' });
  };

  const toggleRowExpansion = (subjectId: number) => {
    setExpandedRows((prev) =>
      prev.includes(subjectId)
        ? prev.filter((id) => id !== subjectId)
        : [...prev, subjectId]
    );
  };

  const filteredSubjects = subjects.filter((subject) =>
    subject.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const headers = ['과목명', '관련 전공', '진도 수', '작업'];

  const renderRow = (subject: Subject) => (
    <>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        <div className="flex items-center">
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleRowExpansion(subject.subject_id);
            }}
            className="mr-2 text-gray-400 hover:text-gray-600"
          >
            <svg
              className={`w-4 h-4 transform transition-transform ${
                expandedRows.includes(subject.subject_id) ? 'rotate-90' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
          <span className="font-medium">{subject.name}</span>
        </div>
        {expandedRows.includes(subject.subject_id) && (
          <div className="mt-3 ml-6 space-y-1">
            <div className="text-xs font-medium text-gray-700 mb-2">
              진도 목록:
            </div>
            {subject.progresses && subject.progresses.length > 0 ? (
              subject.progresses.map((progress) => (
                <div
                  key={progress.progress_id}
                  className="text-xs text-gray-600 flex items-center justify-between group"
                >
                  <div className="flex items-center space-x-2">
                    <span className="bg-gray-100 px-2 py-1 rounded text-xs">
                      Day {progress.day}
                    </span>
                    <span>{progress.name}</span>
                    <span
                      className={`px-1.5 py-0.5 text-xs rounded-full ${
                        progress.difficulty === 'advanced'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {progress.difficulty === 'advanced' ? '심화' : '기본'}
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditProgress(progress as ProblemProgress);
                    }}
                    className="opacity-0 group-hover:opacity-100 text-blue-600 hover:text-blue-800 text-xs transition-opacity"
                  >
                    수정
                  </button>
                </div>
              ))
            ) : (
              <div className="text-xs text-gray-400 italic">
                등록된 진도가 없습니다.
              </div>
            )}
          </div>
        )}
      </td>
      <td className="px-6 py-4 text-sm text-gray-500">
        <div className="flex flex-wrap gap-1">
          {(subject.prepare_majors || []).map((major) => (
            <span
              key={major.prepare_major_id}
              className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
            >
              {major.name}
            </span>
          ))}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
          {subject.progresses
            ? subject.progresses.length
            : subject.progress_count || 0}
          개
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        <button
          className="text-red-600 hover:text-red-900"
          onClick={(e) => {
            e.stopPropagation();
            handleDeleteSubject(subject.subject_id, subject.name);
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-2 text-center text-gray-500">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">과목 관리</h1>

        {/* 검색 및 필터 영역 */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            {/* 검색 입력 */}
            <div className="flex-1">
              <label
                htmlFor="search"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                과목명 검색
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="과목명 검색..."
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

            {/* 새 과목 추가 버튼 */}
            <button
              onClick={() => router.push('/admin/subjects/new')}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
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
              새 과목 추가
            </button>
          </div>
        </div>

        {/* 통계 정보 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg
                    className="h-6 w-6 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                    />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      총 과목 수
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {subjects.length}개
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg
                    className="h-6 w-6 text-purple-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      총 진도 수
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {subjects.reduce(
                        (total, subject) =>
                          total +
                          (subject.progresses
                            ? subject.progresses.length
                            : subject.progress_count || 0),
                        0
                      )}
                      개
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 에러 상태 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* 과목 목록 테이블 */}
        <div className="bg-white shadow rounded-lg">
          {loading ? (
            <div className="p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
              <p className="mt-2 text-gray-500">과목 목록을 불러오는 중...</p>
            </div>
          ) : error ? (
            <div className="p-6 text-center">
              <p className="text-gray-500">데이터를 불러올 수 없습니다.</p>
            </div>
          ) : filteredSubjects.length === 0 ? (
            <div className="p-6 text-center">
              <div className="text-gray-400 mb-4">
                <svg
                  className="mx-auto h-12 w-12"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              </div>
              <h3 className="text-sm font-medium text-gray-900">
                과목이 없습니다
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                새 과목 추가 버튼을 클릭해서 첫 번째 과목을 추가해보세요.
              </p>
            </div>
          ) : (
            <DataTable
              headers={headers}
              data={filteredSubjects}
              renderRow={renderRow}
            />
          )}
        </div>

        {/* 진도 수정 모달 */}
        {editingProgress && (
          <div
            className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"
            onClick={handleCancelEdit}
          >
            <div
              className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  진도 수정
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      진도명 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="진도명을 입력하세요"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Day <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={editForm.day}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          day: parseInt(e.target.value) || 0,
                        }))
                      }
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      난이도 <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={editForm.difficulty}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          difficulty: e.target.value as 'basic' | 'advanced',
                        }))
                      }
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="basic">기본</option>
                      <option value="advanced">심화</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={handleCancelEdit}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleSaveProgress}
                    disabled={!editForm.name.trim() || editForm.day < 1}
                    className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                      editForm.name.trim() && editForm.day >= 1
                        ? 'bg-blue-600 hover:bg-blue-700'
                        : 'bg-gray-400 cursor-not-allowed'
                    }`}
                  >
                    저장
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
