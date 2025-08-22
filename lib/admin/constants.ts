// 이미지 업로드 폴더 상수
export const UPLOAD_FOLDERS = {
  POPUPS: 'popups',
  NOTICES: 'notices',
  PROBLEMS: 'problems',
  MEMORIZATION: 'memorization',
  STUDENTS: 'students',
  GENERAL: 'general',
} as const;

export type UploadFolder = typeof UPLOAD_FOLDERS[keyof typeof UPLOAD_FOLDERS];