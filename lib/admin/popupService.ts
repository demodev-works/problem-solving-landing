import { Popup } from '../../types';
import { apiClient } from './apiClient';

// 팝업 타입에 이미지 URL 필드 추가
export interface PopupWithImageUrl extends Omit<Popup, 'image_url'> {
  image_url?: string; // Django API 응답 필드
}

// 모든 팝업 조회 (이미지 URL 포함)
export async function getPopups(): Promise<PopupWithImageUrl[]> {
  return apiClient.get<PopupWithImageUrl[]>('/admin/notifications/popups/');
}

// 활성 팝업만 조회 (이미지 URL 포함)
export async function getActivePopups(): Promise<PopupWithImageUrl[]> {
  return apiClient.get<PopupWithImageUrl[]>(
    '/admin/notifications/popups/?active=true'
  );
}

// 팝업 생성
export async function createPopup(
  popupData: Omit<Popup, 'pop_up_id' | 'created_at'>
): Promise<Popup> {
  return apiClient.post<Popup>('/admin/notifications/popups/', popupData);
}

// 팝업 수정
export async function updatePopup(
  id: number,
  popupData: Partial<Popup>
): Promise<Popup> {
  return apiClient.put<Popup>(`/admin/notifications/popups/${id}/`, popupData);
}

// 팝업 삭제
export async function deletePopup(id: number): Promise<void> {
  await apiClient.delete<void>(`/admin/notifications/popups/${id}/`);
}

// 팝업 상태 토글
export async function togglePopupState(
  id: number,
  state: boolean
): Promise<Popup> {
  return apiClient.put<Popup>(`/admin/notifications/popups/${id}/`, { state });
}
