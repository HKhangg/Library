"use client";

import React, { useEffect, useState } from "react";
import LeftSideBar from "../components/LeftSideBar";
import BookCard from "../components/BookCard";
import CollectionCard from "./CollectionCard";
import ServiceHoursCard from "./ServiceHoursCard";
import ChatBotButton from "../components/ChatBoxButton";
import axios from "axios";
import { ThreeDot } from "react-loading-indicators";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import BookRecommend from "../components/BookRecomend";
import ImageCard from "./ImageCard";

const HomePage = () => {
  const [books, setBooks] = useState([]);
  const [bookSuggest, setBooksSuggest] = useState([]);
  const [q, setQ] = useState("");
  const [mode, setMode] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 20;
  const [loading, setLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const sliderRecommendSettings = {
    dots: false,
    arrows: true,
    infinite: true,
    speed: 200,
    slidesToShow: 4,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
  };

  const sliderSettings = {
    dots: false,
    arrows: false,
    infinite: true,
    speed: 200,
    slidesToShow: 2,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 2000,
    responsive: [
      {
        breakpoint: 2000,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
        },
      },
    ],
  };

  useEffect(() => {
    if (mode === "all") fetchAll();
  }, [mode, currentPage]);

  useEffect(() => {
    const fetchBooksSuggest = async () => {
      try {
        const userId = localStorage.getItem("id"); 
        const searchKeywords = localStorage.getItem("searchKeywords"); 
        const accessToken = localStorage.getItem("accessToken");
        setIsLoggedIn(!!accessToken); 
        const keywords = searchKeywords ? JSON.parse(searchKeywords) : [];

        const response = await axios.post(
          "http://localhost:8080/api/book/suggest",
          { userId, keywords }
        );

        const convertedBooks = response.data.map((book) => ({
          id: book.maSach,
          imageSrc: book.hinhAnh[0],
          available: book.tongSoLuong - book.soLuongMuon - book.soLuongXoa > 0,
          title: book.tenSach,
          author: book.tenTacGia,
          publisher: book.nxb,
          borrowCount: book.soLuongMuon,
        }));
        setBooksSuggest(convertedBooks);
      } catch (error) {
        console.error("Lỗi khi fetch sách:", error);
      }
    };

    fetchBooksSuggest();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/book`);
      const normalizedData = normalize(data);
      setBooks(normalizedData);
      setTotalPages(Math.ceil(normalizedData.length / itemsPerPage) || 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const normalize = (arr) =>
    arr
      ?.filter((b) => b.trangThai !== "DA_XOA")
      .map((b) => ({
        id: b.maSach,
        imageSrc: b.hinhAnh?.[0] || "",
        status: b.trangThai,
        remaining: b.soLuongCon,
        title: b.tenSach,
        author: b.tenTacGia,
        publisher: b.nxb,
        borrowCount: b.soLuongMuon,
      }));

  const paginatedBooks = books.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  return (
    <div className="flex flex-col min-h-screen -mr-[180px] mt-15
                bg-white dark:bg-gray-900 transition-colors duration-300">
      <main className="flex">
        <LeftSideBar />
        {loading ? (
          <div className="flex w-full h-screen justify-center items-center">
            <ThreeDot
              color="#30c9e8"
              size="large"
              text="Vui lòng chờ"
              variant="bounce"
              textColor="#30c9e8"
            />
          </div>
        ) : (
          <section className="flex-1 max-w-7xl mx-auto px-2 mb-4 mt-8 items-center z-10">
            <div className="grid grid-cols-[3fr_2fr]">
              <div className="px-4 h-[510px] w-[800px]">
                <Slider {...sliderSettings} className="mb-5 max-w-5xl h-auto gap-12">
                  <ServiceHoursCard />
                  <img
                    src="https://mintbook.com/blog/wp-content/uploads/Must-Have-Digital-Library-Tools-1.jpeg.webp"
                    alt="anh bi loi"
                    className="object-cover rounded-2xl h-[500px]"
                  />
                  <img
                    src="https://static.vecteezy.com/system/resources/thumbnails/027/196/314/small/concept-of-electronic-library-online-bookstore-ebook-online-library-people-reading-books-with-digital-library-service-users-learn-with-book-archives-illustration-for-web-design-vector.jpg"
                    alt="anh bi loi"
                    className="object-cover rounded-2xl h-[500px]"
                  />
                  <img
                    src="https://fsucard.com/wp-content/uploads/2022/10/Computer-Library.jpeg"
                    alt="anh bi loi"
                    className="object-cover rounded-2xl h-[500px]"
                  />
                  <img
                    src="https://img.freepik.com/free-vector/online-library-app-reading-banner_33099-1733.jpg"
                    alt="anh bi loi"
                    className="object-cover rounded-2xl h-[500px]"
                  />
                  <img
                    src="https://img.freepik.com/free-vector/audio-books-isometric-composition-with-character-female-librarian-with-book-shelves-inside-smartphone-screen-frame-vector-illustration_1284-80591.jpg"
                    alt="anh bi loi"
                    className="object-cover rounded-2xl h-[500px]"
                  />
                </Slider>
              </div>

              <div>
                {[...Array(4)].map((_, idx) => (
                  <div key={idx} className="h-[116px] mt-2 mb-2 border-b-2 border-blue-300 z-50">
                    <div className="grid grid-cols-[1fr_2fr] 
                bg-blue-50 dark:bg-gray-800 
                w-full h-[100px] items-center 
                shadow-md hover:scale-105 hover:shadow-xl hover:brightness-110 
                transition-transform duration-300 z-50">
                      <img
                        src="https://bizweb.dktcdn.net/100/363/455/files/website-a-nh-da-i-die-n-ba-i-vie-t-16-4fe6bbb7-f06e-45f8-9907-f1d2c78af6d1.png?v=1742196045380"
                        alt=""
                        className="w-40 h-25 object-cover"
                      />
                      <h3 className="text-m text-center text-gray-900 dark:text-white">
                        Nội dung bài viết {idx + 1}
                      </h3>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-blue-50  mt-6 dark:bg-gray-800 rounded-xl p-5 transition-colors duration-300">
              <h2 className="inline-block px-6 py-2 text-white shadow-md font-bold bg-[#9ce5f4] rounded-lg">
                Có thể bạn sẽ thích
              </h2>
              <Slider {...sliderRecommendSettings} className="mt-5 max-w-6xl">
                {bookSuggest.map((book) => (
                  <div key={book.id} className="px-10">
                    <BookRecommend {...book} />
                  </div>
                ))}
              </Slider>
            </div>

            <section className="mt-9 bg-blue-50  dark:bg-gray-800 rounded-xl p-5 transition-colors duration-300">
              <h2 className="inline-block px-4 py-2 font-bold text-white bg-[#9ce5f4] shadow-md rounded-lg">
                Sách hay nè
              </h2>
              <div className="grid md:grid-cols-2 gap-6 mt-5">
                {paginatedBooks.map((book) => (
                  <BookCard key={book.id} {...book} />
                ))}
              </div>
              <div className="mt-4 flex justify-center gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-[#062D76] dark:bg-blue-700 text-white rounded cursor-pointer disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Trang trước
                </button>
                <span className="px-4 py-2 text-gray-700 dark:text-gray-100">
                  Trang {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-[#062D76] dark:bg-blue-700 text-white rounded cursor-pointer disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Trang sau
                </button>
              </div>
            </section>

            {isLoggedIn && <ChatBotButton />}
          </section>
        )}
      </main>
    </div>
  );
};

export default HomePage;
