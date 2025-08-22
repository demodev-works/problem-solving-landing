'use client';

import { useState, useEffect } from 'react';
import { Notice } from '@/types';
import {
  getNotices,
  createNotice,
  updateNotice,
  deleteNotice,
  NoticeWithImageUrl,
} from '@/lib/admin/noticeService';
import { uploadImage, deleteImage } from '@/lib/admin/uploadService';
import { UPLOAD_FOLDERS } from '@/lib/admin/constants';
import { getImageUrl, extractImagePath } from '@/lib/admin/imageUtils';
import { useRequireAuth } from '@/hooks/admin/useAuth';

export default function NoticesPage() {
  const {
    user,
    loading: authLoading,
    isAuthenticated,
    shouldRender,
  } = useRequireAuth();
  const [notices, setNotices] = useState<NoticeWithImageUrl[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedNotice, setSelectedNotice] =
    useState<NoticeWithImageUrl | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    imageFile: null as File | null,
  });

  // 공지사항 목록 로드 (인증된 경우에만)
  useEffect(() => {
    if (shouldRender) {
      loadNotices();
    }
  }, [shouldRender]);

  const loadNotices = async () => {
    try {
      setLoading(true);
      const data = await getNotices();

      console.log('공지사항 API 응답:', data); // 응답 구조 확인을 위한 로그
      console.log(
        '첫 번째 공지사항 구조:',
        (data as any).results?.[0] || data[0]
      ); // 첫 번째 항목의 구조 확인

      // 응답이 배열인지 확인하고, 배열이 아니면 적절한 처리
      if (Array.isArray(data)) {
        setNotices(data);
      } else if (
        data &&
        (data as any).results &&
        Array.isArray((data as any).results)
      ) {
        // Django REST framework의 페이지네이션 응답 처리
        setNotices((data as any).results);
      } else if (
        data &&
        (data as any).data &&
        Array.isArray((data as any).data)
      ) {
        // 다른 형식의 응답 처리
        setNotices((data as any).data);
      } else {
        console.error('예상하지 못한 응답 형식:', data);
        setNotices([]);
      }
    } catch (error: any) {
      console.error('공지사항 로드 오류:', error);
      setNotices([]); // 에러 시 빈 배열로 설정
      if (error.message.includes('로그인이 필요')) {
        alert('로그인이 필요한 서비스입니다.');
        window.location.href = '/login';
      } else {
        alert('공지사항을 불러오는데 실패했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({ ...formData, imageFile: e.target.files[0] });
    }
  };

  const handleAddNotice = () => {
    setFormData({
      title: '',
      content: '',
      imageFile: null,
    });
    setSelectedNotice(null);
    setIsModalOpen(true);
  };

  const handleEditNotice = (notice: NoticeWithImageUrl) => {
    setFormData({
      title: notice.title,
      content: notice.content,
      imageFile: null,
    });
    setSelectedNotice(notice);
    setIsModalOpen(true);
  };

  const handleDeleteImage = async () => {
    if (!selectedNotice?.image_url) return;

    if (confirm('정말로 이미지를 삭제하시겠습니까?')) {
      try {
        // 서버에서 이미지 파일 삭제
        await deleteImage(selectedNotice.image_url);

        // 데이터베이스에서도 즉시 이미지 URL 제거
        const updateData = {
          title: selectedNotice.title,
          content: selectedNotice.content,
          image_url: '', // 이미지 URL을 빈 값으로 설정
          oldImageUrl: selectedNotice.image_url,
        };
        
        await updateNotice(selectedNotice.notice_id, updateData);

        // 로컬 상태 업데이트 - selectedNotice의 image_url을 빈 값으로 변경
        setSelectedNotice({
          ...selectedNotice,
          image_url: ''
        });

        // 목록도 새로고침하여 동기화
        await loadNotices();

        alert('이미지가 삭제되었습니다.');
      } catch (error) {
        console.error('이미지 삭제 오류:', error);
        alert('이미지 삭제에 실패했습니다.');
      }
    }
  };

  const handleSaveNotice = async () => {
    if (!formData.title || !formData.content) {
      alert('제목과 내용을 모두 입력해주세요.');
      return;
    }

    try {
      let imageUrl = selectedNotice?.image_url || '';

      // 새 이미지가 업로드된 경우
      if (formData.imageFile) {
        const uploadedPath = await uploadImage(
          formData.imageFile,
          UPLOAD_FOLDERS.NOTICES
        );
        imageUrl = extractImagePath(uploadedPath); // 순수 경로만 저장
      }

      const noticeData = {
        title: formData.title,
        content: formData.content,
        image_url: imageUrl,
      };

      if (selectedNotice) {
        // 수정 - 기존 이미지 URL도 함께 전송
        const updateData = {
          ...noticeData,
          oldImageUrl: selectedNotice.image_url, // 기존 이미지 URL 추가
        };
        await updateNotice(selectedNotice.notice_id, updateData);
      } else {
        // 추가
        await createNotice(noticeData);
      }

      await loadNotices(); // 목록 새로고침
      setIsModalOpen(false);
      alert(
        selectedNotice
          ? '공지사항이 수정되었습니다.'
          : '공지사항이 추가되었습니다.'
      );
    } catch (error) {
      console.error('공지사항 저장 오류:', error);
      alert('공지사항 저장에 실패했습니다.');
    }
  };

  const handleDeleteNotice = async (id: number) => {
    if (confirm('정말로 이 공지사항을 삭제하시겠습니까?')) {
      try {
        // 삭제할 공지사항의 이미지 URL 찾기
        const noticeToDelete = notices.find(notice => notice.notice_id === id);
        
        // 공지사항 삭제
        await deleteNotice(id);
        
        // 이미지가 있으면 함께 삭제
        if (noticeToDelete?.image_url) {
          try {
            await deleteImage(noticeToDelete.image_url);
          } catch (imageError) {
            console.error('이미지 삭제 오류:', imageError);
            // 이미지 삭제 실패해도 공지사항 삭제는 완료된 상태이므로 계속 진행
          }
        }
        
        await loadNotices(); // 목록 새로고침
        alert('공지사항이 삭제되었습니다.');
      } catch (error) {
        console.error('공지사항 삭제 오류:', error);
        alert('공지사항 삭제에 실패했습니다.');
      }
    }
  };

  // 인증 로딩 중이거나 인증되지 않은 경우
  if (authLoading || !shouldRender) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">
            {authLoading ? '인증 확인 중...' : '로그인 페이지로 이동 중...'}
          </p>
        </div>
      </div>
    );
  }

  // 데이터 로딩 중
  if (loading) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">공지사항을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            공지사항 관리
          </h1>
          <div className="text-center flex justify-end gap-2">
            <button
              onClick={handleAddNotice}
              className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
            >
              새 공지사항 추가
            </button>
          </div>
        </div>

        {/* 공지사항 목록 */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  이미지
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  제목
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  내용
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  생성일
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  작업
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {notices && notices.length > 0 ? (
                notices.map((notice) => (
                  <tr key={notice.notice_id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="w-20 h-20 rounded-lg bg-gray-100">
                        {notice.image_url && (
                          <img
                            src={getImageUrl(notice.image_url) || ''}
                            alt={notice.title}
                            className="w-full h-full object-cover rounded-lg"
                            onError={(e) => {
                              console.error(
                                '이미지 로드 실패:',
                                notice.image_url
                              );
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {notice.title}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                      {notice.content}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(notice.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => handleEditNotice(notice)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        수정
                      </button>
                      <button
                        onClick={() => handleDeleteNotice(notice.notice_id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        삭제
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-4 text-center text-gray-500"
                  >
                    공지사항이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 공지사항 추가/수정 모달 */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
              className="fixed inset-0 bg-opacity-100"
              onClick={() => setIsModalOpen(false)}
            ></div>

            <div className="relative bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 p-6 max-h-[90vh] overflow-y-auto">
              <h2 className="text-lg font-semibold text-gray-900 mb-6 text-center">
                공지사항 {selectedNotice ? '수정' : '추가'}
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    공지사항 제목 *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    placeholder="공지사항 제목을 입력하세요"
                    className="w-full px-3 py-2 text-gray-800 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    공지사항 내용 *
                  </label>
                  <textarea
                    value={formData.content}
                    onChange={(e) =>
                      setFormData({ ...formData, content: e.target.value })
                    }
                    placeholder="공지사항 내용을 입력하세요"
                    rows={4}
                    className="w-full px-3 py-2 text-gray-800 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    공지사항 이미지
                  </label>
                  {selectedNotice?.image_url && (
                    <div className="mb-3">
                      <p className="text-sm text-gray-600 mb-2">현재 이미지:</p>
                      <div className="flex items-center gap-3">
                        <img
                          src={getImageUrl(selectedNotice.image_url) || ''}
                          alt="현재 이미지"
                          className="w-20 h-20 object-cover rounded-lg border"
                        />
                        <div className="flex-1">
                          <span className="text-sm text-gray-500 block">
                            {selectedNotice.image_url}
                          </span>
                          <button
                            onClick={handleDeleteImage}
                            className="mt-2 px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                          >
                            이미지 삭제
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="w-full px-3 py-2 text-gray-800 border border-gray-300 rounded-md"
                  />
                  {formData.imageFile && (
                    <p className="text-sm text-gray-600 mt-2">
                      새 파일 선택됨: {formData.imageFile.name}
                    </p>
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleSaveNotice}
                    className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                  >
                    저장
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
