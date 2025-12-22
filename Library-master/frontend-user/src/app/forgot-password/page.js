"use client";

import React, { useState, useEffect, useRef } from "react";
import { Eye, EyeOff } from "lucide-react";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import { useRouter } from "next/navigation";

// Import các UI component
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

export default function ForgotPasswordPage() {
  const router = useRouter();

  const [step, setStep] = useState("request");
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [resendTimeout, setResendTimeout] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (resendTimeout > 0) {
      intervalRef.current = setInterval(() => {
        setResendTimeout((prev) => {
          if (prev <= 1) {
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [resendTimeout]);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!emailOrPhone) {
      toast.error("Vui lòng nhập email hoặc số điện thoại");
      return;
    }

    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/forgot-password`,
        {
          emailOrPhone,
        }
      );
      toast.success("OTP đã được gửi");
      setStep("reset");
      setResendTimeout(60);
    } catch (error) {
      toast.error(error.response?.data?.message || "Gửi OTP thất bại");
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!otp || !newPassword) {
      toast.error("Vui lòng nhập OTP và mật khẩu mới");
      return;
    }

    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/reset-password`,
        {
          emailOrPhone,
          otp,
          newPassword,
        }
      );
      toast.success("Đặt lại mật khẩu thành công");
      router.push("/user-login");
    } catch (error) {
      toast.error(error.response?.data?.message || "Đặt lại mật khẩu thất bại");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F9FDFF]">
      <Toaster position="top-center" />
      <Card className="w-[90vw] sm:w-[25vw] border-[#062D76] px-4 py-8 shadow-lg rounded-xl">
        <CardHeader>
          <CardTitle className="flex justify-center">
            <img src="/images/logoN.png" alt="logo" className="w-80 h-45" />
          </CardTitle>
        </CardHeader>

        <CardContent>
          <h2 className="text-xl font-semibold text-center mb-4">
            {step === "request" ? "Quên mật khẩu" : "Đặt lại mật khẩu"}
          </h2>

          <form
            onSubmit={step === "request" ? handleSendOtp : handleResetPassword}
            className="space-y-4"
          >
            {step === "request" && (
              <>
                <input
                  type="text"
                  placeholder="Email hoặc số điện thoại"
                  className="w-full p-3 border border-gray-300 rounded-xl  focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={emailOrPhone}
                  onChange={(e) => setEmailOrPhone(e.target.value)}
                />
                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-xl font-medium transition cursor-pointer"
                >
                  Gửi OTP
                </button>
              </>
            )}

            {step === "reset" && (
              <>
                <p className="text-sm text-gray-600 mb-2">
                  Mã OTP đã gửi đến: <strong>{emailOrPhone}</strong>
                </p>

                <input
                  type="text"
                  placeholder="Nhập mã OTP"
                  className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                />

                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Mật khẩu mới"
                    className="w-full p-3 border border-gray-300 rounded-xl pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 cursor-pointer"
                  >
                    {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
                  </button>
                </div>

                <button
                  type="submit"
                  className="w-full bg-green-600 hover:bg-green-700 text-white p-3 rounded-xl font-medium transition cursor-pointer"
                >
                  Xác nhận
                </button>

                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={resendTimeout > 0}
                  className="w-full text-sm text-blue-500 mt-2 underline disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {resendTimeout > 0
                    ? `Gửi lại OTP (${resendTimeout}s)`
                    : "Gửi lại OTP"}
                </button>
              </>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
