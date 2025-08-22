import { apiClient } from './apiClient';

export interface Subject {
  subject_id: number;
  name: string;
}

export interface PrepareMajor {
  prepare_major_id: number;
  name: string;
}

export interface UserCategory {
  prepare_major_id: number;
  subject_id: number;
  prepare_major?: PrepareMajor;
  subject?: Subject;
}

export interface ProblemProgress {
  progress_id: number;
  name: string;
  day: string;
  difficulty: 'easy' | 'basic' | 'advanced';
  subject_id: number;
}

export interface SubjectWithDetails {
  subject_id: number;
  name: string;
  progress_count: number;
  progresses: Array<{
    progress_id: number;
    name: string;
    day: number;
    difficulty: string;
  }>;
  prepare_majors: Array<{
    prepare_major_id: number;
    name: string;
  }>;
}

// 모든 과목 조회 (관련 정보와 함께)
export async function getSubjectsWithDetails(): Promise<SubjectWithDetails[]> {
  return apiClient.get<SubjectWithDetails[]>('/admin/curriculum/subjects/');
}

// 모든 과목 조회
export async function getSubjects(): Promise<Subject[]> {
  return apiClient.get<Subject[]>('/admin/curriculum/subjects/');
}

// 모든 준비 전공 조회
export async function getPrepareMajors(): Promise<PrepareMajor[]> {
  return apiClient.get<PrepareMajor[]>('/admin/curriculum/prepare-majors/');
}

// 특정 과목 조회
export async function getSubjectById(subjectId: number): Promise<Subject | null> {
  try {
    return await apiClient.get<Subject>(`/admin/curriculum/subjects/${subjectId}/`);
  } catch (error) {
    console.error('Error fetching subject by id:', error);
    return null;
  }
}

// 특정 과목의 전공 정보 조회
export async function getSubjectMajors(subjectId: number): Promise<PrepareMajor[]> {
  return apiClient.get<PrepareMajor[]>(`/admin/curriculum/subjects/${subjectId}/majors/`);
}

// 특정 과목의 진도 정보 조회
export async function getSubjectProgresses(subjectId: number): Promise<ProblemProgress[]> {
  return apiClient.get<ProblemProgress[]>(`/admin/curriculum/subjects/${subjectId}/progresses/`);
}

// 새 과목 생성
export async function createSubject(name: string): Promise<Subject> {
  return apiClient.post<Subject>('/admin/curriculum/subjects/', { name });
}

// 과목 수정
export async function updateSubject(subjectId: number, name: string): Promise<Subject> {
  return apiClient.put<Subject>(`/admin/curriculum/subjects/${subjectId}/`, { name });
}

// 과목 삭제
export async function deleteSubject(subjectId: number): Promise<void> {
  await apiClient.delete<void>(`/admin/curriculum/subjects/${subjectId}/`);
}

// 과목-전공 연결 생성
export async function createUserCategory(subjectId: number, prepareMajorId: number): Promise<void> {
  await apiClient.post<void>(`/admin/curriculum/subjects/${subjectId}/majors/`, { prepare_major_id: prepareMajorId });
}

// 과목-전공 연결 삭제
export async function deleteUserCategory(subjectId: number, prepareMajorId: number): Promise<void> {
  await apiClient.delete<void>(`/admin/curriculum/subjects/${subjectId}/majors/${prepareMajorId}/`);
}

// 과목의 모든 전공 연결 삭제 후 새로 생성
export async function updateSubjectMajors(subjectId: number, majorIds: number[]): Promise<void> {
  await apiClient.put<void>(`/admin/curriculum/subjects/${subjectId}/majors/`, { major_ids: majorIds });
}