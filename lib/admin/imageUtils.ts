// 이미지 URL 생성 유틸리티

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const BASE_URL = API_BASE_URL?.replace('/api', '') || '';

/**
 * 이미지 경로를 전체 URL로 변환
 * @param imagePath - DB에 저장된 경로 (예: /media/uploads/images/filename.jpg)
 * @returns 전체 URL (예: http://localhost:8001/media/uploads/images/filename.jpg)
 */
export function getImageUrl(imagePath: string | null | undefined): string | null {
  if (!imagePath) return null;
  
  // 이미 전체 URL인 경우 그대로 반환
  if (imagePath.startsWith('http')) {
    return imagePath;
  }
  
  // 파일명만 있는 경우 (예: 4dc1dadb-be5e-4d3e-80d1-f81706fc8016.png)
  if (!imagePath.startsWith('/')) {
    return `${BASE_URL}/media/uploads/${imagePath}`;
  }
  
  // 경로만 있는 경우 BASE_URL과 결합
  return `${BASE_URL}${imagePath}`;
}

/**
 * 업로드된 이미지의 경로에서 순수 경로만 추출
 * @param fullUrl - 전체 URL 또는 경로
 * @returns 순수 경로 (예: /media/uploads/images/filename.jpg)
 */
export function extractImagePath(fullUrl: string): string {
  if (!fullUrl) return '';
  
  // 이미 경로만 있는 경우
  if (fullUrl.startsWith('/media/')) {
    return fullUrl;
  }
  
  // 전체 URL에서 경로 부분만 추출
  try {
    const url = new URL(fullUrl);
    return url.pathname;
  } catch {
    // URL 파싱 실패 시 원본 반환
    return fullUrl;
  }
}