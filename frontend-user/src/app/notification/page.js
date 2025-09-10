// "use client";
// import React, { useState, useEffect } from "react";
// import LeftSideBar from "../components/LeftSideBar";
// import { useRouter } from "next/navigation";
// import axios from "axios";

// const Notifications = () => {
//   const [notifications, setNotifications] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const router = useRouter();

//   // Load read status from localStorage
//   const [readStatus, setReadStatus] = useState(() => {
//     const saved = localStorage.getItem("notificationReadStatus");
//     return saved ? JSON.parse(saved) : {};
//   });

//   // Save read status to localStorage whenever it changes
//   useEffect(() => {
//     localStorage.setItem("notificationReadStatus", JSON.stringify(readStatus));
//   }, [readStatus]);

//   // Fetch notifications
//   useEffect(() => {
//     const fetchNotifications = async () => {
//       const notificationList = [];
//       try {
//         // Fetch new books this week
//         console.log("Fetching new books...");
//         const newBooksResponse = await axios.get("${process.env.NEXT_PUBLIC_API_URL}/api/book/new-books-this-week");
//         if (newBooksResponse.status === 200) {
//           const newBooksCount = newBooksResponse.data;
//           console.log("New books count:", newBooksCount);
//           if (newBooksCount > 0) {
//             notificationList.push({
//               id: `new-books-${new Date().toISOString()}`,
//               type: "new-books",
//               message: `Có ${newBooksCount} sách mới trong tuần này!`,
//               link: "/Homepage",
//               timestamp: new Date().toISOString(),
//             });
//           }
//         } else {
//           console.log("New books API failed:", newBooksResponse.status);
//         }

//         // Fetch borrow cards for the user with book details
//         const userId = localStorage.getItem("userId") || "54"; // Default to 54 from the image
//         console.log("Fetching borrow cards for userId:", userId);
//         const borrowCardsResponse = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/borrow-cards/user/${userId}`);
//         if (borrowCardsResponse.status === 200) {
//           const borrowCards = borrowCardsResponse.data;
//           console.log("Borrow cards data:", borrowCards);
//           const currentDate = new Date(); // 08:18 PM +07, May 18, 2025

//           for (const card of borrowCards) {
//             console.log("Processing card:", card);
//             if (card.borrowedBooks && Array.isArray(card.borrowedBooks)) {
//               for (const borrowedBook of card.borrowedBooks) {
//                 console.log("Processing borrowed book:", borrowedBook);
//                 // Fetch book name
//                 const bookResponse = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/book/${borrowedBook.bookId}`);
//                 const bookName = bookResponse.status === 200 ? bookResponse.data.tenSach : `Sách ${borrowedBook.bookId}`;
//                 console.log("Book name fetched:", bookName);
//                 const dueDate = card.dueDate ? new Date(card.dueDate) : null;
//                 const daysDiff = dueDate ? Math.ceil((dueDate - currentDate) / (1000 * 60 * 60 * 24)) : null;
//                 const daysSinceDue = dueDate ? Math.ceil((currentDate - dueDate) / (1000 * 60 * 60 * 24)) : null;

//                 // Đã yêu cầu (Pending)
//                 if (card.status === "Đã yêu cầu") {
//                   notificationList.push({
//                     id: `borrow-request-${card.id}-${borrowedBook.bookId}`,
//                     type: "borrow-request",
//                     message: `Bạn đã yêu cầu mượn sách ${bookName} thành công.`,
//                     link: `/borrowed-card/${card.id}`,
//                     timestamp: card.borrowDate || new Date().toISOString(),
//                   });
//                 }

//                 // Đang mượn (Borrowed)
//                 if (card.status === "Đang mượn") {
//                   notificationList.push({
//                     id: `borrow-success-${card.id}-${borrowedBook.bookId}`,
//                     type: "borrow-success",
//                     message: `Bạn đã mượn sách ${bookName} thành công.`,
//                     link: `/borrowed-card/${card.id}`,
//                     timestamp: card.getBookDate || new Date().toISOString(),
//                   });

//                   // Due date reminders (7 days and 1 day before)
//                   if (daysDiff === 7 || daysDiff === 1) {
//                     notificationList.push({
//                       id: `due-reminder-${card.id}-${borrowedBook.bookId}-${daysDiff}`,
//                       type: "due-reminder",
//                       message: `Sách ${bookName} đã gần tới hạn mượn sách. Hãy gia hạn hoặc trả sách.`,
//                       link: `/borrowed-card/${card.id}`,
//                       timestamp: new Date().toISOString(),
//                     });
//                   }

//                   // Overdue check (current date - due_date = 1 day)
//                   if (daysSinceDue === 1) {
//                     notificationList.push({
//                       id: `overdue-${card.id}-${borrowedBook.bookId}`,
//                       type: "overdue",
//                       message: `Bạn đã quá hạn mượn sách ${bookName}!`,
//                       link: `/borrowed-card/${card.id}`,
//                       timestamp: new Date().toISOString(),
//                     });
//                   }
//                 }

//                 // Đã trả (Returned)
//                 if (card.status === "Đã trả") {
//                   notificationList.push({
//                     id: `return-success-${card.id}-${borrowedBook.bookId}`,
//                     type: "return-success",
//                     message: `Bạn đã trả sách ${bookName} thành công.`,
//                     link: `/borrowed-card/${card.id}`,
//                     timestamp: card.dueDate || new Date().toISOString(),
//                   });
//                 }
//               }
//             } else {
//               console.log("No borrowedBooks array found in card:", card);
//             }
//           }
//         } else {
//           console.log("Borrow cards API failed:", borrowCardsResponse.status, borrowCardsResponse.data);
//         }

//         setNotifications(notificationList.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
//         setLoading(false);
//       } catch (err) {
//         console.error("Error fetching notifications:", err);
//         setError(err.message);
//         setLoading(false);
//       }
//     };

//     fetchNotifications();
//   }, []);

//   // Handle notification click
//   const handleNotificationClick = (notificationId, link) => {
//     setReadStatus((prev) => ({ ...prev, [notificationId]: true }));
//     router.push(link);
//   };

//   return (
//     <div className="mt-12 md:ml-60 min-h-screen flex">
//       <LeftSideBar />
//       <div className="flex-1 p-6">
//         <h1 className="text-2xl font-bold mb-4">Thông báo</h1>
//         {loading && <p className="text-gray-500">Đang tải thông báo...</p>}
//         {error && <p className="text-red-500">Lỗi: {error}</p>}
//         {!loading && !error && notifications.length === 0 && (
//           <p className="text-gray-500">Không có thông báo nào.</p>
//         )}
//         {!loading && !error && notifications.length > 0 && (
//           <div className="space-y-4">
//             {notifications.map((notification) => (
//               <div
//                 key={notification.id}
//                 className={`p-4 rounded-lg shadow-md cursor-pointer transition-colors ${
//                   readStatus[notification.id]
//                     ? "bg-gray-300 hover:bg-gray-400"
//                     : "bg-blue-100 hover:bg-blue-300"
//                 }`}
//                 onClick={() =>
//                   handleNotificationClick(notification.id, notification.link)
//                 }
//               >
//                 <div className="flex justify-between items-center">
//                   <div>
//                     <p className="text-lg font-semibold">
//                       {notification.message}
//                     </p>
//                     <p className="text-sm text-gray-500">
//                       {new Date(notification.timestamp).toLocaleString()}
//                     </p>
//                   </div>
//                   {!readStatus[notification.id] && (
//                     <span className="w-3 h-3 bg-blue-500 rounded-full ml-4"></span>
//                   )}
//                 </div>
//               </div>
//             ))}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default Notifications;

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
        refreshNoti(); // Gọi lại hàm fetch để cập nhật danh sách
      } catch (err) {
        toast.error("Lỗi khi đánh dấu đã đọc");
      }
    }
  };
  return (
    <article
      className="flex items-center gap-4 p-4 bg-white backdrop-blur-2xl  rounded-lg shadow-sm border hover:shadow-md transition cursor-pointer"
      onClick={handleMarkAsRead}
    >
      {!read ? (
        <>
          <FaCircle className="text-red-500 text-xs mt-1" title="Chưa đọc" />
          <div className="flex flex-col">
            <p
              className="text-[1.125rem] text-[#131313]/90"
              dangerouslySetInnerHTML={{ __html: formattedMessage }}
            ></p>
            <span className="text-sm text-gray-500 mt-1">
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
    <div className="flex flex-col min-h-screen text-foreground">
      <main className="pt-16 flex">
        <section className="self-stretch pr-[1.25rem] md:pl-60 ml-[1.25rem] my-auto w-full max-md:max-w-full mt-2 mb-2">
          <div className="flex flex-col p-5 w-full bg-white rounded-xl max-md:max-w-full">
            <div className="flex items-center justify-center gap-3">
              <h2 className="gap-2.5 self-center px-[1.25rem] py-[0.625rem] text-[1.5rem] text-[#062D76] font-semibold rounded-lg">
                Thông báo
              </h2>
            </div>
            {loading ? (
              <div className="flex justify-center items-center">
                <ThreeDot
                  color="#062D76"
                  size="large"
                  text="Đang tải thông báo..."
                  variant="bounce"
                  textColor="#062D76"
                />
              </div>
            ) : notifications.length > 0 ? (
              <div className="flex flex-col gap-4">
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
              <p className="text-center text-gray-500">
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
