"use client";

import {React, useState, useMemo } from "react";
import axios from "axios";
import Sidebar from "../components/sidebar/Sidebar";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { useRouter } from "next/navigation";
import { List, Pencil, Plus, Search, Trash2 } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { ThreeDot } from "react-loading-indicators";

import useSWR, { mutate } from "swr";
import { fetcher } from "@/lib/fetcher";

const Page = () => {
  // State tìm kiếm và lọc
  const [searchQuery, setSearchQuery] = useState("");
  const [mode, setMode] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // State UI
  const [popUpOpen, setPopUpOpen] = useState(false);
  const [deleteOne, setDeleteOne] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const router = useRouter();

  // State URL cho SWR
  // Mặc định load tất cả sách
  const [apiUrl, setApiUrl] = useState(`${process.env.NEXT_PUBLIC_API_URL}/api/book`);

  // useSWR: Fetch dữ liệu sách
 // Tìm đến đoạn useSWR và sửa lại như sau:
const { data: booksData = [], isLoading, error, mutate } = useSWR(
  apiUrl,
  fetcher,
  {
    revalidateOnFocus: true, 
    revalidateIfStale: true, 
    dedupingInterval: 0,      
    keepPreviousData: true, 
    onError: () => toast.error("Không thể tải danh sách sách"),
  }
);

  // Đảm bảo dữ liệu luôn là mảng
  const safeBookList = Array.isArray(booksData) ? booksData : [];

  // Xử lý Search
  const handleSearch = (e) => {
    e?.preventDefault();
    setCurrentPage(1); // Reset về trang 1

    // Nếu mode 'all' và không có từ khóa -> Load lại tất cả
    if (mode === "all" && !searchQuery.trim()) {
      setApiUrl(`${process.env.NEXT_PUBLIC_API_URL}/api/book`);
      return;
    }

    // Nếu mode 'all' nhưng không nhập gì -> Reset
    if (mode === "all") {
      setApiUrl(`${process.env.NEXT_PUBLIC_API_URL}/api/book`);
      return;
    }

    // Xây dựng params tìm kiếm
    const params = {};
    if (mode === "title") params.title = searchQuery.trim();
    else if (mode === "author") params.author = searchQuery.trim();
    else if (mode === "category") params.category = searchQuery.trim();
    else if (mode === "publisher") params.publisher = searchQuery.trim();
    else if (mode === "year") {
      if (/^\d{4}$/.test(searchQuery.trim())) {
        params.year = Number(searchQuery.trim());
      } else {
        toast.error("Nhập năm theo dạng YYYY");
        return;
      }
    }

    // Tạo Query String
    const queryString = new URLSearchParams(params).toString();
    setApiUrl(`${process.env.NEXT_PUBLIC_API_URL}/api/book/search?${queryString}`);
  };

  // Xử lý xóa -> giữ logic check sách con + thêm toast loading + mutate)
  const handleDelete = async (book) => {
    const toastId = toast.loading("Đang kiểm tra và xóa sách...");

    try {
      // Kiểm tra sách con 
      const { data } = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/book/${book.maSach}`
      );
      const children = data.children || [];
      const hasBorrowed = children.some((c) => c.status === "BORROWED");

      if (hasBorrowed) {
        toast.error("Không thể xoá: vẫn còn sách con đang được mượn!", { id: toastId });
        return;
      }

      // Xóa sách
      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL}/api/book/${book.maSach}`
      );

      // Cập nhật SWR (Optimistic UI Update hoặc Refetch)
      mutate(
        apiUrl,
        (currentData) => currentData.filter((b) => b.maSach !== book.maSach),
        false // false = không fetch lại ngay
      );
      await mutate(apiUrl);

      toast.success("Xóa sách thành công", { id: toastId });

      // Reset trang nếu trang hiện tại hết dữ liệu
      if (currentBooks.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }

    } catch (error) {
      console.error("Lỗi khi xóa:", error);
      toast.error("Xóa sách thất bại", { id: toastId });
    } finally {
      setPopUpOpen(false);
      setDeleteOne(null);
    }
  };

  // Xử lý phân trang 
  // Lọc theo dropdown trạng thái
  const filteredByStatus = useMemo(() => {
    if (statusFilter === "all") return safeBookList;
    return safeBookList.filter((b) => b.trangThai === statusFilter);
  }, [safeBookList, statusFilter]);

  // Phân trang
  const totalPages = Math.ceil(filteredByStatus.length / itemsPerPage) || 1;
  const indexOfLastBook = currentPage * itemsPerPage;
  const indexOfFirstBook = indexOfLastBook - itemsPerPage;
  const currentBooks = filteredByStatus.slice(indexOfFirstBook, indexOfLastBook);

  const handlePageChange = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  // Component UI Cards
  const BookCard = ({ book }) => {
    return (
      <div className="flex bg-white w-full rounded-lg mt-2 p-5 gap-5 md:gap-10 drop-shadow-lg items-center">
        <img
          src={book.hinhAnh?.[0] || "/placeholder.png"}
          className="w-[145px] h-[205px] object-cover rounded"
          onError={(e) => (e.target.src = "/placeholder.png")}
        />
        <div className="flex flex-col gap-2 w-full">
          <p className="font-bold">{book.tenSach}</p>
          <p className="italic">{book.tenTacGia}</p>
          <p>Tổng số lượng: {book.tongSoLuong}</p>
          <p>Số lượng mượn: {book.soLuongMuon}</p>
          <p>Số lượng xóa: {book.soLuongXoa}</p>
          <p className="font-semibold">
            Trạng thái:{" "}
            <span
              className={
                book.trangThai === "DA_XOA"
                  ? "text-red-500"
                  : book.trangThai === "DA_HET"
                    ? "text-[#5C4033]"
                    : "text-green-600"
              }
            >
              {book.trangThai === "DA_XOA"
                ? "Đã xóa"
                : book.trangThai === "DA_HET"
                  ? "Đã hết"
                  : "Còn sẵn"}
            </span>
          </p>
          <div className="flex justify-end gap-5 md:gap-10">
            <Button
              onClick={() => router.push(`/books/details/${book.maSach}`)}
              className="bg-[#062D76] hover:bg-gray-700 w-10 md:w-40 h-10"
            >
              <List className="w-5 h-5" color="white" />
              <p className="hidden md:block text-white">Xem chi tiết</p>
            </Button>
            <Button
              onClick={() => router.push(`/books/${book.maSach}`)}
              className="bg-[#062D76] hover:bg-gray-700 w-10 md:w-40 h-10"
            >
              <Pencil className="w-5 h-5" color="white" />
              <p className="hidden md:block text-white">Sửa sách</p>
            </Button>
            {book.trangThai !== "DA_XOA" && (
              <Button
                onClick={() => {
                  setDeleteOne(book);
                  setPopUpOpen(true);
                }}
                className="bg-[#D66766] hover:bg-gray-700 w-10 md:w-40 h-10"
              >
                <Trash2 className="w-5 h-5" color="white" />
                <p className="hidden md:block text-white">Xóa sách</p>
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  return (
    <div className="flex flex-row w-full min-h-screen bg-[#EFF3FB]">
      <Toaster position="top-center" reverseOrder={false} />
      <Sidebar />
      {isLoading ? (
        <div className="flex md:ml-52 w-full h-screen justify-center items-center">
          <ThreeDot
            color="#062D76"
            size="large"
            text="Vui lòng chờ"
            variant="bounce"
            textColor="#062D76"
          />
        </div>
      ) : (
        <div className="flex w-full flex-col py-6 md:ml-52 gap-2 items-center px-10 mt-5">
          <div className="flex w-full items-center justify-between mb-10">
            <div className="flex gap-2 p-2 rounded-md w-full max-w-5xl items-center">
              {/* Select Search Mode */}
              <select
                onChange={(e) => setMode(e.target.value)}
                value={mode}
                className="border border-gray-300 bg-gray rounded-md shadow p-2 font-thin italic h-10"
              >
                <option value="all">Tất cả</option>
                <option value="title">Tên sách</option>
                <option value="author">Tác giả</option>
                <option value="category">Thể loại</option>
                <option value="publisher">Nhà xuất bản</option>
                <option value="year">Năm xuất bản</option>
              </select>

              {/* Input Search */}
              <Input
                type="text"
                placeholder="Tìm kiếm..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch(e)}
                className="flex-1 h-10 p-3 text-black bg-white shadow font-thin italic"
              />

              {/* Status Filter (Client-side) */}
              <select
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                value={statusFilter}
                className="border border-gray-300 bg-white rounded-md shadow p-2 italic h-10"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="CON_SAN">Còn sẵn</option>
                <option value="DA_HET">Đã hết</option>
                <option value="DA_XOA">Đã xóa</option>
              </select>

              {/* Search Button */}
              <Button
                onClick={handleSearch}
                className="w-10 h-10 bg-[#062D76] hover:bg-gray-700 shadow rounded-md"
              >
                <Search className="w-5 h-5" color="white" />
              </Button>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 ml-5">
              <Button
                onClick={() => router.push("/books/categories")}
                className="w-40 h-10 bg-[#062D76] hover:bg-gray-700 font-bold rounded-[10px]"
              >
                Quản lý thể loại
              </Button>
              <Button
                onClick={() => router.push("/books/addBook")}
                className="w-40 h-10 bg-[#062D76] hover:bg-gray-700 font-bold rounded-[10px]"
              >
                <Plus className="w-5 h-5" color="white" />
                Thêm sách mới
              </Button>
            </div>
          </div>

          {/* Book List */}
          {currentBooks.length > 0 ? (
            currentBooks.map((book) => (
              <BookCard key={book.maSach} book={book} />
            ))
          ) : (
            <p className="text-gray-500 mt-10">Không tìm thấy sách nào phù hợp.</p>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-6">
              <Button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="bg-[#062D76] hover:bg-gray-700 text-white"
              >
                Trước
              </Button>
              {pageNumbers.map((number) => (
                <Button
                  key={number}
                  onClick={() => handlePageChange(number)}
                  className={`${currentPage === number
                      ? "bg-[#062D76] text-white"
                      : "bg-white text-[#062D76] border border-[#062D76] hover:bg-gray-100"
                    }`}
                >
                  {number}
                </Button>
              ))}
              <Button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="bg-[#062D76] hover:bg-gray-700 text-white"
              >
                Sau
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {popUpOpen && deleteOne && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black opacity-80"></div>
          <div className="bg-white p-6 rounded-lg shadow-lg z-10 w-120">
            <h2 className="text-lg font-bold mb-4">Xác nhận xóa</h2>
            <p>Bạn có chắc chắn muốn xóa sách này không?</p>
            <div className="flex mt-4 gap-5">
              <img
                src={deleteOne.hinhAnh?.[0]}
                className="w-[145px] h-[205px] object-cover"
              />
              <div className="flex flex-col gap-2">
                <p>MaSach: {deleteOne.maSach}</p>
                <p className="font-bold">{deleteOne.tenSach}</p>
                <p className="italic">{deleteOne.tenTacGia}</p>
                <p>Tổng số lượng: {deleteOne.tongSoLuong}</p>
                <p>Số lượng mượn: {deleteOne.soLuongMuon}</p>
              </div>
            </div>
            <div className="flex justify-end mt-4 gap-4">
              <Button
                onClick={() => setPopUpOpen(false)}
                className="bg-gray-500 hover:bg-gray-700 text-white"
              >
                Hủy
              </Button>
              <Button
                onClick={() => handleDelete(deleteOne)}
                className="bg-red-500 hover:bg-red-700 text-white"
              >
                Xóa
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Page;