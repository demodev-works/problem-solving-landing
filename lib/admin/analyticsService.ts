import { apiClient } from './apiClient';

// 진도별 정답률 통계 타입 정의
export interface ProgressCorrectRateStats {
  progress_name: string;
  progress_day: number;
  overall_correct_rate: number;
}

export interface OverallProgressStatsResponse {
  overall_progress_stats: ProgressCorrectRateStats[];
}

// 개별 사용자 진도별 정답률 통계 타입 정의
export interface UserProgressStats {
  progress_name: string;
  user_correct_rate: number;
  overall_correct_rate?: number; // with_average=true일 때만 포함
}

export interface UserProgressStatsResponse {
  user_progress_stats: UserProgressStats[];
}

// 관리자용 진도별 통합 정답률 조회
export async function getOverallProgressStats(): Promise<ProgressCorrectRateStats[]> {
  try {
    const response = await apiClient.get<OverallProgressStatsResponse>(
      '/admin/analytics/progress-rates/overall_stats/'
    );
    return response.overall_progress_stats;
  } catch (error) {
    console.error('진도별 정답률 조회 오류:', error);
    throw error;
  }
}

// 관리자용 개별 사용자 진도별 정답률 조회
export async function getUserProgressStats(
  userId: string,
  withAverage: boolean = true
): Promise<UserProgressStats[]> {
  try {
    const response = await apiClient.get<UserProgressStatsResponse>(
      `/admin/analytics/progress-rates/user_stats/?user_id=${userId}&with_average=${withAverage}`
    );
    return response.user_progress_stats;
  } catch (error) {
    console.error('사용자 진도별 정답률 조회 오류:', error);
    throw error;
  }
}