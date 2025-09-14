import { apiClient } from './apiClient';

export interface Question {
  question_id: number;
  user_id: string;
  problem_management_id: number;
  content: string;
  state: 'pending' | 'answered';
  content_answer?: string;
  created_at: string;
  user?: {
    name: string;
    email: string;
  };
  problem_management?: {
    content: string;
    answer: number;
    explanation: string;
    source?: string;
    exam_year?: string;
    difficulty?: string;
    image_url?: string;
    progress_id: number;
    problem_progress?: {
      name: string;
      subject_id: number;
      subject?: {
        name: string;
      };
    };
  };
}

export interface ProblemOption {
  problem_select_id: number;
  question_number: number;
  content: string;
}

export interface FormattedQuestion {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  subject: string;
  problem: string;
  correctAnswer: string;
  explanation: string;
  question: string;
  answer?: string;
  status: "waiting" | "completed";
  createdAt: string;
  imageUrl?: string;
  source?: string;
  examYear?: string;
  difficulty?: string;
  problemOptions?: ProblemOption[];
}

// 모든 질문 조회 (관련 데이터와 함께)
export async function getQuestions(): Promise<FormattedQuestion[]> {
  const response = await apiClient.get<unknown>('/admin/questions/');
  
  console.log('Raw API response in questionService:', response);
  
  // 응답이 배열인지 확인하고, 배열이 아니면 적절한 처리
  let questions: Record<string, unknown>[] = [];
  if (Array.isArray(response)) {
    questions = response as Record<string, unknown>[];
  } else if (response && typeof response === 'object' && 'results' in response && Array.isArray((response as Record<string, unknown>).results)) {
    // Django REST framework의 페이지네이션 응답 처리
    questions = (response as Record<string, unknown>).results as Record<string, unknown>[];
  } else if (response && typeof response === 'object' && 'data' in response && Array.isArray((response as Record<string, unknown>).data)) {
    // 다른 형식의 응답 처리
    questions = (response as Record<string, unknown>).data as Record<string, unknown>[];
  } else {
    console.error('예상하지 못한 질문 응답 형식:', response);
    return [];
  }
  
  // Django API 응답을 FormattedQuestion 형태로 변환 (업데이트된 백엔드 API 구조에 맞춤)
  const formattedQuestions: FormattedQuestion[] = questions.map((question: Record<string, unknown>, index: number) => ({
    id: question.question_id?.toString() || `question-${index}`,
    studentId: question.student_id?.toString() || question.user_id?.toString() || '',
    studentName: question.student_name?.toString() || '알 수 없음',
    studentEmail: question.student_email?.toString() || '',
    subject: question.subject_name?.toString() || '미분류',
    problem: question.problem_content?.toString() || '문제 없음',
    correctAnswer: question.correct_answer?.toString() || '정답 없음',
    explanation: question.explanation?.toString() || '해설 없음',
    question: question.content?.toString() || '질문 없음',
    answer: question.content_answer?.toString() || undefined,
    status: question.state === 'answered' ? "completed" : "waiting",
    createdAt: question.created_at ? new Date(question.created_at as string).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    imageUrl: question.image_url?.toString(),
    source: question.source?.toString(),
    examYear: question.exam_year?.toString(),
    difficulty: question.difficulty?.toString(),
    problemOptions: Array.isArray(question.problem_options) ? question.problem_options : [],
  }));
  
  console.log('Formatted questions:', formattedQuestions);
  return formattedQuestions;
}

// 특정 질문 조회
export async function getQuestionById(questionId: string): Promise<FormattedQuestion | null> {
  try {
    return await apiClient.get<FormattedQuestion>(`/admin/questions/${questionId}/`);
  } catch (error) {
    console.error('Error fetching question by id:', error);
    return null;
  }
}

// 질문 답변 업데이트
export async function updateQuestionAnswer(
  questionId: string,
  answer: string
): Promise<void> {
  console.log('질문 답변 업데이트 요청:', { questionId, answer });
  const response = await apiClient.put<void>(`/admin/questions/${questionId}/answer/`, {
    content_answer: answer
  });
  console.log('질문 답변 업데이트 응답:', response);
}

// 상태별 질문 개수 조회
export async function getQuestionStats(): Promise<{
  total: number;
  waiting: number;
  completed: number;
}> {
  return apiClient.get<{
    total: number;
    waiting: number;
    completed: number;
  }>('/admin/questions/stats/');
}