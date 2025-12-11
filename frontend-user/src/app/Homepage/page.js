"use client";

import React, { useMemo, useState, useEffect } from "react";
import useSWR from "swr";
import LeftSideBar from "../components/LeftSideBar";
import BookCard from "../components/BookCard";
import CollectionCard from "./CollectionCard";
import ServiceHoursCard from "./ServiceHoursCard";
import ChatBotButton from "../components/ChatBoxButton";
import { ThreeDot } from "react-loading-indicators";
import Slider from "react-slick";
import BookRecommend from "../components/BookRecomend";
import ImageCard from "./ImageCard";
import { fetcher } from "@/lib/fetcher";
import axios from "axios";

// Import CSS cho Slider
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

const INITIAL_LOAD_SIZE = 24;
const LOAD_MORE_SIZE = 12;
const MIN_RECOMMEND_COUNT = 6;

const HomePage = () => {
  const [displayedCount, setDisplayedCount] = useState(INITIAL_LOAD_SIZE);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const { data: allBooksData, error: booksError, isLoading: booksLoading } = useSWR(
    `${process.env.NEXT_PUBLIC_API_URL}/api/book`,
    fetcher,
    {
      dedupingInterval: 30000,         
    }
  );

  // Build suggest request key
  const getSuggestKey = () => {
    if (typeof window === 'undefined') return null;
    const userId = localStorage.getItem("id");
    const searchKeywords = localStorage.getItem("searchKeywords");
    const accessToken = localStorage.getItem("accessToken");

    if (accessToken && !isLoggedIn) {
      setIsLoggedIn(true);
    }

    const keywords = searchKeywords ? JSON.parse(searchKeywords) : [];
    return {
      url: "http://localhost:8080/api/book/suggest",
      userId,
      keywords
    };
  };

  // ✅ SWR: Fetch book suggestions
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
    {
      dedupingInterval: 120000,         // Cache 120s cho suggest
    }
  );

  // Normalize books data
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

  // Normalize suggest books
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

  // Get final suggestions with fallback
  const finalSuggestions = useMemo(() => {
    let final = [...bookSuggest];
    if (final.length < MIN_RECOMMEND_COUNT && allBooks.length > 0) {
      const existingIds = new Set(final.map((b) => b.id));
      const fillers = allBooks.filter((b) => !existingIds.has(b.id));
      final = [...final, ...fillers.slice(0, MIN_RECOMMEND_COUNT - final.length)];
    }
    return final;
  }, [bookSuggest, allBooks]);

  // Displayed books (pagination)
  const displayedBooks = useMemo(() => {
    return allBooks.slice(0, displayedCount);
  }, [allBooks, displayedCount]);

  const hasNextPage = displayedCount < allBooks.length;

  const handleLoadMore = () => {
    setDisplayedCount((prev) => Math.min(prev + LOAD_MORE_SIZE, allBooks.length));
  };

  // Slider settings
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
    dots: false,
    arrows: false,
    infinite: true,
    speed: 200,
    slidesToShow: 2,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 2000,
    responsive: [{ breakpoint: 2000, settings: { slidesToShow: 1, slidesToScroll: 1 } }],
  };

  // Loading state
  const loading = booksLoading || suggestLoading;

  return (
    <div className="flex flex-col min-h-screen -mr-[180px] mt-15 bg-white dark:bg-gray-900 transition-colors duration-300">
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
            {/* Slider banner */}
            <div className="grid grid-cols-[3fr_2fr]">
              <div className="px-4 h-[510px] w-[800px]">
                <Slider {...sliderSettings} className="mb-5 max-w-5xl h-auto gap-12">
                  <ServiceHoursCard />
                  <img src="https://mintbook.com/blog/wp-content/uploads/Must-Have-Digital-Library-Tools-1.jpeg.webp" alt="slider image" className="object-cover rounded-2xl h-[500px]" />
                  <img src="https://static.vecteezy.com/system/resources/thumbnails/027/196/314/small/concept-of-electronic-library-online-bookstore-ebook-online-library-people-reading-books-with-digital-library-service-users-learn-with-book-archives-illustration-for-web-design-vector.jpg" alt="slider image" className="object-cover rounded-2xl h-[500px]" />
                  <img src="https://fsucard.com/wp-content/uploads/2022/10/Computer-Library.jpeg" alt="slider image" className="object-cover rounded-2xl h-[500px]" />
                  <img src="https://img.freepik.com/free-vector/online-library-app-reading-banner_33099-1733.jpg" alt="slider image" className="object-cover rounded-2xl h-[500px]" />
                  <img src="https://img.freepik.com/free-vector/audio-books-isometric-composition-with-character-female-librarian-with-book-shelves-inside-smartphone-screen-frame-vector-illustration_1284-80591.jpg" alt="slider image" className="object-cover rounded-2xl h-[500px]" />
                </Slider>
              </div>

              <div>
                {[...Array(4)].map((_, idx) => (
                  <div key={idx} className="h-[116px] mt-2 mb-2 border-b-2 border-blue-300 z-50">
                    <div className="grid grid-cols-[1fr_2fr] bg-blue-50 dark:bg-gray-800 w-full h-[100px] items-center shadow-md hover:scale-105 hover:shadow-xl hover:brightness-110 transition-transform duration-300 z-50">
                      <img src="https://bizweb.dktcdn.net/100/363/455/files/website-a-nh-da-i-die-n-ba-i-vie-t-16-4fe6bbb7-f06e-45f8-9907-f1d2c78af6d1.png?v=1742196045380" alt="news" className="w-40 h-25 object-cover" />
                      <h3 className="text-m text-center text-gray-900 dark:text-white">Nội dung bài viết {idx + 1}</h3>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Book recommendations */}
            <div className="bg-blue-50 mt-6 dark:bg-gray-800 rounded-xl p-5 transition-colors duration-300">
              <h2 className="inline-block px-6 py-2 text-white shadow-md font-bold bg-[#9ce5f4] rounded-lg">
                Có thể bạn sẽ thích
              </h2>

              {finalSuggestions.length > 0 ? (
                <Slider key={finalSuggestions.length} {...sliderRecommendSettings} className="mt-5 max-w-6xl">
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