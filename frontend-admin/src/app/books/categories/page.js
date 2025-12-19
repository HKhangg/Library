"use client";

import { useRouter } from "next/navigation";
import Sidebar from "@/app/components/sidebar/Sidebar";
import { Button } from "@/app/components/ui/button";
import { ChevronDown, PlusCircle, Undo2 } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

import useSWR from "swr";
import { fetcher } from "@/lib/fetcher"; 
export default function CategoryPage() {
  const router = useRouter();

  const {
    data: categories = [],
    isLoading,
    error,
  } = useSWR(
    `${process.env.NEXT_PUBLIC_API_URL}/api/category`,
    fetcher,
    {
      revalidateOnFocus: false, 
      dedupingInterval: 60000, // Cache 1 phút
      onError: () => toast.error("Không thể tải danh mục"),
    }
  );

  const handleGoBack = () => {
    router.back();
  };

  return (
    <div className="flex flex-row w-full min-h-screen bg-[#EFF3FB]">
      <Toaster position="top-center" reverseOrder={false} />
      <Sidebar />

      {/* Nút Quay lại */}
      <div className="absolute top-5 left-5 md:left-57 fixed z-10">
        <Button
          title={"Quay Lại"}
          className="bg-[#062D76] rounded-3xl w-10 h-10 hover:bg-gray-700"
          onClick={handleGoBack}
        >
          <Undo2 className="w-12 h-12" color="white" />
        </Button>
      </div>

      <div className="flex flex-col py-6 w-full md:ml-52 px-10">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold px-8">📚 Danh mục sách</h1>
          <Button
            className="bg-[#062D76] rounded-xl flex gap-2 hover:bg-gray-700"
            onClick={() => router.push("/books/categories/addCategory")}
          >
            <PlusCircle className="w-5 h-5" />
            Thêm danh mục
          </Button>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-lg text-[#062D76] font-medium animate-pulse">Đang tải danh mục...</p>
          </div>
        ) : (
          <div>
            {categories.length > 0 ? (
              categories.map((parent) => (
                <div
                  key={parent.id}
                  className="bg-white rounded-xl shadow p-5 mb-4 cursor-pointer hover:shadow-lg transition-shadow duration-200"
                  onClick={() => router.push(`/books/categories/${parent.id}`)}
                >
                  <div className="text-lg font-semibold flex items-center gap-2 text-[#062D76]">
                    <ChevronDown className="w-4 h-4" />
                    {parent.name}
                  </div>
                  <ul className="ml-6 mt-2 list-disc">
                    {parent.children && parent.children.map((child) => (
                      <li
                        key={child.id}
                        className="text-gray-700 hover:underline cursor-pointer hover:text-[#062D76]"
                        onClick={(e) => {
                          e.stopPropagation(); // Ngăn sự kiện click lan ra cha
                          router.push(`/books/categories/child/${child.id}`);
                        }}
                      >
                        {child.name}
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 mt-10">Chưa có danh mục nào.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}