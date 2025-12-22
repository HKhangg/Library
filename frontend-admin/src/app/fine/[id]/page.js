"use client";
import React, { useState } from "react";
import Sidebar from "@/app/components/sidebar/Sidebar";
import { Button } from "@/app/components/ui/button";
import { Receipt, Undo2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import { ThreeDot } from "react-loading-indicators";

import useSWR, { mutate } from "swr";
import { fetcher } from "@/lib/fetcher";

const BookCard = ({ book }) => {
  if (!book) return null;
  
  const imageSrc = book.hinhAnh?.[0] || book.image || "/placeholder.png";
  const title = book.tenSach || book.bookName || "Tên sách ẩn";
  const author = book.tenTacGia || book.author || "Tác giả ẩn";
  const category = book.tenTheLoaiCon || book.category || "";
  const bookId = book.childBook?.id || book.bookId || "N/A";

  return (
    <div className="flex bg-white w-full rounded-lg mt-2 relative drop-shadow-md border border-gray-200 p-5 gap-[20px] md:gap-[50px] items-center">
      <img
        src={imageSrc}
        className="w-[100px] h-[140px] object-cover rounded-md shadow-sm"
        alt={title}
        onError={(e) => (e.target.src = "/placeholder.png")}
      />
      <div className="flex flex-col gap-[5px] relative w-full">
        <p className="font-bold text-[#062D76]">ID sách: {bookId}</p>
        <p className="font-bold text-lg">{title}</p>
        <p className="italic text-gray-600">{author}</p>
        <p className="text-sm text-gray-500">{category}</p>
      </div>
    </div>
  );
};

function Page() {
  const { id } = useParams();
  const router = useRouter();

  // Fetch Thông tin Phiếu Phạt
  const {
    data: fine,
    isLoading: loadingFine,
    error: errorFine,
    mutate: mutateFine
  } = useSWR(
    id ? `${process.env.NEXT_PUBLIC_API_URL}/api/fine/${id}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      onError: () => toast.error("Không thể tải thông tin phiếu phạt")
    }
  );

  // Conditional Fetching: Chỉ fetch thông tin sách nếu lỗi là "Trả sách trễ hạn"
  const bookId = fine?.cardId?.borrowedBooks?.[0]?.bookId;
  const shouldFetchBook = fine?.noiDung === "Trả sách trễ hạn" && bookId;

  const { data: borrowInfo, isLoading: loadingBook } = useSWR(
    shouldFetchBook ? `${process.env.NEXT_PUBLIC_API_URL}/api/book/${bookId}` : null,
    fetcher
  );

  const handleGoBack = () => {
    router.back();
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN");
  };

  // Xử lý Thanh Toán
  const handleThanhToan = async () => {
    if (!fine) return;

    const toastId = toast.loading("Đang xử lý thanh toán...");
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/fine/pay/${id}`,
        { method: "PUT" }
      );

      if (!response.ok) throw new Error("Payment failed");

      toast.success("Thanh toán thành công!", { id: toastId });

      // Cập nhật lại dữ liệu local để UI đổi trạng thái ngay lập tức
      mutateFine({ ...fine, trangThai: "DA_THANH_TOAN", ngayThanhToan: new Date().toISOString() }, false);

    } catch (error) {
      console.error(error);
      toast.error("Thanh toán thất bại", { id: toastId });
    }
  };

  if (loadingFine) {
    return (
      <div className="flex w-full h-screen bg-[#EFF3FB]">
        <Sidebar />
        <div className="flex-1 flex justify-center items-center md:pl-52">
          <ThreeDot color="#062D76" size="large" text="Đang tải dữ liệu..." />
        </div>
      </div>
    );
  }

  if (errorFine || !fine) {
    return (
      <div className="flex w-full h-screen bg-[#EFF3FB]">
        <Sidebar />
        <div className="flex-1 flex flex-col justify-center items-center md:pl-52 gap-4">
          <p className="text-gray-500">Không tìm thấy phiếu phạt.</p>
          <Button onClick={handleGoBack}>Quay lại</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-row w-full min-h-screen bg-[#EFF3FB]">
      <Toaster position="top-center" reverseOrder={false} />
      <Sidebar />
      <div className="flex w-full flex-col py-6 md:ml-52 relative mt-10 gap-2 items-center px-10 mb-24">

        {/* Nút Back */}
        <div className="absolute top-5 left-5 md:left-57 fixed z-10">
          <Button
            title={"Quay Lại"}
            className="bg-[#062D76] rounded-3xl w-10 h-10 hover:bg-gray-700"
            onClick={handleGoBack}
          >
            <Undo2 className="w-12 h-12" color="white" />
          </Button>
        </div>

        {/* Nội dung chính */}
        <div className="flex flex-col w-full gap-4 items-center">

          {/* Box 1: Thông tin chung */}
          <div className="flex bg-white w-full rounded-lg mt-2 relative drop-shadow-md p-6 gap-6 md:gap-10 items-start border border-gray-200">
            <div className="flex flex-col gap-2 w-full">
              <p className="font-bold text-lg text-[#062D76]">Mã Phiếu: {fine.id}</p>
              <p className="text-red-600 font-bold text-xl">Số Tiền: {fine.soTien?.toLocaleString()} VNĐ</p>
              <p className="font-medium">Nội Dung: {fine.noiDung}</p>
            </div>
            <div className="flex flex-col gap-2 w-full">
              <p>ID Người Dùng: <span className="font-medium">{fine.userId?.id || fine.userId}</span></p>
              <p>Tên Người Dùng: <span className="font-medium">{fine.tenND}</span></p>
              {fine.trangThai === "DA_THANH_TOAN" && (
                <p className="text-green-600 font-bold">
                  Ngày Thanh Toán: {formatDate(fine.ngayThanhToan)}
                </p>
              )}
              {fine.trangThai === "CHUA_THANH_TOAN" && (
                <p className="text-orange-500 font-bold italic">Chưa thanh toán</p>
              )}
            </div>
          </div>

          {/* Box 2: Chi tiết lỗi */}
          <div className="flex flex-col gap-4 bg-white w-full rounded-lg mt-2 relative drop-shadow-md p-6 items-center border border-gray-200">
            <h3 className="w-full text-left font-bold text-lg text-gray-700 border-b pb-2">Chi tiết vi phạm</h3>

            {/* Trường hợp 1: Trả sách trễ hạn */}
            {fine.noiDung === "Trả sách trễ hạn" && (
              <div className="flex flex-col w-full gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p><strong>Mã Phiếu Mượn:</strong> {fine.cardId?.id}</p>
                    <p><strong>Số Ngày Trễ:</strong> <span className="text-red-500 font-bold">{fine.cardId?.soNgayTre} ngày</span></p>
                  </div>
                  <div>
                    <p><strong>Ngày Mượn:</strong> {formatDate(fine.cardId?.getBookDate)}</p>
                    <p><strong>Hạn Trả:</strong> {formatDate(fine.cardId?.dueDate)}</p>
                  </div>
                </div>

                {loadingBook ? (
                  <ThreeDot color="#062D76" size="small" />
                ) : (
                  <BookCard book={borrowInfo} />
                )}
              </div>
            )}

            {/* Trường hợp 2: Làm mất sách */}
            {fine.noiDung === "Làm mất sách" && (
              <div className="w-full">
                {/* API response cho trường hợp này thường trả thông tin sách trong cardId hoặc cấu trúc tương tự */}
                <BookCard book={fine.cardId} />
              </div>
            )}

            {/* Trường hợp 3: Khác */}
            {fine.noiDung === "Khác" && (
              <div className="w-full p-4 bg-gray-50 rounded">
                <p><strong>Ghi chú:</strong> {JSON.stringify(fine.cardId || "Không có thông tin thêm")}</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer Bar */}
        <div className="w-full bottom-0 px-10 left-0 md:left-52 md:w-[calc(100%-208px)] fixed h-20 bg-white flex items-center justify-end border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-20">
          <Button
            title={fine.trangThai === "CHUA_THANH_TOAN" ? "Thanh Toán Ngay" : "Đã Thanh Toán"}
            disabled={fine.trangThai !== "CHUA_THANH_TOAN"}
            className={`rounded-full px-8 h-12 flex items-center gap-2 font-bold transition-all ${fine.trangThai === "CHUA_THANH_TOAN"
                ? "bg-[#062D76] hover:bg-blue-800 text-white shadow-lg hover:shadow-xl"
                : "bg-green-100 text-green-700 cursor-not-allowed border border-green-200"
              }`}
            onClick={handleThanhToan}
          >
            <Receipt className="w-6 h-6" />
            {fine.trangThai === "CHUA_THANH_TOAN" ? "Xác nhận Thanh Toán" : "Đã Thanh Toán"}
          </Button>
        </div>

      </div>
    </div>
  );
}

export default Page;