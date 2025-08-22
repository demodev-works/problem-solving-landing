import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/lib/admin/authService';

export function useAuth() {
  const [user, setUser] = useState<{
    username?: string;
    email?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  const checkAuth = useCallback(async () => {
    try {
      const currentUser = await getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
        // 로그인이 필요한 서비스라는 알림과 함께 로그인 페이지로 이동
        //  alert('로그인이 필요한 서비스입니다.');
        router.push('/admin/login');
      }
    } catch (error) {
      console.error('인증 확인 오류:', error);
      setIsAuthenticated(false);
      //alert('로그인이 필요한 서비스입니다.');
      router.push('/admin/login');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    router.push('/admin/login');
  };

  return {
    user,
    loading,
    isAuthenticated,
    logout,
    checkAuth,
  };
}

// 인증이 필요한 페이지에서 사용할 HOC
export function useRequireAuth() {
  const { user, loading, isAuthenticated } = useAuth();

  // 로딩 중이거나 인증되지 않은 경우 로딩 화면 표시
  if (loading) {
    return {
      user: null,
      loading: true,
      isAuthenticated: false,
      shouldRender: false,
    };
  }

  if (!isAuthenticated) {
    return {
      user: null,
      loading: false,
      isAuthenticated: false,
      shouldRender: false,
    };
  }

  return {
    user,
    loading: false,
    isAuthenticated: true,
    shouldRender: true,
  };
}
