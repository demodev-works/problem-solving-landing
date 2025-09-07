'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRequireAuth } from '@/hooks/admin/useAuth';
import DataTable from '@/components/admin/DataTable';
import {
  getQuestions,
  Question,
  QuestionsResponse,
  calculateQuestionStatistics,
  // TODO: 통계 API 개발 시 아래 주석 해제
  // getQuestionStatistics,
} from '@/lib/admin/qnaService';

interface QuestionDisplay {
  question_id: number;
  user_email: string;
  title: string;
  content: string;
  state: 'pending' | 'answered';
  content_answer: string | null;
  created_at: string;
  problem_info: {
    problem_management_id: number;
    content: string;
    answer: number;
    explanation: string;
    image?: string | null;
    selects: {
      question_number: number;
      content: string;
    }[];
  };
}

export default function QnaPage() {
  const { shouldRender } = useRequireAuth();

  // 상태 관리
  const [questions, setQuestions] = useState<QuestionDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statistics, setStatistics] = useState<{
    total: number;
    pending: number;
    answered: number;
  } | null>(null);

  // 검색 및 필터 상태
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedState, setSelectedState] = useState<
    'all' | 'pending' | 'answered'
  >('all');

  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);


  useEffect(() => {
    if (shouldRender) {
      fetchData();
    }
  }, [shouldRender, currentPage]);

  useEffect(() => {
    if (shouldRender) {
      setCurrentPage(1);
      fetchData();
    }
  }, [searchTerm, selectedState]);

  const fetchData = async () => {
    try {
      setLoading(true);

      const params: any = {
        page: currentPage,
        ordering: '-created_at',
      };

      if (searchTerm) params.search = searchTerm;
      if (selectedState !== 'all') params.state = selectedState;

      const response: QuestionsResponse | Question[] = await getQuestions(
        params
      );

      // API 응답이 배열인지 페이지네이션 객체인지 확인
      let questions: Question[];
      let totalCount: number;
      let hasNext: boolean;
      let hasPrevious: boolean;

      if (Array.isArray(response)) {
        // 배열로 직접 반환되는 경우
        questions = response;
        totalCount = response.length;
        hasNext = false;
        hasPrevious = false;
      } else if (response.results) {
        // 페이지네이션 객체로 반환되는 경우
        questions = response.results;
        totalCount = response.count;
        hasNext = !!response.next;
        hasPrevious = !!response.previous;
      } else {
        throw new Error('API 응답 구조가 예상과 다릅니다.');
      }

      const formattedQuestions: QuestionDisplay[] = questions.map(
        (question: Question) => {
          return {
            question_id: question.question_id,
            user_email: question.user_email,
            title: question.title,
            content: question.content,
            state: question.state,
            content_answer: question.content_answer,
            created_at: question.created_at,
            problem_info: question.problem_info,
          };
        }
      );

      setQuestions(formattedQuestions);
      setTotalCount(totalCount);
      setHasNext(hasNext);
      setHasPrevious(hasPrevious);
      setError(null);

      // TODO: 통계 API 개발 시 아래 주석 해제하고 calculateQuestionStatistics 부분을 제거하세요
      // const stats = await getQuestionStatistics();

      // 임시: 클라이언트 사이드에서 통계 계산 (API 문서에 맞게 수정)
      const stats = {
        total: formattedQuestions.length,
        pending: formattedQuestions.filter((q) => q.state === 'pending').length,
        answered: formattedQuestions.filter((q) => q.state === 'answered')
          .length,
      };
      setStatistics(stats);
    } catch (error: any) {
      let errorMessage = '질문 목록을 불러오는데 실패했습니다.';

      if (error.message) {
        if (error.message.includes('500')) {
          errorMessage =
            '서버 내부 오류가 발생했습니다. 백엔드 팀에 문의해주세요.';
        } else if (error.message.includes('401')) {
          errorMessage = '인증이 필요합니다. 다시 로그인해주세요.';
        } else if (error.message.includes('403')) {
          errorMessage = '접근 권한이 없습니다.';
        } else {
          errorMessage = `오류: ${error.message}`;
        }
      }

      setError(errorMessage);
      setQuestions([]);
      setTotalCount(0);
      setHasNext(false);
      setHasPrevious(false);
    } finally {
      setLoading(false);
    }
  };


  const clearFilters = () => {
    setSearchTerm('');
    setSelectedState('all');
  };

  const hasActiveFilters = searchTerm || selectedState !== 'all';

  const headers = [
    '질문 ID',
    '사용자',
    '제목',
    '문제 내용',
    '상태',
    '생성일',
    '작업',
  ];

  const renderRow = (question: QuestionDisplay) => (
    <>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
        {question.question_id}
      </td>
      <td className="px-6 py-4 text-sm text-gray-500">
        <div className="max-w-xs truncate font-mono">{question.user_email}</div>
      </td>
      <td className="px-6 py-4 text-sm text-gray-500">
        <div className="max-w-xs truncate font-medium">{question.title}</div>
      </td>
      <td className="px-6 py-4 text-sm text-gray-500">
        <div className="max-w-xs truncate">
          {question.problem_info?.content || '문제 없음'}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
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
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {new Date(question.created_at).toLocaleDateString('ko-KR')}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        <Link
          href={`/admin/qna/${question.question_id}`}
          className="text-blue-600 hover:text-blue-900"
        >
          상세보기
        </Link>
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
        <h1 className="text-2xl font-bold text-gray-900 mb-6">질문 관리</h1>

        {/* 통계 카드 */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-sm font-medium text-gray-500">전체 질문</div>
              <div className="text-2xl font-bold text-gray-900">
                {statistics.total.toLocaleString()}건
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-sm font-medium text-gray-500">답변 대기</div>
              <div className="text-2xl font-bold text-yellow-600">
                {statistics.pending.toLocaleString()}건
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-sm font-medium text-gray-500">답변 완료</div>
              <div className="text-2xl font-bold text-green-600">
                {statistics.answered.toLocaleString()}건
              </div>
            </div>
          </div>
        )}

        {/* 검색 및 필터 영역 */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-end mb-4">
            {/* 검색 입력 */}
            <div className="flex-1">
              <label
                htmlFor="search"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                질문 검색
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="질문 내용, 답변 내용, 사용자 이메일로 검색..."
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

            {/* 상태 필터 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                상태
              </label>
              <select
                value={selectedState}
                onChange={(e) =>
                  setSelectedState(
                    e.target.value as 'all' | 'pending' | 'answered'
                  )
                }
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">전체</option>
                <option value="pending">답변대기</option>
                <option value="answered">답변완료</option>
              </select>
            </div>

            {/* 필터 초기화 */}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="px-4 py-2 text-sm text-blue-600 hover:text-blue-800"
              >
                초기화
              </button>
            )}
          </div>
        </div>

        {/* 에러 상태 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* 질문 목록 테이블 */}
        <div className="bg-white shadow rounded-lg">
          {loading ? (
            <div className="p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-500">질문 목록을 불러오는 중...</p>
            </div>
          ) : (
            <>
              <DataTable
                headers={headers}
                data={questions}
                renderRow={renderRow}
              />

              {/* 페이지네이션 */}
              {totalCount > 0 && (
                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    총 {totalCount.toLocaleString()}건 중{' '}
                    {(currentPage - 1) * 20 + 1}-
                    {Math.min(currentPage * 20, totalCount)}건 표시
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={!hasPrevious}
                      className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      이전
                    </button>
                    <span className="px-3 py-1 text-sm text-gray-700">
                      {currentPage} 페이지
                    </span>
                    <button
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={!hasNext}
                      className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      다음
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

      </div>
    </div>
  );
}
