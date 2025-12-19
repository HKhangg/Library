"use client";
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import axios from 'axios';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
    const [unreadCount, setUnreadCount] = useState(0);
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Lấy trạng thái đã đọc từ LocalStorage
    const getReadStatus = () => {
        if (typeof window !== "undefined") {
            const saved = localStorage.getItem("notificationReadStatus");
            return saved ? JSON.parse(saved) : {};
        }
        return {};
    };

    // Hàm chính: Tải thông báo từ Server
    // Sử dụng useCallback để không bị tạo lại mỗi lần render
    const refreshNotifications = useCallback(async () => {
        // Lấy User ID từ localStorage (giống logic cũ của bạn)
        let userId = null;
        if (typeof window !== "undefined") {
            try {
                const storedUser = JSON.parse(localStorage.getItem("persist:root"));
                userId = storedUser?.id;
            } catch (e) { }
        }

        if (!userId) return;

        setLoading(true);
        const notificationList = [];
        const readStatus = getReadStatus();

        try {
            // A. Fetch Dashboard
            try {
                const dashboardResponse = await axios.get(
                    `${process.env.NEXT_PUBLIC_API_URL}/api/book/dashboard`
                );
                if (dashboardResponse.status === 200) {
                    const newBooksCount = dashboardResponse.data.newBooksThisWeek || 0;
                    if (newBooksCount > 0) {
                        notificationList.push({
                            id: `new-books-${new Date().toISOString().split("T")[0]}`,
                            type: "new-books",
                            message: `Có ${newBooksCount} sách mới trong tuần này!`,
                            link: "/Homepage",
                            timestamp: new Date().toISOString(),
                        });
                    }
                }
            } catch (err) {
                console.error("Dashboard fetch error", err);
            }

            // B. Fetch Borrow Cards
            const borrowCardsResponse = await axios.post(
                `${process.env.NEXT_PUBLIC_API_URL}/api/borrow-cards/user/${userId}`
            );

            if (borrowCardsResponse.status === 200) {
                const borrowCards = borrowCardsResponse.data;
                const currentDate = new Date();

                for (const card of borrowCards) {
                    if (card.borrowedBooks && Array.isArray(card.borrowedBooks)) {
                        for (const borrowedBook of card.borrowedBooks) {
                            let bookName = `Sách ${borrowedBook.bookId}`;
                            try {
                                const bookRes = await axios.get(
                                    `${process.env.NEXT_PUBLIC_API_URL}/api/book/${borrowedBook.bookId}`
                                );
                                if (bookRes.status === 200) bookName = bookRes.data.tenSach;
                            } catch (e) { }

                            const dueDate = card.dueDate ? new Date(card.dueDate) : null;
                            const daysDiff = dueDate
                                ? Math.ceil((dueDate - currentDate) / (1000 * 60 * 60 * 24))
                                : null;
                            const daysSinceDue = dueDate
                                ? Math.ceil((currentDate - dueDate) / (1000 * 60 * 60 * 24))
                                : null;

                            // Logic tạo thông báo
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

            // Sắp xếp và cập nhật State
            const sortedNotifications = notificationList.sort(
                (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
            );
            setNotifications(sortedNotifications);

            // Tính số lượng chưa đọc
            const unread = sortedNotifications.filter((n) => !readStatus[n.id]).length;
            setUnreadCount(unread);

        } catch (err) {
            console.error("Error fetching notifications context:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    // Tự động fetch lần đầu khi load trang
    useEffect(() => {
        refreshNotifications();
    }, [refreshNotifications]);

    // Hàm update thủ công (dùng cho Header click)
    const updateUnreadCount = (count) => {
        setUnreadCount(count);
    };

    const decrementUnreadCount = () => {
        setUnreadCount((prev) => Math.max(0, prev - 1));
    };

    return (
        <NotificationContext.Provider value={{
            unreadCount,
            notifications, // Expose danh sách
            loading,       // Expose trạng thái loading
            error,
            updateUnreadCount,
            decrementUnreadCount,
            refreshNotifications // Quan trọng: Expose hàm này để trang khác gọi
        }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotification = () => useContext(NotificationContext);