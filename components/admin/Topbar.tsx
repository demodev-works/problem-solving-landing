'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, signOut } from '@/lib/admin/authService';

export default function Topbar() {
  const [user, setUser] = useState<{
    username?: string;
    email?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkUser();

    // 로그인 상태 변경 이벤트 리스너
    const handleAuthChange = () => {
      checkUser();
    };

    window.addEventListener('authStateChanged', handleAuthChange);

    return () => {
      window.removeEventListener('authStateChanged', handleAuthChange);
    };
  }, []);

  const checkUser = async () => {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error('사용자 확인 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = () => {
    router.push('/admin/login');
  };

  const handleLogout = async () => {
    try {
      await signOut();
      setUser(null);
      alert('로그아웃되었습니다.');
      router.push('/admin/login');
    } catch (error) {
      console.error('로그아웃 오류:', error);
      alert('로그아웃 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex justify-between items-center">
        <div className="text-xl font-semibold text-gray-900">
          내일은 의대생 앱 관리자 시스템
        </div>
        <div className="flex items-center space-x-4">
          {loading ? (
            <span className="text-gray-600">확인 중...</span>
          ) : user ? (
            <>
              <span className="text-gray-600">
                {user.username || user.email || '관리자'}
              </span>
              <button
                onClick={handleLogout}
                className="text-gray-600 hover:text-gray-900 px-3 py-1 rounded hover:bg-gray-100"
              >
                로그아웃
              </button>
            </>
          ) : (
            <button
              onClick={handleLogin}
              className="text-blue-600 hover:text-blue-900 px-3 py-1 rounded hover:bg-blue-50"
            >
              로그인
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
