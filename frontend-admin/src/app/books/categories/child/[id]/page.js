"use client";

import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Sidebar from "@/app/components/sidebar/Sidebar";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";
import { Undo2, Save, Trash2 } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import axios from "axios";
import { ThreeDot } from "react-loading-indicators";

import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";

export default function EditCategoryChildPage() {
  const router = useRouter();
  const { id } = useParams();

  const [name, setName] = useState("");

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // useSWR: Lấy thông tin chi tiết danh mục con
  const { data: childData, isLoading, error } = useSWR(
    id ? `${process.env.NEXT_PUBLIC_API_URL}/api/category-child/${id}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      onError: () => {
        toast.error("Không thể tải danh mục con");
        router.replace("/books/categories");
      }
    }
  );

  // Populate Data vào Form
  useEffect(() => {
    if (childData) {
      setName(childData.name || "");
    }
  }, [childData]);

  // Giữ nguyên logic xử lý nút Back của trình duyệt
  useEffect(() => {
    const handlePopState = () => {
      router.replace("/books/categories");
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [router]);

  // Hàm cập nhật
  const save = async () => {
    if (!name.trim()) return toast.error("Nhập tên danh mục con");

    const toastId = toast.loading("Đang cập nhật...");
    try {
      await axios.patch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/category-child/${id}`,
        { name }
      );
      toast.success("Cập nhật thành công", { id: toastId });

      // Delay chuyển trang để người dùng thấy thông báo
      setTimeout(() => {
        router.replace("/books/categories");
      }, 500);
    } catch (err) {
      console.error("Lỗi khi cập nhật:", err);
      toast.error("Cập nhật thất bại", { id: toastId });
    }
  };

  // Hàm xóa
  const deleteChild = async () => {
    const toastId = toast.loading("Đang xóa danh mục con...");
    try {
      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL}/api/category-child/${deleteTarget.id}`
      );
      toast.success("Xóa danh mục con thành công", { id: toastId });
      router.replace("/books/categories");
    } catch (err) {
      console.error("Lỗi khi xóa:", err);

      // Logic xử lý thông báo lỗi chi tiết (Giữ nguyên từ code cũ)
      let errorMessage = "Xóa danh mục con thất bại";
      if (err.response?.data) {
        const errorString = JSON.stringify(err.response.data).toLowerCase();
        if (
          errorString.includes("foreign key constraint") ||
          errorString.includes("referenced from table")
        ) {
          errorMessage = "Không thể xóa vì danh mục con đang liên kết với sách";
        } else if (err.response.status === 400) {
          errorMessage = err.response.data.message || "Không thể xóa do có dữ liệu liên quan";
        } else if (err.response.status === 404) {
          errorMessage = "Danh mục con không tồn tại";
        }
      }
      toast.error(errorMessage, { id: toastId });
    } finally {
      setShowDeleteModal(false);
      setDeleteTarget(null);
    }
  };

  const openDeleteModal = (id, name) => {
    setDeleteTarget({ id, name });
    setShowDeleteModal(true);
  };

  if (isLoading) {
    return (
      <div className="flex w-full h-screen bg-[#EFF3FB]">
        <Sidebar />
        <div className="flex-1 flex justify-center items-center">
          <ThreeDot color="#062D76" size="large" text="Đang tải dữ liệu..." />
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full min-h-screen bg-[#EFF3FB]">
      <Toaster position="top-center" reverseOrder={false} />
      <Sidebar />
      <div className="flex-1 flex flex-col p-8 md:ml-52">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            onClick={() => router.replace("/books/categories")}
            className="bg-[#062D76] p-2 rounded-full hover:bg-gray-700"
          >
            <Undo2 color="white" />
          </Button>
          <h1 className="text-2xl font-bold">Chỉnh sửa danh mục con</h1>
        </div>

        {/* Content Box */}
        <div className="bg-white p-6 rounded-lg shadow w-full max-w-full">
          {childData && (
            <p className="mb-4 text-gray-700">
              Danh mục cha: <strong>{childData.parentName || "Không xác định"}</strong>
            </p>
          )}

          <label className="block font-medium mb-1">Tên danh mục con: </label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
            className="mb-4"
          />

          <div className="flex gap-4 mt-6">
            <Button
              onClick={save}
              className="bg-[#062D76] px-6 py-2 rounded flex items-center gap-2 hover:bg-gray-700"
            >
              <Save color="white" /> Lưu
            </Button>
            <Button
              onClick={() => openDeleteModal(id, name)}
              className="bg-red-500 px-6 py-2 rounded flex items-center gap-2 hover:bg-red-600"
            >
              <Trash2 color="white" /> Xóa
            </Button>
          </div>
        </div>
      </div>

      {/* Modal xác nhận xóa */}
      {showDeleteModal && deleteTarget && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Xác nhận xóa</h2>
            <p>
              Bạn có chắc chắn muốn xóa danh mục con{" "}
              <strong>{deleteTarget.name}</strong> không?
            </p>
            <div className="flex gap-4 mt-6 justify-end">
              <Button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteTarget(null);
                }}
                className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400 text-black"
              >
                Hủy
              </Button>
              <Button
                onClick={deleteChild}
                className="bg-red-500 px-4 py-2 rounded text-white hover:bg-red-600"
              >
                Xóa
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}