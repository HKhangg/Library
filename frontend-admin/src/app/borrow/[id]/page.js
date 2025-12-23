"use client";
import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/app/components/ui/button";
import toast, { Toaster } from "react-hot-toast";
import { ThreeDot } from "react-loading-indicators";
import Sidebar from "@/app/components/sidebar/Sidebar";
import { Undo2 } from "lucide-react";

import useSWR from "swr";
import { fetcher } from "@/lib/fetcher"; 

const BookCard = ({
  imageSrc,
  title,
  category,
  author,
  publisher,
  location,
  bookId,
}) => {
  return (
    <article className="flex grow shrink gap-3 min-w-60 cursor-pointer bg-white rounded-xl shadow-[0px_2px_2px_rgba(0,0,0,0.25)] p-5">
      <img
        src={imageSrc || "/placeholder.png"}
        alt={title}
        className="object-cover shrink rounded-sm aspect-[0.67] w-[100px]"
        onError={(e) => (e.target.src = "/placeholder.png")}
      />
      <div className="flex flex-col flex-1 shrink self-end basis-0">
        <h3 className="flex-1 shrink gap-2.5 self-stretch mt-2 w-full text-[1.125rem] font-medium text-black basis-0">
          {title}
        </h3>
        {bookId && (
          <p className="flex-1 shrink gap-2.5 self-stretch mt-2 w-full text-base text-black basis-0">
            ID sách: {bookId}
          </p>
        )}
        <p className="flex-1 shrink gap-2.5 self-stretch mt-2 w-full text-base text-black basis-0">
          Tác giả: {author}
        </p>
        <p className="flex-1 shrink gap-2.5 self-stretch mt-2 w-full text-base text-black basis-0">
          Thể loại: {category}
        </p>
        <p className="flex-1 shrink gap-2.5 self-stretch mt-2 w-full text-base text-black basis-0">
          NXB: {publisher}
        </p>
        <p className="flex-1 shrink gap-2.5 self-stretch mt-2 w-full text-base text-black basis-0">
          Vị trí tủ: {location}
        </p>

      </div>
    </article>
  );
};

const BorrowingInfo = ({ info }) => {
  return (
    <section className="flex flex-col p-5 bg-white rounded-xl shadow-[0px_4px_4px_rgba(0,0,0,0.25)] max-md:px-5 max-md:max-w-full">
      <div className="grid grid-cols-2 gap-5 max-md:grid-cols-1">
        {/* Cột 1 */}
        <div className="flex flex-col gap-5 items-start text-[1.125rem] font-medium text-black">
          <p className="text-[1rem] font-semibold text-[#131313]/50">
            ID Phiếu: <span className="text-[#131313] font-medium ">{info.id}</span>
          </p>
          <p className="text-[1rem] font-semibold text-[#131313]/50">
            Ngày mượn:{" "}
            <span className="text-[#131313] font-medium ">
              {new Date(info.borrowDate).toLocaleDateString("vi-VN")}
            </span>
          </p>
          {info.dueDate ? (
            <p className="text-[1rem] font-semibold text-[#131313]/50">
              Ngày trả sách:{" "}
              <span className="text-[#131313] font-medium ">
                {new Date(info.dueDate).toLocaleDateString("vi-VN")}
              </span>
            </p>
          ) : (
            <p className="text-[1rem] font-semibold text-[#131313]/50">
              Hạn lấy sách:{" "}
              <span className="text-[#131313] font-medium ">
                {new Date(info.getBookDate).toLocaleDateString("vi-VN")}
              </span>
            </p>
          )}
        </div>

        {/* Cột 2 */}
        <div className="flex flex-col gap-5 items-start text-[1.125rem] font-medium text-black">
          <p className="text-[1rem] font-semibold text-[#131313]/50">
            ID Người Dùng:{" "}
            <span className="text-[#131313] font-medium ">{info.userId}</span>
          </p>
          <p className="text-[1rem] font-semibold text-[#131313]/50">
            Tên Người Dùng:{" "}
            <span className="text-[#131313] font-medium ">{info.userName}</span>
          </p>
          <p className="text-[1rem] font-semibold text-[#131313]/50">
            Số lượng mượn:{" "}
            <span className="text-[#131313] font-medium ">
              {info.totalBooks || info.bookIds?.length || 0}
            </span>
          </p>
        </div>
      </div>
    </section>
  );
};

const ChiTietPhieuMuon = () => {
  const { id } = useParams();
  const router = useRouter();
  useEffect(() => {
    const fetchBorrowCardDetail = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/borrow-cards/${id}`,
          {
            method: "GET",
          }
        );
        const res = await response.json();
        console.log("API Response:", res);
        console.log("BookIds array:", res.bookIds);
        setBorrowDetail(res);
      } catch (error) {
        console.error("Lỗi khi fetch chi tiết phiếu mượn:", error);
        toast.error("Không thể tải dữ liệu phiếu mượn");
      } finally {
        setLoading(false);
      }
    };
    fetchBorrowCardDetail();
  }, [id]);


  // useSWR: Lấy thông tin chi tiết phiếu mượn
  const { data: borrowDetail, isLoading, error } = useSWR(
    id ? `${process.env.NEXT_PUBLIC_API_URL}/api/borrow-cards/${id}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      onError: () => toast.error("Không thể tải dữ liệu phiếu mượn"),
    }
  );

  const handleGoBack = () => {
    router.back();
  };

  // Xử lý Xóa Phiếu Mượn (Async + Toast Loading)
  const handleDelete = async () => {
    if (!borrowDetail) return;

    const toastId = toast.loading("Đang xóa phiếu mượn...");
    try {
      // Dùng fetch trực tiếp cho DELETE (vì fetcher mặc định là GET)
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/borrow-cards/${borrowDetail.borrowCardId || id}`, // Fallback ID nếu API trả về khác
        { method: "DELETE" }
      );

      if (!response.ok) throw new Error("API Error");

      toast.success("Xóa phiếu thành công", { id: toastId });
      setPopUpOpen(false);

      // Chuyển trang sau khi xóa
      setTimeout(() => {
        router.push("/borrow");
      }, 500);

    } catch (err) {
      console.error("Lỗi xóa:", err);
      toast.error("Xóa phiếu thất bại", { id: toastId });
    }
  };

  if (isLoading) {
    return (
      <main className="flex flex-col min-h-screen text-foreground bg-[#EFF3FB]">
        <div className="flex">
          <Sidebar />
          <section className="flex justify-center items-center self-center w-full h-screen md:pl-60">
            <ThreeDot
              color="#062D76"
              size="large"
              text="Đang tải dữ liệu..."
              variant="bounce"
              textColor="#062D76"
            />
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-col min-h-screen text-foreground bg-[#EFF3FB]">
      <Toaster position="top-center" reverseOrder={false} />
      <div className="flex">
        <Sidebar />
        <section className="self-stretch pr-[1.25rem] md:pl-60 ml-[1.25rem] my-auto w-full max-md:max-w-full mt-2 mb-2">
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

          {borrowDetail ? (
            <div className="flex flex-col w-full max-md:max-w-full mt-10 px-10">
              <Button
                className={`flex self-end text-[1rem] cursor-pointer bg-red-500 hover:bg-red-700 text-white w-fit mb-4`}
                onClick={() => setPopUpOpen(true)}
              >
                <Trash2Icon className="mr-2 w-5 h-5" />
                Xóa Phiếu
              </Button>

              <BorrowingInfo info={borrowDetail} />

              <h2 className="text-lg font-medium text-[#062D76] text-center mt-8 mb-4">
                Danh sách sách mượn
              </h2>
              <section className="grid grid-cols-1 max-sm:grid-cols-1 gap-5 items-start mt-2 w-full max-md:max-w-full">
                {borrowDetail?.bookIds?.map((book, index) => (
                  <BookCard
                    key={index}
                    imageSrc={book.image}
                    title={book.name}
                    author={book.author}
                    category={book.category}
                    publisher={book.publisher}
                    location={book.viTri}
                    bookId={book.maSach}
                  />
                ))}
              </section>
            </div>
          ) : (
            <div className="flex flex-col w-full justify-center items-center mt-20">
              <p className="text-xl text-gray-500">Không tìm thấy phiếu mượn!</p>
              <Button onClick={handleGoBack} className="mt-4">Quay lại</Button>
            </div>
          )}
        </section>

        {/* Modal Xóa */}
        {popUpOpen && (
          <div className="fixed inset-0 items-center justify-center z-50 flex">
            <div className="w-full h-full bg-black opacity-80 absolute top-0 left-0"></div>
            <div className="relative flex flex-col justify-center bg-white p-6 rounded-lg shadow-lg w-auto min-w-[300px]">
              <div className="flex justify-center mb-2">
                {/* Icon Warning simple */}
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><path d="M12 9v4" /><path d="M12 17h.01" /></svg>
              </div>
              <p className="text-center font-medium text-lg mb-4">
                Bạn có chắc chắn muốn xóa phiếu này không?
              </p>

              <div className="flex justify-center mt-2 gap-4">
                <Button
                  className="bg-gray-500 hover:bg-gray-600 text-white min-w-[80px]"
                  onClick={() => setPopUpOpen(false)}
                >
                  Hủy
                </Button>
                <Button
                  className="bg-red-500 hover:bg-red-700 text-white min-w-[80px]"
                  onClick={handleDelete}
                >
                  Xóa
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
};

// Component Trash Icon nhỏ để thay thế thẻ img
const Trash2Icon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" x2="10" y1="11" y2="17" /><line x1="14" x2="14" y1="11" y2="17" /></svg>
)

export default ChiTietPhieuMuon;