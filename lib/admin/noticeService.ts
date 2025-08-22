import { Notice } from '../../types';
import { apiClient } from './apiClient';

// 공지사항 타입에 이미지 URL 필드 추가
export interface NoticeWithImageUrl extends Omit<Notice, 'image_url'> {
  image_url?: string; // Django API 응답 필드
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

// 공지사항 삭제
export async function deleteNotice(id: number): Promise<void> {
  await apiClient.delete<void>(`/admin/notifications/notices/${id}/`);
}
