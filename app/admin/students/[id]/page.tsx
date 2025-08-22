'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useRequireAuth } from '@/hooks/admin/useAuth';
import {
  getUserById,
  updateUser,
  patchUser,
  activateUser,
  deactivateUser,
  deleteUser,
  getSubscriptions,
  getPrepareMajors,
  User,
  UserSubscription,
  PrepareMajor,
} from '@/lib/admin/userService';

export default function StudentDetailPage() {
  const {
    user: authUser,
    loading: authLoading,
    isAuthenticated,
    shouldRender,
  } = useRequireAuth();
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;

  // 상태 관리
  const [user, setUser] = useState<User | null>(null);
  const [subscriptions, setSubscriptions] = useState<UserSubscription[]>([]);
  const [prepareMajors, setPrepareMajors] = useState<PrepareMajor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 편집 모드 상태
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: '',
    prepare_major: null as number | null,
    is_onboarding_completed: false,
  });

  useEffect(() => {
    if (shouldRender && userId) {
      fetchUserDetail();
      fetchUserSubscriptions();
      fetchPrepareMajors();
    }
  }, [shouldRender, userId]);

  const fetchUserDetail = async () => {
    try {
      setLoading(true);
      const userData = await getUserById(userId);
      setUser(userData);

      // 편집 폼 초기화
      setEditForm({
        name: userData.name,
        email: userData.email,
        phone: userData.phone || '',
        prepare_major: userData.prepare_major?.prepare_major_id || null,
        is_onboarding_completed: userData.is_onboarding_completed,
      });

      setError(null);
    } catch (error) {
      console.error('사용자 상세 정보 로딩 실패:', error);
      setError('사용자 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserSubscriptions = async () => {
    try {
      const response = await getSubscriptions({ user: userId });
      if (Array.isArray(response)) {
        setSubscriptions(response);
      } else {
        setSubscriptions(response.results || []);
      }
    } catch (error) {
      console.error('구독 정보 로딩 실패:', error);
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

  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    const limitedNumbers = numbers.slice(0, 11);

    if (limitedNumbers.length <= 3) {
      return limitedNumbers;
    } else if (limitedNumbers.length <= 7) {
      return `${limitedNumbers.slice(0, 3)}-${limitedNumbers.slice(3)}`;
    } else {
      return `${limitedNumbers.slice(0, 3)}-${limitedNumbers.slice(
        3,
        7
      )}-${limitedNumbers.slice(7)}`;
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setEditForm({ ...editForm, phone: formatted });
  };

  const handleSaveEdit = async () => {
    if (!user) return;

    try {
      const updateData = {
        name: editForm.name,
        email: editForm.email,
        phone: editForm.phone,
        prepare_major: editForm.prepare_major,
        is_onboarding_completed: editForm.is_onboarding_completed,
      };

      const updatedUser = await patchUser(userId, updateData);
      setUser(updatedUser);
      setIsEditing(false);
      alert('사용자 정보가 성공적으로 수정되었습니다.');
    } catch (error: any) {
      let errorMessage = '사용자 정보 수정 중 오류가 발생했습니다.';
      if (error.response?.data) {
        const errorData = error.response.data;
        if (typeof errorData === 'object') {
          const errors = Object.entries(errorData)
            .map(([key, value]) => `${key}: ${value}`)
            .join(', ');
          errorMessage = `오류: ${errors}`;
        } else {
          errorMessage = `오류: ${errorData}`;
        }
      }

      alert(errorMessage);
    }
  };

  const handleActivateUser = async () => {
    if (!user) return;

    try {
      if (user.is_active) {
        await deactivateUser(userId);
        alert('사용자가 비활성화되었습니다.');
      } else {
        await activateUser(userId);
        alert('사용자가 활성화되었습니다.');
      }
      await fetchUserDetail();
    } catch (error) {
      console.error('사용자 상태 변경 실패:', error);
      alert('사용자 상태 변경 중 오류가 발생했습니다.');
    }
  };

  const handleDeleteUser = async () => {
    if (!user) return;

    if (
      confirm(
        `정말로 "${user.name}" 사용자를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`
      )
    ) {
      try {
        await deleteUser(userId);
        alert('사용자가 삭제되었습니다.');
        router.push('admin/students');
      } catch (error) {
        console.error('사용자 삭제 실패:', error);
        alert('사용자 삭제 중 오류가 발생했습니다.');
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

  if (error || !user) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <p className="text-red-600">
              {error || '사용자를 찾을 수 없습니다.'}
            </p>
            <button
              onClick={() => router.push('/admin/students')}
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
              <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
              <p className="text-gray-600">{user.email}</p>
            </div>
            <div className="flex items-center space-x-3">
              <span
                className={`px-3 py-1 text-sm rounded-full ${
                  user.is_active
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {user.is_active ? '활성' : '비활성'}
              </span>
              {user.subscription_status && (
                <span
                  className={`px-3 py-1 text-sm rounded-full ${
                    user.subscription_status.status === 'active'
                      ? 'bg-blue-100 text-blue-800'
                      : user.subscription_status.status === 'expired'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  구독:{' '}
                  {user.subscription_status.status === 'active'
                    ? '활성'
                    : user.subscription_status.status === 'expired'
                    ? '만료'
                    : '취소'}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 기본 정보 */}
          <div className="lg:col-span-2">
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-medium text-gray-900">기본 정보</h2>
                <div className="flex items-center space-x-3">
                  {isEditing ? (
                    <>
                      <button
                        onClick={() => setIsEditing(false)}
                        className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                      >
                        취소
                      </button>
                      <button
                        onClick={handleSaveEdit}
                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      >
                        저장
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      수정
                    </button>
                  )}
                </div>
              </div>

              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      이름
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
                      이메일
                    </label>
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={(e) =>
                        setEditForm({ ...editForm, email: e.target.value })
                      }
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      전화번호
                    </label>
                    <input
                      type="tel"
                      value={editForm.phone}
                      onChange={handlePhoneChange}
                      placeholder="010-1234-5678"
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      준비 전공
                    </label>
                    <select
                      value={editForm.prepare_major || ''}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          prepare_major: e.target.value
                            ? Number(e.target.value)
                            : null,
                        })
                      }
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">선택하세요</option>
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
                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={editForm.is_onboarding_completed}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            is_onboarding_completed: e.target.checked,
                          })
                        }
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        온보딩 완료
                      </span>
                    </label>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">
                        사용자 ID
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900 font-mono">
                        {user.user_id}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">
                        이름
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {user.name}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">
                        이메일
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {user.email}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">
                        전화번호
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {user.phone || '-'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">
                        소셜 타입
                      </dt>
                      <dd className="mt-1">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            user.social_type === 'kakao'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {user.social_type === 'kakao' ? '카카오' : '애플'}
                        </span>
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">
                        준비 전공
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {user.prepare_major_name || '미설정'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">
                        가입일
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {new Date(user.created_at).toLocaleDateString('ko-KR')}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">
                        온보딩 상태
                      </dt>
                      <dd className="mt-1">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            user.is_onboarding_completed
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {user.is_onboarding_completed ? '완료' : '미완료'}
                        </span>
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">
                        구독상태
                      </dt>
                      <dd className="mt-1">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            user.subscription_status?.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : user.subscription_status?.status === 'expired'
                              ? 'bg-red-100 text-red-800'
                              : user.subscription_status?.status === 'cancelled'
                              ? 'bg-gray-100 text-gray-800'
                              : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {user.subscription_status?.status === 'active'
                            ? '활성'
                            : user.subscription_status?.status === 'expired'
                            ? '만료'
                            : user.subscription_status?.status === 'cancelled'
                            ? '취소'
                            : '없음'}
                        </span>
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">
                        구독타입
                      </dt>
                      <dd className="mt-1">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            user.subscription_status?.subscription_type ===
                            'monthly'
                              ? 'bg-blue-100 text-blue-800'
                              : user.subscription_status?.subscription_type ===
                                'yearly'
                              ? 'bg-purple-100 text-purple-800'
                              : user.subscription_status?.subscription_type ===
                                'lifetime'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {user.subscription_status?.subscription_type ===
                          'monthly'
                            ? '월간'
                            : user.subscription_status?.subscription_type ===
                              'yearly'
                            ? '연간'
                            : user.subscription_status?.subscription_type ===
                              'lifetime'
                            ? '평생'
                            : '-'}
                        </span>
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">
                        결제기한 ~ 구독기한
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900 whitespace-pre-line">
                        {user.subscription_status?.expired_at
                          ? `${new Date(user.created_at).toLocaleDateString(
                              'ko-KR'
                            )}\n~ ${new Date(
                              user.subscription_status.expired_at
                            ).toLocaleDateString('ko-KR')}`
                          : '-'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">
                        결제방법
                      </dt>
                      <dd className="mt-1">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            user.subscription_status?.subscription_type ===
                            'monthly'
                              ? 'bg-orange-100 text-orange-800'
                              : user.subscription_status?.subscription_type ===
                                'yearly'
                              ? 'bg-indigo-100 text-indigo-800'
                              : user.subscription_status?.subscription_type ===
                                'lifetime'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {user.subscription_status
                            ? user.subscription_status.subscription_type ===
                              'monthly'
                              ? '정기결제'
                              : user.subscription_status.subscription_type ===
                                'yearly'
                              ? '12개월결제'
                              : user.subscription_status.subscription_type ===
                                'lifetime'
                              ? '평생결제'
                              : '일시결제'
                            : '-'}
                        </span>
                      </dd>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 사이드바 */}
          <div className="space-y-6">
            {/* 통계 정보 */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                통계 정보
              </h3>
              {user.subscription_status ? (
                <div className="space-y-3">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">상태</dt>
                    <dd className="mt-1">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          user.subscription_status.status === 'active'
                            ? 'bg-blue-100 text-blue-700'
                            : user.subscription_status.status === 'expired'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {user.subscription_status.status === 'active'
                          ? '활성'
                          : user.subscription_status.status === 'expired'
                          ? '만료'
                          : '취소'}
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      구독 타입
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {user.subscription_status.subscription_type === 'monthly'
                        ? '월간'
                        : user.subscription_status.subscription_type ===
                          'yearly'
                        ? '연간'
                        : user.subscription_status.subscription_type ===
                          'lifetime'
                        ? '평생'
                        : '-'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      만료일
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {new Date(
                        user.subscription_status.expired_at
                      ).toLocaleDateString('ko-KR')}
                    </dd>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500">통계 정보가 없습니다.</p>
              )}
            </div>

            {/* 액션 버튼 */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                관리 작업
              </h3>
              <div className="space-y-3">
                <button
                  onClick={handleActivateUser}
                  className={`w-full px-4 py-2 text-sm font-medium rounded-md ${
                    user.is_active
                      ? 'bg-orange-600 text-white hover:bg-orange-700'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  {user.is_active ? '비활성화' : '활성화'}
                </button>
                <button
                  onClick={handleDeleteUser}
                  className="w-full px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  사용자 삭제
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 구독 히스토리 */}
        {subscriptions.length > 0 && (
          <div className="mt-6 bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              구독 히스토리
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      결제기한 ~ 구독기한
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      구독 타입
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      결제 방식
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      결제 방법
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      상태
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {subscriptions.map((subscription) => (
                    <tr key={subscription.user_subscription_id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="font-medium">
                          {new Date(
                            subscription.payment_date
                          ).toLocaleDateString('ko-KR')}{' '}
                          ~{' '}
                          {new Date(subscription.expired_at).toLocaleDateString(
                            'ko-KR'
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            subscription.subscription_type === 'monthly'
                              ? 'bg-blue-100 text-blue-800'
                              : subscription.subscription_type === 'yearly'
                              ? 'bg-purple-100 text-purple-800'
                              : subscription.subscription_type === 'lifetime'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {subscription.subscription_type === 'monthly'
                            ? '월간'
                            : subscription.subscription_type === 'yearly'
                            ? '연간'
                            : subscription.subscription_type === 'lifetime'
                            ? '평생'
                            : '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            subscription.subscription_type === 'monthly'
                              ? 'bg-orange-100 text-orange-800'
                              : subscription.subscription_type === 'yearly'
                              ? 'bg-indigo-100 text-indigo-800'
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {subscription.subscription_type === 'monthly'
                            ? '정기결제'
                            : subscription.subscription_type === 'yearly'
                            ? '12개월결제'
                            : subscription.subscription_type === 'lifetime'
                            ? '평생결제'
                            : '일시결제'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            subscription.payment_method === 'card'
                              ? 'bg-gray-100 text-gray-800'
                              : subscription.payment_method === 'kakao_pay'
                              ? 'bg-yellow-100 text-yellow-800'
                              : subscription.payment_method === 'naver_pay'
                              ? 'bg-green-100 text-green-800'
                              : subscription.payment_method === 'apple_pay'
                              ? 'bg-black text-white'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {subscription.payment_method === 'card'
                            ? '카드'
                            : subscription.payment_method === 'kakao_pay'
                            ? '카카오페이'
                            : subscription.payment_method === 'naver_pay'
                            ? '네이버페이'
                            : subscription.payment_method === 'apple_pay'
                            ? '애플페이'
                            : subscription.payment_major}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            subscription.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : subscription.status === 'expired'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {subscription.status === 'active'
                            ? '활성'
                            : subscription.status === 'expired'
                            ? '만료'
                            : '취소'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
