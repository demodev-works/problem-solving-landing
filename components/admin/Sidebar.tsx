'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Sidebar() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const menuItems = [
    { href: '/admin/students', label: '수강생 관리' },
    { href: '/admin/subjects', label: '과목 관리' },
    { href: '/admin/problems', label: '문제 관리' },
    { href: '/admin/memorization', label: '암기 관리' },
    { href: '/admin/qna', label: '문제 Q&A' },
    { href: '/admin/inquiries', label: '문의 관리' },
    { href: '/admin/popups', label: '팝업 관리' },
    { href: '/admin/notices', label: '공지사항' },
  ];

  return (
    <div className="w-64 bg-gray-800 min-h-screen p-4">
      <div className="text-white text-xl font-bold mb-8">관리자 패널</div>
      <nav>
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`block px-4 py-2 rounded ${
                  mounted && pathname === item.href
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-700'
                }`}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
