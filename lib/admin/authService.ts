import { apiClient } from './apiClient';

// 관리자 로그인
export async function loginAdmin(email: string, password: string) {
  try {
    const response = await apiClient.post<{
      access?: string;
      access_token?: string;
      token?: string;
    }>('/admin/auth/login/', {
      email,
      password,
    });

    console.log('Django API 응답:', response); // 응답 구조 확인을 위한 로그

    // 다양한 토큰 형식에 대응
    const token = response.access || response.access_token || response.token;

    if (token) {
      // 로컬 스토리지에 토큰 저장
      if (typeof window !== 'undefined') {
        localStorage.setItem('admin_token', token);

        // 로그인 상태 변경 이벤트 발생
        window.dispatchEvent(new CustomEvent('authStateChanged'));
      }
    }

    return response;
  } catch (error) {
    console.error('로그인 오류:', error);
    throw error;
  }
}

// 관리자 계정 생성
export async function createAdminUser(email: string, password: string) {
  try {
    const response = await apiClient.post<{
      id: number;
      email: string;
      created_at: string;
    }>('/admin/auth/register/', {
      email,
      password,
    });

    return response;
  } catch (error) {
    console.error('관리자 계정 생성 실패:', error);
    throw error;
  }
}

// 현재 로그인된 관리자 확인
export async function getCurrentUser() {
  try {
    if (typeof window === 'undefined') return null;

    const token = localStorage.getItem('admin_token');
    if (!token) return null;

    const response = await apiClient.get<{
      id: number;
      email: string;
    }>('/admin/auth/verify/');

    return response;
  } catch (error) {
    console.error('사용자 확인 오류:', error);
    // 토큰이 유효하지 않은 경우 제거
    if (typeof window !== 'undefined') {
      localStorage.removeItem('admin_token');
    }
    return null;
  }
}

// 로그아웃
export async function signOut() {
  try {
    const token = localStorage.getItem('admin_token');
    if (token) {
      try {
        // 서버에서 토큰 무효화
        await apiClient.post('/admin/auth/logout/', {});
      } catch (error) {
        // 서버 오류가 있어도 로컬 토큰은 제거
        console.warn('서버 로그아웃 실패:', error);
      }

      localStorage.removeItem('admin_token');

      // 로그아웃 상태 변경 이벤트 발생
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('authStateChanged'));
      }
    }
  } catch (error) {
    console.error('로그아웃 오류:', error);
    throw error;
  }
}
