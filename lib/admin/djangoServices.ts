// Django API 서비스들을 통합한 서비스 파일
import { apiClient } from './apiClient';
import { extractImagePath } from './imageUtils';

// 공지사항 서비스
export const noticeService = {
  getAll: () => apiClient.get('/admin/notices/'),
  getById: (id: number) => apiClient.get(`/admin/notices/${id}/`),
  create: (data: any) => apiClient.post('/admin/notices/', data),
  update: (id: number, data: any) => apiClient.put(`/admin/notices/${id}/`, data),
  delete: (id: number) => apiClient.delete(`/admin/notices/${id}/`)
};

// 팝업 서비스
export const popupService = {
  getAll: () => apiClient.get('/admin/notifications/popups/'),
  getById: (id: number) => apiClient.get(`/admin/notifications/popups/${id}/`),
  create: (data: any) => apiClient.post('/admin/notifications/popups/', data),
  update: (id: number, data: any) => apiClient.put(`/admin/notifications/popups/${id}/`, data),
  delete: (id: number) => apiClient.delete(`/admin/notifications/popups/${id}/`)
};

// 사용자 서비스
export const userService = {
  getAll: () => apiClient.get('/admin/users/'),
  getById: (id: string) => apiClient.get(`/admin/users/${id}/`),
  update: (id: string, data: any) => apiClient.put(`/admin/users/${id}/`, data),
  delete: (id: string) => apiClient.delete(`/admin/users/${id}/`)
};

// 문제 서비스
export const problemService = {
  getAll: () => apiClient.get('/admin/problems/'),
  getById: (id: number) => apiClient.get(`/admin/problems/${id}/`),
  create: (data: any) => apiClient.post('/admin/problems/', data),
  update: (id: number, data: any) => apiClient.put(`/admin/problems/${id}/`, data),
  delete: (id: number) => apiClient.delete(`/admin/problems/${id}/`),
  uploadExcel: async (formData: FormData) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/problems/upload/`, {
      method: 'POST',
      headers: {
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      body: formData
    });
    
    if (!response.ok) {
      throw new Error('파일 업로드 실패');
    }
    
    return response.json();
  }
};

// 진도 서비스
export const progressService = {
  getAll: () => apiClient.get('/admin/progress/'),
  getById: (id: number) => apiClient.get(`/admin/progress/${id}/`),
  create: (data: any) => apiClient.post('/admin/progress/', data),
  update: (id: number, data: any) => apiClient.put(`/admin/progress/${id}/`, data),
  delete: (id: number) => apiClient.delete(`/admin/progress/${id}/`)
};

// 과목 서비스
export const subjectService = {
  getAll: () => apiClient.get('/admin/curriculum/subjects/'),
  getById: (id: number) => apiClient.get(`/admin/curriculum/subjects/${id}/`),
  create: (data: any) => apiClient.post('/admin/curriculum/subjects/', data),
  update: (id: number, data: any) => apiClient.put(`/admin/curriculum/subjects/${id}/`, data),
  delete: (id: number) => apiClient.delete(`/admin/curriculum/subjects/${id}/`)
};

// 전공 서비스
export const majorService = {
  getAll: () => apiClient.get('/admin/curriculum/prepare-majors/'),
  create: (data: any) => apiClient.post('/admin/curriculum/prepare-majors/', data),
  update: (id: number, data: any) => apiClient.put(`/admin/curriculum/prepare-majors/${id}/`, data),
  delete: (id: number) => apiClient.delete(`/admin/curriculum/prepare-majors/${id}/`)
};

// 문의 서비스
export const inquiryService = {
  getAll: () => apiClient.get('/admin/supports/inquiries/'),
  getById: (id: number) => apiClient.get(`/admin/supports/inquiries/${id}/`),
  update: (id: number, data: any) => apiClient.put(`/admin/supports/inquiries/${id}/`, data),
  delete: (id: number) => apiClient.delete(`/admin/supports/inquiries/${id}/`)
};

// QnA 서비스
export const qnaService = {
  getAll: () => apiClient.get('/admin/questions/'),
  getById: (id: number) => apiClient.get(`/admin/questions/${id}/`),
  answer: (id: number, data: any) => apiClient.put(`/admin/questions/${id}/answer/`, data),
  delete: (id: number) => apiClient.delete(`/admin/questions/${id}/`)
};

// 암기 진도 서비스
export const memoProgressService = {
  getAll: () => apiClient.get('/admin/memo-progress/'),
  getById: (id: number) => apiClient.get(`/admin/memo-progress/${id}/`),
  create: (data: any) => apiClient.post('/admin/memo-progress/', data),
  update: (id: number, data: any) => apiClient.put(`/admin/memo-progress/${id}/`, data),
  delete: (id: number) => apiClient.delete(`/admin/memo-progress/${id}/`)
};

// 암기 문제 서비스
export const memoProblemService = {
  getAll: () => apiClient.get('/admin/memo-problems/'),
  getById: (id: number) => apiClient.get(`/admin/memo-problems/${id}/`),
  create: (data: any) => apiClient.post('/admin/memo-problems/', data),
  update: (id: number, data: any) => apiClient.put(`/admin/memo-problems/${id}/`, data),
  delete: (id: number) => apiClient.delete(`/admin/memo-problems/${id}/`),
  uploadExcel: async (formData: FormData) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/memo-problems/upload/`, {
      method: 'POST',
      headers: {
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      body: formData
    });
    
    if (!response.ok) {
      throw new Error('파일 업로드 실패');
    }
    
    return response.json();
  }
};