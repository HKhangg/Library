"use client";

import { useState } from "react";
import { FaFacebook } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { useFacebookSDK } from "./FacebookSDKContext";
import { useDispatch } from "react-redux";
import { updateUser } from "@/store/slices/userSlice";
import Cookies from "js-cookie";
import { toast } from "react-hot-toast";

const FacebookLoginButton = () => {
  const router = useRouter();
  const { isSDKLoaded, error: sdkError } = useFacebookSDK();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const dispatch = useDispatch();

  const handleLogin = async () => {
    // Kiểm tra giao thức
    if (
      window.location.protocol !== "https:" &&
      window.location.hostname !== "localhost"
    ) {
      setError(
        "Đăng nhập Facebook yêu cầu HTTPS. Vui lòng truy cập trang qua HTTPS."
      );
      return;
    }

    // Kiểm tra SDK
    if (!isSDKLoaded || !window.FB) {
      setError("Facebook SDK chưa được tải. Vui lòng thử lại sau.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await new Promise((resolve) => {
        window.FB.login((res) => resolve(res), {
          scope: "email,public_profile",
        });
      });

      if (response.authResponse) {
        const accessToken = response.authResponse.accessToken;

        // Gửi accessToken tới backend
        const apiUrl =
          process.env.NODE_ENV === "development"
            ? `${process.env.NEXT_PUBLIC_API_URL}/api/auth/facebook`
            : "https://your-production-url/api/auth/facebook"; // Thay bằng URL sản xuất

        const fetchResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/auth/facebook`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ accessToken }),
          }
        );

        if (!fetchResponse.ok) {
          const errorText = await fetchResponse.text();
          throw new Error(
            `Lỗi từ backend: ${fetchResponse.status} ${fetchResponse.statusText} - ${errorText}`
          );
        }

        const data = await fetchResponse.json();
        console.log("Response from backend:", data);

        if (data.status === "OK") {
          // Lưu token và kiểm tra đồng bộ
          localStorage.setItem("accessToken", data.data.accessToken);
          localStorage.setItem("refreshToken", data.data.refreshToken);
          localStorage.setItem("id", data.data.user.id);

          Cookies.set("refreshToken", data.data.refreshToken, {
            expires: 7,
            sameSite: "Strict",
          });

          // Kiểm tra xem token đã được lưu chưa
          if (
            localStorage.getItem("accessToken") !== data.data.accessToken ||
            localStorage.getItem("refreshToken") !== data.data.refreshToken
          ) {
            throw new Error("Không thể lưu token vào localStorage");
          }

          dispatch(
            updateUser({
              ...data.data.user,
              access_token: data.data.accessToken,
              refreshToken: data.data.refreshToken,
            })
          );

          // Đợi một chút để đảm bảo localStorage được cập nhật
          await new Promise((resolve) => setTimeout(resolve, 100));
          toast.success(data.message || "Đăng nhập thành công", {
            style: { background: "#d1fae5", color: "#065f46" },
          });
          router.push("/");
        } else {
          toast.error(
            "Đăng nhập thất bại: " +
              (data.message || "Lỗi không xác định từ backend"),
            {
              style: { background: "#fee2e2", color: "#b91c1c" },
            }
          );
          setError(
            "Đăng nhập thất bại: " +
              (data.message || "Lỗi không xác định từ backend")
          );
          router.push("/user-login");
        }
      } else {
        toast.error("Đăng nhập bị hủy hoặc thất bại", {
          style: { background: "#fee2e2", color: "#b91c1c" },
        });
        setError("Đăng nhập bị hủy hoặc thất bại.");
        router.push("/user-login");
      }
    } catch (err) {
      console.error("Lỗi khi đăng nhập:", err);
      setError(`Lỗi khi đăng nhập: ${err.message}`);
      router.push("/user-login");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleLogin}
        disabled={isLoading || !isSDKLoaded}
        className={`w-full flex items-center justify-center border border-gray-300 mt-1 rounded-full py-2 text-gray-700 transition-colors duration-200 ${
          isLoading || !isSDKLoaded
            ? "opacity-50 cursor-not-allowed"
            : "hover:bg-gray-100"
        }`}
      >
        <FaFacebook className="text-xl mr-2" />
        {isLoading ? "Đang xử lý..." : "Đăng nhập với Facebook"}
      </button>
      {(error || sdkError) && (
        <p className="text-red-500 text-sm mt-2">{error || sdkError}</p>
      )}
    </div>
  );
};

export default FacebookLoginButton;
