'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useRequireAuth } from '@/hooks/admin/useAuth';
import {
  getProgresses,
  createProblem,
  createProblemWithImage,
  createProblemSelect,
  updateProgressTotalProblems,
  getProblemsByProgress,
  ProblemProgress,
  ProblemManagement,
} from '@/lib/admin/problemService';
import { getSubjects, Subject } from '@/lib/admin/subjectService';

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
  sequence?: number;
  image?: File | string;
  imagePreview?: string;
}

function NewProblemContent() {
  const { shouldRender } = useRequireAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedProgressId = searchParams.get('progress_id');
  const [formData, setFormData] = useState({
    subject: '',
    progress: '',
    progressId: '',
  });
  const [progressOptions, setProgressOptions] = useState<ProblemProgress[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentProblemCount, setCurrentProblemCount] = useState(0);

  // 선택된 과목에 따라 진도명 필터링
  const filteredProgressOptions = progressOptions.filter((progress) => {
    if (!formData.subject) return false;
    const selectedSubject = subjects.find((s) => s.name === formData.subject);
    return selectedSubject && progress.subject === selectedSubject.subject_id;
  });

  useEffect(() => {
    if (shouldRender) {
      fetchProgressList();
      fetchSubjects();
    }
  }, [shouldRender]);

  useEffect(() => {
    // URL에서 progress_id가 전달된 경우 자동 선택
    if (
      preselectedProgressId &&
      progressOptions.length > 0 &&
      subjects.length > 0
    ) {
      const selectedProgress = progressOptions.find(
        (p) => p.progress_id.toString() === preselectedProgressId
      );
      if (selectedProgress) {
        const selectedSubject = subjects.find(
          (s) => s.subject_id === selectedProgress.subject
        );
        if (selectedSubject) {
          setFormData({
            subject: selectedSubject.name,
            progress: selectedProgress.name,
            progressId: preselectedProgressId,
          });
          
          // 미리 선택된 진도의 문제 개수 가져오기
          fetchCurrentProblemCount(preselectedProgressId);
        }
      }
    }
  }, [preselectedProgressId, progressOptions, subjects]);

  const fetchProgressList = async () => {
    try {
      const data = await getProgresses();
      setProgressOptions(data);
      setError(null);
    } catch (error) {
      console.error('진도 목록 로딩 실패:', error);
      setError('진도 목록을 불러오는데 실패했습니다.');
    }
  };

  const fetchSubjects = async () => {
    try {
      const data = await getSubjects();
      setSubjects(data);
      setError(null);
    } catch (error) {
      console.error('과목 목록 로딩 실패:', error);
      setError('과목 목록을 불러오는데 실패했습니다.');
    }
  };

  const fetchCurrentProblemCount = async (progressId: string) => {
    try {
      const problems = await getProblemsByProgress(parseInt(progressId));
      const count = problems.length;
      setCurrentProblemCount(count);
      
      // 첫 번째 문제의 sequence도 업데이트
      setQuestions(prevQuestions => 
        prevQuestions.map((q, index) => ({
          ...q,
          sequence: count + index + 1
        }))
      );
    } catch (error) {
      console.error('문제 개수 조회 실패:', error);
      setCurrentProblemCount(0);
    }
  };
  const [questions, setQuestions] = useState<Question[]>([
    {
      id: 1,
      question: '',
      options: ['', '', '', ''],
      answer: '',
      explanation: '',
      difficulty: 'basic',
      sequence: 1,
    },
  ]);

  const handleAddQuestion = () => {
    setQuestions([
      ...questions,
      {
        id: Math.max(...questions.map((q) => q.id)) + 1,
        sequence: currentProblemCount + questions.length + 1,
        question: '',
        options: ['', '', '', ''],
        answer: '',
        explanation: '',
        difficulty: 'basic',
      },
    ]);
  };

  const handleRemoveQuestion = (id: number) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((q) => q.id !== id));
    }
  };

  const handleQuestionChange = (
    id: number,
    field: keyof Question,
    value: string | number | File | undefined
  ) => {
    setQuestions(prevQuestions => {
      const newQuestions = prevQuestions.map((q) => {
        if (q.id === id) {
          return { ...q, [field]: value };
        }
        return q;
      });
      
      return newQuestions;
    });
  };

  const handleOptionChange = (
    questionId: number,
    optionIndex: number,
    value: string
  ) => {
    setQuestions(
      questions.map((q) =>
        q.id === questionId
          ? {
              ...q,
              options: q.options.map((opt, idx) =>
                idx === optionIndex ? value : opt
              ),
            }
          : q
      )
    );
  };

  const handleAddOption = (questionId: number) => {
    setQuestions(
      questions.map((q) =>
        q.id === questionId && q.options.length < 5
          ? { ...q, options: [...q.options, ''] }
          : q
      )
    );
  };

  const handleRemoveOption = (questionId: number, optionIndex: number) => {
    setQuestions(
      questions.map((q) =>
        q.id === questionId && q.options.length > 2
          ? {
              ...q,
              options: q.options.filter((_, idx) => idx !== optionIndex),
              answer:
                q.answer === String(optionIndex + 1)
                  ? ''
                  : parseInt(q.answer) > optionIndex + 1
                  ? String(parseInt(q.answer) - 1)
                  : q.answer,
            }
          : q
      )
    );
  };

  const handleImageUpload = (questionId: number, file: File) => {
    // 파일 객체를 직접 저장하여 나중에 FormData로 전송
    handleQuestionChange(questionId, 'image', file);
    handleQuestionChange(questionId, 'imagePreview', URL.createObjectURL(file));
  };

  const handleSubmit = async () => {
    if (!isFormValid()) return;

    setLoading(true);
    try {
      for (let i = 0; i < questions.length; i++) {
        const question = questions[i];
        
        // sequence 값 사용 (이제 필수이므로 무조건 존재함)
        const sequenceValue = question.sequence!;
        
        // 문제 생성 - 백엔드 필드명에 맞게 수정
        const problemData: Omit<ProblemManagement, 'problem_management_id' | 'selects' | 'progress_details'> = {
          progress: parseInt(formData.progressId),
          content: question.question.trim(),
          answer: parseInt(question.answer),
          explanation: question.explanation ? question.explanation.trim() : '',
          difficulty: question.difficulty,
          sequence: sequenceValue,
        };

        if (question.source && question.source.trim()) {
          problemData.source = question.source.trim();
        }

        if (question.year) {
          problemData.exam_year = `${question.year}-01-01`;
        }

        let createdProblem;
        
        // 이미지가 있으면 createProblemWithImage, 없으면 createProblem 사용
        if (question.image && question.image instanceof File) {
          createdProblem = await createProblemWithImage(problemData, question.image);
        } else {
          createdProblem = await createProblem(problemData);
        }

        // 선택지 생성
        const validOptions = question.options.filter((opt) => opt.trim());
        for (let j = 0; j < validOptions.length; j++) {
          await createProblemSelect({
            question_number: j + 1,
            content: validOptions[j],
            problem_management: createdProblem.problem_management_id,
          });
        }
      }

      // problem_progress 테이블의 total_problems 업데이트
      await updateProgressTotalProblems(parseInt(formData.progressId));

      alert(`${questions.length}개의 문제가 성공적으로 저장되었습니다.`);
      router.push(`/admin/problems/${formData.progressId}`);
    } catch (error) {
      console.error('문제 저장 실패:', error);
      setError('문제 저장 중 오류가 발생했습니다.');
      alert('문제 저장 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = () => {
    return (
      formData.subject &&
      formData.progressId &&
      questions.every(
        (q) =>
          q.question.trim() && // content 필수
          q.answer && // answer 필수
          q.explanation &&
          q.explanation.trim() && // explanation 필수
          q.sequence && q.sequence > 0 && // sequence 필수
          q.options.filter((opt) => opt.trim()).length >= 2 &&
          q.options
            .slice(0, q.options.filter((opt) => opt.trim()).length)
            .every((opt) => opt.trim())
      )
    );
  };

  // 로딩 중이거나 인증되지 않은 경우 로딩 화면 표시
  if (!shouldRender) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-2 text-gray-500">로딩 중...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">새 문제 추가</h1>
          <button
            onClick={() => router.push('/admin/problems')}
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

        {/* 기본 정보 입력 */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">기본 정보</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                과목명
              </label>
              <select
                value={formData.subject}
                onChange={(e) => {
                  setFormData({
                    subject: e.target.value,
                    progress: '',
                    progressId: '',
                  });
                }}
                className="block w-full pl-3 pr-10 py-2 text-base text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">선택하세요</option>
                {subjects.map((subject) => (
                  <option key={subject.subject_id} value={subject.name}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                진도명
              </label>
              <select
                value={formData.progressId}
                onChange={(e) => {
                  const selectedProgress = filteredProgressOptions.find(
                    (p) => p.progress_id.toString() === e.target.value
                  );
                  setFormData({
                    ...formData,
                    progressId: e.target.value,
                    progress: selectedProgress?.name || '',
                  });
                  
                  // 선택된 진도의 문제 개수 가져오기
                  if (e.target.value) {
                    fetchCurrentProblemCount(e.target.value);
                  } else {
                    setCurrentProblemCount(0);
                    // 진도가 선택되지 않았을 때 sequence 초기화
                    setQuestions(prevQuestions => 
                      prevQuestions.map((q, index) => ({
                        ...q,
                        sequence: index + 1
                      }))
                    );
                  }
                }}
                disabled={!formData.subject}
                className="block w-full pl-3 pr-10 py-2 text-base text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">선택하세요</option>
                {filteredProgressOptions.map((progress) => (
                  <option
                    key={progress.progress_id}
                    value={progress.progress_id}
                  >
                    {progress.name} (Day {progress.day})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 문제 입력 */}
        <div className="space-y-4 mb-6">
          {questions.map((question, qIndex) => (
            <div key={question.id} className="bg-white shadow rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  문제 {qIndex + 1}
                </h3>
                {questions.length > 1 && (
                  <button
                    onClick={() => handleRemoveQuestion(question.id)}
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
                    문제
                  </label>
                  <textarea
                    value={question.question}
                    onChange={(e) =>
                      handleQuestionChange(
                        question.id,
                        'question',
                        e.target.value
                      )
                    }
                    rows={3}
                    className="block w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />

                  {/* 이미지 업로드 */}
                  <div className="mt-2">
                    {question.imagePreview && (
                      <div className="mb-2">
                        <img
                          src={question.imagePreview}
                          alt="문제 이미지"
                          className="max-w-md h-auto border rounded"
                        />
                        <button
                          onClick={() => {
                            handleQuestionChange(question.id, 'image', undefined);
                            handleQuestionChange(question.id, 'imagePreview', undefined);
                          }}
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
                        if (file) handleImageUpload(question.id, file);
                      }}
                      className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-medium text-gray-700">
                      보기 ({question.options.length}개)
                    </label>
                    {question.options.length < 5 && (
                      <button
                        onClick={() => handleAddOption(question.id)}
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
                            handleOptionChange(
                              question.id,
                              optIndex,
                              e.target.value
                            )
                          }
                          className="flex-1 px-3 py-2 text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                        {question.options.length > 2 && (
                          <button
                            onClick={() =>
                              handleRemoveOption(question.id, optIndex)
                            }
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
                      정답
                    </label>
                    <select
                      value={question.answer}
                      onChange={(e) =>
                        handleQuestionChange(
                          question.id,
                          'answer',
                          e.target.value
                        )
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
                        handleQuestionChange(
                          question.id,
                          'difficulty',
                          e.target.value
                        )
                      }
                      className="block w-full pl-3 pr-10 py-2 text-base text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="basic">기본</option>
                      <option value="advanced">심화</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      출처 (선택사항)
                    </label>
                    <input
                      type="text"
                      value={question.source || ''}
                      onChange={(e) =>
                        handleQuestionChange(
                          question.id,
                          'source',
                          e.target.value || undefined
                        )
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
                          question.id,
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
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      순서 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={question.sequence || ''}
                      onChange={(e) =>
                        handleQuestionChange(
                          question.id,
                          'sequence',
                          e.target.value ? parseInt(e.target.value) : undefined
                        )
                      }
                      placeholder={currentProblemCount > 0 ? `${currentProblemCount + 1}` : '1'}
                      min="1"
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
                      handleQuestionChange(
                        question.id,
                        'explanation',
                        e.target.value
                      )
                    }
                    rows={3}
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
            onClick={handleAddQuestion}
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
            문제 추가
          </button>

          <div className="flex gap-3">
            <button
              onClick={() => router.push('/admin/problems')}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              취소
            </button>
            <button
              onClick={handleSubmit}
              disabled={!isFormValid() || loading}
              className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                isFormValid() && !loading
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : 'bg-gray-400 cursor-not-allowed'
              }`}
            >
              {loading ? '저장 중...' : '저장'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NewProblemPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <NewProblemContent />
    </Suspense>
  );
}
