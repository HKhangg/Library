"use client";

import React, { useMemo, useState, useEffect } from "react";
import useSWR from "swr";
import Link from "next/link";
import LeftSideBar from "../components/LeftSideBar";
import BookCard from "../components/BookCard";
import ServiceHoursCard from "./ServiceHoursCard";
import ChatBotButton from "../components/ChatBoxButton";
import { ThreeDot } from "react-loading-indicators";
import Slider from "react-slick";
import BookRecommend from "../components/BookRecomend";
import { fetcher } from "@/lib/fetcher";
import axios from "axios";

// Import CSS cho Slider
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

const INITIAL_LOAD_SIZE = 24;
const LOAD_MORE_SIZE = 12;
const MIN_RECOMMEND_COUNT = 6;
const SIDEBAR_REFRESH_INTERVAL = 10000;

const HomePage = () => {
  const [displayedCount, setDisplayedCount] = useState(INITIAL_LOAD_SIZE);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [sidebarBooks, setSidebarBooks] = useState([]);
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);

  const { data: allBooksData, error: booksError, isLoading: booksLoading } = useSWR(
    `${process.env.NEXT_PUBLIC_API_URL}/api/book`,
    fetcher,
    { dedupingInterval: 30000 }
  );

  const getSuggestKey = () => {
    if (typeof window === 'undefined') return null;
    const userId = localStorage.getItem("id");
    const searchKeywords = localStorage.getItem("searchKeywords");
    const accessToken = localStorage.getItem("accessToken");

    if (accessToken && !isLoggedIn) setIsLoggedIn(true);

    const keywords = searchKeywords ? JSON.parse(searchKeywords) : [];
    return {
      url: "http://localhost:8080/api/book/suggest",
      userId,
      keywords
    };
  };

  const { data: suggestData, isLoading: suggestLoading } = useSWR(
    getSuggestKey,
    async (key) => {
      if (!key) return [];
      const response = await axios.post(key.url, {
        userId: key.userId,
        keywords: key.keywords
      });
      return response.data;
    },
    { dedupingInterval: 120000 }
  );

  // Normalize data
  const allBooks = useMemo(() => {
    if (!allBooksData) return [];
    return allBooksData
      .filter((b) => b.trangThai !== "DA_XOA")
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
  }, [allBooksData]);

  const bookSuggest = useMemo(() => {
    if (!suggestData || !Array.isArray(suggestData)) return [];
    return suggestData.map((book) => ({
      id: book.maSach,
      imageSrc: book.hinhAnh?.[0] || "",
      available: book.tongSoLuong - book.soLuongMuon - book.soLuongXoa > 0,
      title: book.tenSach,
      author: book.tenTacGia,
      publisher: book.nxb,
      borrowCount: book.soLuongMuon,
    }));
  }, [suggestData]);

  const finalSuggestions = useMemo(() => {
    let final = [...bookSuggest];
    if (final.length < MIN_RECOMMEND_COUNT && allBooks.length > 0) {
      const existingIds = new Set(final.map((b) => b.id));
      const fillers = allBooks.filter((b) => !existingIds.has(b.id));
      final = [...final, ...fillers.slice(0, MIN_RECOMMEND_COUNT - final.length)];
    }
    return final;
  }, [bookSuggest, allBooks]);

  const displayedBooks = useMemo(() => {
    return allBooks.slice(0, displayedCount);
  }, [allBooks, displayedCount]);

  const hasNextPage = displayedCount < allBooks.length;

  const handleLoadMore = () => {
    setDisplayedCount((prev) => Math.min(prev + LOAD_MORE_SIZE, allBooks.length));
  };

  // Logic Random Sách
  useEffect(() => {
    if (allBooks.length === 0) return;

    const pickRandomBooks = () => {
      const shuffled = [...allBooks].sort(() => 0.5 - Math.random());
      return shuffled.slice(0, 4);
    };

    setSidebarBooks(pickRandomBooks());

    const intervalId = setInterval(() => {
      setIsSidebarVisible(false);
      setTimeout(() => {
        setSidebarBooks(pickRandomBooks());
        setIsSidebarVisible(true);
      }, 500);
    }, SIDEBAR_REFRESH_INTERVAL);

    return () => clearInterval(intervalId);
  }, [allBooks]);


  const sliderRecommendSettings = {
    dots: false,
    arrows: true,
    infinite: finalSuggestions.length > 4,
    speed: 500,
    slidesToShow: 4,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
    responsive: [
      { breakpoint: 1024, settings: { slidesToShow: 3, infinite: finalSuggestions.length > 3 } },
      { breakpoint: 768, settings: { slidesToShow: 2, infinite: finalSuggestions.length > 2 } },
      { breakpoint: 480, settings: { slidesToShow: 1, infinite: finalSuggestions.length > 1 } },
    ],
  };

  const sliderSettings = {
    dots: true,
    arrows: false,
    infinite: true,
    speed: 1000,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
    fade: true,
  };

  const loading = booksLoading || suggestLoading;

  return (
    <div className="flex flex-col min-h-screen -mr-[180px] mt-15 bg-white dark:bg-gray-900 transition-colors duration-300">
      <main className="flex">
        <LeftSideBar />
        {loading ? (
          <div className="flex w-full h-screen justify-center items-center">
            <ThreeDot color="#30c9e8" size="large" text="Vui lòng chờ" variant="bounce" textColor="#30c9e8" />
          </div>
        ) : (
          <section className="flex-1 max-w-[1400px] mx-auto px-4 mb-4 mt-8 items-center z-10">

            {/* --- LAYOUT CHÍNH --- */}
            <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6 lg:h-[510px]">

              {/* CỘT TRÁI: SLIDER */}
              <div className="w-full h-[510px] overflow-hidden rounded-2xl bg-gray-100 dark:bg-gray-800 min-w-0 relative shadow-sm">
                <Slider {...sliderSettings} className="h-full custom-slick-slider">

                  {/* Slide 1: Service Hours Card - SỬ DỤNG !IMPORTANT ĐỂ FORCE LAYOUT */}
                  <div className="h-[510px] w-full relative">
                    {/* Thêm dấu chấm than (!) vào các class width/height/max-w
                        để ghi đè (override) mọi style bên trong ServiceHoursCard
                     */}
                    <div className="w-full h-full flex [&>div]:!w-full [&>div]:!h-full [&>div]:!max-w-none [&>div]:!mx-0 [&>div]:!rounded-2xl">
                      <ServiceHoursCard />
                    </div>
                  </div>

                  <div className="h-[510px] w-full"><img src="https://mintbook.com/blog/wp-content/uploads/Must-Have-Digital-Library-Tools-1.jpeg.webp" className="w-full h-full object-cover" /></div>
                  <div className="h-[510px] w-full"><img src="https://static.vecteezy.com/system/resources/thumbnails/027/196/314/small/concept-of-electronic-library-online-bookstore-ebook-online-library-people-reading-books-with-digital-library-service-users-learn-with-book-archives-illustration-for-web-design-vector.jpg" className="w-full h-full object-cover" /></div>
                  <div className="h-[510px] w-full"><img src="https://fsucard.com/wp-content/uploads/2022/10/Computer-Library.jpeg" className="w-full h-full object-cover" /></div>
                  <div className="h-[510px] w-full"><img src="https://img.freepik.com/free-vector/online-library-app-reading-banner_33099-1733.jpg" className="w-full h-full object-cover" /></div>
                  <div className="h-[510px] w-full"><img src="https://img.freepik.com/free-vector/audio-books-isometric-composition-with-character-female-librarian-with-book-shelves-inside-smartphone-screen-frame-vector-illustration_1284-80591.jpg" className="w-full h-full object-cover" /></div>
                </Slider>
              </div>

              {/* CỘT PHẢI: LIST SÁCH RANDOM */}
              <div
                className={`flex flex-col justify-between h-[510px] transition-all duration-500 ease-in-out ${isSidebarVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
                  }`}
              >
                {sidebarBooks.length > 0 ? (
                  sidebarBooks.map((book) => (
                    <Link href={`/book-detail/${book.id}`} key={book.id} className="block group w-full h-[23%]">
                      <div className="flex bg-blue-50 dark:bg-gray-800 w-full h-full items-center shadow-sm rounded-xl overflow-hidden hover:shadow-md hover:translate-x-1 transition-all duration-300 border border-transparent hover:border-blue-300">
                        <div className="w-[100px] h-full flex-shrink-0 relative overflow-hidden">
                          <img
                            src={book.imageSrc || "/placeholder-book.png"}
                            alt={book.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 p-3 flex flex-col justify-center overflow-hidden">
                          <h3 className="text-sm font-bold text-gray-900 dark:text-white line-clamp-2 mb-1 group-hover:text-[#30c9e8] transition-colors">
                            {book.title}
                          </h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {book.author}
                          </p>
                          <div className="mt-2">
                            <span className="text-[10px] px-2 py-1 bg-blue-100 text-blue-600 rounded-full font-bold">
                              {book.borrowCount} lượt xem
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))
                ) : (
                  [...Array(4)].map((_, i) => (
                    <div key={i} className="w-full h-[23%] bg-gray-200 dark:bg-gray-700 animate-pulse rounded-xl"></div>
                  ))
                )}
              </div>
            </div>

            {/* Book recommendations */}
            <div className="bg-blue-50 mt-8 dark:bg-gray-800 rounded-xl p-5 transition-colors duration-300">
              <h2 className="inline-block px-6 py-2 text-white shadow-md font-bold bg-[#9ce5f4] rounded-lg">
                Có thể bạn sẽ thích
              </h2>
              {finalSuggestions.length > 0 ? (
                <Slider key={finalSuggestions.length} {...sliderRecommendSettings} className="mt-5 max-w-6xl mx-auto">
                  {finalSuggestions.map((book) => (
                    <div key={book.id} className="px-2 md:px-4">
                      <BookRecommend {...book} />
                    </div>
                  ))}
                </Slider>
              ) : (
                <p className="mt-5 text-center text-gray-500">Đang cập nhật sách gợi ý...</p>
              )}
            </div>

            {/* All books */}
            <section className="mt-9 bg-blue-50 dark:bg-gray-800 rounded-xl p-5 transition-colors duration-300">
              <h2 className="inline-block px-4 py-2 font-bold text-white bg-[#9ce5f4] shadow-md rounded-lg">
                Sách hay nè
              </h2>
              <div className="grid md:grid-cols-2 gap-6 mt-5">
                {displayedBooks.map((book) => (
                  <BookCard key={book.id} {...book} />
                ))}
              </div>
              <div className="mt-6 flex justify-center">
                <button
                  onClick={handleLoadMore}
                  disabled={!hasNextPage}
                  className="px-6 py-3 bg-[#062D76] dark:bg-blue-700 text-white rounded-lg cursor-pointer disabled:bg-gray-400 disabled:opacity-70 disabled:cursor-not-allowed hover:bg-opacity-90 transition-all duration-200"
                >
                  {hasNextPage ? "Xem thêm sách" : "Đã tải toàn bộ sách"}
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