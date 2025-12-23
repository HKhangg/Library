"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import LeftSideBar from "../../components/LeftSideBar";
import ChatBotButton from "../../components/ChatBoxButton";
import { CheckCircle, XCircle } from "lucide-react";
import { Button } from "../../../components/ui/button";
import BookReview from "../../../components/ui/bookreview";
import axios from "axios";
import { BsCartPlus } from "react-icons/bs";
import { useRouter } from "next/navigation";
import { ThreeDot } from "react-loading-indicators";

import { toast } from "sonner";
import { useCart } from "@/app/context/CartContext";
const BookDetailsPage = () => {
  const { id } = useParams();
  const router = useRouter();
  const [details, setDetails] = useState(null);
  const user = JSON.parse(localStorage.getItem("persist:root")) || null;
  const [isAddedToCart, setIsAddedToCart] = useState(false);
  const { fetchCart } = useCart();

  // map enum sang label
  const statusMap = {
    CON_SAN: {
      label: "Còn sẵn",
      icon: <CheckCircle className="text-green-500" />,
      available: true,
    },
    DA_HET: {
      label: "Đã hết",
      icon: <XCircle className="text-red-500" />,
      available: false,
    },
  };

  useEffect(() => {
    const fetchBook = async () => {
      try {
        const { data } = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/book/${id}`
        );
        const book = Array.isArray(data) ? data[0] : data;
        setDetails(book);
      } catch (err) {
        console.error("Lỗi khi fetch chi tiết sách:", err);
      }
    };
    fetchBook();
  }, [id]);

  useEffect(() => {
    if (user?.id) {
      const checkBookInCart = async () => {
        try {
          const res = await axios.get(
            `${process.env.NEXT_PUBLIC_API_URL}/api/cart/${user.id}`
          );
          const cartBooks = res.data.data;
          const found = cartBooks?.some((book) => book.bookId == id);
          setIsAddedToCart(found);
        } catch (error) {
          console.error("Lỗi khi kiểm tra giỏ hàng:", error);
        }
      };
      checkBookInCart();
    }
  }, [user?.id, id]);

  if (!details) {
    return (
      <div className="flex justify-center items-center h-[300px]">
        <ThreeDot
          color="#30c9e8"
          size="large"
          text="Đang tải sách..."
          variant="bounce"
          textColor="#30c9e8"
        />
      </div>
    );
  }


  const handleAddToCart = async () => {
    if (!user?.id) {
      toast.warning("Bạn cần đăng nhập để thêm vào giỏ hàng!");
      router.push("/user-login");
    } else {
      const toastId = toast.loading("Đang thêm sách vào giỏ...");
      try {
        const res = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/api/cart/${user.id}/add/books`,
          [id]
        );
        toast.success("Đã thêm sách vào giỏ!", { id: toastId });
        setIsAddedToCart(true);
        fetchCart();
        //window.location.reload();
      } catch (error) {
        console.error("Lỗi khi thêm sách vào giỏ:", error);
        toast.error("Có lỗi xảy ra khi thêm sách vào giỏ.", { id: toastId });
      }
    }
  };

  const handleBorrowBook = async () => {
    // 1. Kiểm tra user
    if (!user?.id) {
      toast.warning("Bạn cần đăng nhập để mượn sách!");
      router.push("/user-login");
      return;
    }
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/borrow-cards`,
        {
          userId: user.id,
          bookIds: [parseInt(id)]  // Gửi đúng format như backend expect
        }
      );

      if (response.status === 200) {
        alert("Phiếu mượn đã được tạo thành công!");
        window.location.href = "/borrowed-card";
      } else {
        alert("Có lỗi xảy ra khi tạo phiếu mượn");
      }
    } catch (error) {
      console.error("Lỗi gọi API mượn sách:", error);
      let errorMessage = "Không thể mượn sách. Vui lòng thử lại.";
      if (error.response) {
        const status = error.response.status;
        const errorData = error.response.data;
        if (status === 400) {
          errorMessage = "Bạn đã đạt đến giới hạn mượn sách hoặc đã mượn sách này rồi.";
        }
        if (errorData) {
          if (typeof errorData === 'string' && errorData.length > 0) {
            errorMessage = errorData;
          } else if (typeof errorData === 'object') {
            const specificMessage = errorData.message || errorData.error || errorData.detail;
            if (specificMessage) {
              errorMessage = specificMessage;
            }
          }
        }
      } else if (error.request) {
        errorMessage = "Không nhận được phản hồi từ máy chủ. Vui lòng kiểm tra kết nối mạng.";
      } else {
        errorMessage = error.message;
      }
      toast.error(errorMessage);
    }
  };

  let key = details.trangThai;
  if (!key) {
    const anyAvailable = details.children?.some((c) => c.available);
    key = anyAvailable ? "CON_SAN" : "DA_HET";
  }
  const { label, icon, available } = statusMap[key] || statusMap.CON_SAN;

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-gray-900 text-foreground transition-colors duration-300">
      <main className="pt-16 flex">
        <section className="flex-1 pr-5 md:pl-64 ml-5 mt-8 z-10">

          <div className="flex flex-col md:flex-row p-6 bg-blue-50 dark:bg-gray-800 rounded-3xl shadow-md gap-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:bg-blue-100/60 dark:hover:bg-gray-700/80">

            <img
              src={details.hinhAnh?.[0] || ""}
              alt={details.tenSach}
              className="w-33 md:w-35 rounded-lg shadow-lg object-cover transition-transform duration-500 hover:scale-105 hover:shadow-2xl"
            />

            <div className="flex flex-col justify-between flex-1">
              <div>
                <h1 className="text-2xl font-semibold text-[#062D76] dark:text-[#30c9e8] transition-colors duration-300">
                  {details.tenSach}
                </h1>
                <p className="text-gray-700 dark:text-gray-300 font-semibold">
                  Tác giả: {details.tenTacGia}
                </p>
                <p className="text-gray-700 dark:text-gray-300">
                  <span className="font-semibold">Thể loại:</span>{" "}
                  {details.categoryChildName ?? "—"}
                </p>
                <p className="text-gray-700 dark:text-gray-300">
                  <span className="font-semibold">NXB:</span> {details.nxb}
                </p>
                <p className="flex items-center gap-2 font-semibold text-gray-800 dark:text-gray-200">
                  Trạng thái: {label} {icon}
                </p>
                <p className="text-gray-700 dark:text-gray-300">
                  <span className="font-semibold">Lượt mượn:</span>{" "}
                  {details.soLuongMuon} lượt
                </p>
              </div>

              <div className="flex items-center gap-5 mt-6">
                <Button
                  onClick={handleBorrowBook}
                  className="bg-[#30c9e8] hover:bg-[#1bb3d1] text-white font-roboto font-bold py-2 px-4 rounded-3xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
                >
                  Mượn ngay
                </Button>

                <Button
                  onClick={handleAddToCart}
                  disabled={isAddedToCart}
                  className={`font-roboto font-bold py-2 px-4 rounded-3xl border-2 flex items-center gap-2 transition-all duration-300 transform hover:scale-105 hover:shadow-lg ${isAddedToCart
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed border-gray-400"
                      : "bg-white dark:bg-gray-700 text-[#062D76] dark:text-[#30c9e8] hover:bg-[#E6EAF1] dark:hover:bg-gray-600 border-[#062D76] dark:border-[#30c9e8]"
                    }`}
                >
                  <BsCartPlus className="w-5 h-5" />
                  {isAddedToCart ? "Đã thêm" : "Thêm vào giỏ"}
                </Button>
              </div>
            </div>
          </div>


          <div className="mt-6 p-6 bg-blue-50 dark:bg-gray-800 rounded-3xl shadow-md transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:bg-blue-100/60 dark:hover:bg-gray-700/80">
            <h2 className="text-lg font-roboto font-bold bg-[#9ce5f4] shadow-md dark:bg-[#30c9e8] text-[#062D76] dark:text-white p-2 rounded-lg w-fit">
              Thông tin chi tiết
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 text-gray-800 dark:text-gray-300">
              <p><span className="font-semibold">Mã sách:</span> {details.maSach}</p>
              <p><span className="font-semibold">Năm XB:</span> {details.nam}</p>
              <p><span className="font-semibold">Trọng lượng:</span> {details.trongLuong} g</p>
              <p><span className="font-semibold">Đơn giá:</span> {details.donGia} đ</p>
              <p><span className="font-semibold">Tổng số lượng:</span> {details.tongSoLuong}</p>
            </div>
          </div>

          <div className="mt-6 p-6 bg-blue-50 dark:bg-gray-800 rounded-3xl shadow-md transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:bg-blue-100/60 dark:hover:bg-gray-700/80">
            <h2 className="text-lg font-roboto font-bold bg-[#9ce5f4] dark:bg-[#30c9e8] shadow-md text-[#062D76] dark:text-white p-2 rounded-lg w-fit">
              Giới thiệu
            </h2>
            <p className="mt-6 text-gray-800 dark:text-gray-300 leading-relaxed">
              {details.moTa || "Chưa có mô tả."}
            </p>
          </div>


          <div className="mt-6">
            <BookReview bookId={details.maSach} />
          </div>
        </section>

        <ChatBotButton />
      </main>
    </div>
  );

};

export default BookDetailsPage;
