interface InquiryDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function InquiryDetailPage({ params }: InquiryDetailPageProps) {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">문의 상세</h1>
      <div className="bg-white rounded-lg shadow p-6">
        <p>문의 ID: {(await params).id}</p>
        <p>답변 입력 또는 보기 기능이 여기에 표시됩니다.</p>
      </div>
    </div>
  );
} 