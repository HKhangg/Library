

"use client";
import React, { useState, useEffect } from "react";
import ChatBotButton from "../components/ChatBoxButton";
import { FaCircle } from "react-icons/fa";
import toast from "react-hot-toast";
import { ThreeDot } from "react-loading-indicators";
import axios from "axios";

const NotiCard = ({ id, message, timestamp, read, refreshNoti }) => {
  const dateObj = new Date(timestamp);

  const formattedDate = dateObj.toLocaleDateString("vi-VN");
  const formattedTime = dateObj.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const formattedMessage = message.split("\n").join("<br />");
  const handleMarkAsRead = async () => {
    if (!read) {
      try {
        await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/notification/mark-as-read/${id}`,
          {
            method: "PUT",
          }
        );
        toast.success("Đã đánh dấu là đã đọc!");
        refreshNoti(); 
      } catch (err) {
        toast.error("Lỗi khi đánh dấu đã đọc");
      }
    }
  };
  return (
    <article
      className="flex items-center gap-4 p-4 bg-blue-50 dark:bg-gray-600 transition-transform duration-300 shadow-sm backdrop-blur-2xl  rounded-lg shadow-sm border hover:shadow-md transition cursor-pointer"
      onClick={handleMarkAsRead}
    >
      {!read ? (
        <>
          <FaCircle className="text-red-500  mt-3" title="Chưa đọc" />
          <div className="flex flex-col">
            <p
              className="text-[1.125rem] font-lora font-bold text-black dark:text-gray-100 text-[#131313]/90"
              dangerouslySetInnerHTML={{ __html: formattedMessage }}
            ></p>
            <span className="text-sm font-lora font-bold text-black dark:text-gray-100 mt-1">
              {formattedDate} lúc {formattedTime}
            </span>
          </div>
        </>
      ) : (
        <div className="flex flex-col">
          <p className="text-[1.125rem] text-[#131313]/50">{message}</p>
          <span className="text-sm text-gray-500 mt-1">
            {formattedDate} lúc {formattedTime}
          </span>
        </div>
      )}
    </article>
  );
};

const Page = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true); // Trạng thái loading
  const [error, setError] = useState(null);
  const [unreadCount, setUnreadCount] = useState("")
  const [readStatus, setReadStatus] = useState(() => {
    const saved = localStorage.getItem("notificationReadStatus");
    return saved ? JSON.parse(saved) : {};
  });
  const user = JSON.parse(localStorage.getItem("persist:root")) || { id: "54" }; // Default to 54 if no user
  const fetchNotifications = async () => {
    const notificationList = [];
    try {
      const dashboardResponse = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/book/dashboard`
      );
      if (dashboardResponse.status === 200) {
        const newBooksCount = dashboardResponse.data.newBooksThisWeek || 0;
        if (newBooksCount > 0) {
          notificationList.push({
            id: `new-books-${new Date().toISOString()}`,
            type: "new-books",
            message: `Có ${newBooksCount} sách mới trong tuần này!`,
            link: "/Homepage",
            timestamp: new Date().toISOString(),
          });
        }
      }

      const userId = user.id;
      const borrowCardsResponse = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/borrow-cards/user/${userId}`
      );
      if (borrowCardsResponse.status === 200) {
        const borrowCards = borrowCardsResponse.data;
        const currentDate = new Date();

        for (const card of borrowCards) {
          if (card.borrowedBooks && Array.isArray(card.borrowedBooks)) {
            for (const borrowedBook of card.borrowedBooks) {
              const bookResponse = await axios.get(
                `${process.env.NEXT_PUBLIC_API_URL}/api/book/${borrowedBook.bookId}`
              );
              const bookName =
                bookResponse.status === 200
                  ? bookResponse.data.tenSach
                  : `Sách ${borrowedBook.bookId}`;
              const dueDate = card.dueDate ? new Date(card.dueDate) : null;
              const daysDiff = dueDate
                ? Math.ceil((dueDate - currentDate) / (1000 * 60 * 60 * 24))
                : null;
              const daysSinceDue = dueDate
                ? Math.ceil((currentDate - dueDate) / (1000 * 60 * 60 * 24))
                : null;

              if (card.status === "Đã yêu cầu") {
                notificationList.push({
                  id: `borrow-request-${card.id}-${borrowedBook.bookId}`,
                  type: "borrow-request",
                  message: `Bạn đã yêu cầu mượn sách ${bookName} thành công.`,
                  link: `/borrowed-card/${card.id}`,
                  timestamp: card.borrowDate || new Date().toISOString(),
                });
              }

              if (card.status === "Đang mượn") {
                notificationList.push({
                  id: `borrow-success-${card.id}-${borrowedBook.bookId}`,
                  type: "borrow-success",
                  message: `Bạn đã mượn sách ${bookName} thành công.`,
                  link: `/borrowed-card/${card.id}`,
                  timestamp: card.getBookDate || new Date().toISOString(),
                });

                if (daysDiff === 7 || daysDiff === 1) {
                  notificationList.push({
                    id: `due-reminder-${card.id}-${borrowedBook.bookId}-${daysDiff}`,
                    type: "due-reminder",
                    message: `Sách ${bookName} đã gần tới hạn mượn sách. Hãy gia hạn hoặc trả sách.`,
                    link: `/borrowed-card/${card.id}`,
                    timestamp: new Date().toISOString(),
                  });
                }

                if (daysSinceDue === 1) {
                  notificationList.push({
                    id: `overdue-${card.id}-${borrowedBook.bookId}`,
                    type: "overdue",
                    message: `Bạn đã quá hạn mượn sách ${bookName}!`,
                    link: `/borrowed-card/${card.id}`,
                    timestamp: new Date().toISOString(),
                  });
                }
              }

              if (card.status === "Đã trả") {
                notificationList.push({
                  id: `return-success-${card.id}-${borrowedBook.bookId}`,
                  type: "return-success",
                  message: `Bạn đã trả sách ${bookName} thành công.`,
                  link: `/borrowed-card/${card.id}`,
                  timestamp: card.dueDate || new Date().toISOString(),
                });
              }
            }
          }
        }
      }

      const sortedNotifications = notificationList.sort(
        (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
      );
      setNotifications(sortedNotifications);
      const unread = sortedNotifications.filter(
        (n) => !readStatus[n.id]
      ).length;
      setUnreadCount(unread);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching notifications:", err);
      setError(err.message);
      setLoading(false);
    }
  };
  const handleNotificationClick = (notificationId, link) => {
    setReadStatus((prev) => ({ ...prev, [notificationId]: true }));
    router.push(link);
  };

  useEffect(() => {
    localStorage.setItem("notificationReadStatus", JSON.stringify(readStatus));
  }, [readStatus]);
  useEffect(() => {
    fetchNotifications();
  }, [user.id]);

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
            {loading ? (
              <div className="flex justify-center items-center h-[300px]">
                <ThreeDot
                  color="#30c9e8"
                  size="large"
                  text="Đang tải thông báo..."
                  variant="bounce"
                  textColor="#30c9e8"
                />
              </div>
            ) : notifications.length > 0 ? (
              <div className="grid grid-cols-1 max-sm:grid-cols-1 gap-5 items-start mt-5 w-full max-md:max-w-full z-10">
                {notifications.map((item) => (
                  <NotiCard
                    key={item.id}
                    id={item.id}
                    message={item.message}
                    timestamp={item.timestamp}
                    read={item.read}
                    refreshNoti={fetchNotifications}
                  />
                ))}
              </div>
            ) : (
              <p className="text-center text-[#062D76] dark:text-[#30c9e8]">
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
