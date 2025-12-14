"use client";
import React, { useState, useMemo, useEffect } from "react";
import Sidebar from "../components/sidebar/Sidebar";
import { BookCheck, History, List, Search, TimerOff } from "lucide-react";
import { useRouter, useSearchParams, usePathname } from "next/navigation"; // Import hooks
import { Button } from "@/app/components/ui/button";
import toast, { Toaster } from "react-hot-toast";
import { ThreeDot } from "react-loading-indicators";
import { Input } from "../components/ui/input";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";

const Page = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // 1. Lấy trạng thái từ URL
  const searchQuery = searchParams.get("query") || "";
  const currentPage = Number(searchParams.get("page")) || 1;
  const itemsPerPage = 10;

  const [localSearch, setLocalSearch] = useState(searchQuery);

  useEffect(() => {
    setLocalSearch(searchQuery);
  }, [searchQuery]);

  // 2. Fetch Data
  const { data: allBorrowCards = [], isLoading } = useSWR(
    `${process.env.NEXT_PUBLIC_API_URL}/api/borrow-cards`,
    fetcher,
    {
      revalidateOnFocus: true,
      dedupingInterval: 60000,
      onError: (err) => {
        console.error("Lỗi tải dữ liệu:", err);
        toast.error("Không thể tải danh sách phiếu trả.");
      },
    }
  );

  // 3. Helper cập nhật URL
  const updateURL = (key, value) => {
    const params = new URLSearchParams(searchParams);
    if (value) params.set(key, value);
    else params.delete(key);

    if (key === "query") params.set("page", 1);

    router.replace(`${pathname}?${params.toString()}`);
  };

  // 4. Logic Lọc
  const filteredCards = useMemo(() => {
    let result = allBorrowCards.filter(
      (c) => c.status === "Đã trả" || c.status === "RETURNED"
    );

    if (searchQuery.trim()) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(
        (card) =>
          card.id.toString().includes(lowerQuery) ||
          card.userId.toString().includes(lowerQuery)
      );
    }
    return result;
  }, [allBorrowCards, searchQuery]);

  const totalPages = Math.ceil(filteredCards.length / itemsPerPage) || 1;
  const paginatedCards = filteredCards.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Handlers
  const handleDetail = (id) => {
    // Khi push sang trang chi tiết, URL hiện tại (có query params) được lưu trong history
    router.push(`/return/${id}`);
  };

  const handleBorrow = () => {
    router.push(`/borrow`); // Về trang borrow (mặc định tab 'Đã yêu cầu' hoặc giữ nguyên nếu code bên borrow xử lý)
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      updateURL("page", page);
    }
  };

  const handleSearchSubmit = () => {
    updateURL("query", localSearch);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN");
  };

  return (
    <div className="flex flex-row w-full min-h-screen bg-[#EFF3FB]">
      <Toaster position="top-center" reverseOrder={false} />
      <Sidebar />
      <div className="flex-1 py-6 md:ml-52 px-10">
        <div className="mx-auto">
          <header className="flex justify-between gap-8 max-lg:gap-3 max-sm:flex-col bg-white p-3 rounded-xl shadow-sm mb-6">
            {/* Tab Controls (Fake Tabs to Navigation) */}
            <div className="flex w-2/3 gap-5">
              <Button
                className={`flex flex-1 gap-3 justify-center text-white hover:bg-gray-500 items-center text-[1.125rem] font-medium rounded-md py-5 cursor-pointer bg-[#b6cefa]`}
                onClick={handleBorrow}
              >
                <BookCheck className="size-6" /> Đang mượn
              </Button>

              <Button
                className={`flex flex-1 gap-3 justify-center text-white hover:bg-gray-500 items-center text-[1.125rem] font-medium rounded-md py-5 cursor-pointer bg-[#062D76]`}
              >
                <TimerOff className="size-6" /> Đã trả
              </Button>
            </div>

            {/* Search */}
            <div className="flex gap-5">
              <Input
                type="text"
                placeholder="Tìm kiếm (ID, UserID)"
                className="w-full h-10 font-thin italic text-black text-xl bg-gray-50 rounded-[10px]"
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearchSubmit()}
              />
              <Button
                className="w-10 h-10 cursor-pointer bg-[#062D76] hover:bg-gray-700 rounded-[10px]"
                onClick={handleSearchSubmit}
              >
                <Search className="w-6 h-6" color="white" />
              </Button>
            </div>
          </header>

          {/* List Content */}
          <section className="flex flex-col gap-4">
            {isLoading ? (
              <div className="flex justify-center py-10">
                <ThreeDot color="#062D76" size="large" text="Đang tải..." />
              </div>
            ) : paginatedCards.length > 0 ? (
              paginatedCards.map((data) => (
                <div
                  key={data.id}
                  className="flex flex-col bg-white rounded-lg shadow-sm p-5 hover:shadow-md transition-all border border-transparent hover:border-blue-100"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex flex-col gap-1">
                      <p className="text-lg font-semibold text-[#062D76]">
                        Mã Phiếu: {data.id}
                      </p>
                      <p className="text-gray-600">
                        Người dùng ID: <span className="font-medium text-black">{data.userId}</span>
                      </p>
                      <p className="text-gray-500 text-sm">
                        Ngày mượn: {formatDate(data.borrowDate)}
                      </p>
                      <p className="text-green-600 font-medium text-sm">
                        Ngày trả thực tế: {formatDate(data.dueDate)}
                      </p>
                    </div>

                    <Button
                      className="flex items-center gap-2 bg-[#062D76] text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition-colors"
                      onClick={() => handleDetail(data.id)}
                    >
                      <List className="w-5 h-5" />
                      Xem chi tiết
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-gray-500 bg-white rounded-xl">
                <History className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <p>Chưa có phiếu trả nào được ghi nhận.</p>
              </div>
            )}
          </section>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-8">
              <Button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="bg-[#062D76] hover:bg-gray-700 text-white disabled:opacity-50"
              >
                Trước
              </Button>
              <span className="px-4 py-2 bg-white rounded shadow-sm text-[#062D76] font-medium">
                Trang {currentPage} / {totalPages}
              </span>
              <Button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="bg-[#062D76] hover:bg-gray-700 text-white disabled:opacity-50"
              >
                Sau
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Page;