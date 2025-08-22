import { apiClient } from './apiClient';

// 메모 진도 인터페이스
export interface MemoProgress {
  memo_progress_id: number;
  name: string | null;
  day: number | null;
  difficulty: 'basic' | 'advanced' | null;
}

// 메모 문제 데이터 인터페이스
export interface MemoProblemData {
  memo_data_id: number;
  memo_progress: number;
  problem: string | null;
  answer: string | null;
  progress_name?: string;
  progress_day?: number;
  progress_details?: MemoProgress;
}

// 메모 섹션 인터페이스
export interface MemoSection {
  memo_section_id: number;
  user: string;
  sequence: number | null;
  correct_count: number | null;
  wrong_count: number | null;
  user_name?: string;
}

// 메모 섹션 세부사항 인터페이스
export interface MemoSectionDetails {
  memo_sections_id: number;
  memo_section: number;
  sequence: number | null;
  correct_count: number | null;
  wrong_count: number | null;
  section_info?: string;
}

// 메모 사용자 데이터 인터페이스
export interface MemoUserData {
  memo_user_data_id: number;
  user: string;
  memo_data: number;
  memo_sections: number;
  is_correct: boolean;
  solved_at: string | null;
  problem_content?: string;
  section_info?: string;
}

// 메모 노트북 인터페이스
export interface MemoNotebook {
  notebook_id: number;
  user: string;
  memo_data: number;
  solved_count: number | null;
  incorrect_count: number | null;
  last_incorrect_at: string;
  is_correct: boolean;
  problem_content?: string;
}

// 메모 북마크 인터페이스
export interface MemoBookmark {
  bookmarked_id: number;
  user: string;
  memo_user_data: number;
  problem_content?: string;
}

// 메모 진도 관리 API
export async function getMemoProgresses(): Promise<MemoProgress[]> {
  return apiClient.get<MemoProgress[]>('/admin/memo/progresses/');
}

export async function getMemoProgressById(progressId: number): Promise<MemoProgress> {
  return apiClient.get<MemoProgress>(`/admin/memo/progresses/${progressId}/`);
}

export async function createMemoProgress(progress: Omit<MemoProgress, 'memo_progress_id'>): Promise<MemoProgress> {
  return apiClient.post<MemoProgress>('/admin/memo/progresses/', progress);
}

export async function updateMemoProgress(progressId: number, progress: Partial<MemoProgress>): Promise<MemoProgress> {
  return apiClient.put<MemoProgress>(`/admin/memo/progresses/${progressId}/`, progress);
}

export async function deleteMemoProgress(progressId: number): Promise<void> {
  await apiClient.delete<void>(`/admin/memo/progresses/${progressId}/`);
}

// 메모 문제 데이터 관리 API
export async function getMemoProblemData(): Promise<MemoProblemData[]> {
  return apiClient.get<MemoProblemData[]>('/admin/memo/problem-data/');
}

export async function getMemoProblemDataById(dataId: number): Promise<MemoProblemData> {
  return apiClient.get<MemoProblemData>(`/admin/memo/problem-data/${dataId}/`);
}

export async function createMemoProblemData(data: Omit<MemoProblemData, 'memo_data_id' | 'progress_name' | 'progress_day' | 'progress_details'>): Promise<MemoProblemData> {
  return apiClient.post<MemoProblemData>('/admin/memo/problem-data/', data);
}

export async function bulkCreateMemoProblemData(dataList: Omit<MemoProblemData, 'memo_data_id' | 'progress_name' | 'progress_day' | 'progress_details'>[]): Promise<MemoProblemData[]> {
  return apiClient.post<MemoProblemData[]>('/admin/memo/problem-data/bulk_create/', dataList);
}

export async function updateMemoProblemData(dataId: number, data: Partial<MemoProblemData>): Promise<MemoProblemData> {
  return apiClient.patch<MemoProblemData>(`/admin/memo/problem-data/${dataId}/`, data);
}

export async function deleteMemoProblemData(dataId: number): Promise<void> {
  await apiClient.delete<void>(`/admin/memo/problem-data/${dataId}/`);
}

// 특정 진도의 메모 문제들 조회
export async function getMemoProblemDataByProgress(progressId: number): Promise<MemoProblemData[]> {
  return apiClient.get<MemoProblemData[]>(`/admin/memo/problem-data/?memo_progress=${progressId}`);
}

// 메모 섹션 관리 API
export async function getMemoSections(): Promise<MemoSection[]> {
  return apiClient.get<MemoSection[]>('/admin/memo/sections/');
}

export async function createMemoSection(section: Omit<MemoSection, 'memo_section_id' | 'user_name'>): Promise<MemoSection> {
  return apiClient.post<MemoSection>('/admin/memo/sections/', section);
}

export async function updateMemoSection(sectionId: number, section: Partial<MemoSection>): Promise<MemoSection> {
  return apiClient.put<MemoSection>(`/admin/memo/sections/${sectionId}/`, section);
}

export async function deleteMemoSection(sectionId: number): Promise<void> {
  await apiClient.delete<void>(`/admin/memo/sections/${sectionId}/`);
}

// 메모 섹션 세부사항 관리 API
export async function getMemoSectionDetails(): Promise<MemoSectionDetails[]> {
  return apiClient.get<MemoSectionDetails[]>('/admin/memo/section-details/');
}

export async function createMemoSectionDetails(details: Omit<MemoSectionDetails, 'memo_sections_id' | 'section_info'>): Promise<MemoSectionDetails> {
  return apiClient.post<MemoSectionDetails>('/admin/memo/section-details/', details);
}

export async function updateMemoSectionDetails(detailsId: number, details: Partial<MemoSectionDetails>): Promise<MemoSectionDetails> {
  return apiClient.put<MemoSectionDetails>(`/admin/memo/section-details/${detailsId}/`, details);
}

export async function deleteMemoSectionDetails(detailsId: number): Promise<void> {
  await apiClient.delete<void>(`/admin/memo/section-details/${detailsId}/`);
}

// 메모 사용자 데이터 관리 API
export async function getMemoUserData(): Promise<MemoUserData[]> {
  return apiClient.get<MemoUserData[]>('/admin/memo/user-data/');
}

export async function createMemoUserData(data: Omit<MemoUserData, 'memo_user_data_id' | 'problem_content' | 'section_info'>): Promise<MemoUserData> {
  return apiClient.post<MemoUserData>('/admin/memo/user-data/', data);
}

export async function updateMemoUserData(dataId: number, data: Partial<MemoUserData>): Promise<MemoUserData> {
  return apiClient.put<MemoUserData>(`/admin/memo/user-data/${dataId}/`, data);
}

export async function deleteMemoUserData(dataId: number): Promise<void> {
  await apiClient.delete<void>(`/admin/memo/user-data/${dataId}/`);
}

// 메모 노트북 관리 API
export async function getMemoNotebooks(): Promise<MemoNotebook[]> {
  return apiClient.get<MemoNotebook[]>('/admin/memo/notebooks/');
}

export async function createMemoNotebook(notebook: Omit<MemoNotebook, 'notebook_id' | 'problem_content'>): Promise<MemoNotebook> {
  return apiClient.post<MemoNotebook>('/admin/memo/notebooks/', notebook);
}

export async function updateMemoNotebook(notebookId: number, notebook: Partial<MemoNotebook>): Promise<MemoNotebook> {
  return apiClient.put<MemoNotebook>(`/admin/memo/notebooks/${notebookId}/`, notebook);
}

export async function deleteMemoNotebook(notebookId: number): Promise<void> {
  await apiClient.delete<void>(`/admin/memo/notebooks/${notebookId}/`);
}

// 메모 북마크 관리 API
export async function getMemoBookmarks(): Promise<MemoBookmark[]> {
  return apiClient.get<MemoBookmark[]>('/admin/memo/bookmarks/');
}

export async function createMemoBookmark(bookmark: Omit<MemoBookmark, 'bookmarked_id' | 'problem_content'>): Promise<MemoBookmark> {
  return apiClient.post<MemoBookmark>('/admin/memo/bookmarks/', bookmark);
}

export async function deleteMemoBookmark(bookmarkId: number): Promise<void> {
  await apiClient.delete<void>(`/admin/memo/bookmarks/${bookmarkId}/`);
}

// 업로드용 인터페이스
export interface MemoProgressUploadData {
  day: string | number;
  difficulty: string;
  name: string;
}

export interface MemoProblemUploadData {
  progress: string;
  problem: string;
  answer: string;
}

// 엑셀/CSV 업로드 함수들
export async function uploadMemoProgressData(progressList: MemoProgressUploadData[]): Promise<any> {
  const results = [];
  for (const progressData of progressList) {
    try {
      const result = await createMemoProgress(progressData as any);
      results.push(result);
    } catch (error) {
      console.error('Memo progress upload error:', error);
      throw error;
    }
  }
  return { success: true, data: results };
}

export async function uploadMemoProblemData(problems: MemoProblemUploadData[]): Promise<any> {
  const results = [];
  for (const problemData of problems) {
    try {
      const result = await createMemoProblemData(problemData as any);
      results.push(result);
    } catch (error) {
      console.error('Memo problem upload error:', error);
      throw error;
    }
  }
  return { success: true, data: results };
}