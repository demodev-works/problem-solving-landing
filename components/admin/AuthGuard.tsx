'use client';

import { useRequireAuth } from '@/hooks/admin/useAuth';

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function AuthGuard({ children, fallback }: AuthGuardProps) {
  const {
    user,
    loading: authLoading,
    isAuthenticated,
    shouldRender,
  } = useRequireAuth();

  // 인증 로딩 중이거나 인증되지 않은 경우
  if (authLoading || !shouldRender) {
    return (
      fallback || (
        <div className="p-6 bg-gray-50 min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">
              {authLoading ? '인증 확인 중...' : '로그인 페이지로 이동 중...'}
            </p>
          </div>
        </div>
      )
    );
  }

  return <>{children}</>;
}
