"use client";
import React, { useState, useEffect, useMemo } from "react";
import LeftSideBar from "@/app/components/LeftSideBar";
import ChatBotButton from "../components/ChatBoxButton";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Timer, DollarSign } from "lucide-react";
import { ThreeDot } from "react-loading-indicators";
import { TbListDetails } from "react-icons/tb";
import axios from "axios";

import useSWR from "swr";

const fetcher = (url) => axios.get(url).then((res) => res.data);

const Page = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [mode, setMode] = useState(0); // 0: Chưa thanh toán, 1: Đã thanh toán
  const [user, setUser] = useState(null);
  const route = useRouter();

  // Lấy user từ localStorage
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("persist:root"));
    setUser(storedUser);
  }, []);

  const handleDetail = (fineId) => {
    route.push(`/fine/${fineId}`);
  };

  // Sử dụng useSWR để lấy danh sách phiếu phạt
  const { data: fines = [], isLoading } = useSWR(
    user?.id ? `${process.env.NEXT_PUBLIC_API_URL}/api/fines/${user.id}` : null,
    fetcher,
    {
      revalidateOnFocus: true,
      fallbackData: [], // Dữ liệu mặc định
    }
  );

  // Logic lọc dữ liệu (Sử dụng useMemo để tối ưu)
  const displayFines = useMemo(() => {
    if (!Array.isArray(fines)) return [];

    // Lọc theo tab 
    let filtered = fines.filter((fine) => {
      if (mode === 0) return fine.trangThai !== "DA_THANH_TOAN";
      if (mode === 1) return fine.trangThai === "DA_THANH_TOAN";
      return true;
    });

    // Lọc theo từ khóa tìm kiếm 
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (fine) =>
          fine.id.toString().includes(lowerQuery) ||
          fine.userId?.id?.toString().includes(lowerQuery) ||
          fine.noiDung?.toLowerCase().includes(lowerQuery)
      );
    }

    return filtered;
  }, [fines, mode, searchQuery]);

  const FineCard = ({ fine }) => {
    return (
      <div className="flex bg-white w-full rounded-lg mt-2 relative drop-shadow-lg p-5 gap-[20px] md:gap-[50px] items-center">
        <div className="flex flex-col gap-[10px] relative w-full">
          <p className="text-[1rem] font-semibold text-[#131313]/50">
            ID: <span className="text-[#131313] font-medium ">{fine.id}</span>
          </p>
          <p className="text-[1rem] font-semibold text-[#131313]/50">
            User ID:{" "}
            <span className="text-[#131313] font-medium ">
              {fine.userId?.id || fine.userId} {/* Xử lý an toàn nếu userId là object hoặc string */}
            </span>
          </p>
          <p className="text-[1rem] font-semibold text-[#131313]/50">
            Số Tiền:{" "}
            <span className="text-red-600 font-medium ">
              {fine.soTien?.toLocaleString('vi-VN')}&nbsp;đồng
            </span>
          </p>
          <p className="text-[1rem] font-semibold text-[#131313]/50">
            Nội Dung:{" "}
            <span className="text-[#131313] font-medium ">{fine.noiDung}</span>
          </p>
        </div>
        <div className="w-fit flex justify-end">
          <Button
            title={"Xem Chi Tiết"}
            className="flex gap-2 justify-center items-center px-3 py-1 text-[1rem] font-normal self-center bg-[#062D76] text-white hover:bg-[#E6EAF1] hover:text-[#062D76] rounded-3xl cursor-pointer"
            onClick={() => handleDetail(fine.id)}
          >
            <TbListDetails className="w-6 h-6 stroke-[1px]" />
            Xem chi tiết
          </Button>
        </div>
      </div>
    );
  };

  return (
    <main className="flex flex-col min-h-screen text-foreground">
      <div className="pt-16 flex">
        <LeftSideBar />
        <section className="self-stretch pr-[1.25rem] md:pl-60 ml-[1.25rem] my-auto w-full max-md:max-w-full mt-2 mb-2">
          {/* Main Controls */}
          <div className="flex w-full items-center justify-between mb-10">
            <div className="flex w-1/2 gap-10">
              <Button
                title={"Chưa Thanh Toán"}
                className={`w-50 h-10 cursor-pointer ${mode === 0 ? "bg-[#062D76] text-white" : "bg-[#b6cefa] text-black"
                  } hover:bg-gray-500 font-bold rounded-[10px] overflow-hidden`}
                onClick={() => {
                  setMode(0);
                  setSearchQuery("");
                }}
              >
                <Timer className="w-5 h-5 mr-2" color={mode === 0 ? "white" : "black"} />
                Chưa Thanh Toán
              </Button>
              <Button
                title={"Đã Thanh Toán"}
                className={`w-50 h-10 cursor-pointer ${mode === 1 ? "bg-[#062D76] text-white" : "bg-[#b6cefa] text-black"
                  }  hover:bg-gray-500 font-bold rounded-[10px] overflow-hidden`}
                onClick={() => {
                  setMode(1);
                  setSearchQuery("");
                }}
              >
                <DollarSign className="w-5 h-5 mr-2" color={mode === 1 ? "white" : "black"} />
                Đã Thanh Toán
              </Button>
            </div>
            {/* Search Input (Nếu bạn muốn bật lại tính năng search thì uncomment đoạn dưới) */}
            {/* <div className="flex gap-5">
              <Input
                type="text"
                placeholder="Tìm kiếm..."
                className="h-10 font-thin italic text-black text-2xl w-full bg-white rounded-[10px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div> */}
          </div>

          {/* Content */}
          {isLoading ? (
            <div className="flex md:ml-52 w-full h-screen justify-center items-center">
              <ThreeDot
                color="#062D76"
                size="large"
                text="Vui lòng chờ"
                variant="bounce"
                textColor="#062D76"
              />
            </div>
          ) : (
            <>
              {displayFines.length > 0 ? (
                displayFines.map((fine) => (
                  <FineCard key={fine.id} fine={fine} />
                ))
              ) : (
                <p className="text-center text-gray-500 mt-10">
                  Không tìm thấy phiếu phạt nào.
                </p>
              )}
            </>
          )}
        </section>
        <ChatBotButton />
      </div>
    </main>
  );
};

export default Page;