"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "../../components/sidebar/Sidebar";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import axios from "axios";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Calendar, Upload, ChevronDown, CheckCircle2, ArrowRight, Loader2 } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { ThreeDot } from "react-loading-indicators";

import { useSWRConfig } from "swr";

const ROLES = [
  { label: "Quản trị viên", value: "ADMIN" },
  { label: "Người dùng", value: "USER" },
  { label: "Nhân viên", value: "STAFF" },
];

const GENDERS = [
  { label: "Nam", value: "Nam" },
  { label: "Nữ", value: "Nữ" },
  { label: "Khác", value: "Khác" },
];

// SUB-COMPONENTS

const BackButton = () => {
  const router = useRouter();
  return (
    <Button
      onClick={() => router.back()}
      className="w-10 h-10 bg-[#062D76] hover:bg-gray-700 rounded-[10px] flex items-center justify-center transition-colors"
    >
      <svg width="24" height="24" viewBox="0 0 40 40" fill="none">
        <path d="M38 14V26C38 28.206 36.208 30 34 30H6V24H32V16H10V20L2 13L10 6V10H34C35.0609 10 36.0783 10.4214 36.8284 11.1716C37.5786 11.9217 38 12.9391 38 14Z" fill="white" />
      </svg>
    </Button>
  );
};

const InputField = ({ label, value, disabled, onChange, type = "text", placeholder, error }) => (
  <div className="flex flex-col w-full">
    <label className="mb-2 ml-2 text-lg font-bold text-black">{label}</label>
    <Input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      placeholder={placeholder}
      className={`h-10 text-lg rounded-[10px] border ${error ? "border-red-500 focus-visible:ring-red-500" : "border-input"} ${disabled ? "bg-gray-100 text-gray-500" : "bg-white text-black"}`}
    />
    {error && <span className="text-red-500 text-sm ml-2 mt-1">{error}</span>}
  </div>
);

const DatePickerField = ({ value, onChange }) => {
  // Value format: DD/MM/YYYY
  const [startDate, setStartDate] = useState(new Date());

  const handleDateChange = (date) => {
    setStartDate(date);
    if (date) {
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      onChange(`${day}/${month}/${year}`);
    }
  };

  return (
    <div className="flex flex-col w-full">
      <label className="mb-2 ml-2 text-lg font-bold text-black">Ngày Sinh</label>
      <div className="relative flex items-center">
        <DatePicker
          selected={startDate}
          onChange={handleDateChange}
          dateFormat="dd/MM/yyyy"
          className="p-2 w-full text-lg bg-white rounded-[10px] h-10 border border-input pl-4 focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <div className="absolute right-2 pointer-events-none">
          <Calendar className="w-5 h-5 text-[#062D76]" />
        </div>
      </div>
    </div>
  );
};

const AvatarUpload = ({ avatarUrl, onAvatarChange }) => {
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file size (e.g., < 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File quá lớn! Vui lòng chọn ảnh dưới 5MB.");
      return;
    }

    setIsUploading(true);
    const toastId = toast.loading("Đang tải ảnh lên...");
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/upload`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );
      onAvatarChange(response.data.url);
      toast.success("Tải ảnh thành công", { id: toastId });
    } catch (error) {
      console.error(error);
      toast.error("Lỗi tải ảnh, vui lòng thử lại", { id: toastId });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col w-[380px] max-md:w-full mt-8">
      <h2 className="mb-2 ml-10 text-lg font-bold text-black">Ảnh Đại Diện</h2>
      <div className="w-[200px] h-[200px] rounded-full border-2 border-[#D66766] overflow-hidden bg-gray-100 flex items-center justify-center relative">
        <img
          src={avatarUrl || "/default-avatar.png"}
          alt="Avatar"
          className="w-full h-full object-cover"
          onError={(e) => e.target.src = "/default-avatar.png"}
        />
        {isUploading && (
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
            <Loader2 className="animate-spin text-white w-8 h-8" />
          </div>
        )}
      </div>
      <input type="file" accept="image/png, image/jpeg, image/jpg" className="hidden" id="avatarUpload" onChange={handleFileChange} />
      <Button asChild className="mt-4 w-[200px] h-10 bg-[#062D76] hover:bg-gray-700 rounded-[10px]" disabled={isUploading}>
        <label htmlFor="avatarUpload" className="flex items-center gap-2 cursor-pointer">
          <Upload className="w-5 h-5" color="white" /> {isUploading ? "Đang tải..." : "Tải ảnh đại diện"}
        </label>
      </Button>
    </div>
  );
};

const SelectBox = ({ label, value, options, onChange, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="flex flex-col w-full relative">
      <h2 className="mb-2 ml-2 text-lg font-bold text-black">{label}</h2>
      <Button
        className="flex justify-between items-center h-10 bg-white text-black hover:bg-gray-100 rounded-[10px] shadow-sm border border-input"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{options.find(o => o.value === value)?.label || value || placeholder}</span>
        <ChevronDown className="w-5 h-5 text-gray-500" />
      </Button>
      {isOpen && (
        <ul className="absolute top-full mt-1 w-full bg-white shadow-lg rounded-[10px] z-20 border border-gray-200 overflow-hidden">
          {options.map((opt) => (
            <li
              key={opt.value}
              className="p-2 hover:bg-[#D66766] hover:text-white cursor-pointer transition-colors"
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
            >
              {opt.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

// MAIN PAGE

export default function AddUserPage() {
  const router = useRouter();
  const { mutate } = useSWRConfig(); // Hook để invalidate cache

  // State
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    phone: "",
    birthDate: new Date().toLocaleDateString("en-GB"), // Defaults to today
    avatar: "",
    role: "USER",
    gender: "Khác",
  });

  const [step, setStep] = useState("FORM"); // "FORM" | "OTP"
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [otp, setOtp] = useState("");
  const [tempEmail, setTempEmail] = useState("");
  const [errors, setErrors] = useState({}); // Validation errors

  const updateForm = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    // Clear error when user types
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: null }));
  };

  // VALIDATION
  const validateForm = () => {
    const newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /(84|0[3|5|7|8|9])+([0-9]{8})\b/;

    if (!formData.username.trim()) newErrors.username = "Tên người dùng không được để trống";
    if (!formData.email.trim()) {
      newErrors.email = "Email không được để trống";
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = "Email không đúng định dạng";
    }

    if (formData.phone && !phoneRegex.test(formData.phone)) {
      newErrors.phone = "Số điện thoại không hợp lệ";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // HANDLE: CREATE USER
  const handleCreateUser = async () => {
    if (!validateForm()) {
      toast.error("Vui lòng kiểm tra lại thông tin nhập");
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading("Đang xử lý thông tin...");

    try {
      // Format date: DD/MM/YYYY -> YYYY-MM-DD for backend
      const [day, month, year] = formData.birthDate.split("/");
      const formattedDate = `${year}-${month}-${day}`;

      const payload = {
        username: formData.username,
        email: formData.email,
        phone: formData.phone,
        birthdate: formattedDate,
        avatar_url: formData.avatar,
        role: formData.role,
        gender: formData.gender,
      };

      const token = localStorage.getItem("accessToken");
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/users`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Logic check: Backend trả về yêu cầu OTP hay thành công luôn
      if (res.data?.message?.toLowerCase().includes("otp")) {
        setTempEmail(formData.email);
        setStep("OTP");
        toast.success("Đã gửi OTP xác thực đến email!", { id: toastId });
      } else {
        // Case success direct (ít xảy ra ở flow add user này nhưng handle cho chắc)
        toast.success("Tạo người dùng thành công!", { id: toastId });

        // Invalidate cache list users
        mutate(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/users`);

        setTimeout(() => router.push("/users"), 1000);
      }

    } catch (error) {
      console.error("Submit Error:", error);

      // Handle specific status codes
      if (error.response?.status === 401 || error.response?.status === 403) {
        toast.error("Phiên đăng nhập hết hạn hoặc không có quyền", { id: toastId });
        router.push("/admin-login");
        return;
      }

      const msg = error.response?.data?.message || "Tạo người dùng thất bại";
      toast.error(msg, { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  // HANDLE: VERIFY OTP
  const handleVerifyOtp = async () => {
    if (!otp || otp.length < 6) return toast.error("Vui lòng nhập mã OTP đầy đủ");

    setIsSubmitting(true);
    const toastId = toast.loading("Đang xác thực...");

    try {
      const token = localStorage.getItem("accessToken");
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/verify-otp-create`,
        { email: tempEmail, otp },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("Xác thực thành công! Đang chuyển hướng...", { id: toastId });

      // Phase 9: Cache Invalidation
      mutate(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/users`);

      setTimeout(() => router.push("/users"), 1000);

    } catch (error) {
      console.error("OTP Error:", error);
      const msg = error.response?.data?.message || "Mã OTP không đúng";
      toast.error(msg, { id: toastId });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-row w-full h-full bg-[#EFF3FB] min-h-screen">
      <Toaster position="top-center" reverseOrder={false} />
      <Sidebar />
      <main className="relative flex-1 py-6 md:ml-52 px-10 max-md:px-5">

        {/* Header */}
        <div className="mb-6 flex items-center gap-4">
          <BackButton />
          <h1 className="text-2xl font-bold text-[#062D76]">
            {step === "FORM" ? "Thêm Người Dùng Mới" : "Xác Thực OTP"}
          </h1>
        </div>

        {/* STEP 1: FORM INPUT */}
        {step === "FORM" && (
          <div className="bg-white p-8 rounded-xl shadow-sm space-y-6 animate-in fade-in zoom-in duration-300">
            <section>
              <InputField
                label="Tên Người Dùng"
                value={formData.username}
                onChange={(v) => updateForm("username", v)}
                placeholder="Nhập tên người dùng"
                error={errors.username}
                disabled={isSubmitting}
              />
            </section>

            <section>
              <InputField
                label="Email"
                value={formData.email}
                onChange={(v) => updateForm("email", v)}
                placeholder="example@gmail.com"
                type="email"
                error={errors.email}
                disabled={isSubmitting}
              />
            </section>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputField
                label="Số Điện Thoại"
                value={formData.phone}
                onChange={(v) => updateForm("phone", v)}
                placeholder="0123456789"
                error={errors.phone}
                disabled={isSubmitting}
              />
              <DatePickerField
                value={formData.birthDate}
                onChange={(v) => updateForm("birthDate", v)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <SelectBox
                label="Vai Trò"
                value={formData.role}
                options={ROLES}
                onChange={(v) => updateForm("role", v)}
                placeholder="Chọn vai trò"
              />
              <SelectBox
                label="Giới Tính"
                value={formData.gender}
                options={GENDERS}
                onChange={(v) => updateForm("gender", v)}
                placeholder="Chọn giới tính"
              />
            </div>

            <AvatarUpload
              avatarUrl={formData.avatar}
              onAvatarChange={(v) => updateForm("avatar", v)}
            />

            <div className="flex justify-end pt-4">
              <Button
                onClick={handleCreateUser}
                disabled={isSubmitting}
                className={`bg-[#062D76] hover:bg-blue-800 text-white h-12 px-8 rounded-[10px] text-lg font-bold flex items-center gap-2 transition-all ${isSubmitting ? "opacity-70 cursor-not-allowed" : ""}`}
              >
                {isSubmitting ? <ThreeDot color="#FFF" size="small" /> : (
                  <>Tiếp tục <ArrowRight size={20} /></>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2: OTP VERIFICATION */}
        {step === "OTP" && (
          <div className="bg-white p-8 rounded-xl shadow-sm space-y-6 max-w-xl mx-auto mt-10 text-center animate-in slide-in-from-right duration-300">
            <div className="flex flex-col items-center">
              <div className="bg-blue-100 p-4 rounded-full mb-4">
                <CheckCircle2 size={48} className="text-[#062D76]" />
              </div>
              <h2 className="text-xl font-bold mb-2">Xác thực tài khoản</h2>
              <p className="text-gray-500 mb-6">
                Chúng tôi đã gửi mã OTP gồm 6 chữ số đến email: <br />
                <span className="font-bold text-black">{tempEmail}</span>
              </p>
            </div>

            <div className="space-y-4 text-left">
              <InputField
                label="Nhập mã OTP"
                value={otp}
                onChange={setOtp}
                placeholder="XXXXXX"
                className="text-center text-2xl tracking-widest font-mono"
                disabled={isSubmitting}
              />
            </div>

            <div className="flex flex-col gap-3 pt-4">
              <Button
                onClick={handleVerifyOtp}
                disabled={isSubmitting || otp.length < 6}
                className="w-full bg-[#062D76] hover:bg-blue-800 text-white h-12 rounded-[10px] text-lg font-bold transition-all"
              >
                {isSubmitting ? <ThreeDot color="#FFF" size="small" /> : "Xác nhận & Tạo"}
              </Button>

              <Button
                variant="ghost"
                onClick={() => setStep("FORM")}
                disabled={isSubmitting}
                className="text-gray-500 hover:text-black"
              >
                Quay lại chỉnh sửa
              </Button>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}