"use client";
import React, { useState, useMemo, useEffect } from "react";
import Sidebar from "../components/sidebar/Sidebar";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Plus, Search, ReceiptText, Timer, DollarSign } from "lucide-react";
import { ThreeDot } from "react-loading-indicators";
import toast, { Toaster } from "react-hot-toast";

import useSWR from "swr";
import { fetcher } from "@/lib/fetcher"; 

const Page = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // Lấy trạng thái từ URL
  const currentMode = searchParams.get("mode") || "0";
  const searchQuery = searchParams.get("query") || "";
  const currentPage = Number(searchParams.get("page")) || 1;
  const itemsPerPage = 10;

  // Local state cho input search
  const [localSearch, setLocalSearch] = useState(searchQuery);

  useEffect(() => {
    setLocalSearch(searchQuery);
  }, [searchQuery]);

  // Fetch Data
  const {
    data: allFines = [],
    isLoading
  } = useSWR(
    `${process.env.NEXT_PUBLIC_API_URL}/api/fines`,
    fetcher,
    {
      revalidateOnFocus: true,
      dedupingInterval: 60000,
      onError: (err) => {
        console.error("Lỗi tải phiếu phạt:", err);
        toast.error("Không thể tải danh sách phiếu phạt.");
      }
    }
  );

  // Helper cập nhật URL
  const updateParams = (updates) => {
    const params = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });

    // Reset về trang 1 khi đổi mode hoặc search
    if (updates.mode !== undefined || updates.query !== undefined) {
      params.set("page", 1);
    }

    router.replace(`${pathname}?${params.toString()}`);
  };

  // Logic Lọc dữ liệu
  const filteredFines = useMemo(() => {
    let result = allFines;

    // Lọc theo mode trạng thái
    if (currentMode === "0") {
      result = result.filter((f) => f.trangThai === "CHUA_THANH_TOAN");
    } else if (currentMode === "1") {
      result = result.filter((f) => f.trangThai === "DA_THANH_TOAN");
    }

    // Lọc theo Search Query
    if (searchQuery.trim()) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(
        (fine) =>
          fine.id.toString().includes(lowerQuery) ||
          fine.userId.toString().includes(lowerQuery)
      );
    }

    return result;
  }, [allFines, currentMode, searchQuery]);

  // Phân trang
  const totalPages = Math.ceil(filteredFines.length / itemsPerPage) || 1;
  const paginatedFines = filteredFines.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Handlers
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      updateParams({ page });
    }
  };

  const handleModeChange = (modeValue) => {
    updateParams({ mode: modeValue }); // "0" hoặc "1"
  };

  const handleSearchSubmit = () => {
    updateParams({ query: localSearch });
  };

  const handleDetail = (fineId) => {
    router.push(`/fine/${fineId}`);
  };

  const handleAddFine = () => {
    router.push(`/fine/addFine`);
  };

  // Component Card
  const FineCard = ({ fine }) => {
    return (
      <div className="flex bg-white w-full rounded-lg mt-2 relative drop-shadow-sm border border-gray-200 p-5 gap-[20px] md:gap-[50px] items-center hover:shadow-md transition-all">
        <div className="flex flex-col gap-[8px] relative w-full">
          <p className="font-bold text-[#062D76]">Mã Phiếu: {fine.id}</p>
          <p className="text-gray-600">User ID: <span className="font-medium text-black">{fine.userId}</span></p>
          <p className="font-bold text-red-600">Số Tiền: {fine.soTien?.toLocaleString()} VNĐ</p>
          <p className="text-sm text-gray-500 line-clamp-1">Nội Dung: {fine.noiDung}</p>
        </div>
        <div className="flex-shrink-0">
          <Button
            title={"Xem Chi Tiết"}
            className="h-10 bg-[#062D76] hover:bg-gray-700 flex items-center gap-2 px-4 rounded-lg transition-colors"
            onClick={() => handleDetail(fine.id)}
          >
            <ReceiptText className="w-5 h-5" color="white" />
            <span className="hidden md:block">Xem chi tiết</span>
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-row w-full min-h-screen h-full bg-[#EFF3FB]">
      <Toaster position="top-center" reverseOrder={false} />
      <Sidebar />
      <div className="flex w-full flex-col py-6 md:ml-52 relative mt-5 gap-2 items-center px-10">

        {/* Header Controls */}
        <div className="flex w-full items-center justify-between mb-10 flex-wrap gap-4">
          <div className="flex gap-4">
            <Button
              className={`h-10 px-6 font-bold rounded-[10px] flex items-center gap-2 transition-colors ${currentMode === "0" ? "bg-[#062D76] text-white" : "bg-[#b6cefa] text-white hover:bg-gray-400"
                }`}
              onClick={() => handleModeChange("0")}
            >
              <Timer className="w-5 h-5" />
              Chưa Thanh Toán
            </Button>
            <Button
              className={`h-10 px-6 font-bold rounded-[10px] flex items-center gap-2 transition-colors ${currentMode === "1" ? "bg-[#062D76] text-white" : "bg-[#b6cefa] text-white hover:bg-gray-400"
                }`}
              onClick={() => handleModeChange("1")}
            >
              <DollarSign className="w-5 h-5" />
              Đã Thanh Toán
            </Button>
          </div>

          <div className="flex gap-2 w-full md:w-auto">
            <Input
              type="text"
              placeholder="Tìm kiếm (ID, UserID)"
              className="w-full md:w-80 h-10 font-thin italic text-black text-lg bg-white rounded-[10px]"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearchSubmit()}
            />
            <Button
              title="Tìm kiếm"
              className="w-12 h-10 bg-[#062D76] hover:bg-gray-700 rounded-[10px] flex justify-center items-center"
              onClick={handleSearchSubmit}
            >
              <Search className="w-5 h-5" color="white" />
            </Button>
          </div>
        </div>

        {/* List Content */}
        <div className="w-full flex flex-col gap-2 min-h-[400px]">
          {isLoading ? (
            <div className="flex w-full h-full justify-center items-center py-20">
              <ThreeDot color="#062D76" size="large" text="Đang tải dữ liệu..." textColor="#062D76" />
            </div>
          ) : paginatedFines.length > 0 ? (
            paginatedFines.map((fine) => <FineCard key={fine.id} fine={fine} />)
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-gray-500">
              <ReceiptText className="w-16 h-16 opacity-20 mb-4" />
              <p>Không tìm thấy phiếu phạt nào.</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-6 pb-20">
            <Button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="bg-[#062D76] hover:bg-gray-700 text-white disabled:opacity-50"
            >
              Trước
            </Button>
            <span className="px-4 py-2 bg-white rounded shadow-sm text-[#062D76] font-medium border border-gray-200">
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

        {/* Floating Add Button */}
        {currentMode === "0" && (
          <div className="fixed bottom-10 right-10 z-10">
            <Button
              title="Thêm Phiếu Phạt"
              className="bg-[#062D76] hover:bg-[#051e4f] rounded-full w-14 h-14 shadow-lg flex items-center justify-center transition-transform hover:scale-105"
              onClick={handleAddFine}
            >
              <Plus className="w-8 h-8" color="white" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Page;