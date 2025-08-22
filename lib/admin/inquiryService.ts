import { apiClient } from './apiClient';

export interface InquiryType {
  inquiries_type_id: number;
  inquiries_type: string;
}

export interface TotalInquiry {
  total_inquiries_id: number;
  user_id: string;
  inquiries_type_id: number;
  content: string;
  image_url?: string;
  state: boolean;
  content_answer?: string;
  created_at: string;
  user?: {
    name: string;
    email: string;
  };
  inquiries_type?: {
    inquiries_type: string;
  };
}

export interface FormattedInquiry {
  id: string;
  inquirerName: string;
  inquirerEmail: string;
  inquiryType: string;
  content: string;
  imageUrl?: string;
  status: "waiting" | "completed";
  createdAt: string;
  answer?: string;
}

// 문의 유형 조회
export async function getInquiryTypes(): Promise<InquiryType[]> {
  return apiClient.get<InquiryType[]>('/admin/supports/inquiry-types/');
}

// 전체 문의 조회 (문의 유형별 필터링 가능)
export async function getTotalInquiries(
  inquiryTypeFilter?: string
): Promise<FormattedInquiry[]> {
  const queryParams = inquiryTypeFilter ? `?filter=${inquiryTypeFilter}` : '';
  const endpoint = `/admin/supports/inquiries/${queryParams}`;
  console.log('getTotalInquiries 호출됨 - endpoint:', endpoint);
  const rawData = await apiClient.get<TotalInquiry[]>(endpoint);
  console.log('getTotalInquiries API 응답:', rawData);
  
  // 원시 데이터를 FormattedInquiry 형태로 변환
  const formattedData: FormattedInquiry[] = (rawData as any[]).map((inquiry: any) => ({
    id: inquiry.total_inquiries_id?.toString() || '',
    inquirerName: inquiry.user?.name || '알 수 없음',
    inquirerEmail: inquiry.user?.email || '',
    inquiryType: inquiry.inquiries_type?.inquiries_type || '기타',
    content: inquiry.content || '',
    imageUrl: inquiry.image_url,
    status: inquiry.state ? "completed" : "waiting",
    createdAt: inquiry.created_at ? new Date(inquiry.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    answer: inquiry.content_answer || undefined,
  }));
  
  console.log('변환된 데이터:', formattedData);
  return formattedData;
}

// 일반 문의 조회 (오류신고 제외)
export async function getGeneralInquiries(): Promise<FormattedInquiry[]> {
  return getTotalInquiries('general');
}

// 오류신고 조회
export async function getErrorReports(): Promise<FormattedInquiry[]> {
  console.log('getErrorReports 호출됨 - filter: error-report');
  const result = await getTotalInquiries('error-report');
  console.log('getErrorReports 결과:', result);
  return result;
}

// 문의 답변 업데이트
export async function updateInquiryAnswer(
  inquiryId: string,
  answer: string
): Promise<void> {
  await apiClient.put<void>(`/admin/supports/inquiries/${inquiryId}/`, {
    content_answer: answer,
    state: true // 답변 완료 상태로 변경
  });
}

// 특정 문의 조회
export async function getInquiryById(inquiryId: string): Promise<FormattedInquiry | null> {
  try {
    const rawData = await apiClient.get<TotalInquiry>(`/admin/supports/inquiries/${inquiryId}/`);
    // 단일 문의도 FormattedInquiry로 변환
    const formattedData: FormattedInquiry = {
      id: (rawData as any).total_inquiries_id?.toString() || '',
      inquirerName: (rawData as any).user?.name || '알 수 없음',
      inquirerEmail: (rawData as any).user?.email || '',
      inquiryType: (rawData as any).inquiries_type?.inquiries_type || '기타',
      content: (rawData as any).content || '',
      imageUrl: (rawData as any).image_url,
      status: (rawData as any).state ? "completed" : "waiting",
      createdAt: (rawData as any).created_at ? new Date((rawData as any).created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      answer: (rawData as any).content_answer || undefined,
    };
    return formattedData;
  } catch (error) {
    console.error('Error fetching inquiry by id:', error);
    return null;
  }
}