'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRequireAuth } from '@/hooks/admin/useAuth';
import DataTable from '@/components/admin/DataTable';
import {
  getUsers,
  getUserStatistics,
  // activateUser,
  // deactivateUser,
  // deleteUser,
  getPrepareMajors,
  User,
  UserStatistics,
  PrepareMajor,
  UsersResponse,
} from '@/lib/admin/userService';
import {
  getOverallProgressStats,
  ProgressCorrectRateStats,
} from '@/lib/admin/analyticsService';

interface UserDisplay {
  user_id: string;
  name: string;
  email: string;
  phone: string;
  social_type: string;
  prepare_major_name: string;
  subscription_status: string;
  subscription_type: string;
  subscription_period: string;
  payment_method: string;
  is_active: boolean;
}

export default function StudentsPage() {
  const router = useRouter();
  const { shouldRender } = useRequireAuth();

  // 상태 관리
  const [users, setUsers] = useState<UserDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statistics, setStatistics] = useState<UserStatistics | null>(null);
  const [prepareMajors, setPrepareMajors] = useState<PrepareMajor[]>([]);
  const [progressStats, setProgressStats] = useState<ProgressCorrectRateStats[]>([]);
  const [progressStatsError, setProgressStatsError] = useState<string | null>(null);

  // 검색 및 필터 상태
  const [searchTerm, setSearchTerm] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedMajor, setSelectedMajor] = useState<number | ''>('');
  const [selectedSocialType, setSelectedSocialType] = useState<
    'kakao' | 'apple' | ''
  >('');
  const [selectedActiveStatus, setSelectedActiveStatus] = useState<string>('');
  const [selectedOnboardingStatus, setSelectedOnboardingStatus] =
    useState<string>('');

  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);

  useEffect(() => {
    if (shouldRender) {
      fetchData();
      fetchStatistics();
      fetchPrepareMajors();
      fetchProgressStats();
    }
  }, [shouldRender, currentPage]);

  useEffect(() => {
    if (shouldRender) {
      setCurrentPage(1);
      fetchData();
    }
  }, [
    searchTerm,
    selectedMajor,
    selectedSocialType,
    selectedActiveStatus,
    selectedOnboardingStatus,
  ]);

  const fetchData = async () => {
    try {
      setLoading(true);

      const params: Record<string, unknown> = {
        page: currentPage,
        ordering: '-created_at',
      };

      if (searchTerm) params.search = searchTerm;
      if (selectedMajor) params.prepare_major = selectedMajor;
      if (selectedSocialType) params.social_type = selectedSocialType;
      if (selectedActiveStatus !== '')
        params.is_active = selectedActiveStatus === 'true';
      if (selectedOnboardingStatus !== '')
        params.is_onboarding_completed = selectedOnboardingStatus === 'true';

      const response: UsersResponse | User[] = await getUsers(params);

      // API 응답이 배열인지 페이지네이션 객체인지 확인
      let users: User[];
      let totalCount: number;
      let hasNext: boolean;
      let hasPrevious: boolean;

      if (Array.isArray(response)) {
        // 배열로 직접 반환되는 경우
        users = response;
        totalCount = response.length;
        hasNext = false;
        hasPrevious = false;
      } else if (response.results) {
        // 페이지네이션 객체로 반환되는 경우
        users = response.results;
        totalCount = response.count;
        hasNext = !!response.next;
        hasPrevious = !!response.previous;
      } else {
        throw new Error('API 응답 구조가 예상과 다릅니다.');
      }

      const formattedUsers: UserDisplay[] = users.map((user: User) => {
        return {
          user_id: user.user_id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          social_type: user.social_type === 'kakao' ? '카카오' : '애플',
          prepare_major_name: user.prepare_major_name || '미설정',
          subscription_status:
            user.subscription_status?.status === 'active'
              ? '활성'
              : user.subscription_status?.status === 'expired'
              ? '만료'
              : user.subscription_status?.status === 'cancelled'
              ? '취소'
              : '없음',
          subscription_type:
            user.subscription_status?.subscription_type === 'monthly'
              ? '월간'
              : user.subscription_status?.subscription_type === 'yearly'
              ? '연간'
              : user.subscription_status?.subscription_type === 'lifetime'
              ? '평생'
              : '-',
          subscription_period: user.subscription_status?.expired_at
            ? `${new Date(user.created_at).toLocaleDateString(
                'ko-KR'
              )} ~ ${new Date(
                user.subscription_status.expired_at
              ).toLocaleDateString('ko-KR')}`
            : '-',
          payment_method: user.subscription_status
            ? user.subscription_status.subscription_type === 'monthly'
              ? '정기결제'
              : user.subscription_status.subscription_type === 'yearly'
              ? '12개월결제'
              : user.subscription_status.subscription_type === 'lifetime'
              ? '평생결제'
              : '일시결제'
            : '-',
          is_active: user.is_active,
        };
      });

      setUsers(formattedUsers);
      setTotalCount(totalCount);
      setHasNext(hasNext);
      setHasPrevious(hasPrevious);
      setError(null);
    } catch (error: unknown) {
      let errorMessage = '사용자 목록을 불러오는데 실패했습니다.';

      if (error instanceof Error && error.message) {
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

      // 임시 빈 데이터 설정
      setUsers([]);
      setTotalCount(0);
      setHasNext(false);
      setHasPrevious(false);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const stats = await getUserStatistics();
      setStatistics(stats);
    } catch (error) {
      console.error('통계 로딩 실패:', error);
    }
  };

  const fetchPrepareMajors = async () => {
    try {
      const majors = await getPrepareMajors();
      setPrepareMajors(majors);
    } catch (error) {
      console.error('전공 목록 로딩 실패:', error);
    }
  };

  const fetchProgressStats = async () => {
    try {
      setProgressStatsError(null);
      console.log('🔄 진도별 정답률 조회 시작...');
      const stats = await getOverallProgressStats();
      console.log('📊 진도별 정답률 응답:', stats);
      setProgressStats(stats);
    } catch (error) {
      console.error('❌ 진도별 정답률 로딩 실패:', error);
      setProgressStatsError('진도별 정답률을 불러오는데 오류가 발생했습니다.');
      setProgressStats([]);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedMajor('');
    setSelectedSocialType('');
    setSelectedActiveStatus('');
    setSelectedOnboardingStatus('');
  };

  const hasActiveFilters =
    searchTerm ||
    selectedMajor ||
    selectedSocialType ||
    selectedActiveStatus !== '' ||
    selectedOnboardingStatus !== '';

  const headers = [
    '이름',
    '이메일',
    '전화번호',
    '소셜타입',
    '준비전공',
    '구독상태',
    '구독타입',
    '결제기한 \n~ 구독기한',
    '결제방법',
    '상태',
    '작업',
  ];

  const renderRow = (user: UserDisplay) => (
    <>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
        {user.name}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {user.email}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {user.phone}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        <span
          className={`px-2 py-1 text-xs rounded-full ${
            user.social_type === '카카오'
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-gray-100 text-gray-800'
          }`}
        >
          {user.social_type}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {user.prepare_major_name}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        <span
          className={`px-2 py-1 text-xs rounded-full ${
            user.subscription_status === '활성'
              ? 'bg-green-100 text-green-800'
              : user.subscription_status === '만료'
              ? 'bg-red-100 text-red-800'
              : user.subscription_status === '취소'
              ? 'bg-gray-100 text-gray-800'
              : 'bg-gray-100 text-gray-500'
          }`}
        >
          {user.subscription_status}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        <span
          className={`px-2 py-1 text-xs rounded-full ${
            user.subscription_type === '월간'
              ? 'bg-blue-100 text-blue-800'
              : user.subscription_type === '연간'
              ? 'bg-purple-100 text-purple-800'
              : user.subscription_type === '평생'
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-800'
          }`}
        >
          {user.subscription_type}
        </span>
      </td>
      <td className="px-6 py-4 text-sm text-gray-500">
        <div className="font-medium text-xs whitespace-pre-line">
          {user.subscription_period}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        <span
          className={`px-2 py-1 text-xs rounded-full ${
            user.payment_method === '정기결제'
              ? 'bg-orange-100 text-orange-800'
              : user.payment_method === '12개월결제'
              ? 'bg-indigo-100 text-indigo-800'
              : user.payment_method === '평생결제'
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-800'
          }`}
        >
          {user.payment_method}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        <span
          className={`px-2 py-1 text-xs rounded-full ${
            user.is_active
              ? 'bg-blue-100 text-blue-700'
              : 'bg-red-100 text-red-800'
          }`}
        >
          {user.is_active ? '활성' : '비활성'}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        <Link
          href={`/students/${user.user_id}`}
          className="text-blue-600 hover:text-blue-900"
        >
          상세
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
        <h1 className="text-2xl font-bold text-gray-900 mb-6">수강생 관리</h1>

        {/* 통계 카드 */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-sm font-medium text-gray-500">
                전체 사용자
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {statistics.total_users.toLocaleString()}명
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-sm font-medium text-gray-500">
                활성 사용자
              </div>
              <div className="text-2xl font-bold text-green-600">
                {statistics.active_users.toLocaleString()}명
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-sm font-medium text-gray-500">
                온보딩 완료
              </div>
              <div className="text-2xl font-bold text-blue-600">
                {statistics.onboarded_users.toLocaleString()}명
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-sm font-medium text-gray-500">
                카카오 사용자
              </div>
              <div className="text-2xl font-bold text-yellow-600">
                {statistics.social_type_statistics.kakao.toLocaleString()}명
              </div>
            </div>
          </div>
        )}

        {/* 진도별 정답률 통계 */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">진도별 전체 정답률</h2>
            <div className="text-sm text-gray-500">Day별 정답률 (최신순)</div>
          </div>
          
          {progressStatsError ? (
            <div className="text-center py-8">
              <p className="text-sm text-red-600">{progressStatsError}</p>
            </div>
          ) : progressStats.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {progressStats.map((stat) => (
                <div
                  key={stat.progress_day}
                  className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                      Day {stat.progress_day}
                    </div>
                    <div className={`text-lg font-bold ${
                      stat.overall_correct_rate >= 80 
                        ? 'text-green-600' 
                        : stat.overall_correct_rate >= 60 
                        ? 'text-yellow-600' 
                        : 'text-red-600'
                    }`}>
                      {stat.overall_correct_rate}%
                    </div>
                  </div>
                  <div className="text-sm text-gray-700 font-medium mb-2 truncate">
                    {stat.progress_name}
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        stat.overall_correct_rate >= 80 
                          ? 'bg-green-500' 
                          : stat.overall_correct_rate >= 60 
                          ? 'bg-yellow-500' 
                          : 'bg-red-500'
                      }`}
                      style={{ width: `${stat.overall_correct_rate}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-sm text-gray-500">진도별 정답률 정보가 없습니다.</p>
            </div>
          )}
        </div>

        {/* 검색 및 필터 영역 */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-end mb-4">
            {/* 검색 입력 */}
            <div className="flex-1">
              <label
                htmlFor="search"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                사용자 검색
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="이름, 이메일, 전화번호로 검색..."
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

            {/* 필터 토글 버튼 */}
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`inline-flex items-center px-4 py-2 border rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                hasActiveFilters
                  ? 'border-blue-500 bg-blue-50 text-blue-700 hover:bg-blue-100'
                  : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
              }`}
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
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z"
                />
              </svg>
              필터
            </button>
          </div>

          {/* 필터 패널 */}
          {isFilterOpen && (
            <div className="border-t border-gray-200 pt-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">필터 설정</h3>
                <button
                  onClick={clearFilters}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  전체 초기화
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 준비 전공 필터 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    준비 전공
                  </label>
                  <select
                    value={selectedMajor}
                    onChange={(e) =>
                      setSelectedMajor(
                        e.target.value ? Number(e.target.value) : ''
                      )
                    }
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">전체</option>
                    {prepareMajors.map((major) => (
                      <option
                        key={major.prepare_major_id}
                        value={major.prepare_major_id}
                      >
                        {major.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 소셜 타입 필터 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    소셜 타입
                  </label>
                  <select
                    value={selectedSocialType}
                    onChange={(e) =>
                      setSelectedSocialType(
                        e.target.value as 'kakao' | 'apple' | ''
                      )
                    }
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">전체</option>
                    <option value="kakao">카카오</option>
                    <option value="apple">애플</option>
                  </select>
                </div>

                {/* 활성 상태 필터 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    활성 상태
                  </label>
                  <select
                    value={selectedActiveStatus}
                    onChange={(e) => setSelectedActiveStatus(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">전체</option>
                    <option value="true">활성</option>
                    <option value="false">비활성</option>
                  </select>
                </div>

                {/* 온보딩 상태 필터 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    온보딩 상태
                  </label>
                  <select
                    value={selectedOnboardingStatus}
                    onChange={(e) =>
                      setSelectedOnboardingStatus(e.target.value)
                    }
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">전체</option>
                    <option value="true">완료</option>
                    <option value="false">미완료</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 에러 상태 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* 사용자 목록 테이블 */}
        <div className="bg-white shadow rounded-lg">
          {loading ? (
            <div className="p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-500">사용자 목록을 불러오는 중...</p>
            </div>
          ) : (
            <>
              <DataTable
                headers={headers}
                data={users}
                renderRow={renderRow}
                onRowClick={(user) =>
                  router.push(`/admin/students/${user.user_id}`)
                }
              />

              {/* 페이지네이션 */}
              {totalCount > 0 && (
                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    총 {totalCount.toLocaleString()}명 중{' '}
                    {(currentPage - 1) * 20 + 1}-
                    {Math.min(currentPage * 20, totalCount)}명 표시
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
