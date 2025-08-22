'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    
    if (token) {
      // 로그인되어 있으면 수강생 페이지로 리다이렉트
      router.replace('/admin/students');
    } else {
      // 로그인되어 있지 않으면 로그인 페이지로 리다이렉트
      router.replace('/admin/login');
    }
  }, [router]);

  // 리다이렉트 중 로딩 표시
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">로딩 중...</p>
      </div>
    </div>
  );
}
