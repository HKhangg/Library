"use client";

// Conflict marker removed: keep user code
import React, { useEffect, useState, useRef } from "react";
// Conflict marker removed
import React, { useState, useMemo } from "react";
// Conflict marker removed
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { useParams } from "next/navigation";
import { CalendarClock, Check, Search, X, Download, Printer } from "lucide-react";
import { ThreeDot } from "react-loading-indicators";
import toast, { Toaster } from "react-hot-toast";
import Barcode from "react-barcode";

import Sidebar from "@/app/components/sidebar/Sidebar";
import axios from "axios";

import useSWR, { mutate } from "swr";
import { fetcher } from "@/lib/fetcher"; 
const Page = () => {
  const { id } = useParams();
  const [searchQuery, setSearchQuery] = useState("");

  // useSWR: Lấy thông tin Sách cha
  const { data: book, isLoading: bookLoading } = useSWR(
    id ? `${process.env.NEXT_PUBLIC_API_URL}/api/book/${id}` : null,
    fetcher
  );

  // useSWR: Lấy danh sách Sách con
  const childBooksApiUrl = id
    ? `${process.env.NEXT_PUBLIC_API_URL}/api/bookchild/book/${id}`
    : null;

  const { data: childBookList = [], isLoading: childrenLoading, mutate: mutateChildren } = useSWR(
    childBooksApiUrl,
    fetcher,
    {
      revalidateOnFocus: true, // Auto refresh khi quay lại tab để cập nhật trạng thái mượn/trả
    }
  );

  // Loading tổng
  const loading = bookLoading || childrenLoading;

  // Xử lý Thêm Sách con
  const handleAddChild = async () => {
    const toastId = toast.loading("Đang tạo sách con...");
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/bookchild/book/${id}/add`
      );

      // Refresh lại danh sách sách con
      mutateChildren();

      setChildBookList((prev) => [
        ...prev,
        {
          id: newChildBook.id,
          barcode: newChildBook.barcode,
          status: "AVAILABLE",
        },
      ]);

      toast.success("Đã tạo sách con mới thành công", { id: toastId });
    } catch (error) {
      console.error(error);
      toast.error("Không thể thêm sách con", { id: toastId });
    }
  };

  // Xử lý Xóa Sách con
  const handleDeleteChild = async (childId) => {
    const toastId = toast.loading("Đang xóa sách con...");
    try {
      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL}/api/bookchild/${childId}`
      );

      // Refresh lại danh sách để cập nhật trạng thái (hoặc xóa khỏi list tùy API)
      mutateChildren();

      toast.success("Xóa sách con thành công", { id: toastId });
    } catch (error) {
      console.error(error);
      toast.error("Xóa thất bại", { id: toastId });
    }
  };

  // Logic Lọc & Thống kê 
  const { filteredBooks, borrowedCount, availableCount } = useMemo(() => {
    const safeList = Array.isArray(childBookList) ? childBookList : [];
    let filtered = safeList;
    if (searchQuery.trim()) {
      filtered = safeList.filter(
        (cb) => cb.id.toString() === searchQuery.trim() || cb.barcode === searchQuery.trim()
      );
    }
    const borrowed = safeList.filter((cb) => cb.status === "BORROWED").length;
    const available = book ? book.tongSoLuong - borrowed : 0;
    return {
      filteredBooks: filtered,
      borrowedCount: borrowed,
      availableCount: available,
    };
  }, [childBookList, searchQuery, book]);

  // Component UI: BookCard
  const BookCard = ({ bookData }) => (
    <div className="flex bg-white w-full rounded-lg shadow-lg p-6 gap-8">
      <img
        src={bookData.hinhAnh?.[0] || "/placeholder.png"}
        className="w-64 h-96 object-cover rounded-md"
        alt={bookData.tenSach}
        onError={(e) => (e.target.src = "/placeholder.png")}
      />
      <div className="flex flex-col gap-3 flex-1 text-sm md:text-base">
        <p><strong>ID:</strong> {bookData.maSach}</p>
        <p><strong>Tên sách:</strong> {bookData.tenSach}</p>
        <p><strong>Tác giả:</strong> {bookData.tenTacGia}</p>
        <p><strong>Nhà xuất bản:</strong> {bookData.nxb}</p>
        <p><strong>Năm xuất bản:</strong> {bookData.nam}</p>
        <p><strong>Tổng số lượng:</strong> {bookData.tongSoLuong}</p>
        <p><strong>Còn sẵn:</strong> {availableCount}</p>
        <p><strong>Thể loại chính:</strong> {bookData.categoryParentName}</p>
        <p><strong>Thể loại phụ:</strong> {bookData.categoryChildName}</p>
        <p><strong>Đã mượn:</strong> {bookData.soLuongMuon}</p>
        <p><strong>Đã xóa:</strong> {bookData.soLuongXoa}</p>
      </div>
    </div>
  );

  // Đã có ChildBookCard phía dưới, xóa khai báo trùng lặp ở đây
  // Component UI: ChildBookCard
  // ...existing code...

  if (loading) {
    return (
      <div className="flex bg-[#EFF3FB] min-h-screen">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <ThreeDot color="#062D76" size="large" text="Đang tải dữ liệu..." />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-row w-full min-h-screen bg-[#EFF3FB]">
      <Toaster position="top-center" reverseOrder={false} />
      <Sidebar />
      <div className="flex-1 p-6 md:ml-52">
        <div className="flex mb-6">
          <Input
            placeholder="Tìm kiếm sách con theo ID hoặc Barcode"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 h-10 px-4 rounded-lg"
          />
          <Button
            onClick={handleAddChild}
            className="bg-green-600 hover:bg-green-700 text-white ml-2"
          >
            + Thêm sách con
          </Button>
        </div>

        {/* Book Details */}
        {book && <BookCard bookData={book} />}

        {/* Child Books List */}
        <div className="mt-8">
          <h3 className="text-xl font-bold mb-4 text-[#062D76]">Danh sách sách con ({filteredBooks.length})</h3>

          {filteredBooks.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredBooks.map((cb) => (
                <ChildBookCard key={cb.id} childBook={cb} />
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500">Không tìm thấy sách con nào.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Page;