"use client";
import Sidebar from "@/app/components/sidebar/Sidebar";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { ChevronDown, CircleCheck, Plus, Undo2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { ThreeDot } from "react-loading-indicators";

import useSWR from "swr";
import { fetcher } from "@/lib/fetcher"; 

function Page() {
  const router = useRouter();

  // State quản lý dữ liệu
  const [user, setUser] = useState(null); 
  const [book, setBook] = useState(null); 
  const [borrowList, setBorrowList] = useState([]);
  const [userText, setUserText] = useState("");
  const [isDropDownOpen, setOpen] = useState(false);

  // State loading cho hành động Submit
  const [isSubmitting, setIsSubmitting] = useState(false);

  // useSWR: Lấy danh sách Users
  const { data: userList = [], isLoading: usersLoading } = useSWR(
    `${process.env.NEXT_PUBLIC_API_URL}/api/user`,
    fetcher
  );

  // useSWR: Lấy danh sách Books
  const { data: bookList = [], isLoading: booksLoading } = useSWR(
    `${process.env.NEXT_PUBLIC_API_URL}/api/book`,
    fetcher
  );

  const loading = usersLoading || booksLoading; // Loading ban đầu của trang

  const handleGoBack = () => {
    router.back();
  };

  const handleEnterUser = () => {
    // Tìm user theo ID
    const selected = userList.find((u) => u?.id?.toString() === userText.trim());
    if (!selected) {
      toast.error("Không tìm thấy người dùng với ID này");
      return;
    }
    setUser(selected);
    toast.success(`Đã chọn: ${selected.username}`);
  };

  const handleEnterBook = (selectedBook) => {
    setBook(selectedBook);
    setOpen(false); // Đóng dropdown sau khi chọn
  };

  const handleAddIntoList = () => {
    if (!book) {
      toast.error("Vui lòng chọn sách trước");
      return;
    }
    // Kiểm tra sách đã có trong danh sách chưa
    if (borrowList.find((bk) => bk.maSach === book.maSach)) {
      toast.error("Sách này đã có trong danh sách mượn");
      return;
    }
    setBorrowList((prev) => [...prev, book]);
    setBook(null); // Reset sách đang chọn
    toast.success("Đã thêm sách vào danh sách");
  };

  const handleRemoveBook = (selectedBook) => {
    setBorrowList((prev) =>
      prev.filter((item) => item.maSach !== selectedBook.maSach)
    );
  };

  const handleSubmit = async () => {
    // Validation
    if (!user) {
      toast.error("Vui lòng nhập ID người mượn");
      return;
    }
    if (borrowList.length < 1) {
      toast.error("Danh sách mượn đang trống");
      return;
    }

    // Confirm action trước khi submit
    if (!confirm(`Tạo phiếu mượn cho ${user.username} với ${borrowList.length} cuốn sách?`)) {
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading("Đang tạo phiếu mượn...");

    try {
      const borrowedBooks = borrowList.map((item) => ({
        bookId: item.maSach,
        childBookId: null, 
      }));

      // Deadline 7 ngày tính từ ngày mượn
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 7);

      const borrowCardRequest = {
        userId: user.id,
        borrowedBooks,
        borrowDate: new Date().toISOString(),
        status: "REQUESTED",
        dueDate: dueDate.toISOString(),
      };

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/borrow-cards`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(borrowCardRequest),
        }
      );

      if (response.ok) {
        toast.success("Tạo phiếu mượn thành công!", { id: toastId });
        setTimeout(() => router.back(), 1000);
      } else {
        throw new Error("API Error");
      }
    } catch (error) {
      console.error("Lỗi khi tạo phiếu mượn:", error);
      toast.error("Tạo phiếu thất bạVui lòng thử lại.", { id: toastId });
      setIsSubmitting(false);
    }
  };

  const BookCard = ({ bookItem }) => {
    return (
      <div className="w-full h-[200px] p-5 flex justify-between items-center my-3 px-5 border-b border-gray-200">
        <div className="flex flex-col gap-1">
          <p className="font-semibold text-gray-500">ID: <span className="text-black">{bookItem?.maSach}</span></p>
          <p className="font-bold text-lg text-[#062D76]">{bookItem?.tenSach}</p>
          <p className="italic text-sm">{bookItem?.tenTacGia}</p>
          <p className="text-sm">{bookItem?.nxb}</p>
          <Button
            className="mt-2 w-10 h-10 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center"
            title="Xóa khỏi danh sách"
            onClick={() => handleRemoveBook(bookItem)}
          >
            <X className="w-6 h-6 text-white" />
          </Button>
        </div>
        <img
          src={bookItem?.hinhAnh?.[0] || "/placeholder.png"}
          className="w-[100px] h-[140px] object-cover rounded shadow-md"
          alt={bookItem?.tenSach}
          onError={(e) => e.target.src = "/placeholder.png"}
        />
      </div>
    );
  };

  return (
    <div className="flex flex-row w-full h-full min-h-screen bg-[#EFF3FB] pb-15">
      <Toaster position="top-center" reverseOrder={false} />
      <Sidebar />
      {loading ? (
        <div className="flex md:ml-52 w-full h-screen justify-center items-center">
          <ThreeDot color="#062D76" size="large" text="Đang tải dữ liệu..." textColor="#062D76" />
        </div>
      ) : (
        <div className="flex w-full flex-col py-6 md:ml-52 relative mt-10 gap-2 items-center px-10">
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

          {/* Chọn User */}
          <div className="flex w-full justify-between gap-10">
            <div className="flex flex-col w-1/2 space-y-2 relative text-left">
              <p className="font-semibold text-lg mt-3">ID Người Dùng</p>
              <div className="flex gap-2">
                <Input
                  placeholder="Nhập ID và nhấn Enter"
                  className="bg-white text-black rounded-lg h-10 flex-1 shadow-sm"
                  value={userText}
                  onChange={(e) => setUserText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleEnterUser()}
                />
                <Button
                  className="bg-[#062D76] text-white hover:bg-blue-800"
                  onClick={handleEnterUser}
                >
                  Tìm
                </Button>
              </div>
            </div>
            {/* Hiển thị Tên User */}
            <div className="flex flex-col w-1/2 gap-[5px] md:gap-[10px]">
              <p className="font-semibold text-lg mt-3">Tên Người Dùng</p>
              <p className={`font-semibold text-gray-700 rounded-lg w-full h-10 flex items-center px-5 ${user ? "bg-green-100 text-green-800" : "bg-gray-300"}`}>
                {user ? user.username : "Chưa chọn người dùng"}
              </p>
            </div>
          </div>

          {/* Chọn Sách */}
          <div className="flex w-full justify-between mt-4">
            <div className="flex flex-col w-full space-y-2 relative text-left">
              <p className="font-semibold text-lg mt-3">Chọn Sách</p>
              <div className="flex gap-3">
                <div className="relative w-full">
                  <Button
                    className="bg-white text-black rounded-lg w-full h-10 flex relative justify-between hover:bg-gray-100 border border-gray-300"
                    onClick={() => setOpen(!isDropDownOpen)}
                  >
                    <p className="truncate pr-8">
                      {book
                        ? `${book.maSach} - ${book.tenSach} (${book.tenTacGia})`
                        : "Nhấn để chọn sách từ danh sách"}
                    </p>
                    <ChevronDown className="w-5 h-5 text-[#062D76] absolute right-3" />
                  </Button>

                  {/* Dropdown List */}
                  {isDropDownOpen && (
                    <div className="absolute top-12 left-0 w-full h-[300px] overflow-y-auto bg-white rounded-lg border shadow-xl z-20">
                      {bookList.map((item, index) => (
                        <div
                          key={index}
                          className="flex items-center text-left h-12 w-full px-4 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-0"
                          onClick={() => handleEnterBook(item)}
                        >
                          <p className="text-sm truncate">
                            <span className="font-bold text-[#062D76]">{item.maSach}</span> - {item.tenSach} <span className="text-gray-500 italic">- {item.tenTacGia}</span>
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Button
                  className="w-12 h-10 bg-[#062D76] hover:bg-blue-800 rounded-lg flex items-center justify-center"
                  onClick={handleAddIntoList}
                  title="Thêm vào danh sách mượn"
                >
                  <Plus className="w-6 h-6 text-white" />
                </Button>
              </div>
            </div>
          </div>

          {/* Danh sách mượn (Preview) */}
          <div className="w-full mt-6">
            <h3 className="font-bold text-xl mb-2 text-[#062D76]">Danh sách sách mượn ({borrowList.length})</h3>
            <div className="w-full h-[400px] rounded-xl bg-white shadow-inner overflow-y-auto grid grid-cols-1 lg:grid-cols-2 gap-4 p-4 border border-gray-200">
              {borrowList.length < 1 ? (
                <div className="col-span-full flex flex-col items-center justify-center text-gray-400 h-full">
                  <p>Chưa có sách nào được thêm.</p>
                </div>
              ) : (
                borrowList.map((item, index) => (
                  <BookCard key={index} bookItem={item} />
                ))
              )}
            </div>
          </div>

          {/* Footer Controls */}
          <div className="fixed bottom-0 right-0 w-full bg-white border-t border-gray-200 p-4 flex justify-end items-center z-30 md:pl-64">
            <Button
              title={"Hoàn Tất"}
              className={`rounded-full px-8 h-12 flex items-center gap-2 text-lg font-bold text-white transition-all ${isSubmitting ? "bg-gray-400 cursor-not-allowed" : "bg-[#062D76] hover:bg-blue-800 shadow-lg hover:shadow-xl"
                }`}
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ThreeDot color="#FFFFFF" size="small" />
              ) : (
                <>
                  <CircleCheck className="w-6 h-6" /> Hoàn Tất
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
export default Page;