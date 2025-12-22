"use client";
import Sidebar from "../../components/sidebar/Sidebar";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import axios from "axios";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Calendar, Upload, ChevronDown, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";

// Back Button Component
const BackButton = () => {
  const router = useRouter();

  return (
    <Button
      onClick={() => router.back()}
      className="w-10 h-10 bg-[#062D76] hover:bg-gray-700 rounded-[10px]"
      aria-label="Go back"
    >
      <svg
        width="24"
        height="24"
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M38 14V26C38 28.206 36.208 30 34 30H6V24H32V16H10V20L2 13L10 6V10H34C35.0609 10 36.0783 10.4214 36.8284 11.1716C37.5786 11.9217 38 12.9391 38 14Z"
          fill="white"
        />
      </svg>
    </Button>
  );
};

// Input Field Component
const InputField = ({ label, value, disabled, onChange, type = "text" }) => (
  <div className="flex flex-col w-full">
    <label className="mb-2 ml-2 text-lg font-bold text-black">{label}</label>
    <Input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={`h-10 text-lg rounded-[10px] ${
        disabled
          ? "bg-zinc-300 text-neutral-500 cursor-not-allowed"
          : "bg-white text-black"
      }`}
    />
  </div>
);

// Date Picker Field Component
const DatePickerField = ({ value, onChange }) => {
  const [startDate, setStartDate] = useState(
    value ? new Date(value.split("/").reverse().join("-")) : new Date()
  );

  const handleDateChange = (date) => {
    setStartDate(date);
    onChange(date.toLocaleDateString("en-GB").split("/").join("/"));
  };

  return (
    <div className="flex flex-col w-full">
      <label className="mb-2 ml-2 text-lg font-bold text-black">
        Ngày Sinh
      </label>
      <div className="relative flex items-center">
        <DatePicker
          selected={startDate}
          onChange={handleDateChange}
          dateFormat="dd/MM/yyyy"
          className="p-2 w-full text-lg bg-white rounded-[10px] h-10 "
        />
        <Button
          className="absolute right-2 h-8 w-8 bg-[#062D76]  rounded-[10px] cursor-pointer"
          onClick={() =>
            document
              .querySelector(".react-datepicker__input-container input")
              .focus()
          }
        >
          <Calendar className="w-5 h-5" color="white" />
        </Button>
      </div>
    </div>
  );
};

// Avatar Upload Component
const AvatarUpload = ({ avatarUrl, onAvatarChange }) => {
  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (file) {
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
        onAvatarChange(response.data.url || URL.createObjectURL(file));
        toast.success("Tải ảnh đại diện thành công");
      } catch (error) {
        console.error("Error uploading file:", error);
        onAvatarChange(URL.createObjectURL(file)); // Fallback to local URL
        toast.error("Không thể tải ảnh đại diện");
      }
    }
  };

  return (
    <div className="flex flex-col w-[380px] max-md:w-full mt-8 ">
      <h2 className="mb-2 ml-10 text-lg font-bold text-black">Ảnh Đại Diện</h2>
      <img
        src={avatarUrl || "/default-avatar.png"}
        alt="Avatar"
        className="border border-[#D66766] border-solid h-[200px] w-[200px] rounded-full object-cover"
      />
      <input
        type="file"
        accept="image/*"
        className="hidden"
        id="avatarUpload"
        onChange={handleFileChange}
      />
      <Button
        asChild
        className="mt-4 w-[200px] h-10 bg-[#062D76] hover:bg-gray-700 rounded-[10px]"
      >
        <label
          htmlFor="avatarUpload"
          className="flex items-center gap-2 cursor-pointer"
        >
          <Upload className="w-5 h-5" color="white" />
          Tải ảnh đại diện
        </label>
      </Button>
    </div>
  );
};

// Role Selector Component
const roles = ["Quản trị viên", "Người dùng", "Nhân viên"];
const roleMap = {
  "Quản trị viên": "ADMIN",
  "Người dùng": "USER",
  "Nhân viên": "STAFF",
};
const reverseRoleMap = Object.fromEntries(
  Object.entries(roleMap).map(([k, v]) => [v, k])
);

const RoleSelector = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex flex-col w-full relative">
      <h2 className="mb-2 ml-2 text-lg font-bold text-black">Vai Trò</h2>
      <Button
        className="flex justify-between items-center h-10 bg-white text-black hover:bg-[#D66766] rounded-[10px] shadow-sm cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{reverseRoleMap[value] || value || "Chọn vai trò"}</span>
        <ChevronDown className="w-5 h-5" color="#000" />
      </Button>
      {isOpen && (
        <ul className="absolute top-20 w-full bg-white shadow-lg rounded-[10px] z-20">
          {roles.map((role) => (
            <li
              key={role}
              className="p-2 text-black hover:bg-[#D66766] hover:text-white cursor-pointer"
              onClick={() => {
                onChange(roleMap[role]);
                setIsOpen(false);
              }}
            >
              {role}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

// Gender Selector Component
const genders = ["Nam", "Nữ", "Khác"];
const GenderSelector = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex flex-col w-full relative">
      <h2 className="mb-2 ml-2 text-lg font-bold text-black">Giới Tính</h2>
      <Button
        className="flex justify-between items-center h-10 bg-white text-black rounded-[10px] hover:bg-[#D66766] shadow-sm cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{value || "Chọn giới tính"}</span>
        <ChevronDown className="w-5 h-5" color="#000" />
      </Button>
      {isOpen && (
        <ul className="absolute top-20 w-full bg-white shadow-lg rounded-[10px] z-10">
          {genders.map((gender) => (
            <li
              key={gender}
              className="p-2 text-black hover:bg-[#D66766] hover:text-white cursor-pointer"
              onClick={() => {
                onChange(gender);
                setIsOpen(false);
              }}
            >
              {gender}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default function Page() {
  const initialData = {
    id: "",
    username: "",
    email: "",
    phone: "",
    birthDate: "01/01/2000",
    avatar: "",
    role: "",
    gender: "",
  };

  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get("id");

  const [formData, setFormData] = useState(initialData);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [popupColor, setPopupColor] = useState("green-600");
  const [isOtpRequired, setIsOtpRequired] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpEmail, setOtpEmail] = useState("");

  // Check token and fetch user data
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      toast.error("Vui lòng đăng nhập để tiếp tục");
      router.push("/login");
      return;
    }

    if (userId) {
      const fetchUser = async () => {
        try {
          const response = await axios.get(
            `${process.env.NEXT_PUBLIC_API_URL}/api/admin/users`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
          const user = response.data.data.find(
            (u) => u.id === parseInt(userId)
          );
          if (user) {
            setFormData({
              id: user.id.toString(),
              username: user.username,
              email: user.email || "",
              phone: user.phone || "",
              birthDate: user.birthdate
                ? new Date(user.birthdate)
                    .toLocaleDateString("en-GB")
                    .split("/")
                    .join("/")
                : "01/01/2000",
              avatar: user.avatar_url || "",
              role: user.role,
              gender: user.gender || "",
            });
          } else {
            toast.error("Không tìm thấy người dùng");
            setPopupMessage("Không tìm thấy người dùng");
            setPopupColor("red-600");
            setIsPopupOpen(true);
            setTimeout(() => setIsPopupOpen(false), 3000);
          }
        } catch (error) {
          console.error("Error fetching user:", error);
          if (error.response?.status === 403) {
            toast.error(
              "Bạn không có quyền truy cập. Vui lòng đăng nhập với tài khoản admin"
            );
            router.push("/login");
          } else {
            toast.error(error.response?.data?.message || "Lỗi khi tải dữ liệu");
            setPopupMessage(
              error.response?.data?.message || "Lỗi khi tải dữ liệu"
            );
            setPopupColor("red-600");
            setIsPopupOpen(true);
            setTimeout(() => setIsPopupOpen(false), 3000);
          }
        }
      };
      fetchUser();
    }
  }, [userId, router]);

  const handleSubmit = async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      toast.error("Vui lòng đăng nhập để tiếp tục");
      router.push("/login");
      return;
    }

    const [day, month, year] = formData.birthDate.split("/");
    const birthDate = new Date(`${year}-${month}-${day}`)
      .toISOString()
      .split("T")[0];

    const userData = {
      username: formData.username,
      email: formData.email,
      phone: formData.phone,
      birthdate: birthDate,
      avatar_url: formData.avatar,
      role: formData.role,
      gender: formData.gender,
    };

    try {
      const url = userId
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/admin/users/${userId}`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/admin/users`;
      const method = userId ? "put" : "post";
      const response = await axios({
        method,
        url,
        data: userData,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.message === "Đã gửi OTP tới email, vui lòng xác thực") {
        setIsOtpRequired(true);
        setOtpEmail(response.data.email);
        toast.success("Đã gửi OTP tới email, vui lòng nhập mã OTP");
        setPopupMessage("Đã gửi OTP tới email, vui lòng nhập mã OTP");
        setPopupColor("green-600");
        setIsPopupOpen(true);
        setTimeout(() => setIsPopupOpen(false), 3000);
        return;
      }

      toast.success(
        userId ? "Cập nhật thành công!" : "Tạo người dùng thành công!"
      );
      setPopupMessage(
        userId ? "Cập nhật thành công!" : "Tạo người dùng thành công!"
      );
      setPopupColor("green-600");
      setIsPopupOpen(true);
      setTimeout(() => {
        setIsPopupOpen(false);
        router.push("/users");
      }, 2000);
    } catch (error) {
      console.error("Error submitting form:", error);
      if (error.response?.status === 403) {
        toast.error("Bạn không có quyền thực hiện hành động này");
        router.push("/login");
      } else {
        toast.error(error.response?.data?.message || "Thao tác thất bại");
        setPopupMessage(error.response?.data?.message || "Thao tác thất bại");
        setPopupColor("red-600");
        setIsPopupOpen(true);
        setTimeout(() => setIsPopupOpen(false), 3000);
      }
    }
  };

  const handleVerifyOtp = async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      toast.error("Vui lòng đăng nhập để tiếp tục");
      router.push("/login");
      return;
    }

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/verify-otp-create`,
        { email: otpEmail, otp },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log("data", otpEmail, otp);
      console.log("OTP verification response:", response.data);

      toast.success("Tạo người dùng thành công!");
      setPopupMessage("Tạo người dùng thành công!");
      setPopupColor("green-600");
      setIsPopupOpen(true);
      setTimeout(() => {
        setIsPopupOpen(false);
        setIsOtpRequired(false);
        setOtp("");
        setOtpEmail("");
        router.push("/users");
      }, 2000);
    } catch (error) {
      console.error("Error verifying OTP:", error);
      toast.error(
        error.response?.data?.message || "Mã OTP không hợp lệ hoặc đã hết hạn"
      );
      setPopupMessage(
        error.response?.data?.message || "Mã OTP không hợp lệ hoặc đã hết hạn"
      );
      setPopupColor("red-600");
      setIsPopupOpen(true);
      setTimeout(() => setIsPopupOpen(false), 3000);
    }
  };

  const isFormChanged =
    JSON.stringify(formData) !== JSON.stringify(initialData) &&
    formData.username &&
    (formData.email || formData.phone) &&
    formData.role &&
    formData.gender &&
    (formData.role !== "ADMIN" || formData.email); // Email required for ADMIN

  const handleAvatarChange = (newAvatar) => {
    setFormData((prev) => ({ ...prev, avatar: newAvatar }));
  };

  const handleDateChange = (newDate) => {
    setFormData((prev) => ({ ...prev, birthDate: newDate }));
  };

  const handlePhoneChange = (newPhone) => {
    setFormData((prev) => ({ ...prev, phone: newPhone }));
  };

  const handleUserNameChange = (newUserName) => {
    setFormData((prev) => ({ ...prev, username: newUserName }));
  };

  const handleEmailChange = (newEmail) => {
    setFormData((prev) => ({ ...prev, email: newEmail }));
  };

  const handleRoleChange = (newRole) => {
    setFormData((prev) => ({ ...prev, role: newRole }));
  };

  const handleGenderChange = (newGender) => {
    setFormData((prev) => ({ ...prev, gender: newGender }));
  };

  return (
    <div className="flex flex-row w-full h-full bg-[#EFF3FB]">
      <Sidebar />
      <main className="relative mx-auto my-0 w-full max-w-[1420px] py-6 md:ml-52 px-10 max-md:px-5 max-sm:px-2.5">
        <div className="mb-6 cursor-pointer">
          <BackButton />
        </div>

        <section className="mb-6">
          <InputField label="ID" value={formData.id} disabled />
        </section>

        <section className="mb-6">
          <InputField
            label="Tên Người Dùng"
            value={formData.username}
            onChange={handleUserNameChange}
          />
        </section>

        <section className="mb-6">
          <InputField
            label="Email"
            value={formData.email}
            onChange={handleEmailChange}
            disabled={isOtpRequired} // Disable email field during OTP verification
          />
        </section>

        <div className="grid grid-cols-2 gap-6">
          <section className="w-full">
            <InputField
              label="Số Điện Thoại"
              value={formData.phone}
              onChange={handlePhoneChange}
            />
          </section>

          <section className="w-full">
            <DatePickerField
              value={formData.birthDate}
              onChange={handleDateChange}
            />
          </section>

          <section className="w-full">
            <RoleSelector value={formData.role} onChange={handleRoleChange} />
          </section>

          <section className="w-full">
            <GenderSelector
              value={formData.gender}
              onChange={handleGenderChange}
            />
          </section>
        </div>

        {isOtpRequired && (
          <section className="mb-6">
            <InputField
              label="Mã OTP"
              value={otp}
              onChange={setOtp}
              placeholder="Nhập mã OTP"
            />
          </section>
        )}

        <section className="mb-6">
          <AvatarUpload
            avatarUrl={formData.avatar}
            onAvatarChange={handleAvatarChange}
          />
        </section>

        <footer className="flex justify-end items-center gap-4">
          {isPopupOpen && (
            <div
              className={`fixed top-10 right-10 bg-white p-4 rounded-lg shadow-lg border border-${popupColor}`}
            >
              <p className={`text-${popupColor} font-semibold`}>
                {popupMessage}
              </p>
            </div>
          )}
          {isOtpRequired ? (
            <Button
              onClick={handleVerifyOtp}
              className={`flex items-center gap-2 h-10 w-[200px] rounded-[10px] ${
                otp
                  ? "bg-[#062D76] hover:bg-gray-700 cursor-pointer"
                  : "bg-gray-400 cursor-not-allowed"
              }`}
              disabled={!otp}
            >
              <CheckCircle2 className="w-5 h-5" color="white" />
              <span className="text-lg font-bold text-white">Xác Thực OTP</span>
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              className={`flex items-center gap-2 h-10 w-[200px] rounded-[10px] ${
                isFormChanged
                  ? "bg-[#062D76] hover:bg-gray-700 cursor-pointer"
                  : "bg-gray-400 cursor-not-allowed"
              }`}
              disabled={!isFormChanged}
            >
              <CheckCircle2 className="w-5 h-5" color="white" />
              <span className="text-lg font-bold text-white">Hoàn Tất</span>
            </Button>
          )}
        </footer>
      </main>
    </div>
  );
}
