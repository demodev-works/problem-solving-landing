// 진도율에 따른 색상 계산
export function getProgressColor(progress: number): string {
  if (progress >= 80) return 'bg-green-500';
  if (progress >= 50) return 'bg-orange-400';
  return 'bg-red-500';
}

// 성취율에 따른 색상 계산
export function getAchievementColor(achievement: number): string {
  if (achievement >= 90) return 'text-green-600';
  if (achievement >= 70) return 'text-yellow-600';
  if (achievement >= 50) return 'text-orange-600';
  return 'text-red-600';
}

// 날짜 포맷팅
export function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

// 날짜와 시간 포맷팅
export function formatDateTime(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// 상태에 따른 텍스트 변환
export function getStatusText(status: string): string {
  const statusMap: Record<string, string> = {
    pending: '대기중',
    processing: '처리중',
    completed: '완료',
    rejected: '거부됨',
  };
  return statusMap[status] || status;
} 