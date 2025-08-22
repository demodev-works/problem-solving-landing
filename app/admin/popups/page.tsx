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
import { uploadImage, deleteImage } from '@/lib/admin/uploadService';
import { UPLOAD_FOLDERS } from '@/lib/admin/constants';
import { getImageUrl, extractImagePath } from '@/lib/admin/imageUtils';
import { useRequireAuth } from '@/hooks/admin/useAuth';

export default function PopupsPage() {
  const {
    user,
    loading: authLoading,
    isAuthenticated,
    shouldRender,
  } = useRequireAuth();
  const [popups, setPopups] = useState<Popup[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
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

  const handleDeleteImage = async () => {
    if (!selectedPopup?.image_url) return;

    if (confirm('정말로 이미지를 삭제하시겠습니까?')) {
      try {
        // 서버에서 이미지 파일 삭제
        await deleteImage(selectedPopup.image_url);

        // 데이터베이스에서도 즉시 이미지 URL 제거
        const updateData = {
          title: selectedPopup.title,
          content: selectedPopup.content,
          image_url: '', // 이미지 URL을 빈 값으로 설정
          state: selectedPopup.state,
          oldImageUrl: selectedPopup.image_url,
        };
        
        await updatePopup(selectedPopup.pop_up_id, updateData);

        // 로컬 상태 업데이트 - selectedPopup의 image_url을 빈 값으로 변경
        setSelectedPopup({
          ...selectedPopup,
          image_url: ''
        });

        // 목록도 새로고침하여 동기화
        await loadPopups();

        alert('이미지가 삭제되었습니다.');
      } catch (error) {
        console.error('이미지 삭제 오류:', error);
        alert('이미지 삭제에 실패했습니다.');
      }
    }
  };

  const handleSavePopup = async () => {
    if (!formData.title || !formData.content) {
      alert('제목과 내용을 모두 입력해주세요.');
      return;
    }

    try {
      let imageUrl = selectedPopup?.image_url || '';

      // 새 이미지가 업로드된 경우
      if (formData.imageFile) {
        const uploadedPath = await uploadImage(
          formData.imageFile,
          UPLOAD_FOLDERS.POPUPS
        );
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
          oldImageUrl: selectedPopup.image_url, // 기존 이미지 URL 추가
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
        // 삭제할 팝업의 이미지 URL 찾기
        const popupToDelete = popups.find(popup => popup.pop_up_id === id);
        
        // 팝업 삭제
        await deletePopup(id);
        
        // 이미지가 있으면 함께 삭제
        if (popupToDelete?.image_url) {
          try {
            await deleteImage(popupToDelete.image_url);
          } catch (imageError) {
            console.error('이미지 삭제 오류:', imageError);
            // 이미지 삭제 실패해도 팝업 삭제는 완료된 상태이므로 계속 진행
          }
        }
        
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

  const handlePreviewPopup = (popup: Popup) => {
    setSelectedPopup(popup);
    setIsPreviewOpen(true);
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
                  미리보기
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
                      <div
                        className="w-20 h-20 rounded-lg cursor-pointer bg-gray-100"
                        onClick={() => handlePreviewPopup(popup)}
                      >
                        {popup.image_url && (
                          <img
                            src={getImageUrl(popup.image_url) || ''}
                            alt={popup.title}
                            className="w-full h-full object-cover rounded-lg"
                            onError={(e) => {
                              console.error(
                                '이미지 로드 실패:',
                                popup.image_url
                              );
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
              className="fixed inset-0 bg-opacity-30"
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
                  {selectedPopup?.image_url && (
                    <div className="mb-3">
                      <p className="text-sm text-gray-600 mb-2">현재 이미지:</p>
                      <div className="flex items-center gap-3">
                        <img
                          src={getImageUrl(selectedPopup.image_url) || ''}
                          alt="현재 이미지"
                          className="w-20 h-20 object-cover rounded-lg border"
                        />
                        <div className="flex-1">
                          <span className="text-sm text-gray-500 block">
                            {selectedPopup.image_url}
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

        {/* 팝업 미리보기 모달 */}
        {isPreviewOpen && selectedPopup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="relative max-w-sm mx-4">
              <div className="bg-white rounded-2xl shadow-2xl p-8">
                <h3 className="text-2xl font-bold text-center mb-4 text-gray-800">
                  {selectedPopup.title}
                </h3>

                {selectedPopup.image_url && (
                  <img
                    src={getImageUrl(selectedPopup.image_url) || ''}
                    alt={selectedPopup.title}
                    className="w-full max-w-xs mx-auto mb-6 rounded-lg"
                    onError={(e) => {
                      console.error(
                        '미리보기 이미지 로드 실패:',
                        selectedPopup.image_url
                      );
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                )}

                <p className="text-gray-600 mb-6 text-center">
                  {selectedPopup.content}
                </p>

                <button
                  onClick={() => setIsPreviewOpen(false)}
                  className="w-full py-3 bg-gray-800 text-white rounded-lg font-medium hover:bg-gray-900"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
