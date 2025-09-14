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
  const formattedData: FormattedInquiry[] = (rawData as unknown as Record<string, unknown>[]).map((inquiry: Record<string, unknown>) => {
    const user = inquiry.user as Record<string, unknown> | undefined;
    const inquiryType = inquiry.inquiries_type as Record<string, unknown> | undefined;
    
    return {
      id: inquiry.total_inquiries_id?.toString() || '',
      inquirerName: user?.name?.toString() || '알 수 없음',
      inquirerEmail: user?.email?.toString() || '',
      inquiryType: inquiryType?.inquiries_type?.toString() || '기타',
      content: inquiry.content?.toString() || '',
      imageUrl: inquiry.image_url?.toString(),
      status: inquiry.state ? "completed" : "waiting",
      createdAt: inquiry.created_at ? new Date(inquiry.created_at as string).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      answer: inquiry.content_answer?.toString() || undefined,
    };
  });
  
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
    const inquiryData = rawData as unknown as Record<string, unknown>;
    const user = inquiryData.user as Record<string, unknown> | undefined;
    const inquiryType = inquiryData.inquiries_type as Record<string, unknown> | undefined;
    
    const formattedData: FormattedInquiry = {
      id: inquiryData.total_inquiries_id?.toString() || '',
      inquirerName: user?.name?.toString() || '알 수 없음',
      inquirerEmail: user?.email?.toString() || '',
      inquiryType: inquiryType?.inquiries_type?.toString() || '기타',
      content: inquiryData.content?.toString() || '',
      imageUrl: inquiryData.image_url?.toString(),
      status: inquiryData.state ? "completed" : "waiting",
      createdAt: inquiryData.created_at ? new Date(inquiryData.created_at as string).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      answer: inquiryData.content_answer?.toString() || undefined,
    };
    return formattedData;
  } catch (error) {
    console.error('Error fetching inquiry by id:', error);
    return null;
  }
}