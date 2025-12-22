"use client";
import LeftSideBar from "@/app/components/LeftSideBar";
// import ChatBotButton from "../components/ChatBoxButton";
import { Button } from "@/components/ui/button";
import { Receipt, Undo2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

function Page() {
  const params = useParams();
  const MaPhieuPhat = params.id;
  const [fine, setFine] = useState(null);
  const [bookInfo, setBookInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  // Fetch phiếu phạt từ API
  const fetchFine = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/fine/${MaPhieuPhat}`
      );
      if (response.status === 200) {
        const fineData = response.data;
        setFine(fineData);
        // Nếu phiếu phạt liên quan đến sách, lấy thông tin sách
        // console.log(fineData);
        if (
          fineData.noiDung == "Làm mất sách" ||
          fineData.noiDung == "Trả sách trễ hạn"
        ) {
          const bookData = await getBookInfo(
            fineData.cardId.borrowedBooks[0].bookId
          ); // Lấy thông tin sách từ cardId
          setBookInfo(bookData);
          // console.log("Thông tin sách đã được cập nhật:", bookData);
        } else {
          setBookInfo(null); // Nếu không liên quan đến sách, đặt bookInfo là null
        }
      } else {
        toast.error("Lỗi khi lấy phiếu phạt");
      }
    } catch (error) {
      toast.error("Có lỗi xảy ra khi fetch thông báo");
    } finally {
      setLoading(false);
    }
  };

  // Lấy thông tin sách (nếu nội dung phạt liên quan đến sách)
  const getBookInfo = async (bookId) => {
    // console.log("Lấy thông tin sách cho cardId2:", bookId);
    const response = await axios.get(
      `${process.env.NEXT_PUBLIC_API_URL}/api/book/${bookId}` // Lấy thông tin sách từ cardId
    );
    if (response.status === 200) {
      return response.data; // Trả về thông tin sách
    } else {
      toast.error("Lỗi khi lấy thông tin sách");
      return null;
    }
  };

  useEffect(() => {
    fetchFine();
  }, []);
  const route = useRouter();
  const handleGoBack = () => {
    route.back();
  };
  const BookCard = ({ book }) => {
    return (
      <article className="flex grow shrink gap-3 min-w-60 bg-white rounded-xl shadow-[0px_2px_2px_rgba(0,0,0,0.25)] p-5">
        <img
          src={book.hinhAnh[0]}
          alt={book.tenSach}
          className="object-cover shrink rounded-sm aspect-[0.67] w-[100px]"
        />
        <div className="flex flex-col flex-1 shrink self-end basis-0">
          <h3 className="flex-1 shrink gap-2.5 self-stretch mt-2 w-full text-[1.125rem] font-medium text-black basis-0">
            {book.tenSach}
          </h3>
          <p className="flex-1 shrink gap-2.5 self-stretch mt-2 w-full text-base text-black basis-0">
            ID sách: {fine.cardId.borrowedBooks[0].bookId}
          </p>
          <p className="flex-1 shrink gap-2.5 self-stretch mt-2 w-full text-base text-black basis-0">
            ID sách con: {fine.cardId.borrowedBooks[0].childBookId}
          </p>
          <p className="flex-1 shrink gap-2.5 self-stretch mt-2 w-full text-base text-black basis-0">
            Tác giả: {book.tenTacGia}
          </p>
          <p className="flex-1 shrink gap-2.5 self-stretch mt-2 w-full text-base text-black basis-0">
            Thể loại: {book.categoryChildName}
          </p>
          <p className="flex-1 shrink gap-2.5 self-stretch mt-2 w-full text-base text-black basis-0">
            NXB: {book.nxb}
          </p>
        </div>
      </article>
    );
  };

  // Hàm xử lý thanh toán
  const handleThanhToan = async () => {
    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_API_URL}/api/fine/pay-momo/${fine.id}`
    );
    const payUrl = response.data;
    window.location.href = payUrl;
  };
  return (
    <main className="flex flex-col min-h-screen text-foreground">
      <div className="pt-16 flex">
        <section className="self-stretch pr-[1.25rem] md:pl-60 ml-[1.25rem] my-auto w-full max-md:max-w-full mt-2 mb-2">
          {/*Nút Back - Floating Button*/}
          {/*Nút Back*/}
          <div className="mb-2 fixed z-50 flex justify-between items-center">
            <Button
              title={"Quay Lại"}
              className="bg-[#062D76] rounded-3xl w-10 h-10 cursor-pointer"
              onClick={() => {
                handleGoBack();
              }}
            >
              <Undo2 className="w-12 h-12" color="white" />
            </Button>
          </div>
          {fine && (
            <div className="flex pt-10 flex-col w-full gap-[5px] md:gap-[10px] items-center">
              <div className="flex items-start bg-white w-full rounded-lg mt-2 relative drop-shadow-lg p-5 gap-[20px] md:gap-[50px]">
                <div className="flex flex-col gap-[10px] relative w-full">
                  <p className="text-[1rem] font-semibold text-[#131313]/50">
                    ID Phiếu Phạt:{" "}
                    <span className="text-[#131313] font-medium ">
                      {fine.id}
                    </span>
                  </p>

                  <p className="text-[1rem] font-semibold text-[#131313]/50">
                    Số Tiền:{" "}
                    <span className="text-[#131313] font-medium ">
                      {fine.soTien}
                    </span>
                  </p>
                  <p className="text-[1rem] font-semibold text-[#131313]/50">
                    Nội Dung:{" "}
                    <span className="text-[#131313] font-medium ">
                      {fine.noiDung === "Khác" ? fine.cardId : fine.noiDung}
                    </span>
                  </p>
                </div>
                <div className="flex flex-col gap-[10px] justify-start w-full">
                  <p className="text-[1rem] font-semibold text-[#131313]/50">
                    ID Người Dùng:{" "}
                    <span className="text-[#131313] font-medium ">
                      {fine.userId.id}
                    </span>
                  </p>
                  <p className="text-[1rem] font-semibold text-[#131313]/50">
                    Tên Người Dùng:{" "}
                    <span className="text-[#131313] font-medium ">
                      {fine.tenND}
                    </span>
                  </p>
                  <p
                    className={`text-[1rem] font-semibold text-[#131313]/50 ${
                      fine.trangThai === "CHUA_THANH_TOAN" ? "hidden" : "flex"
                    }`}
                  >
                    Ngày Thanh Toán:{" "}
                    <span className="text-[#131313] font-medium ">
                      {fine.ngayThanhToan}
                    </span>
                  </p>
                </div>
              </div>
              {bookInfo && (
                <div className="flex flex-col gap-[10px] relative bg-white w-full rounded-lg mt-2 drop-shadow-lg p-5 items-center">
                  {fine.noiDung === "Trả sách trễ hạn" && (
                    <div className="flex flex-col w-full">
                      <h2 className="text-lg font-medium text-[#062D76] text-center">
                        Thông tin sách
                      </h2>
                      <div className="w-full h-70 mb-[2rem] overflow-y-scroll">
                        {bookInfo && (
                          <BookCard key={bookInfo.id} book={bookInfo} />
                        )}
                      </div>
                    </div>
                  )}
                  {fine.noiDung === "Làm mất sách" && bookInfo && (
                    <div className="w-full h-70 mb-[2rem] overflow-y-scroll">
                      <h2 className="text-lg font-medium text-[#062D76] text-center ">
                        Thông tin sách
                      </h2>
                      <BookCard key={bookInfo.id} book={bookInfo} />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          <div className="fixed bottom-0 self-stretch mr-[1.25rem] md:left-60 ml-[1.25rem] right-0 bg-[#E6EAF1] shadow-lg p-3 flex justify-between">
            {/*Control Bar*/}
            <div></div>
            <Button
              title={"Thanh Toán"}
              disabled={fine?.trangThai === "CHUA_THANH_TOAN" ? false : true}
              className={`rounded-3xl w-fit cursor-pointer ${
                fine?.trangThai === "CHUA_THANH_TOAN"
                  ? "bg-[#062D76]"
                  : "bg-[#b6cefa]"
              }`}
              onClick={() => {
                handleThanhToan();
              }}
            >
              <Receipt className="w-24 h-24" color="white" />
              {fine?.trangThai === "CHUA_THANH_TOAN"
                ? "Thanh toán ngay!"
                : "Đã Thanh Toán"}
            </Button>
          </div>
        </section>
        {/* <ChatBotButton /> */}
      </div>
    </main>
  );
}

export default Page;
