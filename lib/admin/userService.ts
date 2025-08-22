import { apiClient } from './apiClient';

// 사용자 인터페이스
export interface User {
  user_id: string;
  email: string;
  name: string;
  phone: string;
  social_type: 'kakao' | 'apple';
  social_id: string;
  profile_image_url: string | null;
  is_onboarding_completed: boolean;
  created_at: string;
  prepare_major: {
    prepare_major_id: number;
    name: string;
  } | null;
  prepare_major_name: string | null;
  is_active: boolean;
  subscription_status: {
    status: 'active' | 'expired' | 'cancelled';
    subscription_type: 'monthly' | 'yearly' | 'lifetime';
    expired_at: string;
    is_active: boolean;
  } | null;
}

// 구독 인터페이스
export interface UserSubscription {
  user_subscription_id: number;
  user: {
    user_id: string;
    email: string;
    name: string;
  };
  user_name: string;
  user_email: string;
  payment_date: string;
  expired_at: string;
  payment_method: 'card' | 'kakao_pay' | 'naver_pay' | 'apple_pay';
  payment_major: string;
  subscription_type: 'monthly' | 'yearly' | 'lifetime';
  status: 'active' | 'expired' | 'cancelled';
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

// 사용자 카테고리 인터페이스
export interface UserCategory {
  id: number;
  prepare_major: {
    prepare_major_id: number;
    name: string;
  };
  subject: {
    subject_id: number;
    name: string;
  };
  prepare_major_name: string;
  subject_name: string;
}

// 준비 전공 인터페이스
export interface PrepareMajor {
  prepare_major_id: number;
  name: string;
}

// API 응답 인터페이스
export interface UsersResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: User[];
}

export interface SubscriptionsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: UserSubscription[];
}

// 사용자 통계 인터페이스
export interface UserStatistics {
  total_users: number;
  active_users: number;
  inactive_users: number;
  onboarded_users: number;
  not_onboarded_users: number;
  social_type_statistics: {
    kakao: number;
    apple: number;
  };
}

// 구독 통계 인터페이스
export interface SubscriptionStatistics {
  total_subscriptions: number;
  active_subscriptions: number;
  expired_subscriptions: number;
  cancelled_subscriptions: number;
  subscription_type_statistics: {
    monthly: number;
    yearly: number;
    lifetime: number;
  };
  payment_method_statistics: {
    card: number;
    kakao_pay: number;
    naver_pay: number;
    apple_pay: number;
  };
}

// 사용자 관리 API
export async function getUsers(params?: {
  page?: number;
  is_active?: boolean;
  social_type?: 'kakao' | 'apple';
  is_onboarding_completed?: boolean;
  prepare_major?: number;
  search?: string;
  ordering?: string;
}): Promise<UsersResponse | User[]> {
  console.log('🚀 getUsers 호출됨, params:', params);
  
  const searchParams = new URLSearchParams();
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });
  }
  
  const queryString = searchParams.toString();
  const endpoint = queryString ? `/admin/users/users/?${queryString}` : '/admin/users/users/';
  
  console.log('🌐 API 엔드포인트:', endpoint);
  
  try {
    const result = await apiClient.get<UsersResponse | User[]>(endpoint);
    console.log('📡 API 응답 성공:', result);
    return result;
  } catch (error) {
    console.error('📡 API 요청 실패:', error);
    throw error;
  }
}

export async function getUserById(userId: string): Promise<User> {
  return apiClient.get<User>(`/admin/users/users/${userId}/`);
}

export async function createUser(userData: Omit<User, 'user_id' | 'created_at' | 'prepare_major' | 'prepare_major_name' | 'subscription_status'> & { prepare_major?: number }): Promise<User> {
  return apiClient.post<User>('/admin/users/users/', userData);
}

export async function updateUser(userId: string, userData: Partial<User> & { prepare_major?: number }): Promise<User> {
  return apiClient.put<User>(`/admin/users/users/${userId}/`, userData);
}

export async function patchUser(userId: string, userData: any): Promise<User> {
  return apiClient.patch<User>(`/admin/users/users/${userId}/`, userData);
}

export async function deleteUser(userId: string): Promise<void> {
  await apiClient.delete<void>(`/admin/users/users/${userId}/`);
}

export async function activateUser(userId: string): Promise<User> {
  return apiClient.post<User>(`/admin/users/users/${userId}/activate/`);
}

export async function deactivateUser(userId: string): Promise<User> {
  return apiClient.post<User>(`/admin/users/users/${userId}/deactivate/`);
}

export async function getUserStatistics(): Promise<UserStatistics> {
  return apiClient.get<UserStatistics>('/admin/users/users/statistics/');
}

// 구독 관리 API
export async function getSubscriptions(params?: {
  page?: number;
  status?: 'active' | 'expired' | 'cancelled';
  subscription_type?: 'monthly' | 'yearly' | 'lifetime';
  payment_method?: 'card' | 'kakao_pay' | 'naver_pay' | 'apple_pay';
  user?: string;
}): Promise<SubscriptionsResponse> {
  const searchParams = new URLSearchParams();
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });
  }
  
  const queryString = searchParams.toString();
  const endpoint = queryString ? `/admin/users/subscriptions/?${queryString}` : '/admin/users/subscriptions/';
  
  return apiClient.get<SubscriptionsResponse>(endpoint);
}

export async function getSubscriptionById(subscriptionId: number): Promise<UserSubscription> {
  return apiClient.get<UserSubscription>(`/admin/users/subscriptions/${subscriptionId}/`);
}

export async function createSubscription(subscriptionData: Omit<UserSubscription, 'user_subscription_id' | 'user' | 'user_name' | 'user_email' | 'created_at' | 'updated_at'> & { user: string }): Promise<UserSubscription> {
  return apiClient.post<UserSubscription>('/admin/users/subscriptions/', subscriptionData);
}

export async function updateSubscription(subscriptionId: number, subscriptionData: Partial<UserSubscription>): Promise<UserSubscription> {
  return apiClient.put<UserSubscription>(`/admin/users/subscriptions/${subscriptionId}/`, subscriptionData);
}

export async function patchSubscription(subscriptionId: number, subscriptionData: Partial<UserSubscription>): Promise<UserSubscription> {
  return apiClient.patch<UserSubscription>(`/admin/users/subscriptions/${subscriptionId}/`, subscriptionData);
}

export async function deleteSubscription(subscriptionId: number): Promise<void> {
  await apiClient.delete<void>(`/admin/users/subscriptions/${subscriptionId}/`);
}

export async function activateSubscription(subscriptionId: number): Promise<UserSubscription> {
  return apiClient.post<UserSubscription>(`/admin/users/subscriptions/${subscriptionId}/activate/`);
}

export async function cancelSubscription(subscriptionId: number): Promise<UserSubscription> {
  return apiClient.post<UserSubscription>(`/admin/users/subscriptions/${subscriptionId}/cancel/`);
}

export async function expireSubscription(subscriptionId: number): Promise<UserSubscription> {
  return apiClient.post<UserSubscription>(`/admin/users/subscriptions/${subscriptionId}/expire/`);
}

export async function getSubscriptionStatistics(): Promise<SubscriptionStatistics> {
  return apiClient.get<SubscriptionStatistics>('/admin/users/subscriptions/statistics/');
}

// 사용자 카테고리 API
export async function getUserCategories(params?: {
  prepare_major?: number;
  subject?: number;
}): Promise<{ count: number; results: UserCategory[] }> {
  const searchParams = new URLSearchParams();
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });
  }
  
  const queryString = searchParams.toString();
  const endpoint = queryString ? `/admin/users/categories/?${queryString}` : '/admin/users/categories/';
  
  return apiClient.get<{ count: number; results: UserCategory[] }>(endpoint);
}

export async function createUserCategory(categoryData: { prepare_major: number; subject: number }): Promise<UserCategory> {
  return apiClient.post<UserCategory>('/admin/users/categories/', categoryData);
}

export async function deleteUserCategory(categoryId: number): Promise<void> {
  await apiClient.delete<void>(`/admin/users/categories/${categoryId}/`);
}

// 준비 전공 조회 (올바른 API 경로 사용)
export async function getPrepareMajors(): Promise<PrepareMajor[]> {
  return apiClient.get<PrepareMajor[]>('/admin/curriculum/prepare-majors/');
}