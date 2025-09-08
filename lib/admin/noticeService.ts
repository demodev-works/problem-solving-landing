import { Notice } from '../../types';
import { apiClient } from './apiClient';

// 공지사항 타입에 이미지 URL 필드 추가
export interface NoticeWithImageUrl extends Omit<Notice, 'image_url'> {
  image?: string; // Django API 응답 필드 (실제로는 image로 옴)
}

// 모든 공지사항 조회 (이미지 URL 포함)
export async function getNotices(): Promise<NoticeWithImageUrl[]> {
  return apiClient.get<NoticeWithImageUrl[]>('/admin/notifications/notices/');
}

// 공지사항 생성
export async function createNotice(
  noticeData: Omit<Notice, 'notice_id' | 'created_at'>
): Promise<Notice> {
  return apiClient.post<Notice>('/admin/notifications/notices/', noticeData);
}

// 공지사항 수정
export async function updateNotice(
  id: number,
  noticeData: Partial<Notice>
): Promise<Notice> {
  return apiClient.put<Notice>(
    `/admin/notifications/notices/${id}/`,
    noticeData
  );
}

// 이미지를 포함한 공지사항 생성 (multipart/form-data)
export async function createNoticeWithImage(
  data: { title: string; content: string },
  imageFile?: File
): Promise<NoticeWithImageUrl> {
  const formData = new FormData();
  formData.append('title', data.title);
  formData.append('content', data.content);
  
  if (imageFile) {
    formData.append('image', imageFile);
  }
  
  const token = localStorage.getItem('admin_token');
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/notifications/notices/`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      // Content-Type 헤더는 설정하지 않음 - FormData가 자동으로 multipart/form-data 설정
    },
    body: formData,
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`공지사항 생성 API 에러:`, response.status, errorText);
    throw new Error(`공지사항 생성 실패: ${response.status}`);
  }
  
  return response.json();
}

// 이미지를 포함한 공지사항 수정 (multipart/form-data)
export async function updateNoticeWithImage(
  id: number,
  data: { title: string; content: string },
  imageFile?: File
): Promise<NoticeWithImageUrl> {
  const formData = new FormData();
  formData.append('title', data.title);
  formData.append('content', data.content);
  
  if (imageFile) {
    formData.append('image', imageFile);
  }
  
  const token = localStorage.getItem('admin_token');
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/notifications/notices/${id}/`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      // Content-Type 헤더는 설정하지 않음 - FormData가 자동으로 multipart/form-data 설정
    },
    body: formData,
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`공지사항 수정 API 에러:`, response.status, errorText);
    throw new Error(`공지사항 수정 실패: ${response.status}`);
  }
  
  return response.json();
}

// 공지사항 삭제
export async function deleteNotice(id: number): Promise<void> {
  await apiClient.delete<void>(`/admin/notifications/notices/${id}/`);
}
