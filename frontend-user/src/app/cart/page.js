"use client";
import React, { useState, useEffect } from "react";
import LeftSideBar from "../components/LeftSideBar";
import BookCard from "./book";
import axios from "axios";
import { ThreeDot } from "react-loading-indicators";
import { toast } from "sonner";
import { useCart } from "@/app/context/CartContext";
import useSWR, { mutate } from "swr";

// Fetcher dùng chung cho GET request
const fetcher = (url) => axios.get(url).then((res) => res.data);

const Page = () => {
  const [selected, setSelected] = useState([]);
  const [user, setUser] = useState(null);

  // Lấy hàm update Header từ Context
  const { fetchCart: fetchCartCount } = useCart();

  // Lấy user từ localStorage (client-side only)
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("persist:root"));
    setUser(storedUser);
  }, []);

  // 2. useSWR: Lấy Cài đặt (Max Borrowed Books)
  const { data: settingsData } = useSWR(
    `${process.env.NEXT_PUBLIC_API_URL}/api/settings`,
    fetcher
  );
  const maxAllowed = settingsData?.maxBorrowedBooks || 5;

  // 3. useSWR: Lấy Giỏ hàng
  // Key phụ thuộc vào user.id, nếu chưa có user thì không fetch (null)
  const cartApiUrl = user?.id
    ? `${process.env.NEXT_PUBLIC_API_URL}/api/cart/${user.id}`
    : null;

  const { data: cartResponse, isLoading } = useSWR(cartApiUrl, fetcher, {
    revalidateOnFocus: true, // Tự động làm mới khi quay lại tab
    fallbackData: { data: [] }, // Dữ liệu mặc định
  });

  // Trích xuất mảng sách từ response (API trả về object có thuộc tính .data)
  const books = Array.isArray(cartResponse?.data) ? cartResponse.data : [];

  const toggleBook = (bookId, checked) => {
    setSelected((prev) =>
      checked ? [...prev, bookId] : prev.filter((i) => i !== bookId)
    );
  };

  const allChecked = books.length > 0 && selected.length === books.length;

  const toggleAll = (checked) =>
    setSelected(checked ? books.map((b) => b.bookId) : []);

  // Hàm xóa sách khỏi giỏ dùng mutate
  const handleDeleteBooks = async () => {
    if (selected.length === 0) {
      toast.warning("Vui lòng chọn sách cần xóa");
      return;
    }

    const toastId = toast.loading("Đang xóa sách...");
    try {
      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL}/api/cart/${user.id}/remove/books`,
        { data: selected }
      );

      // A. Cập nhật dữ liệu tại chỗ (Local Mutate) để giao diện nhanh hơn
      // (Báo cho SWR biết dữ liệu mới là gì mà không cần chờ server trả lời ngay)
      mutate(cartApiUrl, {
        ...cartResponse,
        data: books.filter(b => !selected.includes(b.bookId))
      }, false);

      // B. Gọi API ngầm để xác thực lại dữ liệu chuẩn
      mutate(cartApiUrl);

      // C. Cập nhật Header
      fetchCartCount();

      toast.success(`Đã xóa ${selected.length} sách khỏi giỏ.`, { id: toastId });
      setSelected([]); // Reset lựa chọn
    } catch (error) {
      console.error(error);
      toast.error("Đã có lỗi khi xóa sách!", { id: toastId });
    }
  };

  // Hàm mượn sách từ giỏ dùng mutate
  const handleBorrowBooks = async () => {
    if (selected.length === 0) {
      toast.warning("Vui lòng chọn sách để mượn");
      return;
    }

    const toastId = toast.loading("Đang tạo phiếu mượn...");
    try {
      const booksInCart = selected; // Mảng ID sách

      // Payload chuẩn cho backend
      const payload = {
        userId: parseInt(user.id, 10),
        borrowedBooks: booksInCart.map((bookId) => ({
          bookId: parseInt(bookId, 10),
          childBookId: null,
        })),
        borrowDate: new Date().toISOString(),
        status: "REQUESTED",
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      };

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/borrow-cards`,
        payload
      );

      if (response.status === 200) {
        toast.success("Phiếu mượn đã được tạo!", { id: toastId });

        // Xóa sách khỏi giỏ hàng sau khi mượn
        await axios.delete(
          `${process.env.NEXT_PUBLIC_API_URL}/api/cart/${user.id}/remove/books`,
          { data: booksInCart }
        );

        // A. Cập nhật SWR (Làm mới giỏ hàng)
        mutate(cartApiUrl);

        // B. Cập nhật Header
        fetchCartCount();

        // C. Chuyển trang
        window.location.href = "/borrowed-card";
      } else {
        toast.error("Không thể tạo phiếu mượn", { id: toastId });
      }
    } catch (error) {
      console.error("Lỗi khi tạo phiếu mượn:", error);
      let errorMessage = "Có lỗi xảy ra, vui lòng thử lại.";
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      toast.error(errorMessage, { id: toastId });
    }
  };

  const exceedLimit = selected.length > maxAllowed;

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300">
      <main className="pt-16 flex">
        <LeftSideBar />
        <section className="self-stretch pr-5 md:pl-64 ml-5 my-auto w-full max-md:max-w-full mt-4 ">
          <div className="flex flex-col p-5 w-full bg-white dark:bg-gray-800 rounded-xl transition-colors duration-300">
            <div className="flex items-center justify-center mt-0 gap-1">
              <h2 className="gap-2.5 self-center px-5 py-2 text-[2rem] font-extrabold font-lora rounded-lg text-[#30c9e8] dark:text-[#30c9e8]">
                Giỏ sách
              </h2>
            </div>

            {/* Loading State */}
            {isLoading ? (
              <div className="flex justify-center items-center h-[300px]">
                <ThreeDot
                  color="#30c9e8"
                  size="large"
                  text="Đang tải sách..."
                  variant="bounce"
                  textColor="#30c9e8"
                />
              </div>
            ) : books.length === 0 ? (
              <p className="text-center text-gray-500 dark:text-gray-400 py-10">
                Giỏ sách trống, hãy thêm sách để mượn nhé 📚
              </p>
            ) : (
              <div className="grid grid-cols-1 max-sm:grid-cols-1 gap-5 items-start mt-5 w-full max-md:max-w-full z-10">
                {books.map((book) => (
                  <BookCard
                    key={book.bookId}
                    id={book.bookId}
                    imageSrc={book.hinhAnh?.[0]}
                    available={
                      book.tongSoLuong - book.soLuongMuon - book.soLuongXoa > 0
                        ? "Còn sẵn"
                        : "Hết sách"
                    }
                    title={book.tenSach}
                    author={book.tenTacGia}
                    publisher={book.nxb}
                    borrowCount={book.soLuongMuon}
                    checked={selected.includes(book.bookId)}
                    onCheck={(c) => toggleBook(book.bookId, c)}
                    hoverEffect={true}
                  />
                ))}
              </div>
            )}
          </div>

          {selected.length > 0 && (
            <footer className="fixed bottom-0 self-stretch mr-5 md:left-64 ml-5 right-0 
                     bg-blue-50 dark:bg-gray-800/80 backdrop-blur-md shadow-lg 
                     p-4 flex justify-between items-center rounded-t-xl 
                     transition-all duration-300 border-t border-gray-300 dark:border-gray-600 z-20">
              {/* Checkbox chọn tất cả */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="w-5 h-5 accent-[#F7302E] cursor-pointer"
                  checked={allChecked}
                  onChange={(e) => toggleAll(e.target.checked)}
                />
                <span className="text-sm font-medium text-[#062D76] dark:text-[#30c9e8]">
                  Chọn tất cả ({books.length})
                </span>
              </div>

              {/* Nút hành động */}
              <div className="flex items-center gap-3">
                <button
                  onClick={handleDeleteBooks}
                  className="px-5 py-2.5 rounded-xl border border-transparent 
                       bg-gradient-to-r from-[#F7302E] to-[#F44336] 
                       text-white font-medium shadow-sm hover:brightness-110 
                       hover:scale-[1.03] active:scale-95 transition-all duration-300"
                >
                  Xóa sách ({selected.length})
                </button>

                <button
                  onClick={handleBorrowBooks}
                  className="px-5 py-2.5 rounded-xl border border-transparent 
                       bg-gradient-to-r from-[#062D76] to-[#0a3c9d]
                       text-white font-medium shadow-sm hover:brightness-110 
                       hover:scale-[1.03] active:scale-95 transition-all duration-300"
                >
                  Đăng ký mượn ({selected.length})
                </button>
                {exceedLimit && (
                  <p className="text-red-500 text-sm">
                    Bạn chỉ được mượn tối đa {maxAllowed} sách.
                  </p>
                )}
              </div>
            </footer>
          )}
        </section>
      </main>
    </div>
  );
};

export default Page;