"use client";
import React, { useState, useMemo, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Sidebar from "../components/sidebar/Sidebar";
import {
  BookCheck,
  List,
  Loader,
  MailWarning,
  Plus,
  Search,
  TicketX,
  TimerOff,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import toast, { Toaster } from "react-hot-toast";
import { ThreeDot } from "react-loading-indicators";

import useSWR, { mutate } from "swr";
import { fetcher } from "@/lib/fetcher";

const Page = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [allBorrowCards, setAllBorrowCards] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [currentTab, setCurrentTab] = useState("Đã yêu cầu");
  const [localSearch, setLocalSearch] = useState("");

  const fetchBorrowCards = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/borrow-cards`,
        { method: "GET" }
      );
      if (!response.ok) throw new Error("Network response was not ok");
      const data = await response.json();
      setAllBorrowCards(data);
    } catch (error) {
      console.error(error);
      toast.error("Không thể tải dữ liệu phiếu mượn.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBorrowCards();
  }, []);

  const filteredCards = useMemo(() => {
    return allBorrowCards.filter((card) => {
      const matchTab = card.status === currentTab;
      const matchSearch = localSearch.trim() === "" 
        ? true 
        : card.id.toString().includes(localSearch.trim()) || 
          card.userId.toString().includes(localSearch.trim());
      return matchTab && matchSearch;
    });
  }, [allBorrowCards, currentTab, localSearch]);

  const totalPages = Math.ceil(filteredCards.length / itemsPerPage) || 1;
  const paginatedCards = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredCards.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredCards, currentPage]);

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const handleTabChange = (tabName) => {
    setCurrentTab(tabName);
    setCurrentPage(1);
  };

  const handleSearchSubmit = () => {
    setCurrentPage(1);
  };

  const handleDetails = (id) => {
    router.push(`/borrow/${id}`);
  };

  const handleAddBorrow = () => {
    router.push(`/borrow/addBorrow`);
  };

  const handleExpired = async () => {
    if (!confirm("Bạn chắc chắn muốn tiến hành xem xét các phiếu quá hạn?")) return;
    const toastId = toast.loading("Đang xử lý...");
    const today = new Date();

    const expiredList = allBorrowCards.filter((card) => {
      if (card.status !== "Đã yêu cầu") return false;
      return new Date(card.getBookDate) < today;
    });

    if (expiredList.length === 0) {
      toast("Không có phiếu nào quá hạn", { id: toastId, icon: "ℹ️" });
      return;
    }

    try {
      await Promise.all(
        expiredList.map((item) =>
          fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/borrow-cards/expired/${item.id}`,
            { method: "PUT" }
          )
        )
      );
      await fetchBorrowCards();
      toast.success(`Đã xử lý ${expiredList.length} phiếu`, { id: toastId });
    } catch (error) {
      console.error(error);
      toast.error("Lỗi xử lý", { id: toastId });
    }
  };

  const handleMailing = async () => {
    if (!confirm("Gửi mail hối trả sách cho danh sách hiện tại?")) return;
    const toastId = toast.loading("Đang gửi email...");

    if (filteredCards.length === 0) {
      toast("Danh sách trống", { id: toastId, icon: "ℹ️" });
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/borrow-cards/askToReturn`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(filteredCards),
        }
      );
      if (!response.ok) throw new Error("API Error");
      toast.success("Đã gửi mail thành công", { id: toastId });
    } catch (error) {
      console.error(error);
      toast.error("Gửi mail thất bại", { id: toastId });
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN");
  };

  return (
    <main className="flex flex-col min-h-screen w-full bg-[#EFF3FB]">
      <Toaster position="top-center" reverseOrder={false} />
      <div className="flex">
        <Sidebar />
        <section className="self-stretch pr-[1.25rem] md:pl-60 ml-[1.25rem] my-auto w-full max-md:max-w-full mt-2 mb-2">
          <div className="mx-auto">
            <header className="flex justify-between gap-8 max-lg:gap-3 max-sm:flex-col p-3 rounded-xl">
              <div className="flex w-2/3 gap-5">
                <Button
                  className={`flex flex-1 gap-3 justify-center text-white hover:bg-gray-500 items-center text-[1.125rem] max-md:text-[1rem] font-medium rounded-md py-5 max-md:py-2 cursor-pointer ${currentTab === "Đã yêu cầu" ? "bg-[#062D76]" : "bg-[#b6cefa]"
                    }`}
                  onClick={() => handleTabChange("Đã yêu cầu")}
                >
                  <Loader className="size-6" /> Đã yêu cầu
                </Button>

                <Button
                  className={`flex flex-1 gap-3 justify-center text-white hover:bg-gray-500 items-center text-[1.125rem] max-md:text-[1rem] font-medium rounded-md py-5 max-md:py-2 cursor-pointer ${currentTab === "Đang mượn" ? "bg-[#062D76]" : "bg-[#b6cefa]"
                    }`}
                  onClick={() => handleTabChange("Đang mượn")}
                >
                  <BookCheck className="size-6" /> Đang mượn
                </Button>

                <Button
                  className={`flex flex-1 gap-3 justify-center text-white hover:bg-gray-500 items-center text-[1.125rem] max-md:text-[1rem] font-medium rounded-md py-5 max-md:py-2 cursor-pointer ${currentTab === "Đã trả" ? "bg-[#062D76]" : "bg-[#b6cefa]"
                    }`}
                  onClick={() => handleTabChange("Đã trả")}
                >
                  <TimerOff className="size-6" /> Đã trả
                </Button>
              </div>

              <div className="flex gap-5">
                <Input
                  type="text"
                  placeholder="Tìm kiếm (ID, UserID)"
                  className="w-full h-10 font-thin italic text-black text-2xl bg-white rounded-[10px]"
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearchSubmit()}
                />
                <Button
                  className="w-10 h-10 cursor-pointer text-[20px] bg-[#062D76] hover:bg-gray-700 font-bold rounded-[10px] overflow-hidden"
                  onClick={handleSearchSubmit}
                >
                  <Search className="w-10 h-10" color="white" />
                </Button>
              </div>
            </header>

            <section className="gap-y-2.5 mt-5">
              {isLoading ? (
                <div className="flex justify-center">
                  <ThreeDot color="#062D76" size="large" text="Đang tải..." textColor="#062D76" />
                </div>
              ) : paginatedCards.length > 0 ? (
                paginatedCards.map((borrowing) => (
                  <article
                    key={borrowing.id}
                    className="p-4 bg-white rounded-xl shadow-sm mb-2 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-center max-md:flex-col max-md:gap-5 max-md:items-start">
                      <div className="flex flex-col gap-2">
                        <h3 className="text-[1rem] font-semibold text-[#131313]/50">
                          ID: <span className="text-[#131313] font-medium">{borrowing.id}</span>
                        </h3>
                        <p className="text-[1rem] font-semibold text-[#131313]/50">
                          User ID: <span className="text-[#131313] font-medium">{borrowing.userId}</span>
                        </p>
                        <p className="text-[1rem] font-semibold text-[#131313]/50">
                          Ngày mượn: <span className="text-[#131313] font-medium">{formatDate(borrowing.borrowDate)}</span>
                        </p>
                        <p className="text-[1rem] font-semibold text-[#131313]/50">
                          {currentTab === "Đang mượn" && (
                            <>Ngày trả dự kiến: <span className="text-[#131313] font-medium">{formatDate(borrowing.dueDate)}</span></>
                          )}
                          {currentTab === "Đã trả" && (
                            <>{borrowing.dueDate ? "Ngày trả: " : "Hạn lấy sách: "}
                              <span className="text-[#131313] font-medium">
                                {formatDate(borrowing.dueDate || borrowing.getBookDate)}
                              </span>
                            </>
                          )}
                          {currentTab === "Đã yêu cầu" && (
                            <>Hạn lấy sách: <span className="text-[#131313] font-medium">{formatDate(borrowing.getBookDate)}</span></>
                          )}
                        </p>
                      </div>
                      <Button
                        className="flex gap-2 justify-center items-center px-3 py-1 text-[1rem] font-normal self-center bg-[#062D76] text-white hover:bg-[#E6EAF1] hover:text-[#062D76] rounded-3xl cursor-pointer"
                        onClick={() => handleDetails(borrowing.id)}
                      >
                        <List className="size-6" /> Xem chi tiết
                      </Button>
                    </div>
                  </article>
                ))
              ) : (
                <p className="text-center text-gray-600 mt-10">Không có phiếu mượn nào.</p>
              )}
            </section>

            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-6">
                <Button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="bg-[#062D76] hover:bg-gray-700 text-white"
                >
                  Trước
                </Button>
                <span className="px-4 py-2 bg-white border rounded">
                  Trang {currentPage} / {totalPages}
                </span>
                <Button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="bg-[#062D76] hover:bg-gray-700 text-white"
                >
                  Sau
                </Button>
              </div>
            )}

            <div className={`fixed bottom-6 right-10 flex flex-col gap-4`}>
              {currentTab === "Đã yêu cầu" && (
                <>
                  <Button
                    title="Xét phiếu quá hạn"
                    className="bg-red-700 rounded-full w-14 h-14 border-2 border-white shadow-lg hover:bg-red-800 flex justify-center items-center"
                    onClick={handleExpired}
                  >
                    <TicketX className="w-8 h-8" color="white" />
                  </Button>
                  <Button
                    title="Thêm Phiếu Mượn"
                    className="bg-[#062D76] rounded-full w-14 h-14 border-2 border-white shadow-lg hover:bg-blue-900 flex justify-center items-center"
                    onClick={handleAddBorrow}
                  >
                    <Plus className="w-8 h-8" color="white" />
                  </Button>
                </>
              )}

              {currentTab === "Đang mượn" && (
                <Button
                  title="Gửi Mail hối trả sách"
                  className="bg-red-700 rounded-full w-14 h-14 border-2 border-white shadow-lg hover:bg-red-800 flex justify-center items-center"
                  onClick={handleMailing}
                >
                  <MailWarning className="w-8 h-8" color="white" />
                </Button>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
};

export default Page;