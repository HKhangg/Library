"use client";
import React, { useState, useEffect } from "react";
import LeftSideBar from "../components/LeftSideBar";
import ChatBotButton from "../components/ChatBoxButton";
import { useRouter } from "next/navigation";
import { TbListDetails } from "react-icons/tb";
import { LuTimerOff, LuBookCheck } from "react-icons/lu";
import { FiLoader } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import axios from "axios";
import { ThreeDot } from "react-loading-indicators";
import useSWR from "swr";

const Page = () => {
  const [selectedButton, setSelectedButton] = useState("Đã yêu cầu");
  const [user, setUser] = useState(null);
  const route = useRouter();

  // Lấy user từ localStorage
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("persist:root"));
    setUser(storedUser);
  }, []);

  const postFetcher = (url) => axios.post(url).then((res) => res.data);

  const {
    data: allBorrowCards = [],
    isLoading,
    error,
  } = useSWR(
    user?.id
      ? `${process.env.NEXT_PUBLIC_API_URL}/api/borrow-cards/user/${user.id}`
      : null,
    postFetcher,
    {
      revalidateOnFocus: true, // Tự động cập nhật khi quay lại tab này
      fallbackData: [], // Dữ liệu mặc định là mảng rỗng
      // Xử lý nếu API trả về null thay vì mảng
      onSuccess: (data) => {
        if (!Array.isArray(data)) return [];
      },
    }
  );

  
  const safeBorrowCards = Array.isArray(allBorrowCards) ? allBorrowCards : [];

  const filteredCards = safeBorrowCards.filter((card) => {
    if (selectedButton === "Đã yêu cầu") return card.status === "Đã yêu cầu";
    if (selectedButton === "Đang mượn") return card.status === "Đang mượn";
    if (selectedButton === "Hết hạn") return card.status === "Hết hạn";
    return false;
  });

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN");
  };

  const handleButtonClick = (buttonType) => {
    setSelectedButton(buttonType);
  };

  const handleDetails = (id) => {
    route.push(`/borrowed-card/${id}`);
  };

  return (
    <main className="flex flex-col min-h-screen text-foreground w-full">
      <div className="pt-16 flex">
        <LeftSideBar />
        <section className="self-stretch pr-[1.25rem] md:pl-60 ml-[1.25rem] z-100 my-auto w-full max-md:max-w-full mt-2 mb-2">
          <div className="mx-auto">
            <header className="flex justify-between gap-8 max-lg:gap-3 max-sm:flex-col bg-white dark:bg-gray-700 p-3 rounded-xl transition-colors duration-300">
              {/* Current Borrowings Status */}
              <Button
                className={`flex flex-1 gap-2 justify-center items-center text-[1.125rem] max-md:text-[1rem] rounded-md py-5 max-md:py-2 cursor-pointer ${selectedButton === "Đã yêu cầu"
                    ? "bg-[#062D76] text-white hover:bg-[#062D76] hover:text-white"
                    : "bg-gray-300 text-[#131313] hover:bg-[#062D76] hover:text-white"
                  }`}
                onClick={() => handleButtonClick("Đã yêu cầu")}
              >
                <FiLoader className="size-6 w-5 h-5" />
                Đã yêu cầu
              </Button>

              <Button
                className={`flex flex-1 gap-2 justify-center items-center text-[1.125rem] max-md:text-[1rem] font-medium rounded-md py-5 max-md:py-2 cursor-pointer ${selectedButton === "Đang mượn"
                    ? "bg-[#062D76] text-white hover:bg-[#062D76] hover:text-white"
                    : "bg-gray-300 text-[#131313] hover:bg-[#062D76] hover:text-white"
                  }`}
                onClick={() => handleButtonClick("Đang mượn")}
              >
                <LuBookCheck className="size-6 w-5 h-5" />
                Đang mượn
              </Button>

              {/* Returned Status */}
              <Button
                className={`flex flex-1 gap-3 justify-center items-center text-[1.125rem] max-md:text-[1rem] font-medium rounded-md py-5 max-md:py-2 cursor-pointer ${selectedButton === "Hết hạn"
                    ? "bg-[#062D76] text-white hover:bg-[#062D76] hover:text-white"
                    : "bg-gray-300 text-[#131313] hover:bg-[#062D76] hover:text-white"
                  }`}
                onClick={() => handleButtonClick("Hết hạn")}
              >
                <LuTimerOff className="size-6 w-5 h-5" />
                Hết hạn
              </Button>
            </header>

            {/* Loading State */}
            {isLoading ? (
              <div className="flex justify-center items-center h-[300px]">
                <ThreeDot
                  color="#062D76"
                  size="large"
                  text="Đang tải dữ liệu..."
                  variant="bounce"
                  textColor="#062D76"
                />
              </div>
            ) : (
              /* Borrowing Cards Section */
              <section className="gap-y-2.5 mt-5">
                {filteredCards.length > 0 ? (
                  filteredCards.map((borrowing) => (
                    <article
                      key={borrowing.id}
                      className="p-4 bg-white dark:bg-gray-600 rounded-xl shadow-sm mb-2 transition-colors duration-300"
                    >
                      <div className="flex justify-between items-center max-md:flex-col max-md:gap-5 max-md:items-start">
                        <div className="flex flex-col gap-2">
                          <h3 className="text-[1rem] font-semibold text-[#131313]/50 dark:text-gray-400">
                            ID:{" "}
                            <span className="text-[#131313] dark:text-gray-100 font-medium">
                              {borrowing.id}
                            </span>
                          </h3>
                          <p className="text-[1rem] font-semibold text-[#131313]/50 dark:text-gray-400">
                            User ID:{" "}
                            <span className="text-[#131313] dark:text-gray-100 font-medium ">
                              {borrowing.userId}
                            </span>
                          </p>
                          <p className="text-[1rem] font-semibold text-[#131313]/50 dark:text-gray-400">
                            Ngày mượn:{" "}
                            <span className="text-[#131313] dark:text-gray-100 font-medium ">
                              {formatDate(borrowing.borrowDate)}
                            </span>
                          </p>
                          <p className="text-[1rem] font-semibold text-[#131313]/50 dark:text-gray-400">
                            {selectedButton === "Đang mượn" && (
                              <>
                                Ngày trả dự kiến:{" "}
                                <span className="text-[#131313] dark:text-gray-100 font-medium">
                                  {formatDate(borrowing.dueDate)}
                                </span>
                              </>
                            )}

                            {selectedButton === "Hết hạn" && (
                              <>
                                Ngày trả:{" "}
                                <span className="text-[#131313] dark:text-gray-100 font-medium">
                                  {formatDate(borrowing.dueDate)}
                                </span>
                              </>
                            )}

                            {selectedButton === "Đã yêu cầu" && (
                              <>
                                Hạn lấy sách:{" "}
                                <span className="text-[#131313] dark:text-gray-100 font-medium">
                                  {formatDate(borrowing.getBookDate)}
                                </span>
                              </>
                            )}
                          </p>
                        </div>
                        <Button
                          className="flex gap-2 justify-center items-center px-3 py-1 text-[1rem] font-normal self-center bg-[#062D76] text-white hover:bg-[#E6EAF1] hover:text-[#062D76] rounded-3xl cursor-pointer"
                          aria-label={`View details for borrowing ${borrowing.id}`}
                          onClick={() => {
                            handleDetails(borrowing.id);
                          }}
                        >
                          <TbListDetails className="size-6 w-6 h-6 stroke-[1px]" />
                          Xem chi tiết
                        </Button>
                      </div>
                    </article>
                  ))
                ) : (
                  <p className="text-center text-gray-500 mt-10">
                    Không có phiếu mượn nào ở trạng thái này.
                  </p>
                )}
              </section>
            )}
          </div>
        </section>
        <ChatBotButton />
      </div>
    </main>
  );
};

export default Page;