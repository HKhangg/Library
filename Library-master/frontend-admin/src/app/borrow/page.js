"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import toast from "react-hot-toast";
import { ThreeDot } from "react-loading-indicators";

const Page = () => {
  const [allBorrowCards, setAllBorrowCards] = useState([]);
  const [selectedButton, setSelectedButton] = useState("Đã yêu cầu");
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;

  const fetchBorrowCards = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/borrow-cards`,
        {
          method: "GET",
        }
      );
      const data = await response.json();
      console.log(data);
      setAllBorrowCards(data);
      setTotalPages(Math.ceil(data.length / itemsPerPage) || 1);
      setCurrentPage(1); // Reset to first page
    } catch (error) {
      console.error("Lỗi khi fetch phiếu mượn:", error);
      toast.error("Không thể tải dữ liệu phiếu mượn.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBorrowCards();
  }, []);

  const filteredCards = allBorrowCards?.filter((card) => {
    if (selectedButton === "Đã yêu cầu") return card.status === "Đã yêu cầu";
    if (selectedButton === "Đang mượn") return card.status === "Đang mượn";
    if (selectedButton === "Đã trả") return card.status === "Đã trả";
    return false;
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [searchFilter, setSearchFilter] = useState([]);
  const handleSearch = () => {
    if (searchQuery) {
      setLoading(true);
      const filter = filteredCards?.filter((card) =>
        card?.id.toString() === searchQuery || // tìm theo id
        card?.userId.toString() === searchQuery
          ? card
          : null
      );
      setSearchFilter(filter);
      setTotalPages(Math.ceil(filter.length / itemsPerPage) || 1);
      setCurrentPage(1); // Reset to first page
      setLoading(false);
      if (filter.length < 1) toast.error("Không tìm thấy kết quả");
    } else {
      setSearchFilter([]);
      setTotalPages(Math.ceil(filteredCards.length / itemsPerPage) || 1);
      setCurrentPage(1); // Reset to first page
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN"); // Kết quả: 22/04/2025
  };

  const handleButtonClick = (buttonType) => {
    setSelectedButton(buttonType);
    setSearchFilter([]);
    setSearchQuery("");
    setCurrentPage(1); // Reset to first page when changing filter
  };

  const route = useRouter();
  const handleDetails = (id) => {
    route.push(`/borrow/${id}`);
  };
  const handleAddBorrow = () => {
    route.push(`/borrow/addBorrow`);
  };

  const fetchExpired = async (list) => {
    try {
      const responses = await Promise.all(
        list.map((item) =>
          fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/borrow-cards/expired/${item?.id}`,
            {
              method: "PUT",
            }
          )
        )
      );
      toast.success("Xem xét phiếu hết hạn thành công");
      fetchBorrowCards();
    } catch (error) {
      console.error("Lỗi khi xem xét phiếu hết hạn:", error);
      toast.error("Lỗi khi xem xét phiếu hết hạn.");
    }
  };

  const fetchMailing = async (list) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/borrow-cards/askToReturn`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(list),
        }
      );
      toast.success("Gửi mail hối trả sách thành công");
      fetchBorrowCards();
    } catch (error) {
      toast.error("Lỗi khi gửi mail hối trả sách");
      console.error("Lỗi khi gửi mail hối trả sách:", error);
    }
  };

  const handleExpired = () => {
    setSelectedButton("Đã yêu cầu");
    if (confirm("Bạn chắc chắn muốn tiến hành xem xét các phiếu Đã trả?")) {
      const today = new Date();
      const expiredList = filteredCards.filter((card) => {
        return new Date(card.getBookDate) < today;
      });
      fetchExpired(expiredList);
    }
  };
  const handleMailing = () => {
    setSelectedButton("Đang mượn");
    if (confirm("Bạn chắc chắn muốn tiến hành gửi mail hối trả sách?")) {
      fetchMailing(filteredCards);
    }
  };

  // Phân trang
  const paginatedCards = (
    searchFilter.length > 0 ? searchFilter : filteredCards
  )?.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Generate page numbers for pagination
  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <main className="flex flex-col min-h-screen w-full bg-[#EFF3FB]">
      <div className="flex">
        <Sidebar />
        <section className="self-stretch pr-[1.25rem] md:pl-60 ml-[1.25rem] my-auto w-full max-md:max-w-full mt-2 mb-2">
          <div className="mx-auto">
            <header className="flex justify-between gap-8 max-lg:gap-3 max-sm:flex-col p-3 rounded-xl">
              {/* Current Borrowings Status */}
              <div className="flex w-2/3 gap-5">
                <Button
                  className={`flex flex-1 gap-3 justify-center text-white hover:bg-gray-500 items-center text-[1.125rem] max-md:text-[1rem] font-medium rounded-md py-5 max-md:py-2 cursor-pointer ${
                    selectedButton === "Đã yêu cầu"
                      ? "bg-[#062D76]"
                      : "bg-[#b6cefa]"
                  }`}
                  onClick={() => handleButtonClick("Đã yêu cầu")}
                >
                  <Loader
                    style={{
                      width: "1.25rem",
                      height: "1.25rem",
                    }}
                    className="size-6"
                  />
                  Đã yêu cầu
                </Button>

                <Button
                  className={`flex flex-1 gap-3 justify-center text-white hover:bg-gray-500 items-center text-[1.125rem] max-md:text-[1rem] font-medium rounded-md py-5 max-md:py-2 cursor-pointer ${
                    selectedButton === "Đang mượn"
                      ? "bg-[#062D76]"
                      : "bg-[#b6cefa]"
                  }`}
                  onClick={() => handleButtonClick("Đang mượn")}
                >
                  <BookCheck
                    style={{
                      width: "1.25rem",
                      height: "1.25rem",
                    }}
                    className="size-6"
                  />
                  Đang mượn
                </Button>

                <Button
                  className={`flex flex-1 gap-3 justify-center text-white hover:bg-gray-500 items-center text-[1.125rem] max-md:text-[1rem] font-medium rounded-md py-5 max-md:py-2 cursor-pointer ${
                    selectedButton === "Đã trả"
                      ? "bg-[#062D76]"
                      : "bg-[#b6cefa]"
                  }`}
                  onClick={() => handleButtonClick("Đã trả")}
                >
                  <TimerOff
                    style={{
                      width: "1.25rem",
                      height: "1.25rem",
                    }}
                    className="size-6"
                  />
                  Đã trả
                </Button>
              </div>
              <div className="flex gap-5">
                <Input
                  type="text"
                  placeholder="Tìm kiếm"
                  className="w-full h-10 font-thin italic text-black text-2xl bg-white rounded-[10px]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
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
              </div>
            </header>
            <section className="gap-y-2.5 mt-5">
              {loading ? (
                <div className="flex justify-center">
                  <ThreeDot
                    color="#062D76"
                    size="large"
                    text="Đang tải..."
                    textColor="#062D76"
                  />
                </div>
              ) : paginatedCards?.length > 0 ? (
                paginatedCards.map((borrowing) => (
                  <article
                    key={borrowing.id}
                    className="p-4 bg-white rounded-xl shadow-sm mb-2"
                  >
                    <div className="flex justify-between items-center max-md:flex-col max-md:gap-5 max-md:items-start">
                      <div className="flex flex-col gap-2">
                        <h3 className="text-[1rem] font-semibold text-[#131313]/50">
                          ID:{" "}
                          <span className="text-[#131313] font-medium">
                            {borrowing.id}
                          </span>
                        </h3>
                        <p className="text-[1rem] font-semibold text-[#131313]/50">
                          User ID:{" "}
                          <span className="text-[#131313] font-medium">
                            {borrowing.userId}
                          </span>
                        </p>
                        <p className="text-[1rem] font-semibold text-[#131313]/50">
                          Ngày mượn:{" "}
                          <span className="text-[#131313] font-medium">
                            {formatDate(borrowing.borrowDate)}
                          </span>
                        </p>
                        <p className="text-[1rem] font-semibold text-[#131313]/50">
                          {selectedButton === "Đang mượn" && (
                            <>
                              Ngày trả dự kiến:{" "}
                              <span className="text-[#131313] font-medium">
                                {formatDate(borrowing.dueDate)}
                              </span>
                            </>
                          )}

                          {selectedButton === "Đã trả" && (
                            <>
                              {borrowing.dueDate
                                ? "Ngày trả: "
                                : "Hạn lấy sách: "}
                              <span className="text-[#131313] font-medium">
                                {borrowing.dueDate
                                  ? formatDate(borrowing.dueDate)
                                  : formatDate(borrowing.getBookDate)}
                              </span>
                            </>
                          )}

                          {selectedButton === "Đã yêu cầu" && (
                            <>
                              Hạn lấy sách:{" "}
                              <span className="text-[#131313] font-medium">
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
                        <List
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
                  </article>
                ))
              ) : (
                <p className="text-center text-gray-600">
                  Không có phiếu mượn nào.
                </p>
              )}
            </section>
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-6">
                <Button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1 || loading}
                  className="bg-[#062D76] hover:bg-gray-700 text-white"
                >
                  Trước
                </Button>
                {pageNumbers.map((number) => (
                  <Button
                    key={number}
                    onClick={() => handlePageChange(number)}
                    className={`${
                      currentPage === number
                        ? "bg-[#062D76] text-white"
                        : "bg-white text-[#062D76] border border-[#062D76] hover:bg-gray-100"
                    }`}
                  >
                    {number}
                  </Button>
                ))}
                <Button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages || loading}
                  className="bg-[#062D76] hover:bg-gray-700 text-white"
                >
                  Sau
                </Button>
              </div>
            )}
            <div
              className={`fixed bottom-6 right-10 ${
                selectedButton === "Đã yêu cầu" ? "" : "hidden"
              }`}
            >
              <Button
                title={"Xét phiếu đã trả"}
                className="bg-red-700 rounded-3xl w-12 h-12 border-2 border-white"
                onClick={() => {
                  handleExpired();
                }}
              >
                <TicketX className="w-24 h-24" color="white" />
              </Button>
              <Button
                title={"Thêm Phiếu Mượn"}
                className="bg-[#062D76] rounded-3xl w-12 h-12 border-2 border-white"
                onClick={() => {
                  handleAddBorrow();
                }}
              >
                <Plus className="w-24 h-24" color="white" />
              </Button>
            </div>
            <div
              className={`fixed bottom-6 right-10 ${
                selectedButton === "Đang mượn" ? "" : "hidden"
              }`}
            >
              <Button
                title={"Gửi Mail hối trả sách"}
                className="bg-red-700 rounded-3xl w-12 h-12 border-2 border-white"
                onClick={() => {
                  handleMailing();
                }}
              >
                <MailWarning className="w-24 h-24" color="white" />
              </Button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
};

export default Page;
