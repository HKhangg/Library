"use client";

import React, { useEffect, useState } from "react";
import { ThreeDot } from "react-loading-indicators";
import Sidebar from "../components/sidebar/Sidebar";
import StatisticsCard from "./StatisticsCard";
import axios from "axios";
import toast from "react-hot-toast";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const Dashboard = () => {
  const [totalBooks, setTotalBooks] = useState(0);
  const [totalBookQuantity, setTotalBookQuantity] = useState(0);
  const [newBooksThisMonth, setNewBooksThisMonth] = useState(0);
  const [borrowedBooksThisMonth, setBorrowedBooksThisMonth] = useState(0);
  const [monthlyStats, setMonthlyStats] = useState([]);
  const [booksToRestock, setBooksToRestock] = useState([]);
  const [allBooks, setAllBooks] = useState([]);
  const [filteredBooks, setFilteredBooks] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const booksPerPage = 10;
  const [searchParams, setSearchParams] = useState({
    author: "",
    category: "",
    publisher: "",
    year: "",
    title: "",
    mode: "all",
    sortByBorrowCount: false,
  });
  const [loading, setLoading] = useState(false);
  const [activeSection, setActiveSection] = useState("danhSach"); // Default to "Danh sách các sách"
  const router = useRouter();

  // State for chart data
  const [barChartData, setBarChartData] = useState({
    labels: [],
    datasets: [],
  });
  const [lineChartData, setLineChartData] = useState({
    labels: [],
    datasets: [],
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const dashboardResponse = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/book/dashboard`,
          { headers: { "Cache-Control": "no-cache" } }
        );

        setTotalBooks(dashboardResponse.data.totalBooks || 0);
        setTotalBookQuantity(dashboardResponse.data.totalBookQuantity || 0);
        setNewBooksThisMonth(dashboardResponse.data.newBooksThisMonth || 0);
        setBorrowedBooksThisMonth(
          dashboardResponse.data.borrowedBooksThisMonth || 0
        );
        setMonthlyStats(dashboardResponse.data.monthlyStats || []);
        setBooksToRestock(dashboardResponse.data.booksToRestock || []);

        const booksResponse = await axios.get(
// <<<<<<< thanhtri
//           "http://localhost:8080/api/book",
//           { headers: { "Cache-Control": "no-cache" } }
// =======
          `${process.env.NEXT_PUBLIC_API_URL}/api/book`,
          {
            headers: { "Cache-Control": "no-cache" },
          }

        );

        setAllBooks(booksResponse.data || []);
        setFilteredBooks(booksResponse.data || []);
        setTotalPages(Math.ceil(booksResponse.data.length / booksPerPage) || 1);
        setCurrentPage(1);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Không thể tải dữ liệu.");
        setAllBooks([]);
        setFilteredBooks([]);
        setTotalPages(1);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    console.log("monthlyStats:", monthlyStats); // Debug log to inspect the data
    // Bar chart for absolute values
    setBarChartData({
      labels: [
        "Tổng đầu sách",
        "Tổng số lượng sách",
        "Sách mới tháng này",
        "Sách mượn tháng này",
      ],
      datasets: [
        {
          label: "Số lượng",
          data: [
            totalBooks,
            totalBookQuantity,
            newBooksThisMonth,
            borrowedBooksThisMonth,
          ],
          backgroundColor: [
            "rgba(75, 192, 192, 0.6)",
            "rgba(255, 99, 132, 0.6)",
            "rgba(54, 162, 235, 0.6)",
            "rgba(255, 205, 86, 0.6)",
          ],
          borderColor: [
            "rgba(75, 192, 192, 1)",
            "rgba(255, 99, 132, 1)",
            "rgba(54, 162, 235, 1)",
            "rgba(255, 205, 86, 1)",
          ],
          borderWidth: 1,
        },
      ],
    });

    // Line chart for percentage growth (if previous month data exists)
    if (monthlyStats.length >= 2) {
      const prevMonth = monthlyStats[1]; // Previous month (May 2025)
      const currMonth = monthlyStats[0]; // Current month (June 2025)

      const prevNewBooks = Number(prevMonth.newBooks) || 0;
      const currNewBooks = Number(currMonth.newBooks) || 0;
      const prevBorrowedBooks = Number(prevMonth.borrowedBooks) || 0;
      const currBorrowedBooks = Number(currMonth.borrowedBooks) || 0;

      const newBooksGrowth =
        prevNewBooks > 0
          ? ((currNewBooks - prevNewBooks) / prevNewBooks) * 100
          : 0;
      const borrowGrowth =
        prevBorrowedBooks > 0
          ? ((currBorrowedBooks - prevBorrowedBooks) / prevBorrowedBooks) * 100
          : 0;
      setLineChartData({
        labels: ["Tháng này"],
        datasets: [
          {
            label: "% Tăng trưởng sách mới",
            data: [newBooksGrowth],
            borderColor: "rgb(54, 162, 235)",
            backgroundColor: "rgba(54, 162, 235, 0.2)",
            tension: 0.1,
            fill: false,
          },
          {
            label: "% Tăng trưởng lượt mượn",
            data: [borrowGrowth],
            borderColor: "rgb(255, 205, 86)",
            backgroundColor: "rgba(255, 205, 86, 0.2)",
            tension: 0.1,
            fill: false,
          },
        ],
      });
    } else {
      setLineChartData({ labels: [], datasets: [] });
    }
  }, [
    totalBooks,
    totalBookQuantity,
    newBooksThisMonth,
    borrowedBooksThisMonth,
    monthlyStats,
  ]);

  const fetchSearchResults = async (params) => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (params.mode === "all" && params.title) {
        queryParams.append("all", params.title.trim());
      } else if (params.mode === "author" && params.author) {
        queryParams.append("author", params.author.trim());
      } else if (params.mode === "category" && params.category) {
        queryParams.append("category", params.category.trim());
      } else if (params.mode === "publisher" && params.publisher) {
        queryParams.append("publisher", params.publisher.trim());
      } else if (params.mode === "year" && params.year) {
        if (/^\d{4}$/.test(params.year.trim())) {
          queryParams.append("year", params.year.trim());
        } else {
          toast.error("Vui lòng nhập năm theo định dạng YYYY (VD: 2023)");
          setLoading(false);
          return;
        }
      } else if (params.mode === "title" && params.title) {
        queryParams.append("title", params.title.trim());
      } else {
        setFilteredBooks(allBooks);
        setTotalPages(Math.ceil(allBooks.length / booksPerPage) || 1);
        setCurrentPage(1);
        setLoading(false);
        return;
      }
      queryParams.append("sortByBorrowCount", params.sortByBorrowCount);

      const response = await axios.get(
        `${
          process.env.NEXT_PUBLIC_API_URL
        }/api/book/search?${queryParams.toString()}`,
        { headers: { "Cache-Control": "no-cache" } }
      );
      console.log("Search results:", response.data);
      setFilteredBooks(response.data || []);
      setTotalPages(Math.ceil(response.data.length / booksPerPage) || 1);
      setCurrentPage(1);
    } catch (error) {
      console.error("Error fetching search results:", error);
      toast.error("Không thể tìm kiếm sách.");
      setFilteredBooks([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  const paginatedBooks = filteredBooks.slice(
    (currentPage - 1) * booksPerPage,
    currentPage * booksPerPage
  );

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      console.log(`Navigating to page ${page}`);
      setCurrentPage(page);
    }
  };

  const handleSearchChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSearchParams((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      fetchSearchResults(searchParams);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    console.log("Search submitted with params:", searchParams);
    fetchSearchResults(searchParams);
  };

  const handleBookClick = (id, type) => {
    if (type === "restock") {
      router.push(`/books/${id}`);
    }
  };

  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  const BookCard = ({ book, onClick }) => {
    const isAvailable = book.trangThai === "CON_SAN";
    return (
      <div
        className="flex bg-white w-full rounded-lg mt-2 p-5 gap-5 md:gap-10 drop-shadow-lg items-center cursor-pointer"
        onClick={onClick}
      >
        <img
          src={book.hinhAnh?.[0] || "/placeholder.png"}
          alt={book.tenSach}
          className="w-[145px] h-[205px] object-cover rounded"
          onError={(e) => (e.target.src = "/placeholder.png")}
        />
        <div className="flex flex-col gap-2 w-full">
          <p className="font-bold text-lg">{book.tenSach}</p>
          <p className="italic text-gray-600">{book.tenTacGia}</p>
          <p>Tổng số lượng: {book.tongSoLuong || 0}</p>
          <p>Số lượng mượn: {book.soLuongMuon || 0}</p>
          <p>Số lượng xóa: {book.soLuongXoa || 0}</p>
          <p className="font-semibold">
            Trạng thái:{" "}
            <span
              className={
                book.trangThai === "DA_XOA"
                  ? "text-red-500"
                  : book.trangThai === "DA_HET"
                  ? "text-yellow-600"
                  : "text-green-600"
              }
            >
              {book.trangThai === "DA_XOA"
                ? "Đã xóa"
                : book.trangThai === "DA_HET"
                ? "Đã hết"
                : "Còn sẵn"}
            </span>
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-row w-full min-h-screen bg-[#F4F7FE]">
      <Sidebar />
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
      ) : (
        <main className="self-stretch pr-[1.25rem] md:pl-52 ml-[1.25rem] my-auto w-full max-md:max-w-full py-[2rem]">
          {/* <section className="grid lg:grid-cols-4 md:grid-cols-2 grid-cols-1 gap-4 justify-between items-center w-full leading-none text-white h-full max-md:max-w-full">
            <StatisticsCard
              icon="https://cdn.builder.io/api/v1/image/assets/TEMP/e444cbee3c99f14768fa6c876faa966d9bede995?placeholderIfAbsent=true&apiKey=d911d70ad43c41e78d81b9650623c816"
              title="Tổng đầu sách"
              value={totalBooks}
            />
            <StatisticsCard
              title="Tổng số lượng sách"
              value={totalBookQuantity}
            />
            <StatisticsCard
              icon="https://cdn.builder.io/api/v1/image/assets/TEMP/70bb6ff8485146e65b19f58221ee1e5ce86c9519?placeholderIfAbsent=true&apiKey=d911d70ad43c41e78d81b9650623c816"
              title="Sách mới tháng này"
              value={newBooksThisMonth}
            />
            <StatisticsCard
              icon="https://cdn.builder.io/api/v1/image/assets/TEMP/70bb6ff8485146e65b19f58221ee1e5ce86c9519?placeholderIfAbsent=true&apiKey=d911d70ad43c41e78d81b9650623c816"
              title="Sách mượn tháng này"
              value={borrowedBooksThisMonth}
            />
          </section> */}
          

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-lg" style={{ height: "400px" }}>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Thống kê tuyệt đối
              </h2>
              {barChartData.labels.length > 0 ? (
                <Bar
                  data={barChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { position: "top" },
                      title: { display: true, text: "Số lượng theo tháng này" },
                    },
                    scales: {
                      x: { title: { display: true, text: "Chỉ số" } },
                      y: {
                        title: { display: true, text: "Số lượng" },
                        beginAtZero: true,
                      },
                    },
                  }}
                />
              ) : (
                <p className="text-gray-600">Không có dữ liệu để hiển thị.</p>
              )}
            </div>
            <div className="bg-white p-6 rounded-lg shadow-lg" style={{ height: "400px" }}>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Xu hướng tăng trưởng
              </h2>
              {lineChartData.labels.length > 0 ? (
                <Line
                  data={lineChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { position: "top" },
                      title: {
                        display: true,
                        text: "% Tăng trưởng so với tháng trước",
                      },
                    },
                    scales: {
                      x: { title: { display: true, text: "Thời gian" } },
                      y: {
                        title: { display: true, text: "% Tăng trưởng" },
                        beginAtZero: true,
                      },
                    },
                  }}
                />
              ) : (
                <p className="text-gray-600">
                  Không đủ dữ liệu để hiển thị xu hướng.
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-2 p-2 mt-8 rounded-md w-full items-center justify-center">
            <select
              name="mode"
              onChange={handleSearchChange}
              value={searchParams.mode}
              className="border border-gray-300 bg-gray-100 rounded-md shadow p-2 font-thin italic cursor-pointer"
            >
              <option value="all">Tất cả</option>
              <option value="title">Tên sách</option>
              <option value="author">Tác giả</option>
              <option value="category">Thể loại</option>
              <option value="publisher">Nhà xuất bản</option>
              <option value="year">Năm xuất bản</option>
            </select>
            <Input
              type="text"
              placeholder="Tìm kiếm..."
              value={
                searchParams.mode === "title"
                  ? searchParams.title
                  : searchParams.mode === "author"
                  ? searchParams.author
                  : searchParams.mode === "category"
                  ? searchParams.category
                  : searchParams.mode === "publisher"
                  ? searchParams.publisher
                  : searchParams.mode === "year"
                  ? searchParams.year
                  : searchParams.title
              }
              name={searchParams.mode !== "all" ? searchParams.mode : "title"}
              onChange={handleSearchChange}
              onKeyDown={handleKeyDown}
              className="flex-1 p-3 text-black bg-white shadow font-thin italic cursor-text"
            />
            <Button
              onClick={handleSearchSubmit}
              className="w-10 h-10 bg-[#062D76] hover:bg-gray-700 shadow rounded-md cursor-pointer"
            >
              <Search className="w-5 h-5" color="white" />
            </Button>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="sortByBorrowCount"
                checked={searchParams.sortByBorrowCount}
                onChange={handleSearchChange}
                className="form-checkbox h-5 w-5 text-[#062D76]"
              />
              <span className="text-gray-700">Sắp xếp theo số lượt mượn</span>
            </label>
          </div>

          <div className="mt-6 w-full">
            <div className="flex gap-4 mb-6">
              <Button
                onClick={() => setActiveSection("danhSach")}
                className={`px-4 py-7 text-[1.25rem] text-white rounded-lg ${
                  activeSection === "danhSach"
                    ? "bg-[#062D76]"
                    : "bg-gray-300 hover:bg-gray-400"
                }`}
              >
                Danh sách các sách
              </Button>
              <Button
                onClick={() => setActiveSection("restock")}
                className={`px-4 py-7 text-[1.25rem] text-white rounded-lg ${
                  activeSection === "restock"
                    ? "bg-[#062D76]"
                    : "bg-gray-300 hover:bg-gray-400"
                }`}
              >
                Sách cần bổ sung ({booksToRestock.length})
              </Button>
            </div>
            {activeSection === "danhSach" && (
              <div className="w-full">
                {paginatedBooks.length > 0 ? (
                  paginatedBooks.map((book) => (
                    <BookCard
                      key={book.maSach}
                      book={book}
                      onClick={() => handleBookClick(book.maSach, "view")}
                    />
                  ))
                ) : (
                  <p className="text-gray-600 text-center">
                    Không tìm thấy sách phù hợp.
                  </p>
                )}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-6">
                    <Button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="bg-[#062D76] hover:bg-gray-700 text-white cursor-pointer"
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
                            : "bg-white text-[#062D76] border border-[#062D76] hover:bg-gray-100 cursor-pointer"
                        }`}
                      >
                        {number}
                      </Button>
                    ))}
                    <Button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="bg-[#062D76] hover:bg-gray-700 text-white cursor-pointer"
                    >
                      Sau
                    </Button>
                  </div>
                )}
              </div>
            )}
            {activeSection === "restock" && (
              <div className="w-full">
                {booksToRestock.length > 0 ? (
                  booksToRestock.map((book) => (
                    <BookCard
                      key={book.maSach}
                      book={book}
                      onClick={() => handleBookClick(book.maSach, "restock")}
                    />
                  ))
                ) : (
                  <p className="text-gray-600 text-center">
                    Không có sách nào cần bổ sung.
                  </p>
                )}
              </div>
            )}
          </div>

          
        </main>
      )}
    </div>
  );
};

export default Dashboard;
