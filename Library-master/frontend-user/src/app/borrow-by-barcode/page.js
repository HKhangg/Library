"use client";

import React, { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import LeftSideBar from "../components/LeftSideBar";
import ChatBotButton from "../components/ChatBoxButton";

const ScanPage = () => {
  const [barcode, setBarcode] = useState("");
  const [book, setBook] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  const handleScan = async () => {
    setMessage("");
    setBook(null);

    if (!barcode.trim()) {
      setMessage("Vui lòng nhập hoặc quét barcode trước.");
      return;
    }

    try {
      setLoading(true);

      const res = await axios.get(
       `${process.env.NEXT_PUBLIC_API_URL}/api/scan/barcode/${encodeURIComponent(
          barcode.trim()
        )}`
      );

      setBook(res.data);
      setMessage("Đã tìm thấy sách.");
    } catch (err) {
      console.error(err);
      if (err.response && err.response.status === 404) {
        setMessage("Không tìm thấy sách với barcode này.");
      } else {
        setMessage("Có lỗi xảy ra khi quét barcode.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = () => {
    if (!book || !book.id) return;
    router.push(`/book-detail/${book.id}`);
  };

  // (Tuỳ chọn) Thêm vào giỏ sách – nếu bạn đã có API giỏ
  const handleAddToCart = async () => {
    try {
      const userId = localStorage.getItem("id");
      if (!userId) {
        alert("Vui lòng đăng nhập trước khi thêm vào giỏ sách.");
        router.push("/user-login");
        return;
      }

      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/cart/${userId}/add/books`,
        [book.id] // mảng 1 phần tử
      );

      alert("Đã thêm sách vào giỏ.");
    } catch (error) {
      console.error(error);
      alert("Có lỗi khi thêm vào giỏ sách.");
    }
  };

  return (
    <div className="flex flex-col min-h-screen text-foreground">
      <main className="pt-16 flex">
        <LeftSideBar />

        <section className="flex-1 pr-5 md:pl-64 ml-5 mt-2">
          <h1 className="text-2xl font-semibold text-[#062D76] mb-4">
            Quét sách bằng Barcode
          </h1>

          {/* Form nhập barcode */}
          <div className="bg-white rounded-xl shadow p-4 mb-4">
            <label className="block font-medium mb-2">
              Nhập / quét mã vạch sách
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                className="border rounded px-3 py-2 flex-1"
                placeholder="Ví dụ: 8938505974198"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleScan();
                  }
                }}
              />
              <button
                onClick={handleScan}
                disabled={loading}
                className="px-4 py-2 bg-[#062D76] text-white rounded hover:bg-[#415987]"
              >
                {loading ? "Đang quét..." : "Quét"}
              </button>
            </div>

            {message && (
              <p className="mt-3 text-sm text-blue-700 bg-blue-50 px-3 py-2 rounded">
                {message}
              </p>
            )}
          </div>

          {/* Kết quả sách */}
          {book && (
            <div className="bg-white rounded-xl shadow p-4">
              <h2 className="text-lg font-semibold mb-3">
                Kết quả tra cứu sách
              </h2>

              <div className="flex gap-4">
                {book.hinhAnh && book.hinhAnh.length > 0 && (
                  <img
                    src={book.hinhAnh[0]}
                    alt={book.tenSach}
                    className="w-32 h-44 object-cover rounded shadow"
                  />
                )}

                <div>
                  <p>
                    <span className="font-semibold">Mã sách:</span> {book.id}
                  </p>
                  <p>
                    <span className="font-semibold">Tên sách:</span>{" "}
                    {book.tenSach}
                  </p>
                  <p>
                    <span className="font-semibold">Tác giả:</span>{" "}
                    {book.tenTacGia}
                  </p>
                  <p>
                    <span className="font-semibold">NXB:</span> {book.nxb}
                  </p>
                  <p>
                    <span className="font-semibold">Năm XB:</span> {book.nam}
                  </p>
                  <p>
                    <span className="font-semibold">Trạng thái:</span>{" "}
                    {book.trangThai}
                  </p>

                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={handleViewDetail}
                      className="px-4 py-2 bg-[#062D76] text-white rounded hover:bg-[#415987]"
                    >
                      Xem chi tiết
                    </button>
                    <button
                      onClick={handleAddToCart}
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      Thêm vào giỏ sách
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        <ChatBotButton />
      </main>
    </div>
  );
};

export default ScanPage;
