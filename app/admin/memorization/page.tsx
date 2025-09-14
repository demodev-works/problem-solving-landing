'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DataTable from '@/components/admin/DataTable';
import * as XLSX from 'xlsx';
import { useRequireAuth } from '@/hooks/admin/useAuth';
import {
  getMemoProgresses,
  getMemoProblemDataByProgress,
  deleteMemoProgress,
  updateMemoProgress,
  createMemoProgress,
  bulkCreateMemoProblemData,
  MemoProgress,
} from '@/lib/admin/memoService';

type Difficulty = '기본' | '심화';

interface MemoProgressDisplay {
  id: number;
  name: string;
  questionCount: number;
  day: string;
  difficulty: Difficulty;
}

export default function MemorizationPage() {
  const { shouldRender } = useRequireAuth();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [memoProgresses, setMemoProgresses] = useState<MemoProgressDisplay[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [editingProgress, setEditingProgress] =
    useState<MemoProgressDisplay | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    day: '' as number | '',
    difficulty: 'basic' as 'basic' | 'advanced',
  });

  useEffect(() => {
    if (shouldRender) {
      fetchData();
    }
  }, [shouldRender]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // 1. 암기 진도 목록 가져오기
      const progressesData = await getMemoProgresses();

      // 2. 유효한 진도 데이터만 필터링하고 Display 형태로 변환
      const validProgresses = progressesData.filter(
        (progress) => progress.name && progress.name.trim()
      );

      const formattedProgresses: MemoProgressDisplay[] = validProgresses.map(
        (progress: MemoProgress) => {
          return {
            id: progress.memo_progress_id,
            name: progress.name || '진도명 없음',
            questionCount: progress.total_problems || 0,
            day: progress.day ? progress.day.toString() : '-',
            difficulty: progress.difficulty === 'advanced' ? '심화' : '기본',
          };
        }
      );

      setMemoProgresses(formattedProgresses);
    } catch (error) {
      console.error('암기 데이터 로딩 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProgresses = memoProgresses.filter((progress) => {
    const matchesSearch = (progress.name || '')
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // 난이도 매핑
  const difficultyMap: { [key: string]: string } = {
    기본: 'basic',
    심화: 'advanced',
  };

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

        await uploadMemoProgressDataWithMapping(jsonData as any);

        alert('암기 진도표가 성공적으로 업로드되었습니다.');
        await fetchData();
        e.target.value = '';
      } catch (error) {
        console.error('암기 진도표 Excel parsing error:', error);
        alert('암기 진도표 파일 처리 중 오류가 발생했습니다.');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const uploadMemoProgressDataWithMapping = async (data: any[]) => {
    for (const row of data) {
      const progressData: any = {};

      // 진도명 처리
      if (row.진도 && String(row.진도).trim()) {
        progressData.name = String(row.진도).trim();
      } else if (row.name && String(row.name).trim()) {
        progressData.name = String(row.name).trim();
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
      } else if (row.difficulty && String(row.difficulty).trim()) {
        const difficultyValue = String(row.difficulty).trim();
        if (['basic', 'advanced'].includes(difficultyValue)) {
          progressData.difficulty = difficultyValue;
        }
      }

      // 필수 필드 검증
      if (!progressData.name || !progressData.name.trim()) {
        continue;
      }

      await createMemoProgress(progressData);
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

        await uploadMemoProblemDataWithMapping(jsonData as any);

        alert('암기 문제가 성공적으로 업로드되었습니다.');
        await fetchData();
        e.target.value = '';
      } catch (error) {
        console.error('암기 문제 Excel parsing error:', error);
        alert('암기 문제 파일 처리 중 오류가 발생했습니다.');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const uploadMemoProblemDataWithMapping = async (data: any[]) => {
    const progressesData = await getMemoProgresses();
    const validMemoDataList: any[] = [];

    // 모든 데이터를 검증하고 배열에 수집
    for (const row of data) {
      // 진도명으로 진도 ID 찾기
      const progressName = row.progress || row.진도 || row.진도명 || row.name;
      if (!progressName) {
        continue;
      }

      const progress = progressesData.find(
        (p) => p.name === String(progressName).trim()
      );
      if (!progress) {
        continue;
      }

      // 암기 문제 데이터 구성
      const memoData: any = {
        memo_progress: progress.memo_progress_id,
        problem: String(row.problem || row.문제 || ''),
        answer: String(row.answer || row.정답 || row.해설 || ''),
      };

      // 필수 필드 검증
      if (!memoData.problem.trim() || !memoData.answer.trim()) {
        continue;
      }

      validMemoDataList.push(memoData);
    }

    // Bulk 생성 - 한 번의 API 호출로 모든 문제 생성
    if (validMemoDataList.length > 0) {
      try {
        await bulkCreateMemoProblemData(validMemoDataList);
      } catch (error: any) {
        console.error('암기 문제 bulk 생성 실패:', error.message);
        throw error;
      }
    }
  };

  const headers = ['진도명', '날짜', '난이도', '문제 수', '작업'];

  const handleEditProgress = (progress: MemoProgressDisplay) => {
    setEditingProgress(progress);
    setEditForm({
      name: progress.name,
      day: progress.day === '-' ? '' : parseInt(progress.day),
      difficulty: progress.difficulty === '심화' ? 'advanced' : 'basic',
    });
  };

  const handleSaveProgressEdit = async () => {
    if (!editingProgress) return;

    try {
      await updateMemoProgress(editingProgress.id, {
        name: editForm.name.trim(),
        day: editForm.day as number,
        difficulty: editForm.difficulty,
      });

      alert('암기 진도가 수정되었습니다.');
      setEditingProgress(null);
      setEditForm({ name: '', day: '', difficulty: 'basic' });
      await fetchData();
    } catch (error) {
      console.error('암기 진도 수정 실패:', error);
      alert('암기 진도 수정 중 오류가 발생했습니다.');
    }
  };

  const handleCancelProgressEdit = () => {
    setEditingProgress(null);
    setEditForm({ name: '', day: '', difficulty: 'basic' });
  };

  const renderRow = (progress: MemoProgressDisplay) => (
    <>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        <button
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/admin/memorization/${progress.id}`);
          }}
          className="text-blue-600 hover:text-blue-900 hover:underline text-left"
        >
          {progress.name}
        </button>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {progress.day}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm">
        <span
          className={`px-2 py-1 text-xs rounded-full ${
            progress.difficulty === '기본'
              ? 'bg-green-100 text-green-800'
              : 'bg-purple-100 text-purple-800'
          }`}
        >
          {progress.difficulty}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {progress.questionCount}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        <button
          className="text-blue-600 hover:text-blue-900 mr-3"
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/admin/memorization/${progress.id}`);
          }}
        >
          관리
        </button>
        <button
          className="text-green-600 hover:text-green-900 mr-3"
          onClick={(e) => {
            e.stopPropagation();
            handleEditProgress(progress);
          }}
        >
          수정
        </button>
        <button
          className="text-red-600 hover:text-red-900"
          onClick={async (e) => {
            e.stopPropagation();
            if (
              confirm(
                `"${progress.name}" 암기 진도를 정말로 삭제하시겠습니까?\n\n관련된 모든 암기 문제들도 함께 삭제될 수 있습니다.`
              )
            ) {
              try {
                await deleteMemoProgress(progress.id);
                alert('암기 진도가 삭제되었습니다.');
                await fetchData();
              } catch (error) {
                console.error('암기 진도 삭제 실패:', error);
                alert('암기 진도 삭제 중 오류가 발생했습니다.');
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-2 text-center text-gray-500">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          암기 문제 관리
        </h1>

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

            {/* 새 암기 진도 추가 버튼 */}
            <button
              onClick={() => router.push('/admin/memorization/progress/new')}
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
              새 암기 진도 추가
            </button>
          </div>

          {/* 암기 진도 엑셀 업로드 */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              엑셀 파일로 암기 진도 업로드
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
                  <strong>필수 헤더:</strong> day, 난이도(기본/심화), 진도(또는
                  name)
                </div>
                <div className="text-blue-600">
                  💡 헤더명은 유연하게 인식됩니다 (예: day/Day/DAY,
                  진도/진도명/name)
                </div>
                <div className="text-green-600">
                  ✅ 여러 암기 진도를 한 번에 추가할 수 있습니다
                </div>
              </div>
            </div>
          </div>

          {/* CSV 파일 업로드 */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              CSV 파일로 암기 문제 업로드
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
                  <strong>필수 헤더:</strong> 진도(또는 progress, name),
                  문제(또는 problem), 정답(또는 answer, 해설)
                </div>
                <div className="text-blue-600">
                  💡 진도명은 기존에 등록된 암기 진도와 정확히 일치해야 합니다
                </div>
                <div className="text-green-600">
                  ✅ 필수: 진도명, 문제, 정답
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 진도 수정 모달 */}
        {editingProgress && (
          <div className="fixed inset-0 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-1/2 lg:w-1/3 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  암기 진도 수정
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      진도명 *
                    </label>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) =>
                        setEditForm({ ...editForm, name: e.target.value })
                      }
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Day *
                    </label>
                    <input
                      type="number"
                      value={editForm.day}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          day: e.target.value ? parseInt(e.target.value) : '',
                        })
                      }
                      min="1"
                      max="365"
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      난이도 *
                    </label>
                    <select
                      value={editForm.difficulty}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          difficulty: e.target.value as 'basic' | 'advanced',
                        })
                      }
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="basic">기본</option>
                      <option value="advanced">심화</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={handleCancelProgressEdit}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleSaveProgressEdit}
                    disabled={!editForm.name.trim() || !editForm.day}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    저장
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 암기 진도 목록 테이블 */}
        <div className="bg-white shadow rounded-lg">
          {loading ? (
            <div className="p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-500">
                암기 진도 목록을 불러오는 중...
              </p>
            </div>
          ) : (
            <DataTable
              headers={headers}
              data={filteredProgresses}
              renderRow={renderRow}
              onRowClick={(progress) =>
                router.push(`/admin/memorization/${progress.id}`)
              }
            />
          )}
        </div>
      </div>
    </div>
  );
}
