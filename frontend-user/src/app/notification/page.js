"use client";
import React, { useState, useEffect, useMemo } from "react";
import ChatBotButton from "../components/ChatBoxButton";
import { FaCircle } from "react-icons/fa";
import toast from "react-hot-toast";
import { ThreeDot } from "react-loading-indicators";
import axios from "axios";
import useSWR from "swr";

// Fetcher từ nhiều nguồn
const notificationFetcher = async (userId) => {
  const notificationList = [];

  // A. Lấy thông tin Dashboard (Sách mới)
  try {
    const dashboardResponse = await axios.get(
      `${process.env.NEXT_PUBLIC_API_URL}/api/book/dashboard`
    );
    if (dashboardResponse.status === 200) {
      const newBooksCount = dashboardResponse.data.newBooksThisWeek || 0;
      if (newBooksCount > 0) {
        notificationList.push({
          id: `new-books-${new Date().toISOString().split('T')[0]}`, // ID dựa trên ngày để tránh duplicate
          type: "new-books",
          message: `Có ${newBooksCount} sách mới trong tuần này!`,
          link: "/Homepage",
          timestamp: new Date().toISOString(),
        });
      }
    }
  } catch (err) {
    console.error("Lỗi fetch dashboard:", err);
  }

  // B. Lấy thông tin Phiếu mượn
  try {
    const borrowCardsResponse = await axios.post(
      `${process.env.NEXT_PUBLIC_API_URL}/api/borrow-cards/user/${userId}`
    );

    if (borrowCardsResponse.status === 200) {
      const borrowCards = borrowCardsResponse.data;
      const currentDate = new Date();

      // Dùng Promise.all để fetch thông tin sách song song (nhanh hơn vòng lặp for)
      const cardPromises = borrowCards.map(async (card) => {
        if (!card.borrowedBooks || !Array.isArray(card.borrowedBooks)) return [];

        const bookPromises = card.borrowedBooks.map(async (borrowedBook) => {
          let bookName = `Sách ${borrowedBook.bookId}`;
          try {
            const bookResponse = await axios.get(
              `${process.env.NEXT_PUBLIC_API_URL}/api/book/${borrowedBook.bookId}`
            );
            if (bookResponse.status === 200) {
              bookName = bookResponse.data.tenSach;
            }
          } catch (e) {
            console.error(`Không lấy được tên sách ${borrowedBook.bookId}`);
          }

          const dueDate = card.dueDate ? new Date(card.dueDate) : null;
          const daysDiff = dueDate
            ? Math.ceil((dueDate - currentDate) / (1000 * 60 * 60 * 24))
            : null;
          const daysSinceDue = dueDate
            ? Math.ceil((currentDate - dueDate) / (1000 * 60 * 60 * 24))
            : null;

          const localNotis = [];

          if (card.status === "Đã yêu cầu") {
            localNotis.push({
              id: `borrow-request-${card.id}-${borrowedBook.bookId}`,
              type: "borrow-request",
              message: `Bạn đã yêu cầu mượn sách ${bookName} thành công.`,
              link: `/borrowed-card/${card.id}`,
              timestamp: card.borrowDate || new Date().toISOString(),
            });
          }

          if (card.status === "Đang mượn") {
            localNotis.push({
              id: `borrow-success-${card.id}-${borrowedBook.bookId}`,
              type: "borrow-success",
              message: `Bạn đã mượn sách ${bookName} thành công.`,
              link: `/borrowed-card/${card.id}`,
              timestamp: card.getBookDate || new Date().toISOString(),
            });

            if (daysDiff === 7 || daysDiff === 1) {
              localNotis.push({
                id: `due-reminder-${card.id}-${borrowedBook.bookId}-${daysDiff}`,
                type: "due-reminder",
                message: `Sách ${bookName} đã gần tới hạn mượn sách. Hãy gia hạn hoặc trả sách.`,
                link: `/borrowed-card/${card.id}`,
                timestamp: new Date().toISOString(),
              });
            }

            if (daysSinceDue === 1) {
              localNotis.push({
                id: `overdue-${card.id}-${borrowedBook.bookId}`,
                type: "overdue",
                message: `Bạn đã quá hạn mượn sách ${bookName}!`,
                link: `/borrowed-card/${card.id}`,
                timestamp: new Date().toISOString(),
              });
            }
          }

          if (card.status === "Đã trả") {
            localNotis.push({
              id: `return-success-${card.id}-${borrowedBook.bookId}`,
              type: "return-success",
              message: `Bạn đã trả sách ${bookName} thành công.`,
              link: `/borrowed-card/${card.id}`,
              timestamp: card.dueDate || new Date().toISOString(),
            });
          }
          return localNotis;
        });

        // Chờ tất cả sách trong 1 phiếu xử lý xong
        const booksNotis = await Promise.all(bookPromises);
        return booksNotis.flat();
      });

      // Chờ tất cả các phiếu xử lý xong
      const allCardNotis = await Promise.all(cardPromises);
      notificationList.push(...allCardNotis.flat());
    }
  } catch (err) {
    console.error("Lỗi fetch borrow cards:", err);
  }

  return notificationList;
};

const NotiCard = ({ id, message, timestamp, read, onMarkAsRead }) => {
  const dateObj = new Date(timestamp);

  const formattedDate = dateObj.toLocaleDateString("vi-VN");
  const formattedTime = dateObj.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const formattedMessage = message.split("\n").join("<br />");

  const handleClick = () => {
    if (!read) {
      onMarkAsRead(id);
    }
  };

  return (
    <article
      className="flex items-center gap-4 p-4 bg-blue-50 dark:bg-gray-600 transition-transform duration-300 shadow-sm backdrop-blur-2xl rounded-lg border hover:shadow-md cursor-pointer"
      onClick={handleClick}
    >
      {!read ? (
        <>
          <FaCircle className="text-red-500 mt-3 flex-shrink-0" title="Chưa đọc" />
          <div className="flex flex-col">
            <p
              className="text-[1.125rem] font-lora font-bold text-black dark:text-gray-100"
              dangerouslySetInnerHTML={{ __html: formattedMessage }}
            ></p>
            <span className="text-sm font-lora font-bold text-black dark:text-gray-100 mt-1">
              {formattedDate} lúc {formattedTime}
            </span>
          </div>
        </>
      ) : (
        <div className="flex flex-col ml-8"> {/* Thêm margin-left để thẳng hàng với text chưa đọc */}
          <p className="text-[1.125rem] text-[#131313]/50 dark:text-gray-400">{message}</p>
          <span className="text-sm text-gray-500 mt-1">
            {formattedDate} lúc {formattedTime}
          </span>
        </div>
      )}
    </article>
  );
};

const Page = () => {
  const [user, setUser] = useState(null);

  // State lưu trạng thái đã đọc (vẫn cần dùng vì logic cũ dựa vào localStorage)
  const [readStatus, setReadStatus] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem("notificationReadStatus");
      return saved ? JSON.parse(saved) : {};
    }
    return {};
  });

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("persist:root"));
    setUser(storedUser);
  }, []);

  useEffect(() => {
    localStorage.setItem("notificationReadStatus", JSON.stringify(readStatus));
  }, [readStatus]);

  // 2. Sử dụng useSWR
  const {
    data: notifications = [],
    isLoading,
    mutate, // Hàm này dùng để refresh lại dữ liệu
  } = useSWR(
    user?.id ? ["notifications", user.id] : null, // Key phụ thuộc vào user.id
    ([key, userId]) => notificationFetcher(userId),
    {
      revalidateOnFocus: true,
      dedupingInterval: 60000, // Cache 1 phút vì thông báo không cần realtime từng giây
    }
  );

  // Xử lý sắp xếp (Derived state)
  const sortedNotifications = useMemo(() => {
    return [...notifications].sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
    );
  }, [notifications]);

  // Hàm đánh dấu đã đọc
  const handleMarkAsRead = async (id) => {
    // 1. Cập nhật UI ngay lập tức (Optimistic UI update cho localStorage state)
    setReadStatus((prev) => ({ ...prev, [id]: true }));

    try {
      // 2. Gọi API báo server (nếu server hỗ trợ lưu trạng thái này)
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/notification/mark-as-read/${id}`,
        { method: "PUT" }
      );
      toast.success("Đã đánh dấu là đã đọc!");

      // 3. Refresh lại dữ liệu từ server (nếu cần thiết)
      // mutate(); 
    } catch (err) {
      console.error("Lỗi mark read:", err);
      // toast.error("Lỗi khi đánh dấu đã đọc"); // Có thể bỏ qua lỗi này để không làm phiền user
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
                <ThreeDot
                  color="#30c9e8"
                  size="large"
                  text="Đang tải thông báo..."
                  variant="bounce"
                  textColor="#30c9e8"
                />
              </div>
            ) : sortedNotifications.length > 0 ? (
              <div className="grid grid-cols-1 max-sm:grid-cols-1 gap-5 items-start mt-5 w-full max-md:max-w-full z-10">
                {sortedNotifications.map((item) => (
                  <NotiCard
                    key={item.id}
                    id={item.id}
                    message={item.message}
                    timestamp={item.timestamp}
                    read={!!readStatus[item.id]} // Kiểm tra trạng thái đọc từ local state
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