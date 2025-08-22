'use client';

import { useState, useEffect } from 'react';
import {
  getTotalInquiries,
  updateInquiryAnswer,
  FormattedInquiry,
} from '@/lib/admin/inquiryService';
import { useRequireAuth } from '@/hooks/admin/useAuth';

interface Inquiry extends FormattedInquiry {}

export default function InquiriesPage() {
  const {
    user,
    loading: authLoading,
    isAuthenticated,
    shouldRender,
  } = useRequireAuth();
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [answer, setAnswer] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'latest' | 'status'>('latest');
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 데이터 로드
  useEffect(() => {
    async function loadInquiries() {
      try {
        setLoading(true);
        const data = await getTotalInquiries(); // 모든 질문 유형 포함
        setInquiries(data);
        setError(null);
      } catch (err) {
        console.error('Failed to load inquiries:', err);
        setError('문의 데이터를 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    }

    if (shouldRender) {
      loadInquiries();
    }
  }, [shouldRender]);

  // 필터링 및 정렬
  const filteredAndSortedInquiries = inquiries
    .filter((inquiry) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        (inquiry.inquirerName || '').toLowerCase().includes(searchLower) ||
        (inquiry.inquiryType || '').toLowerCase().includes(searchLower) ||
        (inquiry.content || '').toLowerCase().includes(searchLower) ||
        (inquiry.id || '').toLowerCase().includes(searchLower)
      );
    })
    .sort((a, b) => {
      if (sortBy === 'latest') {
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      } else if (sortBy === 'status') {
        // 답변 대기를 먼저 보여줌
        if (a.status === 'waiting' && b.status === 'completed') return -1;
        if (a.status === 'completed' && b.status === 'waiting') return 1;
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      }
      return 0;
    });

  const handleOpenModal = (inquiry: Inquiry) => {
    console.log('Opening modal for inquiry:', inquiry);
    setSelectedInquiry(inquiry);
    setAnswer(inquiry.answer || '');
    setIsModalOpen(true);
  };

  const handleSaveAnswer = async () => {
    if (selectedInquiry) {
      try {
        await updateInquiryAnswer(selectedInquiry.id, answer);

        // 로컬 상태 업데이트
        setInquiries(
          inquiries.map((inquiry) =>
            inquiry.id === selectedInquiry.id
              ? { ...inquiry, answer, status: 'completed' as const }
              : inquiry
          )
        );

        setIsModalOpen(false);
        setSelectedInquiry(null);
        setAnswer('');
      } catch (err) {
        console.error('Failed to save answer:', err);
        alert('답변 저장에 실패했습니다. 다시 시도해주세요.');
      }
    }
  };

  // 로딩 중이거나 인증되지 않은 경우 로딩 화면 표시
  if (!shouldRender) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-center text-gray-500">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">문의 관리</h1>
          <p className="text-gray-600">
            수강생들의 문의를 확인하고 답변을 작성하세요.
          </p>
        </div>

        {/* 로딩 및 에러 상태 */}
        {loading && (
          <div className="bg-white shadow rounded-lg p-6 mb-6 text-center">
            <p className="text-gray-600">데이터를 불러오는 중...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* 검색 및 필터 */}
        {!loading && !error && (
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* 검색 */}
              <div className="flex-1">
                <div className="relative">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="문의 ID, 문의자 이름, 문의 유형, 내용으로 검색..."
                    className="block w-full pl-10 pr-3 py-2 text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
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

              {/* 정렬 옵션 */}
              <div>
                <select
                  value={sortBy}
                  onChange={(e) =>
                    setSortBy(e.target.value as 'latest' | 'status')
                  }
                  className="block w-full pl-3 pr-10 py-2 text-base text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="latest">최신순</option>
                  <option value="status">답변 대기순</option>
                </select>
              </div>
            </div>

            {/* 통계 */}
            <div className="mt-4 flex gap-4 text-sm">
              <span className="text-gray-600">
                전체:{' '}
                <span className="font-medium text-gray-900">
                  {inquiries.length}건
                </span>
              </span>
              <span className="text-gray-600">
                답변 대기:{' '}
                <span className="font-medium text-red-600">
                  {inquiries.filter((i) => i.status === 'waiting').length}건
                </span>
              </span>
              <span className="text-gray-600">
                답변 완료:{' '}
                <span className="font-medium text-green-600">
                  {inquiries.filter((i) => i.status === 'completed').length}건
                </span>
              </span>
            </div>
          </div>
        )}

        {/* 문의 목록 테이블 */}
        {!loading && !error && (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    문의 ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    문의자 이름
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    문의 유형
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    문의 내용
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    상태
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    작업
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAndSortedInquiries.map((inquiry) => (
                  <tr key={inquiry.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {inquiry.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {inquiry.inquirerName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {inquiry.inquiryType}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="max-w-xs truncate">{inquiry.content}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          inquiry.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {inquiry.status === 'completed'
                          ? '답변 완료'
                          : '답변 대기'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleOpenModal(inquiry)}
                        className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                      >
                        답변
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 답변 모달 - 스크린샷과 동일한 스타일 */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* 배경 오버레이 */}
            <div
              className="fixed inset-0 bg-opacity-100"
              onClick={() => setIsModalOpen(false)}
            ></div>

            {/* 모달 컨텐츠 */}
            <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6 text-center">
                문의 답변
              </h2>

              {selectedInquiry && (
                <div className="space-y-4">
                  {/* 문의 유형 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      문의 유형
                    </label>
                    <input
                      type="text"
                      value={selectedInquiry.inquiryType}
                      readOnly
                      className="w-full px-3 py-2 text-gray-800 bg-gray-50 border border-gray-300 rounded-md"
                    />
                  </div>

                  {/* 문의 내용 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      문의 내용
                    </label>
                    <textarea
                      value={selectedInquiry.content}
                      readOnly
                      rows={3}
                      className="w-full px-3 py-2 text-gray-800 bg-gray-50 border border-gray-300 rounded-md resize-none"
                    />
                  </div>

                  {/* 답변 입력 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      답변 입력
                    </label>
                    <textarea
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                      rows={6}
                      placeholder="문의에 대한 답변을 입력하세요."
                      className="w-full px-3 py-2 text-gray-800 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* 버튼 */}
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => setIsModalOpen(false)}
                      className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
                    >
                      닫기
                    </button>
                    <button
                      onClick={handleSaveAnswer}
                      className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      저장
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
