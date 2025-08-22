'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useRequireAuth } from '@/hooks/admin/useAuth';
import {
  getProblemById,
  updateProblem,
  updateProblemSelect,
  createProblemSelect,
  deleteProblemSelect,
  ProblemManagement,
} from '@/lib/admin/problemService';

type Difficulty = 'basic' | 'advanced';

interface Question {
  id: number;
  question: string;
  options: string[];
  answer: string;
  explanation: string;
  difficulty: Difficulty;
  source?: string;
  year?: number;
  image?: string;
}

function EditProblemContent() {
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

  const [problem, setProblem] = useState<ProblemManagement | null>(null);
  const [question, setQuestion] = useState<Question>({
    id: 1,
    question: '',
    options: ['', '', '', ''],
    answer: '',
    explanation: '',
    difficulty: 'basic',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (shouldRender && problemId) {
      fetchProblem();
    }
  }, [shouldRender, problemId]);

  const fetchProblem = async () => {
    try {
      setLoading(true);
      const problemData = await getProblemById(Number(problemId));
      setProblem(problemData);

      // 문제 데이터를 폼에 맞게 변환
      setQuestion({
        id: 1,
        question: problemData.content,
        options: problemData.selects.map((select) => select.content),
        answer: problemData.answer.toString(),
        explanation: problemData.explanation || '',
        difficulty: problemData.difficulty,
        source: problemData.source || '',
        year: problemData.exam_year
          ? new Date(problemData.exam_year).getFullYear()
          : undefined,
        image: problemData.image_url || '',
      });

      setError(null);
    } catch (error) {
      console.error('문제 정보 로딩 실패:', error);

      // 404 오류인 경우 (삭제된 문제) 이전 페이지로 이동
      if (error instanceof Error && error.message.includes('404')) {
        alert(
          '문제를 찾을 수 없습니다. 삭제되었거나 존재하지 않는 문제입니다.'
        );
        router.push(
          progressId ? `/admin/problems/${progressId}` : '/admin/problems'
        );
        return;
      }

      setError('문제 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuestionChange = (field: keyof Question, value: any) => {
    setQuestion((prev) => ({ ...prev, [field]: value }));
  };

  const handleOptionChange = (optionIndex: number, value: string) => {
    setQuestion((prev) => ({
      ...prev,
      options: prev.options.map((opt, idx) =>
        idx === optionIndex ? value : opt
      ),
    }));
  };

  const handleAddOption = () => {
    if (question.options.length < 5) {
      setQuestion((prev) => ({
        ...prev,
        options: [...prev.options, ''],
      }));
    }
  };

  const handleRemoveOption = (optionIndex: number) => {
    if (question.options.length > 2) {
      setQuestion((prev) => ({
        ...prev,
        options: prev.options.filter((_, idx) => idx !== optionIndex),
        answer:
          parseInt(prev.answer) > optionIndex + 1
            ? String(parseInt(prev.answer) - 1)
            : prev.answer === String(optionIndex + 1)
            ? ''
            : prev.answer,
      }));
    }
  };

  const handleImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      handleQuestionChange('image', reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!isFormValid() || !problem) return;

    setSaving(true);
    try {
      // 문제 업데이트 - PATCH 방식으로 필요한 필드들만 전송
      const problemData: any = {
        answer: parseInt(question.answer),
        explanation: question.explanation ? question.explanation.trim() : '',
      };

      // 선택적 필드들 - 값이 있을 때만 포함
      if (question.question && question.question.trim()) {
        problemData.content = question.question.trim();
      }

      if (question.difficulty) {
        problemData.difficulty = question.difficulty;
      }

      if (question.source && question.source.trim()) {
        problemData.source = question.source.trim();
      }

      if (question.year) {
        problemData.exam_year = `${question.year}-01-01`;
      }

      if (question.image && question.image.trim()) {
        problemData.image_url = question.image.trim();
      }

      console.log('PATCH로 보내는 데이터:', problemData);
      await updateProblem(problem.problem_management_id, problemData);

      // 기존 선택지 삭제 후 새로 생성
      for (const select of problem.selects) {
        await deleteProblemSelect(select.problem_select_id);
      }

      // 새 선택지 생성
      const validOptions = question.options.filter((opt) => opt.trim());
      for (let i = 0; i < validOptions.length; i++) {
        await createProblemSelect({
          question_number: i + 1,
          content: validOptions[i],
          problem_management: problem.problem_management_id,
        });
      }

      alert('문제가 성공적으로 수정되었습니다.');
      router.push(
        progressId ? `/admin/problems/${progressId}` : '/admin/problems'
      );
    } catch (error) {
      console.error('문제 수정 실패:', error);
      setError('문제 수정 중 오류가 발생했습니다.');
      alert('문제 수정 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const isFormValid = () => {
    return (
      question.question.trim() &&
      question.answer &&
      question.explanation.trim() &&
      question.options.filter((opt) => opt.trim()).length >= 2 &&
      question.options
        .slice(0, question.options.filter((opt) => opt.trim()).length)
        .every((opt) => opt.trim())
    );
  };

  // 로딩 중이거나 인증되지 않은 경우 로딩 화면 표시
  if (!shouldRender || loading) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-2 text-gray-500">문제 정보를 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">문제 수정</h1>
          <button
            onClick={() => router.push(`/admin/problems/${progressId || ''}`)}
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

        {/* 문제 수정 폼 */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                문제 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={question.question}
                onChange={(e) =>
                  handleQuestionChange('question', e.target.value)
                }
                rows={3}
                className="block w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />

              {/* 이미지 업로드 */}
              <div className="mt-2">
                {question.image && (
                  <div className="mb-2">
                    <img
                      src={question.image}
                      alt="문제 이미지"
                      className="max-w-md h-auto border rounded"
                    />
                    <button
                      onClick={() => handleQuestionChange('image', undefined)}
                      className="mt-1 text-sm text-red-600 hover:text-red-800"
                    >
                      이미지 삭제
                    </button>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(file);
                  }}
                  className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">
                  보기 ({question.options.length}개){' '}
                  <span className="text-red-500">*</span>
                </label>
                {question.options.length < 5 && (
                  <button
                    onClick={handleAddOption}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    + 보기 추가
                  </button>
                )}
              </div>
              <div className="space-y-2">
                {question.options.map((option, optIndex) => (
                  <div key={optIndex} className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700 w-8">
                      {optIndex + 1}.
                    </span>
                    <input
                      type="text"
                      value={option}
                      onChange={(e) =>
                        handleOptionChange(optIndex, e.target.value)
                      }
                      className="flex-1 px-3 py-2 text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                    {question.options.length > 2 && (
                      <button
                        onClick={() => handleRemoveOption(optIndex)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <svg
                          className="h-4 w-4"
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
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  정답 <span className="text-red-500">*</span>
                </label>
                <select
                  value={question.answer}
                  onChange={(e) =>
                    handleQuestionChange('answer', e.target.value)
                  }
                  className="block w-full pl-3 pr-10 py-2 text-base text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">선택하세요</option>
                  {question.options.map((_, idx) => (
                    <option key={idx} value={String(idx + 1)}>
                      {idx + 1}번
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  난이도
                </label>
                <select
                  value={question.difficulty}
                  onChange={(e) =>
                    handleQuestionChange('difficulty', e.target.value)
                  }
                  className="block w-full pl-3 pr-10 py-2 text-base text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="basic">기본</option>
                  <option value="advanced">심화</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  출처 (선택사항)
                </label>
                <input
                  type="text"
                  value={question.source || ''}
                  onChange={(e) =>
                    handleQuestionChange('source', e.target.value || undefined)
                  }
                  placeholder="예: 교과서, 수능, 평가원"
                  className="block w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  출제년도 (선택사항)
                </label>
                <input
                  type="number"
                  value={question.year || ''}
                  onChange={(e) =>
                    handleQuestionChange(
                      'year',
                      e.target.value ? parseInt(e.target.value) : undefined
                    )
                  }
                  placeholder="예: 2023"
                  min="2000"
                  max="2099"
                  className="block w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                해설 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={question.explanation}
                onChange={(e) =>
                  handleQuestionChange('explanation', e.target.value)
                }
                rows={10}
                className="block w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* 버튼 영역 */}
        <div className="flex justify-end gap-3">
          <button
            onClick={() => router.push(`/admin/problems/${progressId || ''}`)}
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
  );
}

export default function EditProblemPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <EditProblemContent />
    </Suspense>
  );
}
