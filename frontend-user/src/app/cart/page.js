"use client";
import React, { useState, useEffect } from "react";
import LeftSideBar from "../components/LeftSideBar";
import BookCard from "./book";
import axios from "axios";
import { ThreeDot } from "react-loading-indicators";

const Page = () => {
  const [selected, setSelected] = useState([]);
  const [maxAllowed, setMaxAllowed] = useState(null);
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(localStorage.getItem("persist:root"));
  let cartId = "";

  const fetchMaxAllowed = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/settings`);
      if (!res.ok) throw new Error("Không thể tải cài đặt.");
      const result = await res.json();
      setMaxAllowed(result.maxBorrowedBooks);
    } catch (error) {
      console.error("Lỗi khi lấy cài đặt:", error);
      setMaxAllowed(5);
    } 
  };


  const fetchCart = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/cart/${user.id}`);
      if (response.ok) {
        const data = await response.json();
        cartId = data.data.id;
        setBooks(Array.isArray(data.data) ? data.data : []);
      }
      else {
        console.error("Lỗi khi lấy giỏ hàng");
        setBooks([]);
      }
    } catch (error) {
      console.error(error);
      setBooks([]);
    } finally {
      setLoading(false);
    }
  };

useEffect(() => {
    if (!user?.id) {
      setBooks([]);
      setLoading(false);
      return;
    }
    fetchMaxAllowed();
    fetchCart();
  }, [user?.id]);

  const toggleBook = (bookId, checked) => {
    setSelected((prev) => (checked ? [...prev, bookId] : prev.filter((i) => i !== bookId)));
  };

  const allChecked = selected.length === books?.length;
 const toggleAll = (checked) => setSelected(checked ? books.map((b) => b.bookId) : []);

  const handleDeleteBooks = async () => {
    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/api/cart/${user.id}/remove/books`, {
        data: selected,
      });
      fetchCart();
      alert("Xóa sách thành công!");
      setSelected([]);
    } catch (error) {
      console.error(error);
      alert("Đã có lỗi khi xóa sách!");
    }
  };

  const handleBorrowBooks = async () => {
    try {
      const booksInCart = selected;
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/borrow-cards`, {
        userId: user.id,
        borrowedBooks: booksInCart.map((bookId) => ({ bookId, childBookId: null })),
        borrowDate: new Date().toISOString(),
        status: "REQUESTED",
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      });

      if (response.status === 200) {
        alert("Phiếu mượn đã được tạo!");
        await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/api/cart/${user.id}/remove/books`, {
          data: booksInCart,
        });
        window.location.href = "/borrowed-card";
      } else alert("Không thể tạo phiếu mượn");
    } catch (error) {
      console.error(error);
      alert("Bạn đã vượt quá số lượng sách mượn tối đa hoặc có lỗi xảy ra.");
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

              {loading ? (
              <div className="flex justify-center items-center h-[300px]">
                <ThreeDot
                  color="#30c9e8"
                  size="large"
                  text="Đang tải sách..."
                  variant="bounce"
                  textColor="#30c9e8"
                />
              </div>
            ) : !loading && books.length === 0 ? (
              <p className="text-center text-gray-500 dark:text-gray-400 py-10">
                Giỏ sách trống, hãy thêm sách để mượn nhé 📚
              </p>
            ) : (
            <div className="grid grid-cols-1 max-sm:grid-cols-1 gap-5 items-start mt-5 w-full max-md:max-w-full z-10">
              {Array.isArray(books) &&
                books.map((book, index) => (
                  <BookCard
                    key={book.bookId}
                    id={book.bookId}
                    imageSrc={book.hinhAnh[0]}
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
