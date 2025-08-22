// 수강생 타입
export interface Student {
  id: string;
  name: string;
  phone: string;
  email: string;
  prepMajor: string; // 준비학과
  paymentDate: string; // 결제일
  paidSubjects: string[]; // 결제과목
  createdAt?: string;
  updatedAt?: string;
}

// 진도 관리 타입
export interface Progress {
  id: string;
  studentId: string;
  subject: string;
  currentProgress: number; // 현재 진도율 (0-100)
  achievement: number; // 성취율 (0-100)
}

// 상세 진도 정보 타입
export interface DetailedProgress {
  subject_name: string;
  progresses: Array<{
    progress_id: number;
    progress_name: string;
    day: string;
    difficulty: string;
    total_problems: number;
    completed_problems: number;
    completion_rate: number; // 진도율 (0-100)
  }>;
}

// 문제 타입
export interface Question {
  id: string;
  title: string;
  content: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

// 문의 타입
export interface Inquiry {
  id: string;
  title: string;
  content: string;
  author: string;
  email: string;
  status: 'pending' | 'processing' | 'completed';
  answer?: string;
  createdAt: string;
  updatedAt: string;
}

// 질문 타입
export interface Qna {
  id: string;
  title: string;
  content: string;
  author: string;
  status: 'pending' | 'answered';
  answer?: string;
  createdAt: string;
  updatedAt: string;
}

// 팝업 타입 (Supabase 테이블 구조에 맞게 수정)
export interface Popup {
  pop_up_id: number;
  title: string;
  content: string;
  image_url: string;
  state: boolean;
  created_at: string;
}

// 공지사항 타입 (Supabase 테이블 구조에 맞게 수정)
export interface Notice {
  notice_id: number;
  title: string;
  content: string;
  image_url: string;
  created_at: string;
}

// 오류신고 타입
export interface ErrorReport {
  id: string;
  title: string;
  description: string;
  reporter: string;
  email: string;
  status: 'pending' | 'investigating' | 'resolved';
  priority: 'low' | 'medium' | 'high' | 'critical';
  createdAt: string;
  updatedAt: string;
} 