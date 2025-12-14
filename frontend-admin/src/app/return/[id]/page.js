"use client";
import React, { useState } from "react";
import Sidebar from "@/app/components/sidebar/Sidebar";
import { Undo2, Trash2, Eye } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/app/components/ui/button";
import useSidebarStore from "@/store/sideBarStore";
import toast, { Toaster } from "react-hot-toast";
import { ThreeDot } from "react-loading-indicators";

import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";

// Component hiển thị từng cuốn sách
const BookCard = ({ book }) => {
  return (
    <article className="flex w-full p-6 bg-white shadow-md mt-4 rounded-[10px] border-[2px] border-gray-300 gap-4 hover:shadow-lg transition-shadow">
      <div className="flex-shrink-0">
        <img
          src={book.image || "/placeholder.png"}
          className="w-[80px] h-[120px] object-cover rounded-md shadow-sm"
          alt={book.name || "Book Image"}
          onError={(e) => (e.target.src = "/placeholder.png")}
        />
      </div>

      <div className="flex justify-between w-full max-sm:flex-col">
        <div className="flex flex-col justify-between gap-1">
          <h3 className="font-bold text-xl text-[#062D76]">{book.name}</h3>
          <p className="text-gray-600 font-medium">Tác giả: {book.author}</p>
          <p className="text-gray-500 text-sm">Thể loại: {book.category}</p>
          <p className="text-gray-500 text-sm">NXB: {book.publisher}</p>
          <p className="text-gray-400 text-xs">Mã sách: {book.id || book.bookId}</p>
        </div>
      </div>
    </article>
  );
};

const Page = () => {
  const { id } = useParams();
  const { isSidebarOpen } = useSidebarStore();
  const router = useRouter();

  // State cho Modal Xóa
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // 2. Fetch Data với SWR
  const {
    data: borrowDetail,
    isLoading,
    error
  } = useSWR(
    id ? `${process.env.NEXT_PUBLIC_API_URL}/api/borrow-cards/${id}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      onError: (err) => {
        console.error("Lỗi fetch:", err);
        toast.error("Không thể tải thông tin phiếu trả.");
      }
    }
  );

  // Handlers
  const handleBack = () => {
    router.back();
  };

  const handleViewFine = () => {
    // Điều hướng sang trang phiếu phạt với query param
    router.push(`/fine?borrowId=${id}`);
  };

  const handleDelete = async () => {
    const toastId = toast.loading("Đang xóa phiếu...");
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/borrow-cards/${id}`,
        { method: "DELETE" }
      );

      if (!response.ok) throw new Error("API Error");

      toast.success("Xóa phiếu thành công", { id: toastId });
      setShowDeleteModal(false);

      // Delay chuyển trang
      setTimeout(() => {
        router.push("/return");
      }, 500);
    } catch (err) {
      console.error(err);
      toast.error("Xóa phiếu thất bại", { id: toastId });
    }
  };

  // Helper format ngày
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("vi-VN");
  };

  // Render Loading
  if (isLoading) {
    return (
      <div className="flex w-full min-h-screen bg-[#F4F7FE]">
        <Sidebar />
        <div className={`flex-1 flex justify-center items-center transition-all duration-300 ${isSidebarOpen ? "md:ml-64" : "md:ml-0"}`}>
          <ThreeDot color="#062D76" size="large" text="Đang tải dữ liệu..." />
        </div>
      </div>
    );
  }

  // Render Error/Empty
  if (error || !borrowDetail) {
    return (
      <div className="flex w-full min-h-screen bg-[#F4F7FE]">
        <Sidebar />
        <div className={`flex-1 p-10 transition-all duration-300 ${isSidebarOpen ? "md:ml-64" : "md:ml-0"}`}>
          <button onClick={handleBack} className="mb-4 px-4 py-2 bg-[#6CB1DA] rounded-full text-white"><Undo2 /></button>
          <div className="text-center text-gray-500 mt-10">Không tìm thấy thông tin phiếu trả này.</div>
        </div>
      </div>
    );
  }

  // Tính tổng sách (Dựa trên mảng bookIds trả về từ API)
  const bookList = borrowDetail.bookIds || [];
  const totalBooks = bookList.length;

  return (
    <div className="flex flex-row w-full min-h-screen bg-[#F4F7FE]">
      <Toaster position="top-center" reverseOrder={false} />
      <Sidebar />

      <div
        className={`flex-1 py-6 px-10 transition-all duration-300 ${isSidebarOpen ? "md:ml-64" : "md:ml-0"
          }`}
      >
        {/* Nút Quay lại */}
        <button
          className="w-12 h-12 flex justify-center items-center bg-[#062D76] hover:bg-[#051e4f] rounded-full shadow-md transition-colors"
          onClick={handleBack}
          title="Quay lại"
        >
          <Undo2 className="w-6 h-6 text-white" />
        </button>

        {/* Thông tin chung (Header) */}
        <div className="flex flex-col md:flex-row justify-between items-start w-full bg-white p-8 mt-6 rounded-[10px] border-[2px] border-gray-300 shadow-sm gap-6">
          <div className="flex flex-col gap-3 w-full md:w-1/2">
            <h2 className="font-bold text-2xl text-[#062D76] mb-2">Chi tiết phiếu: #{borrowDetail.id}</h2>
            <div className="flex gap-2">
              <span className="font-semibold w-32">Ngày mượn:</span>
              <span>{formatDate(borrowDetail.borrowDate)}</span>
            </div>
            <div className="flex gap-2">
              <span className="font-semibold w-32">Ngày trả dự kiến:</span>
              <span>{formatDate(borrowDetail.dueDate)}</span>
            </div>
            {/* Nếu API có trả về ngày thực trả */}
            <div className="flex gap-2 text-green-600">
              <span className="font-semibold w-32">Ngày trả thực tế:</span>
              <span>{formatDate(borrowDetail.dueDate)}</span>
            </div>
          </div>

          <div className="flex flex-col gap-3 w-full md:w-1/2">
            <div className="flex gap-2">
              <span className="font-semibold w-32">ID người dùng:</span>
              <span>{borrowDetail.userId}</span>
            </div>
            <div className="flex gap-2">
              <span className="font-semibold w-32">Tên người dùng:</span>
              <span className="font-bold">{borrowDetail.userName}</span>
            </div>
            <div className="flex gap-2">
              <span className="font-semibold w-32">Số lượng sách:</span>
              <span className="bg-gray-100 px-3 rounded-full font-bold">{totalBooks}</span>
            </div>
          </div>
        </div>

        {/* Danh sách sách */}
        <h3 className="text-xl font-bold text-[#062D76] mt-8 mb-2">Danh sách sách đã trả</h3>
        <div className="flex flex-col gap-2">
          {bookList.length > 0 ? (
            bookList.map((book, index) => (
              <BookCard key={index} book={book} />
            ))
          ) : (
            <p className="text-gray-500 italic">Không có thông tin sách chi tiết.</p>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col md:flex-row justify-between items-center w-full bg-white p-6 mt-8 rounded-[10px] border-[2px] border-gray-300 shadow-sm gap-4">
          <div className="flex gap-4">
            <Button
              onClick={() => setShowDeleteModal(true)}
              className="bg-red-500 hover:bg-red-600 text-white flex items-center gap-2 px-6"
            >
              <Trash2 size={18} />
              Xóa phiếu
            </Button>
            {/* Đã xóa nút "Sửa" theo yêu cầu */}
          </div>

          <div className="flex gap-4">
            <Button
              onClick={handleViewFine}
              className="bg-[#062D76] hover:bg-[#051e4f] text-white flex items-center gap-2 px-6"
            >
              <Eye size={18} />
              Xem phiếu phạt
            </Button>
          </div>
        </div>
      </div>

      {/* Modal Xác Nhận Xóa */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md animate-in fade-in zoom-in duration-200">
            <h3 className="text-lg font-bold mb-4 text-red-600">Xác nhận xóa</h3>
            <p className="text-gray-700 mb-6">
              Bạn có chắc chắn muốn xóa phiếu trả <strong>#{id}</strong> không? Hành động này không thể hoàn tác.
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowDeleteModal(false)}
                className="border-gray-300"
              >
                Hủy
              </Button>
              <Button
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={handleDelete}
              >
                Xóa ngay
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Page;