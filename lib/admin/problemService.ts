import { apiClient } from './apiClient';

export interface ProblemProgress {
  progress_id: number;
  name: string;
  day: number; // 정수형 (Day 1, 2, 3...)
  difficulty: 'basic' | 'advanced';
  subject: number;
  subject_details?: {
    subject_id: number;
    name: string;
  };
}

export interface ProblemSelect {
  problem_select_id: number;
  question_number: number;
  content: string;
  problem_management?: number;
}

export interface ProblemManagement {
  problem_management_id: number;
  progress: number;
  content: string;
  answer: number;
  explanation?: string;
  source?: string;
  exam_year?: string;
  difficulty: 'basic' | 'advanced';
  image?: string;
  sequence?: number;
  selects: ProblemSelect[];
  progress_details?: ProblemProgress;
}

export interface UserProblemData {
  user_problem_data_id: number;
  user: number;
  problem_management: number;
  is_collect: boolean;
  selected_answer: string;
  solved_at: string;
  type: 'practice' | 'exam' | 'review';
}

export interface ProblemBookmark {
  bookmarked_id: number;
  user: number;
  problem_management: number;
  created_at: string;
}

export interface ProblemNotebook {
  notebook_id: number;
  user: number;
  problem_management: number;
  solved_count: number;
  incorrect_count: number;
  is_correct: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProblemQuestion {
  question_id: number;
  user: number;
  problem_management: number;
  content: string;
  content_answer?: string;
  state: 'pending' | 'answered' | 'closed';
  created_at: string;
  updated_at: string;
}

// 업로드용 인터페이스
export interface ProgressUploadData {
  day: string | number;
  difficulty: string;
  subject: string;
  progress: string;
}

export interface ProblemUploadData {
  subject: string;
  progress: string;
  problem: string;
  choices?: string;
  choice1?: string;
  choice2?: string;
  choice3?: string;
  choice4?: string;
  choice5?: string;
  answer: string | number;
  explanation?: string;
  source?: string;
  exam_year?: string;
  difficulty?: string;
}

// 진도 관리 API
export async function getProgresses(): Promise<ProblemProgress[]> {
  return apiClient.get<ProblemProgress[]>('/admin/problems/progresses/');
}

export async function getProgressById(progressId: number): Promise<ProblemProgress> {
  return apiClient.get<ProblemProgress>(`/admin/problems/progresses/${progressId}/`);
}

export async function createProgress(progress: Omit<ProblemProgress, 'progress_id'>): Promise<ProblemProgress> {
  return apiClient.post<ProblemProgress>('/admin/problems/progresses/', progress);
}

export async function updateProgress(progressId: number, progress: Partial<ProblemProgress>): Promise<ProblemProgress> {
  return apiClient.put<ProblemProgress>(`/admin/problems/progresses/${progressId}/`, progress);
}

export async function deleteProgress(progressId: number): Promise<void> {
  await apiClient.delete<void>(`/admin/problems/progresses/${progressId}/`);
}

// 문제 관리 API
export async function getProblems(): Promise<ProblemManagement[]> {
  return apiClient.get<ProblemManagement[]>('/admin/problems/managements/');
}

export async function getProblemById(problemId: number): Promise<ProblemManagement> {
  return apiClient.get<ProblemManagement>(`/admin/problems/managements/${problemId}/`);
}

export async function createProblem(problem: Omit<ProblemManagement, 'problem_management_id' | 'selects' | 'progress_details'>): Promise<ProblemManagement> {
  return apiClient.post<ProblemManagement>('/admin/problems/managements/', problem);
}

export async function bulkCreateProblems(problems: Omit<ProblemManagement, 'problem_management_id' | 'selects' | 'progress_details'>[]): Promise<ProblemManagement[]> {
  return apiClient.post<ProblemManagement[]>('/admin/problems/problem-management/bulk_create/', problems);
}

export async function updateProblem(problemId: number, problem: Partial<ProblemManagement>): Promise<ProblemManagement> {
  return apiClient.patch<ProblemManagement>(`/admin/problems/managements/${problemId}/`, problem);
}

// 이미지를 포함한 문제 수정 (multipart/form-data)
export async function updateProblemWithImage(problemId: number, data: any, imageFile?: File): Promise<ProblemManagement> {
  const formData = new FormData();
  
  // 필드별로 FormData에 추가
  Object.keys(data).forEach(key => {
    if (data[key] !== undefined && data[key] !== null) {
      formData.append(key, data[key].toString());
    }
  });
  
  // 이미지 파일이 있는 경우 추가
  if (imageFile) {
    formData.append('image', imageFile);
  }
  
  const token = localStorage.getItem('admin_token');
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/problems/managements/${problemId}/`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`문제 수정 API 에러:`, response.status, errorText);
    
    if (response.status === 401) {
      localStorage.removeItem('admin_token');
      window.location.href = '/admin/login';
      throw new Error('인증이 만료되었습니다. 다시 로그인해주세요.');
    }
    
    throw new Error(`문제 수정 실패: ${response.status} - ${errorText}`);
  }
  
  const result = await response.json();
  console.log('문제 수정 성공 응답:', result);
  return result;
}

// 이미지를 포함한 문제 생성 (multipart/form-data)
export async function createProblemWithImage(data: any, imageFile?: File): Promise<ProblemManagement> {
  const formData = new FormData();
  
  // 필드별로 FormData에 추가
  Object.keys(data).forEach(key => {
    if (data[key] !== undefined && data[key] !== null) {
      formData.append(key, data[key].toString());
    }
  });
  
  // 이미지 파일이 있는 경우 추가
  if (imageFile) {
    formData.append('image', imageFile);
  }
  
  const token = localStorage.getItem('admin_token');
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/problems/managements/`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`문제 생성 API 에러:`, response.status, errorText);
    
    if (response.status === 401) {
      localStorage.removeItem('admin_token');
      window.location.href = '/admin/login';
      throw new Error('인증이 만료되었습니다. 다시 로그인해주세요.');
    }
    
    throw new Error(`문제 생성 실패: ${response.status} - ${errorText}`);
  }
  
  const result = await response.json();
  console.log('문제 생성 성공 응답:', result);
  return result;
}

export async function deleteProblem(problemId: number): Promise<void> {
  await apiClient.delete<void>(`/admin/problems/managements/${problemId}/`);
}

// 특정 진도의 문제들 조회
export async function getProblemsByProgress(progressId: number): Promise<ProblemManagement[]> {
  return apiClient.get<ProblemManagement[]>(`/admin/problems/managements/?progress=${progressId}`);
}

export async function getNextSequenceNumber(progressId: number): Promise<number> {
  const problems = await getProblemsByProgress(progressId);
  const maxSequence = Math.max(...problems.map(p => p.sequence || 0), 0);
  return maxSequence + 1;
}

export async function updateProgressTotalProblems(progressId: number): Promise<void> {
  const problems = await getProblemsByProgress(progressId);
  const totalProblems = problems.length;
  
  await apiClient.patch(`/admin/problems/progresses/${progressId}/`, {
    total_problems: totalProblems
  });
}

// 선택지 관리 API
export async function getProblemSelects(): Promise<ProblemSelect[]> {
  return apiClient.get<ProblemSelect[]>('/admin/problems/selects/');
}

export async function createProblemSelect(select: Omit<ProblemSelect, 'problem_select_id'>): Promise<ProblemSelect> {
  return apiClient.post<ProblemSelect>('/admin/problems/selects/', select);
}

export async function bulkCreateProblemSelects(selects: Omit<ProblemSelect, 'problem_select_id'>[]): Promise<ProblemSelect[]> {
  return apiClient.post<ProblemSelect[]>('/admin/problems/problem-select/bulk_create/', selects);
}

export async function updateProblemSelect(selectId: number, select: Partial<ProblemSelect>): Promise<ProblemSelect> {
  return apiClient.put<ProblemSelect>(`/admin/problems/selects/${selectId}/`, select);
}

export async function deleteProblemSelect(selectId: number): Promise<void> {
  await apiClient.delete<void>(`/admin/problems/selects/${selectId}/`);
}

// 사용자 풀이 데이터 관리 API
export async function getUserProblemData(): Promise<UserProblemData[]> {
  return apiClient.get<UserProblemData[]>('/admin/problems/user-data/');
}

export async function createUserProblemData(data: Omit<UserProblemData, 'user_problem_data_id' | 'user' | 'solved_at'>): Promise<UserProblemData> {
  return apiClient.post<UserProblemData>('/admin/problems/user-data/', data);
}

// 북마크 관리 API
export async function getBookmarks(): Promise<ProblemBookmark[]> {
  return apiClient.get<ProblemBookmark[]>('/admin/problems/bookmarks/');
}

export async function createBookmark(problemId: number): Promise<ProblemBookmark> {
  return apiClient.post<ProblemBookmark>('/admin/problems/bookmarks/', { problem_management: problemId });
}

export async function deleteBookmark(bookmarkId: number): Promise<void> {
  await apiClient.delete<void>(`/admin/problems/bookmarks/${bookmarkId}/`);
}

// 오답노트 관리 API
export async function getNotebooks(): Promise<ProblemNotebook[]> {
  return apiClient.get<ProblemNotebook[]>('/admin/problems/notebooks/');
}

export async function createNotebook(notebook: Omit<ProblemNotebook, 'notebook_id' | 'user' | 'created_at' | 'updated_at'>): Promise<ProblemNotebook> {
  return apiClient.post<ProblemNotebook>('/admin/problems/notebooks/', notebook);
}

// 질문 관리 API
export async function getQuestions(): Promise<ProblemQuestion[]> {
  return apiClient.get<ProblemQuestion[]>('/admin/problems/questions/');
}

export async function createQuestion(question: Omit<ProblemQuestion, 'question_id' | 'user' | 'created_at' | 'updated_at'>): Promise<ProblemQuestion> {
  return apiClient.post<ProblemQuestion>('/admin/problems/questions/', question);
}

export async function updateQuestion(questionId: number, question: Partial<ProblemQuestion>): Promise<ProblemQuestion> {
  return apiClient.put<ProblemQuestion>(`/admin/problems/questions/${questionId}/`, question);
}

// 엑셀/CSV 업로드 함수들 (실제 Django 엔드포인트에 맞춰 추후 수정 필요)
export async function uploadProgressData(progressList: ProgressUploadData[]): Promise<any> {
  // 진도 일괄 업로드 - Django에서 지원하는 엔드포인트가 있다면 수정
  const results = [];
  for (const progressData of progressList) {
    try {
      const result = await createProgress(progressData as any);
      results.push(result);
    } catch (error) {
      console.error('Progress upload error:', error);
      throw error;
    }
  }
  return { success: true, data: results };
}

export async function uploadProblemData(problems: ProblemUploadData[]): Promise<any> {
  // 문제 일괄 업로드 - Django에서 지원하는 엔드포인트가 있다면 수정
  const results = [];
  for (const problemData of problems) {
    try {
      // 실제 구현시 데이터 변환 로직 필요
      const result = await createProblem(problemData as any);
      results.push(result);
    } catch (error) {
      console.error('Problem upload error:', error);
      throw error;
    }
  }
  return { success: true, data: results };
}
