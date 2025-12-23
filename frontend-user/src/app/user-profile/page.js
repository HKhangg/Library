"use client";
import React, { useState, useEffect } from "react";
import LeftSideBar from "../components/LeftSideBar";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import useSidebarStore from "@/store/sidebarStore";
import axios from "axios";
import { useRouter } from "next/navigation";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Calendar } from "lucide-react";

// Date Picker Field Component (adapted from previous code)
const DatePickerField = ({ value, onChange }) => {
  const parseDate = (dateString) => {
    if (!dateString || typeof dateString !== "string") return null;
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? null : date;
  };

  const [startDate, setStartDate] = useState(parseDate(value));

  useEffect(() => {
    setStartDate(parseDate(value));
  }, [value]);

  const handleDateChange = (date) => {
    setStartDate(date);
    const formattedDate = date ? date.toISOString().split("T")[0] : "";
    onChange(formattedDate);
  };

  return (
    <div className="relative flex items-center">
      <DatePicker
        selected={startDate}
        onChange={handleDateChange}
        dateFormat="yyyy-MM-dd"
        className="px-2 py-2 border border-black dark:border-gray-600 
                   bg-gray-100 dark:bg-gray-700 text-black dark:text-gray-100 
                   text-m font-normal w-full rounded"
        placeholderText="yyyy-mm-dd"
      />
      <Button
        className="absolute right-2 h-8 w-8 bg-blue-500 dark:bg-blue-500 
                   hover:bg-blue-400 dark:hover:bg-blue-600 rounded cursor-pointer"
        onClick={() =>
          document
            .querySelector(".react-datepicker__input-container input")
            ?.focus()
        }
      >
        <Calendar className="w-5 h-5 text-white" />
      </Button>
    </div>
  );
};

// OTP Input Component (adapted from previous code)
const OtpInput = ({ otp, setOtp, onVerifyOtp, isOtpSent }) => {
  const handleOtpChange = (e) => {
    setOtp(e.target.value);
  };

  return (
    <div className="mt-4">
      <label className="text-black dark:text-gray-200 text-l font-medium">
        Nhập OTP
      </label>
      <div className="flex items-center gap-4">
        <Input
          type="text"
          value={otp}
          onChange={handleOtpChange}
          placeholder="Nhập mã OTP (6 chữ số)"
          className="px-2.5 py-3.5 border border-black dark:border-gray-600 
                     bg-gray-100 dark:bg-gray-700 text-black dark:text-gray-100 
                     text-m font-normal w-full rounded"
          maxLength={6}
          disabled={!isOtpSent}
        />
        <Button
          onClick={onVerifyOtp}
          className="w-20 p-3 bg-blue-300 dark:bg-blue-500 rounded-2xl 
                     text-white text-l font-medium hover:bg-blue-400 
                     dark:hover:bg-blue-600"
          disabled={otp.length !== 6}
        >
          Xác nhận
        </Button>
      </div>
    </div>
  );
};

// InfoRow Component (updated to handle DatePicker for birthdate)
const InfoRow = ({ label, name, value, isEditing, onChange, isDateField }) => (
  <div className="flex flex-col w-[400px] gap-2">
    <label className="text-sm text-black dark:text-gray-200 font-medium">
      {label}
    </label>
    {isEditing ? (
      name === "birthdate" ? (
        <DatePickerField
          value={value}
          onChange={(date) =>
            onChange({ target: { name: "birthdate", value: date } })
          }
        />
      ) : (
        <input
          type="text"
          name={name}
          value={value || ""}
          onChange={onChange}
          className="px-2 py-2 border border-black dark:border-gray-600 
                     bg-gray-100 dark:bg-gray-700 rounded text-black 
                     dark:text-gray-100 text-m font-normal"
        />
      )
    ) : (
      <div className="px-2 py-2 border-b border-black dark:border-gray-600">
        <p className="text-black dark:text-gray-100 text-m font-normal">
            {value || "Chưa cập nhật"}
        </p>
      </div>
    )}
  </div>
);
// StatCard Component (unchanged)
const StatCard = ({ number, label, onClick }) => (
  <div
    className="flex-1 p-6 bg-slate-200 rounded-2xl flex flex-col gap-6 cursor-pointer"
    onClick={onClick}
  >
    <span className="text-sky-900 text-xl font-normal">{number}</span>
    <span className="text-sky-900 text-l font-medium">{label}</span>
  </div>
);

// Section Component (unchanged)
const Section = ({ title, children }) => (
  <div className="flex flex-col gap-3 w-full">
    <div className="bg-slate-200 dark:bg-gray-600 w-fit text-center px-3 py-2 mt-6 rounded-lg text-sky-900 dark:text-gray-100 text-[18px]">
      {title}
    </div>
    <div className="grid grid-cols-2 gap-5 ml-3">{children}</div>
  </div>
);

const ProfileCard = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    studentId: "",
    email: "",
    birthdate: "",
    phone: "",
    joinDate: "",
    avatar_url: null,
  });

  const router = useRouter();
  const isSidebarOpen = useSidebarStore((state) => state.isSidebarOpen);

  // Format date for display (dd/MM/yyyy)
  const formatDateForDisplay = (date) => {
    if (!date || typeof date !== "string") return "Chưa cập nhật";
    try {
      const [year, month, day] = date.split("-");
      return `${day}/${month}/${year}`;
    } catch {
      return "Chưa cập nhật";
    }
  };

  // Validate form data
  const validateForm = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\d{3,11}$/; //
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

    if (formData.email && !emailRegex.test(formData.email)) {
      setMessage("Email không hợp lệ");
      setIsError(true);
      return false;
    }
    if (formData.phone && !phoneRegex.test(formData.phone)) {
      setMessage("Số điện thoại không hợp lệ (10-11 số)");
      setIsError(true);
      return false;
    }
    if (formData.birthdate && !dateRegex.test(formData.birthdate)) {
      setMessage("Ngày sinh phải có định dạng yyyy-MM-dd");
      setIsError(true);
      return false;
    }
    if (!formData.fullName) {
      setMessage("Họ và tên không được để trống");
      setIsError(true);
      return false;
    }
    return true;
  };

  // Fetch user data
  useEffect(() => {
    const id = localStorage.getItem("id");
    const fetchUserInfo = async () => {
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/user/${id}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        const user = response.data;
        setFormData({
          fullName: user.fullname || "",
          studentId: user.id?.toString() || "",
          email: user.email || "",
          birthdate: user.birthdate || "",
          phone: user.phone || "",
          joinDate: user.joined_date || "",
          avatar_url: user.avatar_url || null,
        });
      } catch (error) {
        console.error("Lỗi khi lấy thông tin người dùng:", error);
        if (error.response?.status === 401) {
          setMessage("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
          router.push("/login");
        } else {
          setMessage("Không thể tải thông tin người dùng");
        }
        setIsError(true);
      }
    };

    if (id) {
      fetchUserInfo();
    } else {
      setMessage("Không tìm thấy ID người dùng");
      setIsError(true);
    }
  }, [router]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle avatar file selection
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith("image/")) {
      setAvatarFile(file);
      setMessage("");
    } else {
      setMessage("Vui lòng chọn file ảnh (JPG, PNG, v.v.)");
      setIsError(true);
    }
  };

  // Navigate to borrowed card page
  const handleBorrowedCard = () => {
    router.push("/borrowed-card");
  };
  const handleFine = () => {
    router.push("/fine");
  };

  // Handle form save
  const handleSave = async () => {
    if (!validateForm()) return;

    const id = localStorage.getItem("id");
    const updates = {
      fullname: formData.fullName || null,
      phone: formData.phone || null,
      email: formData.email || null,
      birthdate: formData.birthdate || null,
    };

    try {
      const response = await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/api/user/${id}`,
        updates,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const data = response.data;
      if (data.message?.includes("OTP")) {
        setShowOtpInput(true);
        setIsOtpSent(true);
        setMessage("Vui lòng nhập OTP được gửi tới email mới");
        setIsError(false);
      } else {
        setFormData((prev) => ({
          ...prev,
          fullName: data.data.fullname || prev.fullName,
          phone: data.data.phone || prev.phone,
          email: data.data.email || prev.email,
          birthdate: data.data.birthdate || prev.birthdate,
          avatar_url: data.data.avatar_url || null,
        }));

        setMessage("Cập nhật thông tin thành công");
        setIsError(false);
        setIsEditing(false);
      }
    } catch (error) {
      console.error("Lỗi khi cập nhật thông tin:", error);
      if (error.response?.status === 401) {
        setMessage("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
        router.push("/login");
      } else {
        setMessage(
          error.response?.data?.message ||
            "Có lỗi xảy ra khi cập nhật thông tin"
        );
      }
      setIsError(true);
    }
  };

  // Handle avatar upload
  const handleUploadAvatar = async () => {
    if (!avatarFile) {
      setMessage("Vui lòng chọn file ảnh");
      setIsError(true);
      return;
    }

    const id = localStorage.getItem("id");
    if (!id) {
      setMessage("Không tìm thấy thông tin ID người dùng");
      setIsError(true);
      return;
    }

    const formData = new FormData();
    formData.append("id", id);
    formData.append("file", avatarFile);

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/user/upload-avatar`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setFormData((prev) => ({
        ...prev,
        avatar_url: response.data.data.avatar_url || null,
      }));

      setMessage("Upload ảnh đại diện thành công");
      setIsError(false);
      setAvatarFile(null);
    } catch (error) {
      console.error("Lỗi khi upload ảnh:", error);
      setMessage(
        error.response?.data?.message || "Có lỗi xảy ra khi upload ảnh"
      );
      setIsError(true);
    }
  };

  // Handle OTP verification
  const handleVerifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      setMessage("Vui lòng nhập mã OTP hợp lệ (6 chữ số)");
      setIsError(true);
      return;
    }

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/user/verify-email-update`,
        {
          id: localStorage.getItem("id"),
          email: formData.email,
          otp,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      setFormData((prev) => ({
        ...prev,
        email: response.data.data.email || prev.email,
      }));

      setMessage("Xác thực email thành công");
      setIsError(false);
      setShowOtpInput(false);
      setIsOtpSent(false);
      setOtp("");
      setIsEditing(false);
    } catch (error) {
      console.error("Lỗi khi xác thực OTP:", error);
      if (error.response?.status === 401) {
        setMessage("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
        router.push("/login");
      } else {
        setMessage(error.response?.data?.message || "Xác thực OTP thất bại");
      }
      setIsError(true);
    }
  };

  // Toggle edit mode
  const toggleEdit = () => {
    setIsEditing(!isEditing);
    setMessage("");
    setShowOtpInput(false);
    setIsOtpSent(false);
    setOtp("");
    setAvatarFile(null);
  };

  return (
    <div className="p-15 bg-white dark:bg-gray-700 mx-auto rounded-2xl overflow-y-auto">
      {message && (
        <div
          className={`mb-4 p-3 rounded-lg ${
            isError ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
          }`}
        >
          {message}
        </div>
      )}

      <div className="w-full flex justify-between items-start">
        <div className="flex items-center gap-3.5">
          {formData.avatar_url ? (
            <img
              src={formData.avatar_url}
              alt="User Avatar"
              width={100}
              height={100}
              className="w-[100px] h-[100px] rounded-full object-cover"
              onError={() =>
                setFormData((prev) => ({ ...prev, avatar_url: null }))
              }
            />
          ) : (
            <div className="w-[100px] h-[100px] rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
              No Avatar
            </div>
          )}
          <div className="flex flex-col gap-3">
            <h2 className="text-neutral-900 dark:text-white text-xl font-lora">
              {formData.fullName}
            </h2>
            <p className="text-neutral-900 dark:text-gray-300 text-opacity-50 dark:text-opacity-70 text-l font-medium">
              {formData.email}
            </p>
          </div>
        </div>
        <Button
          onClick={isEditing ? handleSave : toggleEdit}
          className="mt-2 w-20 p-3 bg-blue-500 rounded-2xl !text-white text-l font-medium hover:bg-blue-400"
        >
          {isEditing ? "Lưu" : "Sửa"}
        </Button>
      </div>

      <Section title="Thông tin cá nhân">
        <InfoRow
          label="Họ và Tên"
          name="fullName"
          value={formData.fullName}
          isEditing={isEditing}
          onChange={handleChange}
        />
        <InfoRow
          label="MSSV"
          name="studentId"
          value={formData.studentId || "Chưa cập nhật"}
          isEditing={false}
        />
        <InfoRow
          label="Email"
          name="email"
          value={formData.email || "Chưa cập nhật"}
          isEditing={isEditing}
          onChange={handleChange}
        />
        <InfoRow
          label="Ngày Sinh"
          name="birthdate"
          value={formatDateForDisplay(formData.birthdate)}
          isEditing={isEditing}
          onChange={handleChange}
          isDateField={true}
        />
        {showOtpInput && (
          <OtpInput
            otp={otp}
            setOtp={setOtp}
            onVerifyOtp={handleVerifyOtp}
            isOtpSent={isOtpSent}
          />
        )}
        <InfoRow
          label="Số Điện Thoại"
          name="phone"
          value={formData.phone}
          isEditing={isEditing}
          onChange={handleChange}
        />
        <InfoRow
          label="Ngày Tham Gia"
          name="joinDate"
          value={formatDateForDisplay(formData.joinDate)}
          isEditing={false}
        />
      </Section>

      {isEditing && (
        // 1. Thêm w-[400px] và gap-2 để canh thẳng hàng với các InfoRow bên trên (Họ tên, Email...)
        <div className="mt-4 flex flex-col w-[400px] gap-2">

          {/* Label tiêu đề giống hệt InfoRow */}
          <label className="text-sm text-black dark:text-gray-200 font-medium">
            Upload ảnh đại diện
          </label>

          <div className="flex flex-col gap-2">
            {/* 2. Ẩn input file gốc để loại bỏ chữ 'No file chosen' mặc định */}
            <input
              id="avatar-upload"
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />

            {/* Tạo label đóng vai trò là nút bấm "Choose File" 
                Style (màu nền, bo góc, chữ) được copy từ nút Upload bên dưới để đồng bộ */}
            <div className="flex items-center gap-3">
              <label
                htmlFor="avatar-upload"
                className="cursor-pointer px-4 py-2 bg-blue-500 dark:bg-blue-500 rounded-2xl text-white text-base font-medium hover:bg-blue-400 dark:hover:bg-blue-600 transition-colors"
              >
                Choose File
              </label>

              {/* Hiển thị tên file nếu đã chọn (thay thế cho dòng No file chosen) */}
              <span className="text-sm text-gray-600 dark:text-gray-400 italic truncate max-w-[200px]">
                {avatarFile ? avatarFile.name : ""}
              </span>
            </div>

            {/* Nút thực hiện hành động Upload */}
            <Button
              onClick={handleUploadAvatar}
              className="px-4 py-2 w-20 bg-blue-500 dark:bg-blue-500 rounded-2xl text-white text-base font-medium hover:bg-blue-400 dark:hover:bg-blue-600"
            >
              Upload
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

const Page = () => {
  return (
    <div className="pt-20 pb-17 -mr-[180px] bg-blue-50 dark:bg-gray-800 flex flex-1 justify-items-center items-center gap-5">
      <main className="max-w-7xl mx-auto w-full flex flex-col gap-5 z-10 ">
        <ProfileCard />
      </main>
    </div>
  );
};

export default Page;
