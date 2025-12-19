"use client";

import React, { useState, useMemo } from "react";
import useSWR from "swr";
import BookCard from "../components/BookCard";
import { ThreeDot } from "react-loading-indicators";
import CategorySidebar from "../components/CategorySidebar";
import { fetcher } from "@/lib/fetcher";

export default function CategoriesPage() {
  const [activeParentId, setActiveParentId] = useState(null);
  const [activeChildId, setActiveChildId] = useState(null);
  const [activeFilter, setActiveFilter] = useState("ALL");

  const filterLabels = {
    ALL: "Tất cả sách",
    NEWEST: "Mới nhất",
    MOST_BORROWED: "Được mượn nhiều",
  };

  const { data: categories = [], isLoading: categoriesLoading } = useSWR(
    `${process.env.NEXT_PUBLIC_API_URL}/api/category`,
    fetcher,
    {
      dedupingInterval: 60000,
    }
  );

  const { data: categoryChildren = [], isLoading: childrenLoading } = useSWR(
    activeParentId
      ? `${process.env.NEXT_PUBLIC_API_URL}/api/category-child/category/${activeParentId}` 
      : null,
    fetcher,
    {
      dedupingInterval: 60000,
    }
  );

  const childrenMap = useMemo(() => {
    if (!activeParentId || !categoryChildren) return {};
    return { [activeParentId]: categoryChildren };
  }, [activeParentId, categoryChildren]);

  const booksUrl = useMemo(() => {
    const baseUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/book`;
    if (activeChildId) {


      
      return `${baseUrl}/v2/category-child/${activeChildId}?filter=${activeFilter}`;
    } else if (activeParentId) {
      return `${baseUrl}/v2/category-parent/${activeParentId}?filter=${activeFilter}`;
    } else {
      return `${baseUrl}/v2?filter=${activeFilter}`;
    }
  }, [activeParentId, activeChildId, activeFilter]);

  const { data: books = [], isLoading: booksLoading } = useSWR(
    booksUrl,
    fetcher,
    {
      dedupingInterval: 30000,          // Cache 30s - ngăn duplicate request
      keepPreviousData: true,           // Giữ data cũ khi đổi filter 
      revalidateOnFocus: false,         // Không refetch khi focus window
    }
  );

  const currentChildList = activeParentId ? childrenMap[activeParentId] || [] : [];


  const handleParentClick = (catId) => {
    if (activeParentId === catId) {
      setActiveParentId(null);
      setActiveChildId(null);
      setActiveFilter("ALL");
    } else {
      setActiveParentId(catId);
      setActiveChildId(null);
      setActiveFilter("ALL");
    }
  };

  const handleChildClick = (childId) => {
   
    if (activeChildId === childId) {
      setActiveChildId(null);
      setActiveFilter("ALL");
    } else {
      setActiveChildId(childId);
      setActiveFilter("ALL");
    }
  };

  return (
    <div className="flex flex-col min-h-screen -mr-[180px] mt-15 pt-9 bg-white dark:bg-gray-900 transition-colors duration-300">
      <main className="flex w-full z-10">
        <CategorySidebar
          categories={categories}
          childrenMap={childrenMap}
          activeParentId={activeParentId}
          activeChildId={activeChildId}
          onParentClick={handleParentClick}
          onChildClick={handleChildClick}
        />

        <section className="flex-1 max-w-7xl mx-auto px-15">
          <div className="bg-blue-50 dark:bg-gray-800 rounded-3xl p-6 transition-colors duration-300 shadow-md w-full">
            <div className="flex gap-9 mb-6 justify-center">
              {Object.entries(filterLabels).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setActiveFilter(key)}
                  className={`px-5 py-2 rounded-3xl font-roboto font-bold transition-colors duration-300 ${
                    activeFilter === key
                      ? "bg-[#30c9e8] text-white shadow-md"
                      : "bg-[#9ce5f4] text-white shadow-md hover:bg-[#66d7ee]"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Tiêu đề text-center*/}
            <h2 className="text-2xl font-roboto font-bold text-gray-900 dark:text-white mb-5">
              {activeChildId
                ? currentChildList.find((c) => c.id === activeChildId)?.name
                : activeParentId
                ? `Tất cả sách của ${
                    categories.find((c) => c.id === activeParentId)?.name
                  }`
                : "Tất cả sách"}
            </h2>

            {/* Nội dung sách */}
            {booksLoading ? (
              <div className="flex justify-center items-center h-[300px]">
                <ThreeDot
                  color="#30c9e8"
                  size="large"
                  text="Đang tải sách..."
                  variant="bounce"
                  textColor="#30c9e8"
                />
              </div>
            ) : books.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-6">
                {books.map((book) => (
                  <BookCard
                    key={book.maSach}
                    id={book.maSach}
                    imageSrc={book.hinhAnh?.[0] || "/placeholder.png"}
                    status={book.trangThai}
                    available={book.trangThai === "CON_SAN"}
                    title={book.tenSach}
                    author={book.tenTacGia}
                    publisher={`${book.nxb} (${book.nam})`}
                    borrowCount={book.soLuongMuon}
                  />
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-600 dark:text-gray-300 mt-4">
                Không có sách nào.
              </p>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
