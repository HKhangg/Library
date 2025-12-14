"use client";
import React, { useState, useMemo, useEffect } from "react";
import axios from "axios";
import Sidebar from "../components/sidebar/Sidebar";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { usePathname, useRouter, useSearchParams } from "next/navigation"; // Import hooks điều hướng
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { ThreeDot } from "react-loading-indicators";

import useSWR, { mutate } from "swr";

// Fetcher
const authFetcher = async (url) => {
  const token = localStorage.getItem("accessToken");
  const response = await axios.get(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "*/*",
    },
  });
  return response.data;
};

const Page = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // 1. Lấy trạng thái từ URL thay vì useState
  const currentPage = Number(searchParams.get("page")) || 1;
  const urlSearchQuery = searchParams.get("query") || "";

  // State cục bộ cho ô input tìm kiếm (để gõ mượt mà không reload URL liên tục)
  const [localSearchQuery, setLocalSearchQuery] = useState(urlSearchQuery);

  const [popUpOpen, setPopUpOpen] = useState(false);
  const [deleteOne, setDeleteOne] = useState(null);
  const itemsPerPage = 10;

  // Đồng bộ URL search query vào ô input khi URL thay đổi (ví dụ khi nhấn Back)
  useEffect(() => {
    setLocalSearchQuery(urlSearchQuery);
  }, [urlSearchQuery]);

  // 2. Fetch dữ liệu
  const {
    data: responseData,
    isLoading,
    error,
  } = useSWR(
    `${process.env.NEXT_PUBLIC_API_URL}/api/admin/users`,
    authFetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
      onError: (err) => {
        if (err.response?.status === 403 || err.response?.status === 401) {
          toast.error("Phiên đăng nhập hết hạn");
          router.push("/admin-login");
        }
      },
    }
  );

  const userList = responseData?.data || [];

  // 3. Logic tìm kiếm (Filter dựa trên từ khóa từ URL)
  const filteredUsers = useMemo(() => {
    if (!urlSearchQuery.trim()) return userList;

    const lowerQuery = urlSearchQuery.toLowerCase();
    return userList.filter(
      (user) =>
        user.id.toString().includes(lowerQuery) ||
        user.username.toLowerCase().includes(lowerQuery) ||
        (user.email && user.email.toLowerCase().includes(lowerQuery)) ||
        (user.phone && user.phone.toLowerCase().includes(lowerQuery))
    );
  }, [urlSearchQuery, userList]);

  // 4. Hàm cập nhật URL
  const updateURL = (key, value) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    // replace: thay thế URL hiện tại mà không thêm vào history stack (hoặc dùng push nếu muốn back lại từng bước search)
    router.replace(`${pathname}?${params.toString()}`);
  };

  // Handle Search Submit
  const handleSearch = () => {
    const params = new URLSearchParams(searchParams);
    if (localSearchQuery) {
      params.set("query", localSearchQuery);
    } else {
      params.delete("query");
    }
    params.set("page", 1); // Reset về trang 1 khi tìm kiếm
    router.replace(`${pathname}?${params.toString()}`);
  };

  // Handle Page Change
  const handlePageChange = (pageNumber) => {
    updateURL("page", pageNumber);
  };

  // --- Các hàm xử lý logic khác giữ nguyên ---
  const handleDelete = async (user) => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      toast.error("Vui lòng đăng nhập lại");
      router.push("/admin-login");
      return;
    }

    const toastId = toast.loading("Đang xóa người dùng...");

    try {
      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/users/${user.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "*/*",
          },
        }
      );

      mutate(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/users`,
        (currentData) => {
          if (!currentData) return currentData;
          return {
            ...currentData,
            data: currentData.data.filter((u) => u.id !== user.id),
          };
        },
        false
      );

      toast.success("Xóa người dùng thành công", {
        id: toastId,
        style: { background: "#d1fae5", color: "#065f46" },
      });

      setPopUpOpen(false);
      setDeleteOne(null);

      // Nếu xóa hết item ở trang hiện tại, lùi về trang trước
      if (currentUsers.length === 1 && currentPage > 1) {
        handlePageChange(currentPage - 1);
      }

    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Xóa thất bại! Vui lòng thử lại.", {
        id: toastId,
        style: { background: "#fee2e2", color: "#991b1b" },
      });
    }
  };

  const handleAddUser = () => {
    router.push("/users/addUser");
  };

  const handleEdit = (userId) => {
    // URL hiện tại (có page, query) sẽ được lưu trong history của trình duyệt
    router.push(`/users/${userId}`);
  };

  // Pagination Calculation
  const indexOfLastUser = currentPage * itemsPerPage;
  const indexOfFirstUser = indexOfLastUser - itemsPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage) || 1;

  // Components UI
  const UserCard = ({ user }) => (
    <div className="flex bg-white w-full rounded-lg mt-2 drop-shadow-lg p-5 gap-5 md:gap-10 items-center">
      <img
        src={user.avatar_url || "/default-avatar.png"}
        alt={user.username}
        className="w-[145px] h-[205px] object-cover rounded"
        onError={(e) => (e.target.src = "/default-avatar.png")}
      />
      <div className="flex flex-col gap-3 w-full">
        <p>ID: {user.id}</p>
        <p className="font-bold">{user.username}</p>
        <p>Email: {user.email || "N/A"}</p>
        <p>Số điện thoại: {user.phone || "N/A"}</p>
        <p>Vai trò: {user.role || "USER"}</p>
        <div className="flex justify-end gap-5">
          <Button
            className="w-10 md:w-40 h-10 bg-[#062D76] hover:bg-gray-700 cursor-pointer"
            onClick={() => handleEdit(user.id)}
          >
            <Pencil className="w-5 h-5" color="white" />
            <p className="hidden md:block">Sửa người dùng</p>
          </Button>
          <Button
            className="w-10 md:w-40 h-10 bg-[#D66766] hover:bg-gray-700 cursor-pointer"
            onClick={() => {
              setDeleteOne(user);
              setPopUpOpen(true);
            }}
          >
            <Trash2 className="w-5 h-5" color="white" />
            <p className="hidden md:block">Xóa người dùng</p>
          </Button>
        </div>
      </div>
    </div>
  );

  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  return (
    <div className="flex flex-row w-full min-h-screen bg-[#EFF3FB]">
      <Toaster position="top-center" reverseOrder={false} />
      <Sidebar />
      {isLoading ? (
        <div className="flex md:ml-52 w-full h-screen justify-center items-center">
          <ThreeDot color="#062D76" size="large" text="Vui lòng chờ" variant="bounce" textColor="#062D76" />
        </div>
      ) : (
        <div className="flex w-full flex-col py-6 md:ml-52 mt-5 gap-2 items-center px-10">
          <div className="flex w-full items-center justify-between mb-10">
            <div className="flex gap-5">
              <Input
                type="text"
                placeholder="Tìm kiếm người dùng..."
                className="w-full md:w-96 h-10 font-thin italic text-black text-lg bg-white rounded-[10px]"
                value={localSearchQuery}
                onChange={(e) => setLocalSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button
                className="w-10 h-10 bg-[#062D76] hover:bg-gray-700 rounded-[10px] cursor-pointer"
                onClick={handleSearch}
              >
                <Search className="w-6 h-6" color="white" />
              </Button>
            </div>
            <Button
              className="w-40 h-10 bg-[#062D76] hover:bg-gray-700 rounded-[10px] cursor-pointer"
              onClick={handleAddUser}
            >
              <Plus className="w-5 h-5" color="white" />
              Thêm người dùng
            </Button>
          </div>

          {currentUsers.length > 0 ? (
            currentUsers.map((user) => <UserCard key={user.id} user={user} />)
          ) : (
            <p className="text-gray-500 mt-10">Không tìm thấy người dùng nào</p>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-6">
              <Button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="bg-[#062D76] hover:bg-gray-700 text-white cursor-pointer disabled:opacity-50"
              >
                Trước
              </Button>
              {pageNumbers.map((number) => (
                <Button
                  key={number}
                  onClick={() => handlePageChange(number)}
                  className={`${currentPage === number
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
                className="bg-[#062D76] hover:bg-gray-700 text-white cursor-pointer disabled:opacity-50"
              >
                Sau
              </Button>
            </div>
          )}

          {/* Delete Modal Code (Giữ nguyên) */}
          {popUpOpen && deleteOne && (
            <div className="fixed inset-0 flex items-center justify-center z-50">
              <div className="w-full h-full bg-black opacity-80 absolute top-0 left-0"></div>
              <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md z-10">
                <h2 className="text-lg font-bold mb-4">Xác nhận xóa</h2>
                <p>Bạn có chắc chắn muốn xóa người dùng này không?</p>
                <div className="flex bg-white w-full rounded-lg mt-2 p-5 gap-5 items-center">
                  <img
                    src={deleteOne.avatar_url || "/default-avatar.png"}
                    className="w-[60px] h-[60px] object-cover rounded"
                  />
                  <div className="flex flex-col">
                    <p className="font-bold">{deleteOne.username}</p>
                    <p className="text-sm text-gray-500">ID: {deleteOne.id}</p>
                  </div>
                </div>
                <div className="flex justify-end mt-4 gap-4">
                  <Button className="bg-gray-500 text-white" onClick={() => setPopUpOpen(false)}>Hủy</Button>
                  <Button className="bg-red-500 text-white" onClick={() => handleDelete(deleteOne)}>Xóa</Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Page;