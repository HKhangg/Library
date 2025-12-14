"use client";
import Sidebar from "@/app/components/sidebar/Sidebar";
import { Button } from "@/app/components/ui/button";
import { ChevronDown, CircleCheck, Undo2 } from "lucide-react";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import toast, { Toaster } from "react-hot-toast";
import { ThreeDot } from "react-loading-indicators";

import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";

function AddFine() {
  const router = useRouter();

  const [user, setUser] = useState(null); // User object
  const [userText, setUserText] = useState(""); // Input ID User
  const [money, setMoney] = useState(0);
  const [reason, setReason] = useState(""); // Lý do phạt
  const [more, setMore] = useState(""); // Nội dung 'Khác'

  // State liên quan đến lý do phạt
  const [borrow, setBorrow] = useState(null); // Phiếu mượn được chọn (cho lỗi Trả muộn)
  const [book, setBook] = useState(null); // Sách được chọn (cho lỗi Mất sách)
  const [bookText, setBookText] = useState(""); // Input ID Sách

  // UI State
  const [isBorrowDropDownOpen, setBorrowDropDownOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 2. useSWR: Lấy danh sách Users (Fetch 1 lần)
  const { data: userList = [] } = useSWR(
    `${process.env.NEXT_PUBLIC_API_URL}/api/user`,
    fetcher
  );

  // 3. useSWR: Lấy danh sách Phiếu mượn của User (Chỉ fetch khi đã chọn User)
  const { data: borrowList = [] } = useSWR(
    user ? `${process.env.NEXT_PUBLIC_API_URL}/api/borrow-cards/user/${user.id}` : null,
    // Lưu ý: API này code cũ dùng method POST, nhưng fetcher mặc định GET. 
    // Nếu API backend bắt buộc POST, ta cần custom fetcher. 
    // Giả sử ở đây ta sửa lại dùng fetcher GET hoặc custom fetcher:
    async (url) => {
      const res = await fetch(url, { method: "POST" }); // Giữ method POST như code cũ
      if (res.status === 204) return [];
      return res.json();
    }
  );

  const handleGoBack = () => {
    router.back();
  };

  // Handlers tìm kiếm
  const handleEnterUser = () => {
    const selected = userList.find((u) => u.id.toString() === userText.trim());
    if (!selected) {
      toast.error("Không tìm thấy người dùng với ID này");
      return;
    }
    setUser(selected);
    setBorrow(null); // Reset phiếu mượn khi đổi user
    toast.success(`Đã chọn: ${selected.fullname || selected.username}`);
  };

  const handleEnterBook = async () => {
    if (!bookText.trim()) return;

    const toastId = toast.loading("Đang tìm sách...");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/bookchild/${bookText}`);
      if (!res.ok) throw new Error("Not found");
      const data = await res.json();

      setBook(data);
      toast.success("Đã tìm thấy sách", { id: toastId });
    } catch (error) {
      toast.error("Không tìm thấy sách với ID này", { id: toastId });
      setBook(null);
    }
  };

  const handleReasonChange = (e) => {
    setReason(e.target.value);
    // Reset các state phụ thuộc khi đổi lý do
    setBorrow(null);
    setBook(null);
    setMore("");
  };

  // Submit Handler
  const handleSubmit = async () => {
    // Validation
    if (!user) return toast.error("Vui lòng chọn Người dùng.");
    if (!money || money <= 0) return toast.error("Vui lòng nhập số tiền phạt hợp lệ.");
    if (!reason) return toast.error("Vui lòng chọn lý do phạt.");

    let cardIdValue = null;

    if (reason === "Trả sách trễ hạn") {
      if (!borrow) return toast.error("Vui lòng chọn Phiếu mượn.");
      cardIdValue = borrow.id;
    } else if (reason === "Làm mất sách") {
      if (!book) return toast.error("Vui lòng nhập và kiểm tra ID sách.");
      cardIdValue = book.id;
    } else if (reason === "Khác") {
      if (!more.trim()) return toast.error("Vui lòng nhập nội dung phạt.");
      cardIdValue = more; // Backend lưu string vào trường cardId ?? (Theo logic code cũ)
    }

    const payload = {
      userId: user.id,
      soTien: Number.parseFloat(money),
      noiDung: reason,
      cardId: cardIdValue,
    };

    setIsSubmitting(true);
    const toastId = toast.loading("Đang tạo phiếu phạt...");

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/addFine`, // Endpoint thêm phạt
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) throw new Error("API Error");

      toast.success("Thêm phiếu phạt thành công!", { id: toastId });
      setTimeout(() => handleGoBack(), 1000);
    } catch (error) {
      console.error(error);
      toast.error("Tạo phiếu thất bại. Vui lòng thử lại.", { id: toastId });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-row w-full h-dvh bg-[#EFF3FB]">
      <Toaster position="top-center" reverseOrder={false} />
      <Sidebar />
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

        {/* Form Nhập Liệu */}

        {/* 1. Chọn User */}
        <div className="flex w-full justify-between gap-10">
          <div className="flex flex-col w-1/2 space-y-2 relative text-left">
            <p className="font-semibold text-lg mt-3">ID Người Dùng</p>
            <div className="flex gap-2">
              <Input
                placeholder="Nhập ID và nhấn Enter"
                className="bg-white text-black rounded-lg h-10 flex-1"
                value={userText}
                onChange={(e) => setUserText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleEnterUser()}
              />
              <Button onClick={handleEnterUser} className="bg-[#062D76]">Tìm</Button>
            </div>
          </div>

          <div className="flex flex-col w-1/2 gap-[5px] md:gap-[10px]">
            <p className="font-semibold text-lg mt-3">Tên Người Dùng</p>
            <p className={`font-semibold text-gray-700 rounded-lg w-full h-10 flex items-center px-5 ${user ? "bg-green-100" : "bg-gray-300"}`}>
              {user ? (user.fullname || user.username) : "Chưa chọn người dùng"}
            </p>
          </div>
        </div>

        {/* 2. Số tiền */}
        <div className="flex flex-col w-full gap-[5px] md:gap-[10px]">
          <p className="font-semibold text-lg mt-3">Số Tiền (VNĐ)</p>
          <Input
            type="number"
            placeholder="Nhập số tiền phạt"
            className="font-semibold rounded-lg w-full h-10 flex items-center px-5 bg-white"
            value={money}
            onChange={(e) => setMoney(e.target.value)}
          />
        </div>

        {/* 3. Nội dung phạt */}
        <div className="flex flex-col w-full gap-[5px] md:gap-[10px]">
          <p className="font-semibold text-lg mt-3">Nội Dung Vi Phạm</p>

          {/* Option A: Trả sách trễ */}
          <div className="flex items-center gap-2 mt-2">
            <input
              type="radio"
              name="reason"
              className="w-5 h-5 cursor-pointer"
              value="Trả sách trễ hạn"
              checked={reason === "Trả sách trễ hạn"}
              onChange={handleReasonChange}
            />
            <p className="font-semibold text-md w-40">Trả sách trễ hạn</p>

            {reason === "Trả sách trễ hạn" && (
              <div className="relative inline-block text-left w-full ml-10">
                <Button
                  className="bg-white text-black border border-gray-300 rounded-lg w-full h-10 flex justify-between hover:bg-gray-100"
                  onClick={() => setBorrowDropDownOpen(!isBorrowDropDownOpen)}
                  disabled={!user}
                >
                  {borrow ? `Phiếu #${borrow.id}` : "Chọn Phiếu Mượn"}
                  <ChevronDown className="w-5 h-5 text-[#062D76]" />
                </Button>

                {isBorrowDropDownOpen && (
                  <div className="absolute top-11 bg-white rounded-lg w-full z-50 shadow-lg max-h-40 overflow-y-auto border border-gray-200">
                    {borrowList.length > 0 ? borrowList.map((item) => (
                      <div
                        key={item.id}
                        className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-sm"
                        onClick={() => {
                          setBorrow(item);
                          setBorrowDropDownOpen(false);
                        }}
                      >
                        Phiếu #{item.id} - Ngày mượn: {new Date(item.borrowDate).toLocaleDateString("vi-VN")}
                      </div>
                    )) : (
                      <div className="px-4 py-2 text-gray-500 text-sm">Không có phiếu mượn nào</div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Option B: Làm mất sách */}
          <div className="flex items-center gap-2 mt-2">
            <input
              type="radio"
              name="reason"
              className="w-5 h-5 cursor-pointer"
              value="Làm mất sách"
              checked={reason === "Làm mất sách"}
              onChange={handleReasonChange}
            />
            <p className="font-semibold text-md w-40">Làm mất sách</p>

            {reason === "Làm mất sách" && (
              <div className="flex gap-2 w-full ml-10">
                <Input
                  placeholder="Nhập ID sách và nhấn Enter"
                  className="bg-white text-black rounded-lg h-10 flex-1 border border-gray-300"
                  value={bookText}
                  onChange={(e) => setBookText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleEnterBook()}
                />
                {book && <span className="text-green-600 font-bold self-center">✓ {book.tenSach}</span>}
              </div>
            )}
          </div>

          {/* Option C: Khác */}
          <div className="flex items-center gap-2 mt-2">
            <input
              type="radio"
              name="reason"
              className="w-5 h-5 cursor-pointer"
              value="Khác"
              checked={reason === "Khác"}
              onChange={handleReasonChange}
            />
            <p className="font-semibold text-md w-40">Khác</p>

            {reason === "Khác" && (
              <Input
                type="text"
                placeholder="Nhập nội dung chi tiết"
                className="bg-white w-full ml-10 h-10 border border-gray-300 rounded-lg"
                value={more}
                onChange={(e) => setMore(e.target.value)}
              />
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="w-full bottom-0 px-10 left-0 md:left-52 md:w-[calc(100%-208px)] fixed h-20 bg-white flex items-center justify-end border-t border-gray-200 z-20">
          <Button
            title={"Hoàn Tất"}
            className={`rounded-full px-8 h-12 flex items-center gap-2 font-bold text-white transition-all ${isSubmitting ? "bg-gray-400 cursor-not-allowed" : "bg-[#062D76] hover:bg-blue-800 shadow-lg hover:shadow-xl"
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
    </div>
  );
}

export default AddFine;