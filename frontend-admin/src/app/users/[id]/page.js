"use client";
import Sidebar from "../../components/sidebar/Sidebar";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import axios from "axios";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Calendar, Upload, ChevronDown, CheckCircle2 } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { ThreeDot } from "react-loading-indicators";

import useSWR, { mutate } from "swr";
import { fetcher } from "@/lib/fetcher";

const BackButton = () => {
  const router = useRouter();
  return (
    <Button
      onClick={() => router.back()}
      className="w-10 h-10 bg-[#062D76] hover:bg-gray-700 rounded-[10px] flex items-center justify-center"
    >
      <svg width="24" height="24" viewBox="0 0 40 40" fill="none">
        <path d="M38 14V26C38 28.206 36.208 30 34 30H6V24H32V16H10V20L2 13L10 6V10H34C35.0609 10 36.0783 10.4214 36.8284 11.1716C37.5786 11.9217 38 12.9391 38 14Z" fill="white" />
      </svg>
    </Button>
  );
};

const InputField = ({ label, value, disabled, onChange, type = "text", placeholder }) => (
  <div className="flex flex-col w-full">
    <label className="mb-2 ml-2 text-lg font-bold text-black">{label}</label>
    <Input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      placeholder={placeholder}
      className={`h-10 text-lg rounded-[10px] ${disabled ? "bg-gray-100 text-gray-500" : "bg-white text-black"}`}
    />
  </div>
);

const DatePickerField = ({ value, onChange }) => {
  const [startDate, setStartDate] = useState(null);

  useEffect(() => {
    if (value) {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        setStartDate(date);
      } else {
        const parts = value.split("/");
        if (parts.length === 3) setStartDate(new Date(`${parts[2]}-${parts[1]}-${parts[0]}`));
      }
    }
  }, [value]);

  const handleDateChange = (date) => {
    setStartDate(date);
    if (date) {
      const offsetDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
      onChange(offsetDate.toISOString().split('T')[0]);
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
          className="p-2 w-full text-lg bg-white rounded-[10px] h-10 border border-input pl-4"
        />
        <div className="absolute right-2 pointer-events-none">
          <Calendar className="w-5 h-5 text-[#062D76]" />
        </div>
      </div>
    </div>
  );
};

const AvatarUpload = ({ avatarUrl, onAvatarChange }) => {
  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

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
      toast.error("Lỗi tải ảnh", { id: toastId });
    }
  };

  return (
    <div className="flex flex-col w-[380px] max-md:w-full mt-8">
      <h2 className="mb-2 ml-10 text-lg font-bold text-black">Ảnh Đại Diện</h2>
      <div className="w-[200px] h-[200px] rounded-full border-2 border-[#D66766] overflow-hidden bg-gray-100 flex items-center justify-center">
        <img
          src={avatarUrl || "/default-avatar.png"}
          alt="Avatar"
          className="w-full h-full object-cover"
          onError={(e) => e.target.src = "/default-avatar.png"}
        />
      </div>
      <input type="file" accept="image/*" className="hidden" id="avatarUpload" onChange={handleFileChange} />
      <Button asChild className="mt-4 w-[200px] h-10 bg-[#062D76] hover:bg-gray-700 rounded-[10px]">
        <label htmlFor="avatarUpload" className="flex items-center gap-2 cursor-pointer">
          <Upload className="w-5 h-5" color="white" /> Tải ảnh đại diện
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

// Trang chính

export default function EditUserPage() {
  const { id } = useParams();
  const router = useRouter();

  const roleOptions = [
    { label: "Quản trị viên", value: "ADMIN" },
    { label: "Người dùng", value: "USER" },
    { label: "Nhân viên", value: "STAFF" },
  ];

  const genderOptions = [
    { label: "Nam", value: "Nam" },
    { label: "Nữ", value: "Nữ" },
    { label: "Khác", value: "Khác" },
  ];

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    phone: "",
    birthDate: "",
    avatar: "",
    role: "",
    gender: "",
  });

  const { data: userResponse, isLoading } = useSWR(
    `${process.env.NEXT_PUBLIC_API_URL}/api/admin/users`,
    fetcher
  );

  // Populate data when loaded
  useEffect(() => {
    if (userResponse?.data) {
      const user = userResponse.data.find(u => u.id === parseInt(id));
      if (user) {
        setFormData({
          username: user.username || "",
          email: user.email || "",
          phone: user.phone || "",
          birthDate: user.birthdate || "",
          avatar: user.avatar_url || "",
          role: user.role || "USER",
          gender: user.gender || "Khác",
        });
      } else {
        toast.error("Không tìm thấy người dùng");
        // router.push("/users");
      }
    }
  }, [userResponse, id]);

  const updateForm = (key, value) => setFormData(prev => ({ ...prev, [key]: value }));

  const handleSubmit = async () => {
    const toastId = toast.loading("Đang cập nhật...");

    try {
      const payload = {
        username: formData.username,
        email: formData.email,
        phone: formData.phone,
        birthdate: formData.birthDate,
        avatar_url: formData.avatar,
        role: formData.role,
        gender: formData.gender,
      };

      const token = localStorage.getItem("accessToken");
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/users/${id}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("Cập nhật thành công!", { id: toastId });

      mutate(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/users`);

      setTimeout(() => router.push("/users"), 1000);

    } catch (error) {
      console.warn("Lỗi cập nhật:", error);
      const msg = error.response?.data?.message || "Cập nhật thất bại";
      toast.error(msg, { id: toastId });
    }
  };

  if (isLoading) {
    return (
      <div className="flex w-full h-screen bg-[#EFF3FB]">
        <Sidebar />
        <div className="flex-1 flex justify-center items-center md:pl-52">
          <ThreeDot color="#062D76" size="large" text="Đang tải..." />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-row w-full h-full bg-[#EFF3FB] min-h-screen">
      <Toaster position="top-center" />
      <Sidebar />
      <main className="relative flex-1 py-6 md:ml-52 px-10 max-md:px-5">

        <div className="mb-6 flex items-center gap-4">
          <BackButton />
          <h1 className="text-2xl font-bold text-[#062D76]">Chỉnh Sửa Người Dùng</h1>
        </div>

        <div className="bg-white p-8 rounded-xl shadow-sm space-y-6">
          <section>
            <InputField
              label="ID"
              value={id}
              disabled={true}
              onChange={() => { }}
            />
          </section>

          <section>
            <InputField
              label="Tên Người Dùng"
              value={formData.username}
              onChange={(v) => updateForm("username", v)}
              placeholder="Nhập tên người dùng"
            />
          </section>

          <section>
            <InputField
              label="Email"
              value={formData.email}
              onChange={(v) => updateForm("email", v)}
              placeholder="example@gmail.com"
              type="email"
            />
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField
              label="Số Điện Thoại"
              value={formData.phone}
              onChange={(v) => updateForm("phone", v)}
              placeholder="0123456789"
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
              options={roleOptions}
              onChange={(v) => updateForm("role", v)}
              placeholder="Chọn vai trò"
            />
            <SelectBox
              label="Giới Tính"
              value={formData.gender}
              options={genderOptions}
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
              onClick={handleSubmit}
              className="bg-[#062D76] hover:bg-blue-800 text-white h-12 px-8 rounded-[10px] text-lg font-bold flex items-center gap-2"
            >
              <CheckCircle2 size={20} /> Lưu thay đổi
            </Button>
          </div>
        </div>

      </main>
    </div>
  );
}