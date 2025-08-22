import { apiClient } from './apiClient';

// QnA 인터페이스
export interface Question {
  question_id: number;
  user: string;
  problem_management: number;
  content: string;
  state: 'pending' | 'answered' | 'closed';
  content_answer: string | null;
  created_at: string;
  problem_content: string;
}

// API 응답 인터페이스
export interface QuestionsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Question[];
}

// 질문 생성 데이터
export interface CreateQuestionData {
  problem_management: number;
  content: string;
}

// 답변 데이터
export interface AnswerData {
  content_answer: string;
}

// 질문 목록 조회
export async function getQuestions(params?: {
  page?: number;
  search?: string;
  state?: string;
  ordering?: string;
}): Promise<QuestionsResponse | Question[]> {
  const searchParams = new URLSearchParams();
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, value.toString());
      }
    });
  }
  
  const queryString = searchParams.toString();
  const endpoint = queryString ? `/app/problems/questions/?${queryString}` : '/app/problems/questions/';
  
  return apiClient.get<QuestionsResponse>(endpoint);
}

// 질문 상세 조회
export async function getQuestionById(questionId: number): Promise<Question> {
  return apiClient.get<Question>(`/app/problems/questions/${questionId}/`);
}

// 질문 작성
export async function createQuestion(questionData: CreateQuestionData): Promise<Question> {
  return apiClient.post<Question>('/app/problems/questions/', questionData);
}

// 질문 수정
export async function updateQuestion(questionId: number, questionData: Partial<CreateQuestionData>): Promise<Question> {
  return apiClient.put<Question>(`/app/problems/questions/${questionId}/`, questionData);
}

// 질문 부분 수정
export async function patchQuestion(questionId: number, questionData: Partial<CreateQuestionData>): Promise<Question> {
  return apiClient.patch<Question>(`/app/problems/questions/${questionId}/`, questionData);
}

// 질문 삭제
export async function deleteQuestion(questionId: number): Promise<void> {
  await apiClient.delete<void>(`/app/problems/questions/${questionId}/`);
}

// 답변 작성/수정
export async function answerQuestion(questionId: number, answerData: AnswerData): Promise<Question> {
  return apiClient.patch<Question>(`/app/problems/questions/${questionId}/answer/`, answerData);
}

// TODO: 백엔드에서 통계 API가 개발되면 아래 주석을 해제하고 calculateQuestionStatistics 함수를 제거하세요
// 상태별 통계 조회 (서버 사이드)
// export async function getQuestionStatistics(): Promise<{
//   total: number;
//   pending: number;
//   answered: number;
//   closed: number;
// }> {
//   return apiClient.get<{
//     total: number;
//     pending: number;
//     answered: number;
//     closed: number;
//   }>('/app/problems/questions/statistics/');
// }

// 임시: 클라이언트 사이드에서 통계 계산 (통계 API 개발 전까지 사용)
export function calculateQuestionStatistics(questions: Question[]): {
  total: number;
  pending: number;
  answered: number;
  closed: number;
} {
  const stats = {
    total: questions.length,
    pending: 0,
    answered: 0,
    closed: 0
  };

  questions.forEach(question => {
    switch (question.state) {
      case 'pending':
        stats.pending++;
        break;
      case 'answered':
        stats.answered++;
        break;
      case 'closed':
        stats.closed++;
        break;
    }
  });

  return stats;
}