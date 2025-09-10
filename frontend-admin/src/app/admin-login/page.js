"use client";
import { Button } from "@/app/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/components/ui/label";
import { yupResolver } from "@hookform/resolvers/yup";
import { motion } from "framer-motion";
import { LogIn, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import toast, { Toaster } from "react-hot-toast";
import * as yup from "yup";
import Cookies from "js-cookie";
import { updateUser } from "@/store/slices/userSlice";
import { useDispatch } from "react-redux";

// Validation schema for login
const loginSchema = yup.object().shape({
  loginInput: yup
    .string()
    .required("Vui lòng nhập số điện thoại hoặc email")
    .test(
      "is-email-or-phone",
      "Vui lòng nhập email hợp lệ hoặc số điện thoại",
      (value) => {
        if (!value) return false;
        const isEmail = value.includes("@");
        const isPhone = /^\d+$/.test(value);
        return isEmail || isPhone;
      }
    ),
  password: yup
    .string()
    .min(6, "Mật khẩu phải có ít nhất 6 ký tự")
    .required("Mật khẩu không được để trống"),
});

// Validation schema for OTP
const otpSchema = yup.object().shape({
  otp: yup
    .string()
    .required("Vui lòng nhập mã OTP")
    .matches(/^\d{6}$/, "Mã OTP phải là 6 chữ số"),
});

const Page = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [isOtpPhase, setIsOtpPhase] = useState(false);
  const [email, setEmail] = useState("");

  // Login form
  const {
    register: loginRegister,
    handleSubmit: handleLoginSubmit,
    formState: { errors: loginErrors },
    reset: resetLogin,
  } = useForm({
    resolver: yupResolver(loginSchema),
  });

  // OTP form
  const {
    register: otpRegister,
    handleSubmit: handleOtpSubmit,
    formState: { errors: otpErrors },
    reset: resetOtp,
  } = useForm({
    resolver: yupResolver(otpSchema),
  });

  const onLoginSubmit = async (data) => {
    setLoading(true);
    try {
      const isEmail = data.loginInput.includes("@");
      const payload = {
        [isEmail ? "email" : "phone"]: data.loginInput,
        password: data.password,
        isFEAdmin: true,
      };

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Đăng nhập thất bại");
      }

      const result = await response.json();

      if (result.message == "Đăng nhập thành công") {
        throw new Error("Bạn không có quyền truy cập vào trang này");
      }

      setIsOtpPhase(true);
      setEmail(result.email);
      toast.success(result.message || "Đã gửi OTP tới email của bạn", {
        style: { background: "#d1fae5", color: "#065f46" },
      });
      resetLogin(); // Clear login form
    } catch (error) {
      toast.error(error.message || "Đã xảy ra lỗi, vui lòng thử lại", {
        style: { background: "#fee2e2", color: "#991b1b" },
      });
    } finally {
      setLoading(false);
    }
  };

  const onOtpSubmit = async (data) => {
    setLoading(true);
    try {
      const payload = { email: email, otp: data.otp };
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/verify-otp`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Xác thực OTP thất bại");
      }

      const result = await response.json();
      //console.log("Login result:", result);

      localStorage.setItem("accessToken", result.data.accessToken);
      localStorage.setItem("id", result.data.admin.id || "");

      Cookies.set("refreshToken", result.data.refreshToken, {
        expires: 7,
        sameSite: "Strict",
      });

      dispatch(
        updateUser({
          ...result.data.admin,
          access_token: result.data.accessToken,
          refreshToken: result.data.refreshToken,
        })
      );

      toast.success(result.message || "Đăng nhập thành công", {
        style: { background: "#d1fae5", color: "#065f46" },
      });
      // Chờ 1.5 giây rồi chuyển trang
      setTimeout(() => {
        router.push("/dashboard");
      }, 1000);
    } catch (error) {
      toast.error(error.message || "Đã xảy ra lỗi, vui lòng thử lại", {
        style: { background: "#fee2e2", color: "#991b1b" },
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    setIsOtpPhase(false);
    setEmail("");
    resetOtp();
  };

  const renderLoginForm = () => (
    <form onSubmit={handleLoginSubmit(onLoginSubmit)}>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="loginInput" className="text-[#086280]">
            Số điện thoại hoặc Email
          </Label>
          <Input
            id="loginInput"
            name="loginInput"
            type="text"
            {...loginRegister("loginInput")}
            placeholder="Nhập số điện thoại hoặc email"
            className="col-span-3 dark:border-gray-400 border-[#0E42D2] placeholder:text-gray-400"
          />
          {loginErrors.loginInput && (
            <p className="text-red- react-hot-toast500">
              {loginErrors.loginInput.message}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="loginPassword" className="text-[#086280]">
            Mật khẩu
          </Label>
          <Input
            id="loginPassword"
            name="password"
            type="password"
            {...loginRegister("password")}
            placeholder="Nhập mật khẩu của bạn"
            className="col-span-3 dark:border-gray-400 border-[#0E42D2] placeholder:text-gray-400"
          />
          {loginErrors.password && (
            <p className="text-red-500">{loginErrors.password.message}</p>
          )}
        </div>
        <Button
          className="w-full bg-[#23CAF1] text-white mt-5 cursor-pointer"
          type="submit"
          disabled={loading}
        >
          <LogIn className="mr-2 w-4 h-4" />
          {loading ? "Đang đăng nhập..." : "Đăng nhập"}
        </Button>
      </div>
    </form>
  );

  const renderOtpForm = () => (
    <form onSubmit={handleOtpSubmit(onOtpSubmit)}>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="otp" className="text-[#086280]">
            Mã OTP
          </Label>
          <Input
            id="otp"
            name="otp"
            type="text"
            {...otpRegister("otp")}
            placeholder="Nhập mã OTP 6 chữ số"
            className="col-span-3 dark:border-gray-400 border-[#0E42D2] placeholder:text-gray-400"
          />
          {otpErrors.otp && (
            <p className="text-red-500">{otpErrors.otp.message}</p>
          )}
        </div>
        <Button
          className="w-full bg-[#23CAF1] text-white mt-5 cursor-pointer"
          type="submit"
          disabled={loading}
        >
          <LogIn className="mr-2 w-4 h-4" />
          {loading ? "Đang xác thực..." : "Xác thực OTP"}
        </Button>
        <Button
          variant="outline"
          className="w-full mt-2 text-[#086280] border-[#0E42D2]"
          onClick={handleBackToLogin}
          disabled={loading}
        >
          <ArrowLeft className="mr-2 w-4 h-4" />
          Quay lại đăng nhập
        </Button>
      </div>
    </form>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F9FDFF] p-6">
      <Toaster position="top-center" reverseOrder={false} />
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="w-[400px] max-w-lg border border-blue-500 shadow-lg p-6">
          <CardHeader className="text-center">
            <CardTitle>
              <img
                src="/images/logoN.png"
                alt="Admin Panel"
                className="w-40 h-25 mx-auto"
              />
            </CardTitle>
            <CardDescription className="text-center text-[#1CA2C1] text-[16px]">
              {isOtpPhase
                ? "Xác thực OTP để đăng nhập"
                : "Đăng nhập vào tài khoản quản trị"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isOtpPhase ? renderOtpForm() : renderLoginForm()}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Page;
