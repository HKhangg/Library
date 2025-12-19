"use client";
import React, { useState, useEffect, useMemo } from "react";
import ChatBotButton from "../components/ChatBoxButton";
import { FaCircle } from "react-icons/fa";
import toast from "react-hot-toast";
import { ThreeDot } from "react-loading-indicators";
import axios from "axios";
import useSWR from "swr";
import { useNotification } from "@/app/context/NotificationContext";

const notificationFetcher = async (userId) => {
  if (!userId) return [];
  try {
    const response = await axios.get(
      `${process.env.NEXT_PUBLIC_API_URL}/api/notification/${userId}`
    );

    if (response.status === 200 && Array.isArray(response.data)) {
      return response.data.map((noti) => ({
        id: noti.id,           
        message: noti.message, 
        timestamp: noti.timestamp,
        read: noti.isRead ?? noti.is_read ?? noti.read ?? false,
      }));
    }
    return [];
  } catch (err) {
    console.error("Lỗi fetch notifications:", err);
    return [];
  }
};

const NotiCard = ({ id, message, timestamp, read, onMarkAsRead }) => {
  const dateObj = new Date(timestamp);
  const formattedDate = !isNaN(dateObj) ? dateObj.toLocaleDateString("vi-VN") : "";
  const formattedTime = !isNaN(dateObj) ? dateObj.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) : "";
  const formattedMessage = message ? message.split("\n").join("<br />") : "";

  return (
    <article
      className={`flex items-center gap-4 p-4 transition-transform duration-300 shadow-sm backdrop-blur-2xl rounded-lg border hover:shadow-md cursor-pointer ${read
          ? "bg-white dark:bg-gray-800 border-gray-200 opacity-60"
          : "bg-blue-50 dark:bg-gray-700 border-blue-200"
        }`}
      onClick={() => !read && onMarkAsRead(id)}
    >
      {!read ? (
        <>
          <FaCircle className="text-red-500 mt-1 flex-shrink-0" title="Chưa đọc" size={10} />
          <div className="flex flex-col">
            {/* QUAN TRỌNG: Hiển thị HTML từ backend */}
            <p
              className="text-[1.125rem] font-lora font-bold text-black dark:text-gray-100"
              dangerouslySetInnerHTML={{ __html: formattedMessage }}
            ></p>
            <span className="text-sm font-lora font-bold text-blue-600 dark:text-blue-400 mt-1">
              {formattedDate} lúc {formattedTime}
            </span>
          </div>
        </>
      ) : (
        <div className="flex flex-col ml-6">
          <p
            className="text-[1.125rem] text-[#131313]/60 dark:text-gray-400 font-normal"
            dangerouslySetInnerHTML={{ __html: formattedMessage }}
          ></p>
          <span className="text-sm text-gray-400 mt-1">
            {formattedDate} lúc {formattedTime}
          </span>
        </div>
      )}
    </article>
  );
};

const Page = () => {
  const [user, setUser] = useState(null);
  const { updateUnreadCount, decrementUnreadCount } = useNotification();

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("persist:root");
        if (stored) {
          setUser(JSON.parse(stored));
        }
      } catch (e) { }
    }
  }, []);

  const {
    data: notifications = [],
    isLoading,
    mutate,
  } = useSWR(
    user?.id ? ["notifications", user.id] : null,
    ([key, userId]) => notificationFetcher(userId),
    {
      revalidateOnFocus: true,
      dedupingInterval: 5000,
      fallbackData: [],
    }
  );

  const sortedNotifications = useMemo(() => {
    if (!Array.isArray(notifications)) return [];
    return [...notifications].sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
    );
  }, [notifications]);

  useEffect(() => {
    if (Array.isArray(notifications)) {
      const unread = notifications.filter(n => !n.read).length;
      updateUnreadCount(unread);
    }
  }, [notifications, updateUnreadCount]);

  const handleMarkAsRead = async (id) => {
    const optimisticData = notifications.map(n =>
      n.id === id ? { ...n, read: true } : n
    );
    mutate(optimisticData, false); // Cập nhật cache SWR
    decrementUnreadCount();        // Giảm số trên Header

    try {
      const response = await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/api/notification/mark-as-read/${id}`
      );

      if (response.status === 200) {
        mutate(); 
        toast.success("Đã đánh dấu đã đọc");
      }
    } catch (err) {
      console.error("Lỗi mark read:", err);
      toast.error("Lỗi cập nhật trạng thái");
      mutate(); 
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300">
      <main className="pt-16 flex">
        <section className="self-stretch pr-[1.25rem] md:pl-60 ml-[1.25rem] my-auto w-full max-md:max-w-full mt-4 mb-2">
          <div className="flex flex-col p-5 w-full bg-white dark:bg-gray-800 rounded-xl transition-colors duration-300">
            <div className="flex items-center justify-center gap-3">
              <h2 className="gap-2.5 self-center px-5 py-2 text-[2rem] font-extrabold font-lora rounded-lg text-[#30c9e8] dark:text-[#30c9e8]">
                Thông báo
              </h2>
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center h-[300px]">
                <ThreeDot color="#30c9e8" size="large" text="Đang tải..." textColor="#30c9e8" />
              </div>
            ) : sortedNotifications.length > 0 ? (
              <div className="grid grid-cols-1 max-sm:grid-cols-1 gap-5 items-start mt-5 w-full max-md:max-w-full z-10 pb-20">
                {sortedNotifications.map((item) => (
                  <NotiCard
                    key={item.id}
                    id={item.id}
                    message={item.message}
                    timestamp={item.timestamp}
                    read={item.read}
                    onMarkAsRead={handleMarkAsRead}
                  />
                ))}
              </div>
            ) : (
              <p className="text-center text-[#062D76] dark:text-[#30c9e8] mt-10">
                Bạn không có thông báo nào.
              </p>
            )}
          </div>
        </section>
        <ChatBotButton />
      </main>
    </div>
  );
};

export default Page;