"use client";

import { useGoogleLogin } from "@react-oauth/google";
import { FcGoogle } from "react-icons/fc";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { updateUser } from "@/store/slices/userSlice";
import Cookies from "js-cookie";
import { toast } from "react-hot-toast";

const GoogleLoginButton = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const error = new Error("Đã xảy ra lỗi, vui lòng thử lại");

  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const accessToken = tokenResponse.access_token;
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/auth/google`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ accessToken }),
          }
        );

        const data = await res.json();
        console.log("Response from server:", data); // Log the response for debugging

        if (res.ok && data.status === "OK") {
          localStorage.setItem("accessToken", data.data.accessToken);
          localStorage.setItem("refreshToken", data.data.refreshToken);
          localStorage.setItem("id", data.data.user.id);

          Cookies.set("refreshToken", data.data.refreshToken, {
            expires: 7,
            sameSite: "Strict",
          });
          dispatch(
            updateUser({
              ...data.data.user,
              access_token: data.data.accessToken,
              refreshToken: data.data.refreshToken,
            })
          );

          toast.success(data.message || "Đăng nhập thành công", {
            style: { background: "#d1fae5", color: "#065f46" },
          });
          router.push("/");
        } else {
          toast.error(error.message || "Đã xảy ra lỗi, vui lòng thử lại", {
            style: { background: "#fee2e2", color: "#b91c1c" },
          });
          console.error("Đăng nhập thất bại:", data.message || data.error);
          router.push("/user-login");
        }
      } catch (err) {
        toast.error(error.message || "Đã xảy ra lỗi, vui lòng thử lại", {
          style: { background: "#fee2e2", color: "#b91c1c" },
        });
        console.error("Lỗi khi gọi API:", err.message);
      }
    },
    onError: () => {
      console.error("Đăng nhập Google thất bại");
    },
  });

  return (
    <button
      onClick={() => login()}
      className="w-full flex items-center justify-center border border-gray-300 mt-1 rounded-full py-2 text-gray-700 hover:bg-gray-100 transition-colors duration-200"
    >
      <FcGoogle className="text-xl mr-2" />
      Đăng nhập với Google
    </button>
  );
};

export default GoogleLoginButton;
