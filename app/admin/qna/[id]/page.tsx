'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useRequireAuth } from '@/hooks/admin/useAuth';
import {
  getQuestionById,
  answerQuestion,
  deleteQuestion,
  Question,
} from '@/lib/admin/qnaService';

export default function QuestionDetailPage() {
  const {
    user: authUser,
    loading: authLoading,
    isAuthenticated,
    shouldRender,
  } = useRequireAuth();
  const router = useRouter();
  const params = useParams();
  const questionId = parseInt(params.id as string);

  // 상태 관리
  const [question, setQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 답변 관련 상태
  const [isAnswering, setIsAnswering] = useState(false);
  const [answer, setAnswer] = useState('');

  useEffect(() => {
    if (shouldRender && questionId) {
      fetchQuestionDetail();
    }
  }, [shouldRender, questionId]);

  const fetchQuestionDetail = async () => {
    try {
      setLoading(true);
      const questionData = await getQuestionById(questionId);
      setQuestion(questionData);
      setAnswer(questionData.content_answer || '');
      setError(null);
    } catch (error) {
      console.error('질문 상세 정보 로딩 실패:', error);
      setError('질문 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAnswer = async () => {
    if (!question) return;

    try {
      setIsAnswering(true);
      await answerQuestion(question.question_id, { content_answer: answer });

      // 로컬 상태 업데이트
      setQuestion({
        ...question,
        content_answer: answer,
        state: 'answered',
      });

      alert('답변이 성공적으로 저장되었습니다.');
    } catch (error) {
      console.error('답변 저장 실패:', error);
      alert('답변 저장 중 오류가 발생했습니다.');
    } finally {
      setIsAnswering(false);
    }
  };

  const handleDeleteQuestion = async () => {
    if (!question) return;

    if (
      confirm(
        `정말로 이 질문을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`
      )
    ) {
      try {
        await deleteQuestion(question.question_id);
        alert('질문이 삭제되었습니다.');
        router.push('/admin/qna');
      } catch (error) {
        console.error('질문 삭제 실패:', error);
        alert('질문 삭제 중 오류가 발생했습니다.');
      }
    }
  };

  // 로딩 중이거나 인증되지 않은 경우 로딩 화면 표시
  if (!shouldRender || loading) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-2 text-center text-gray-500">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (error || !question) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <p className="text-red-600">
              {error || '질문을 찾을 수 없습니다.'}
            </p>
            <button
              onClick={() => router.push('/admin/qna')}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              목록으로 돌아가기
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="mb-6">
          <div className="flex items-center space-x-4 mb-4">
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

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                질문 ID: {question.question_id}
              </h1>
              <p className="text-gray-600">
                생성일: {new Date(question.created_at).toLocaleString('ko-KR')}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <span
                className={`px-3 py-1 text-sm rounded-full ${
                  question.state === 'answered'
                    ? 'bg-green-100 text-green-800'
                    : question.state === 'pending'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {question.state === 'answered'
                  ? '답변완료'
                  : question.state === 'pending'
                  ? '답변대기'
                  : '종료'}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 메인 컨텐츠 */}
          <div className="lg:col-span-2">
            <div className="bg-white shadow rounded-lg p-6 mb-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                문제 정보
              </h2>

              <div className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">문제 ID</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {question.problem_management}
                  </dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    문제 내용
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
                    {question.problem_content || '문제 내용이 없습니다.'}
                  </dd>
                </div>
              </div>
            </div>

            {/* 질문 내용 */}
            <div className="bg-white shadow rounded-lg p-6 mb-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                질문 내용
              </h2>

              <div className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    사용자 ID
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 font-mono">
                    {question.user}
                  </dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    질문 내용
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
                    {question.content}
                  </dd>
                </div>
              </div>
            </div>

            {/* 답변 섹션 */}
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-900">
                  관리자 답변
                </h2>
                <span className="text-sm text-gray-500">
                  {question.content_answer ? '답변 수정' : '답변 작성'}
                </span>
              </div>

              {/* 기존 답변 표시 (있는 경우) */}
              {question.content_answer && (
                <div className="mb-4 p-4 bg-gray-50 rounded-md">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">
                    현재 답변
                  </h3>
                  <p className="text-sm text-gray-900 whitespace-pre-wrap">
                    {question.content_answer}
                  </p>
                </div>
              )}

              {/* 답변 입력/수정 */}
              <div className="space-y-4">
                <textarea
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  rows={8}
                  placeholder="질문에 대한 답변을 입력하세요..."
                  className="w-full px-3 py-2 text-gray-800 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />

                <div className="flex gap-2">
                  <button
                    onClick={handleSaveAnswer}
                    disabled={!answer.trim() || isAnswering}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isAnswering ? '저장 중...' : '답변 저장'}
                  </button>

                  {question.content_answer && (
                    <button
                      onClick={() => setAnswer('')}
                      className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
                    >
                      초기화
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 사이드바 */}
          <div className="space-y-6">
            {/* 상태 정보 */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                상태 정보
              </h3>
              <div className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    현재 상태
                  </dt>
                  <dd className="mt-1">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        question.state === 'answered'
                          ? 'bg-green-100 text-green-800'
                          : question.state === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {question.state === 'answered'
                        ? '답변완료'
                        : question.state === 'pending'
                        ? '답변대기'
                        : '종료'}
                    </span>
                  </dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-gray-500">생성일</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {new Date(question.created_at).toLocaleDateString('ko-KR')}
                  </dd>
                </div>
              </div>
            </div>

            {/* 관리 작업 */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                관리 작업
              </h3>
              <div className="space-y-3">
                <button
                  onClick={() => router.push('/admin/qna')}
                  className="w-full px-4 py-2 text-sm font-medium bg-gray-600 text-white rounded-md hover:bg-gray-700"
                >
                  목록으로 돌아가기
                </button>

                <button
                  onClick={handleDeleteQuestion}
                  className="w-full px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  질문 삭제
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
