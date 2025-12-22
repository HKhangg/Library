"use client";
import React, { useEffect, useState } from "react";
import LeftSideBar from "@/app/components/LeftSideBar";
import ChatBotButton from "../components/ChatBoxButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { Plus, Search, ReceiptText, Timer, DollarSign } from "lucide-react";
import { ThreeDot } from "react-loading-indicators";
import toast from "react-hot-toast";
import axios from "axios";
import { TbListDetails } from "react-icons/tb";

const Page = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterFines, setFilterFines] = useState([]);
  const [needToPay, setNeedToPay] = useState([]);
  const [paid, setPaid] = useState([]);
  const [mode, setMode] = useState(0); // 0 là chưa thanh toán, 1 là đã thanh toán
  const [loading, setLoading] = useState(false);

  const handleSearch = () => {
    // Hàm tìm kiếm
    if (searchQuery) {
      setLoading(true);
      const fineList = mode === 0 ? needToPay : paid;
      const filterFine = fineList.filter(
        (book) =>
          book.id.toString() === searchQuery || // Tìm theo ID phiếu phạt
          book?.userId.toLowerCase().includes(searchQuery.toLowerCase()) // Tìm theo userId
      );
      setFilterFines(filterFine);
      setLoading(false);
      if (filterFine.length < 1) toast.error("Không tìm thấy kết quả");
    } else {
      setFilterFines([]);
    }
  };

  const route = useRouter();
  const handleAddFine = () => {
    // Chuyển sang trang thêm phiếu phạt
    route.push(`/fine/addFine`);
  };

  const handleDetail = (fineId) => {
    // Chuyển sang trang chi tiết phiếu phạt
    route.push(`/fine/${fineId}`);
  };

  const fetchFine = async () => {
    setLoading(true);
    const userId = localStorage.getItem("id"); // Lấy userId từ localStorage

    try {
      console.log("Fetching fines for userId22:", userId);
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/fines/${userId}`
      );
      console.log("Dữ liệu trả về từ API:", response.data);
      if (response.status === 200) {
        const data = response.data;

        // Đảm bảo không bị trùng lặp
        const newNeedToPay = [];
        const newPaid = [];

        data.forEach((fine) => {
          if (fine.trangThai === "DA_THANH_TOAN") {
            newPaid.push(fine);
          } else {
            newNeedToPay.push(fine);
          }
        });

        setNeedToPay(newNeedToPay);
        setPaid(newPaid);
      } else {
        toast.error("Lỗi khi lấy phiếu phạt");
      }
    } catch (error) {
      toast.error("Có lỗi xảy ra khi fetch thông báo");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log("Fetching fines on component mount");
    fetchFine();
    setMode(0);
    setSearchQuery("");
  }, []);

  useEffect(() => {
    handleSearch();
  }, [searchQuery, mode, needToPay, paid]);
  const FineCard = ({ fine }) => {
    // Component phiếu phạt
    return (
      <div className="flex bg-white w-full rounded-lg mt-2 relative drop-shadow-lg p-5 gap-[20px] md:gap-[50px] items-center">
        <div className="flex flex-col gap-[10px] relative w-full">
          <p className="text-[1rem] font-semibold text-[#131313]/50">
            ID: <span className="text-[#131313] font-medium ">{fine.id}</span>
          </p>
          <p className="text-[1rem] font-semibold text-[#131313]/50">
            User ID:{" "}
            <span className="text-[#131313] font-medium ">
              {fine.userId.id}
            </span>
          </p>
          <p className="text-[1rem] font-semibold text-[#131313]/50">
            Số Tiền:{" "}
            <span className="text-red-600 font-medium ">
              {fine.soTien}&nbsp;đồng
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
            onClick={() => {
              handleDetail(fine.id);
            }}
          >
            <TbListDetails
              style={{
                width: "1.5rem",
                height: "1.5rem",
                strokeWidth: "1px",
              }}
              className="size-6"
            />
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
          {/*Main*/}
          <div className="flex w-full items-center justify-between mb-10">
            <div className="flex w-1/2 gap-10">
              <Button
                title={"Chưa Thanh Toán"}
                className={`w-50 h-10 cursor-pointer ${
                  mode === 0 ? "bg-[#062D76]" : "bg-[#b6cefa]"
                } hover:bg-gray-500 font-bold rounded-[10px] overflow-hidden`}
                onClick={() => {
                  setMode(0);
                  setSearchQuery("");
                  filterFines.length = 0;
                }}
              >
                <Timer className="w-5 h-5" color="white" />
                Chưa Thanh Toán
              </Button>
              <Button
                title={"Đã Thanh Toán"}
                className={`w-50 h-10 cursor-pointer ${
                  mode === 1 ? "bg-[#062D76]" : "bg-[#b6cefa]"
                }  hover:bg-gray-500 font-bold rounded-[10px] overflow-hidden`}
                onClick={() => {
                  setMode(1);
                  setSearchQuery("");
                  filterFines.length = 0;
                }}
              >
                <DollarSign className="w-5 h-5" color="white" />
                Đã Thanh Toán
              </Button>
            </div>
            {/* <div className="flex gap-5">
              <Input
                type="text"
                placeholder="Tìm kiếm"
                className="h-10 font-thin italic text-black text-2xl w-full bg-white rounded-[10px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Button
                title={"Tìm kiếm"}
                className="w-10 h-10 cursor-pointer text-[20px] bg-[#062D76] hover:bg-gray-700 font-bold rounded-[10px] overflow-hidden"
                onClick={() => {
                  handleSearch();
                }}
              >
                <Search className="w-10 h-10" color="white" />
              </Button>
            </div> */}
          </div>
          {loading ? (
            <div className="flex md:ml-52 w-full h-screen justify-center items-center">
              <ThreeDot
                color="#062D76"
                size="large"
                text="Vui lòng chờ"
                variant="bounce"
                textColor="#062D76"
              />
            </div>
          ) : mode === 0 ? (
            filterFines.length > 0 ? ( // Nếu đang tìm kiếm thì hiện danh sách lọc
              filterFines.map((fine, index) => {
                return <FineCard key={index} fine={fine} />;
              })
            ) : (
              needToPay.map((fine, index) => {
                return <FineCard key={index} fine={fine} />;
              })
            )
          ) : filterFines.length > 0 ? ( // Nếu đang tìm kiếm thì hiện danh sách lọc
            filterFines.map((fine, index) => {
              return <FineCard key={index} fine={fine} />;
            })
          ) : (
            paid.map((fine, index) => {
              return <FineCard key={index} fine={fine} />;
            })
          )}
        </section>
        <ChatBotButton />
      </div>
    </main>
  );
};

export default Page;
