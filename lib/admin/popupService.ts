import { Popup } from '../../types';
import { apiClient } from './apiClient';

// 팝업 타입에 이미지 URL 필드 추가
export interface PopupWithImage extends Popup {
  image?: string; // Django API 응답 필드
}

// 모든 팝업 조회 (이미지 URL 포함)
export async function getPopups(): Promise<PopupWithImage[]> {
  return apiClient.get<PopupWithImage[]>('/admin/notifications/popups/');
}

// 활성 팝업만 조회 (이미지 URL 포함)
export async function getActivePopups(): Promise<PopupWithImage[]> {
  return apiClient.get<PopupWithImage[]>(
    '/admin/notifications/popups/?active=true'
  );
}

// 팝업 생성
export async function createPopup(
  popupData: Omit<Popup, 'pop_up_id' | 'created_at'>
): Promise<Popup> {
  return apiClient.post<Popup>('/admin/notifications/popups/', popupData);
}

// 이미지를 포함한 팝업 생성 (multipart/form-data)
export async function createPopupWithImage(
  data: { title: string; content: string; state: boolean },
  imageFile?: File
): Promise<PopupWithImage> {
  const formData = new FormData();
  formData.append('title', data.title);
  formData.append('content', data.content);
  formData.append('state', data.state.toString());
  
  if (imageFile) {
    formData.append('image', imageFile);
  }
  
  const token = localStorage.getItem('admin_token');
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/notifications/popups/`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return response.json();
}

// 팝업 수정
export async function updatePopup(
  id: number,
  popupData: Partial<Popup>
): Promise<Popup> {
  return apiClient.put<Popup>(`/admin/notifications/popups/${id}/`, popupData);
}

// 이미지를 포함한 팝업 수정 (multipart/form-data)
export async function updatePopupWithImage(
  id: number,
  data: { title: string; content: string; state: boolean; image?: any },
  imageFile?: File
): Promise<PopupWithImage> {
  const formData = new FormData();
  formData.append('title', data.title);
  formData.append('content', data.content);
  formData.append('state', data.state.toString());
  
  if (imageFile) {
    formData.append('image', imageFile);
  } else if (data.image === null) {
    // 이미지 삭제 시 null 전송
    formData.append('image', '');
  }
  
  const token = localStorage.getItem('admin_token');
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/notifications/popups/${id}/`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return response.json();
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
