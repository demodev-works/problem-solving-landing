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
  const { shouldRender } = useRequireAuth();
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

      // 답변 입력 필드 비우기
      setAnswer('');

      alert('답변이 성공적으로 저장되었습니다.');
    } catch (error) {
      console.error('답변 저장 실패:', error);
      alert('답변 저장 중 오류가 발생했습니다.');
    } finally {
      setIsAnswering(false);
    }
  };

  // TODO: 삭제 기능이 필요하면 주석 해제하고 UI에 삭제 버튼 추가
  // const handleDeleteQuestion = async () => {
  //   if (!question) return;

  //   if (
  //     confirm(
  //       `정말로 이 질문을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`
  //     )
  //   ) {
  //     try {
  //       await deleteQuestion(question.question_id);
  //       alert('질문이 삭제되었습니다.');
  //       router.push('/qna');
  //     } catch (error) {
  //       console.error('질문 삭제 실패:', error);
  //       alert('질문 삭제 중 오류가 발생했습니다.');
  //     }
  //   }
  // };

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
                {question.title}
              </h1>
              <p className="text-gray-600">
                질문 ID: {question.question_id} | 생성일:{' '}
                {new Date(question.created_at).toLocaleString('ko-KR')}
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
                {question.state === 'answered' ? '답변완료' : '답변대기'}
              </span>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* 메인 컨텐츠 */}
          <div>
            <div className="bg-white shadow rounded-lg p-6 mb-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                문제 정보
              </h2>

              <div className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">문제 ID</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {question.problem_info.problem_management_id}
                  </dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    문제 내용
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
                    {question.problem_info.content || '문제 내용이 없습니다.'}
                  </dd>
                </div>

                {question.problem_info.image && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      문제 이미지
                    </dt>
                    <dd className="mt-1">
                      <img
                        src={question.problem_info.image}
                        alt="문제 이미지"
                        className="max-w-full h-auto rounded-md border border-gray-200"
                        style={{ maxHeight: '400px' }}
                        onError={(e) => {
                          const img = e.target as HTMLImageElement;
                          img.style.display = 'none';
                          const errorDiv = document.createElement('div');
                          errorDiv.className =
                            'text-sm text-gray-500 p-4 border border-gray-200 rounded-md bg-gray-50';
                          errorDiv.textContent = '이미지를 불러올 수 없습니다.';
                          img.parentNode?.appendChild(errorDiv);
                        }}
                      />
                    </dd>
                  </div>
                )}

                <div>
                  <dt className="text-sm font-medium text-gray-500">정답</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {question.problem_info.answer}번
                  </dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-gray-500">해설</dt>
                  <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
                    {question.problem_info.explanation || '해설이 없습니다.'}
                  </dd>
                </div>

                {question.problem_info.selects &&
                  question.problem_info.selects.length > 0 && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">
                        선택지
                      </dt>
                      <dd className="mt-1 space-y-1">
                        {question.problem_info.selects.map((select, index) => (
                          <div key={index} className="text-sm text-gray-900">
                            <span className="font-medium">
                              {select.question_number}.
                            </span>{' '}
                            {select.content}
                          </div>
                        ))}
                      </dd>
                    </div>
                  )}
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
                    사용자 이메일
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 font-mono">
                    {question.user_email}
                  </dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    질문 제목
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 font-medium">
                    {question.title}
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
        </div>
      </div>
    </div>
  );
}
