"use client";

import { useRouter, useParams } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";
import Sidebar from "@/app/components/sidebar/Sidebar";
import { Undo2, Save, PlusCircle, Trash2, Edit2, X } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import axios from "axios";
import { ThreeDot } from "react-loading-indicators";

import useSWR, { mutate } from "swr";
import { fetcher } from "@/lib/fetcher"; 

export default function EditCategoryPage() {
  const router = useRouter();
  const { id } = useParams();

  // State Form Data
  const [data, setData] = useState({
    name: "",
    soLuongDanhMuc: 0,
    children: [],
  });

  // State UI
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showAddChildModal, setShowAddChildModal] = useState(false);
  const [newChildName, setNewChildName] = useState("");

  // 2. useSWR: Lấy thông tin chi tiết danh mục
  const {
    data: categoryData,
    isLoading,
    error,
    mutate: mutateCategory // Fetch lại dữ liệu khi cần
  } = useSWR(
    id ? `${process.env.NEXT_PUBLIC_API_URL}/api/category/${id}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      onError: () => {
        toast.error("Không thể tải danh mục");
        router.replace("/books/categories");
      }
    }
  );

  // 3. Populate Data: Khi có data từ SWR thì đổ vào form state
  useEffect(() => {
    if (categoryData) {
      setData({
        name: categoryData.name || "",
        soLuongDanhMuc: categoryData.children?.length || 0,
        children: categoryData.children || [],
      });
    }
  }, [categoryData]);

  // Handle browser back button logic (Giữ nguyên từ code cũ của bạn)
  useEffect(() => {
    const handlePopState = () => {
      router.replace("/books/categories");
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [router]);

  const updateField = (e) => {
    setData({ ...data, [e.target.name]: e.target.value });
  };

  // HÀM THÊM DANH MỤC CON
  const addChild = async () => {
    if (!newChildName.trim()) {
      toast.error("Vui lòng nhập tên danh mục con");
      return;
    }

    const toastId = toast.loading("Đang thêm danh mục con...");
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/category-child/category/${id}/add`,
        { name: newChildName }
      );

      // Refresh lại data từ server để đảm bảo đồng bộ
      await mutateCategory();

      toast.success("Thêm danh mục con thành công", { id: toastId });
      setShowAddChildModal(false);
      setNewChildName("");
    } catch (err) {
      console.error("Lỗi khi thêm danh mục con:", err);
      toast.error("Thêm danh mục con thất bại (có thể đã tồn tại).", { id: toastId });
    }
  };

  // HÀM CẬP NHẬT TÊN DANH MỤC CHA
  const save = async () => {
    if (!data.name.trim()) {
      toast.error("Vui lòng nhập tên danh mục cha");
      return;
    }

    const toastId = toast.loading("Đang cập nhật...");
    try {
      await axios.patch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/category/${id}`,
        { name: data.name }
      );

      // Update cache SWR (cho cả danh sách bên ngoài nếu cần, nhưng quan trọng là trang này)
      mutateCategory();

      toast.success("Cập nhật danh mục thành công", { id: toastId });
      setTimeout(() => router.replace("/books/categories"), 500);
    } catch (err) {
      console.error("Lỗi khi cập nhật:", err);
      toast.error("Cập nhật thất bại", { id: toastId });
    }
  };

  // HÀM XÓA DANH MỤC CHA
  const deleteParent = async () => {
    const toastId = toast.loading("Đang xóa danh mục...");
    try {
      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL}/api/category/${id}`
      );
      toast.success("Xóa toàn bộ danh mục thành công", { id: toastId });
      router.replace("/books/categories");
    } catch (err) {
      // Logic xử lý lỗi chi tiết giữ nguyên để thông báo chính xác cho user
      let errorMessage = "Xóa danh mục cha thất bại";
      if (err.response?.data) {
        const errorString = JSON.stringify(err.response.data).toLowerCase();
        if (
          errorString.includes("foreign key constraint") ||
          errorString.includes("referenced from table")
        ) {
          errorMessage = "Không thể xóa vì có sách liên quan đến danh mục con";
        } else if (err.response.status === 400) {
          errorMessage = err.response.data.message || "Không thể xóa do có dữ liệu liên quan";
        }
      }
      toast.error(errorMessage, { id: toastId });
    } finally {
      setShowDeleteModal(false);
      setDeleteTarget(null);
    }
  };

  // HÀM XÓA DANH MỤC CON
  const deleteChild = async (childId) => {
    const toastId = toast.loading("Đang xóa danh mục con...");
    try {
      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL}/api/category-child/${childId}`
      );

      // Tự động fetch lại data mới nhất từ server thay vì filter thủ công
      await mutateCategory();

      toast.success("Xóa danh mục con thành công", { id: toastId });
    } catch (err) {
      let errorMessage = "Xóa danh mục con thất bại";
      if (err.response?.data) {
        const errorString = JSON.stringify(err.response.data).toLowerCase();
        if (
          errorString.includes("foreign key constraint") ||
          errorString.includes("referenced from table")
        ) {
          errorMessage = "Không thể xóa vì đang có sách liên kết.";
        }
      }
      toast.error(errorMessage, { id: toastId });
    } finally {
      setShowDeleteModal(false);
      setDeleteTarget(null);
    }
  };

  const openDeleteModal = (type, id, name) => {
    setDeleteTarget({ type, id, name });
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
      <div className="flex-1 p-8 md:ml-52">
        <div className="flex items-center gap-4 mb-6">
          <Button
            onClick={() => router.replace("/books/categories")}
            className="bg-[#062D76] p-2 rounded-full hover:bg-gray-700"
          >
            <Undo2 color="white" />
          </Button>
          <h1 className="text-2xl font-bold">Chỉnh sửa danh mục</h1>
        </div>

        <div className="bg-white p-6 rounded-lg shadow w-full">
          <label className="block font-medium mb-1">Tên danh mục cha:</label>
          <Input
            name="name"
            value={data.name}
            onChange={updateField}
            fullWidth
            className="mb-4"
          />
          <div className="flex gap-4 mt-5">
            <Button
              onClick={save}
              className="bg-[#062D76] px-6 py-2 rounded flex items-center gap-2 hover:bg-gray-700"
            >
              <Save color="white" /> Lưu
            </Button>
            <Button
              onClick={() => openDeleteModal("parent", null, data.name)}
              className="bg-red-500 px-6 py-2 rounded flex items-center gap-2 hover:bg-red-600"
            >
              <Trash2 color="white" /> Xóa
            </Button>
          </div>

          <h2 className="mt-4 font-medium mb-2">
            Danh mục con: ({data.soLuongDanhMuc})
          </h2>
          <ul className="list-disc ml-6">
            {data.children.map((ch) => (
              <li key={ch.id} className="flex items-center gap-2 mb-2">
                <span className="flex-1">{ch.name}</span>
                <Button
                  onClick={() =>
                    router.replace(`/books/categories/child/${ch.id}`)
                  }
                  className="bg-[#6BE5FF] p-2 rounded hover:bg-[#5acde3]"
                >
                  <Edit2 color="white" />
                </Button>
                <Button
                  onClick={() => openDeleteModal("child", ch.id, ch.name)}
                  className="bg-red-500 p-2 rounded hover:bg-red-600"
                >
                  <Trash2 color="white" />
                </Button>
              </li>
            ))}
          </ul>

          <Button
            onClick={() => setShowAddChildModal(true)}
            className="mt-4 bg-[#062D76] text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-gray-700"
          >
            <PlusCircle /> Thêm danh mục con
          </Button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deleteTarget && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Xác nhận xóa</h2>
            <p>
              Bạn có chắc chắn muốn xóa{" "}
              {deleteTarget.type === "parent" ? "danh mục cha" : "danh mục con"}{" "}
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
                onClick={() =>
                  deleteTarget.type === "parent"
                    ? deleteParent()
                    : deleteChild(deleteTarget.id)
                }
                className="bg-red-500 px-4 py-2 rounded text-white hover:bg-red-600"
              >
                Xóa
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* Add Child Modal */}
      {showAddChildModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Thêm danh mục con</h2>
              <Button
                onClick={() => {
                  setShowAddChildModal(false);
                  setNewChildName("");
                }}
                className="p-1 hover:bg-gray-100 rounded-full"
              >
                <X color="gray" />
              </Button>
            </div>
            <label className="block font-medium mb-1">Tên danh mục con:</label>
            <Input
              value={newChildName}
              onChange={(e) => setNewChildName(e.target.value)}
              fullWidth
              className="mb-4"
            />
            <div className="flex gap-4 justify-end">
              <Button
                onClick={() => {
                  setShowAddChildModal(false);
                  setNewChildName("");
                }}
                className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400 text-black"
              >
                Hủy
              </Button>
              <Button
                onClick={addChild}
                className="bg-[#062D76] px-4 py-2 rounded text-white hover:bg-gray-700"
              >
                Thêm
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}