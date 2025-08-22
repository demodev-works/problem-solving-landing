export async function uploadImage(file: File, folder: string = 'general'): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  // 백엔드에서 folder 파라미터를 사용하지 않으므로 제거
  // formData.append('folder', folder);

  const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  
  const response = await fetch(`${apiBaseUrl}/admin/upload/`, {
    method: 'POST',
    headers: {
      ...(token && { 'Authorization': `Bearer ${token}` })
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || error.error || '이미지 업로드에 실패했습니다.');
  }

  const data = await response.json();
  // 백엔드 API 응답에서 경로만 반환하도록 수정: { success, filename, file_path, size }
  return data.file_path || data.url || data.filename;
}

export async function deleteImage(filename: string): Promise<void> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  
  const response = await fetch(`${apiBaseUrl}/admin/upload/delete-image/`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    },
    body: JSON.stringify({ filename }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || error.error || '이미지 삭제에 실패했습니다.');
  }
} 