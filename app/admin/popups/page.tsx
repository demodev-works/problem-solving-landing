'use client';

import { useState, useEffect } from 'react';
import { Popup } from '@/types';
import {
  getPopups,
  createPopup,
  updatePopup,
  deletePopup,
  togglePopupState,
} from '@/lib/admin/popupService';
import { uploadImage } from '@/lib/admin/uploadService';
import { UPLOAD_FOLDERS } from '@/lib/admin/constants';
import { getImageUrl, extractImagePath } from '@/lib/admin/imageUtils';
import { useRequireAuth } from '@/hooks/admin/useAuth';

export default function PopupsPage() {
  const { shouldRender } = useRequireAuth();
  const [popups, setPopups] = useState<Popup[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPopup, setSelectedPopup] = useState<Popup | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    imageFile: null as File | null,
    state: true,
  });

  // 팝업 목록 로드 (인증된 경우에만)
  useEffect(() => {
    if (shouldRender) {
      loadPopups();
    }
  }, [shouldRender]);

  const loadPopups = async () => {
    try {
      setLoading(true);
      const data: any = await getPopups();

      console.log('팝업 API 응답:', data); // 응답 구조 확인을 위한 로그

      // 응답이 배열인지 확인하고, 배열이 아니면 적절한 처리
      if (Array.isArray(data)) {
        setPopups(data);
      } else if (
        data &&
        typeof data === 'object' &&
        'results' in data &&
        Array.isArray(data.results)
      ) {
        // Django REST framework의 페이지네이션 응답 처리
        setPopups(data.results);
      } else if (
        data &&
        typeof data === 'object' &&
        'data' in data &&
        Array.isArray(data.data)
      ) {
        // 다른 형식의 응답 처리
        setPopups(data.data);
      } else {
        console.error('예상하지 못한 응답 형식:', data);
        setPopups([]);
      }
    } catch (error: any) {
      console.error('팝업 로드 오류:', error);
      setPopups([]); // 에러 시 빈 배열로 설정
      if (error.message && error.message.includes('로그인이 필요')) {
        alert('로그인이 필요한 서비스입니다.');
        window.location.href = '/login';
      } else {
        alert('팝업을 불러오는데 실패했습니다.');
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

  const handleAddPopup = () => {
    setFormData({
      title: '',
      content: '',
      imageFile: null,
      state: true,
    });
    setSelectedPopup(null);
    setIsModalOpen(true);
  };

  const handleEditPopup = (popup: Popup) => {
    setFormData({
      title: popup.title,
      content: popup.content,
      imageFile: null,
      state: popup.state,
    });
    setSelectedPopup(popup);
    setIsModalOpen(true);
  };

  const handleSavePopup = async () => {
    if (!formData.title || !formData.content) {
      alert('제목과 내용을 모두 입력해주세요.');
      return;
    }

    try {
      let imageUrl = selectedPopup?.image || '';

      // 새 이미지가 업로드된 경우
      if (formData.imageFile) {
        const uploadedPath = await uploadImage(formData.imageFile);
        imageUrl = extractImagePath(uploadedPath); // 순수 경로만 저장
      }

      const popupData = {
        title: formData.title,
        content: formData.content,
        image_url: imageUrl,
        state: formData.state,
      };

      if (selectedPopup) {
        // 수정 - 기존 이미지 URL도 함께 전송
        const updateData = {
          ...popupData,
          oldImageUrl: selectedPopup.image, // 기존 이미지 URL 추가
        };
        await updatePopup(selectedPopup.pop_up_id, updateData);
      } else {
        // 추가
        await createPopup(popupData);
      }

      await loadPopups(); // 목록 새로고침
      setIsModalOpen(false);
      alert(
        selectedPopup ? '팝업이 수정되었습니다.' : '팝업이 추가되었습니다.'
      );
    } catch (error) {
      console.error('팝업 저장 오류:', error);
      alert('팝업 저장에 실패했습니다.');
    }
  };

  const handleDeletePopup = async (id: number) => {
    if (confirm('정말로 이 팝업을 삭제하시겠습니까?')) {
      try {
        await deletePopup(id);
        await loadPopups(); // 목록 새로고침
        alert('팝업이 삭제되었습니다.');
      } catch (error) {
        console.error('팝업 삭제 오류:', error);
        alert('팝업 삭제에 실패했습니다.');
      }
    }
  };

  const handleToggleActive = async (id: number, currentState: boolean) => {
    try {
      await togglePopupState(id, !currentState);
      await loadPopups(); // 목록 새로고침
    } catch (error) {
      console.error('상태 변경 오류:', error);
      alert('상태 변경에 실패했습니다.');
    }
  };


  // 인증되지 않은 경우
  if (!shouldRender) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">로그인 페이지로 이동 중...</p>
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
          <p className="mt-4 text-gray-600">팝업을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2 ">팝업 관리</h1>
          <div className="text-center flex justify-end gap-2">
            <button
              onClick={handleAddPopup}
              className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
            >
              새 팝업 추가
            </button>
          </div>
        </div>

        {/* 팝업 목록 */}
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
                  상태
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
              {popups && popups.length > 0 ? (
                popups.map((popup) => (
                  <tr key={popup.pop_up_id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="w-20 h-20 rounded-lg bg-gray-100">
                        {popup.image && (
                          <img
                            src={getImageUrl(popup.image) || ''}
                            alt={popup.title}
                            className="w-full h-full object-cover rounded-lg"
                            onError={(e) => {
                              console.error('이미지 로드 실패:', popup.image);
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {popup.title}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                      {popup.content}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() =>
                          handleToggleActive(popup.pop_up_id, popup.state)
                        }
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          popup.state
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {popup.state ? '활성' : '비활성'}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(popup.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => handleEditPopup(popup)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        수정
                      </button>
                      <button
                        onClick={() => handleDeletePopup(popup.pop_up_id)}
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
                    colSpan={6}
                    className="px-6 py-4 text-center text-gray-500"
                  >
                    팝업이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 팝업 추가/수정 모달 */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
              className="fixed inset-0"
              onClick={() => setIsModalOpen(false)}
            ></div>

            <div className="relative bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 p-6 max-h-[90vh] overflow-y-auto">
              <h2 className="text-lg font-semibold text-gray-900 mb-6 text-center">
                팝업 {selectedPopup ? '수정' : '추가'}
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    팝업 제목 *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    placeholder="팝업 제목을 입력하세요"
                    className="w-full px-3 py-2 text-gray-800 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    팝업 내용 *
                  </label>
                  <textarea
                    value={formData.content}
                    onChange={(e) =>
                      setFormData({ ...formData, content: e.target.value })
                    }
                    placeholder="팝업 내용을 입력하세요"
                    rows={4}
                    className="w-full px-3 py-2 text-gray-800 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    팝업 이미지
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="w-full px-3 py-2 text-gray-800 border border-gray-300 rounded-md"
                  />
                </div>

                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.state}
                      onChange={(e) =>
                        setFormData({ ...formData, state: e.target.checked })
                      }
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      활성 상태
                    </span>
                  </label>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleSavePopup}
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
