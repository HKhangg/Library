"use client";

import React, { createContext, useState, useContext, useEffect } from "react";

// 1. Tạo Context
const CartContext = createContext(null);

// 2. Tạo Provider (Component "bọc" ứng dụng)
export const CartProvider = ({ children }) => {
    const [cartCount, setCartCount] = useState(0);
    const [user, setUser] = useState(null);

    // Lấy user từ localStorage khi component mount
    useEffect(() => {
        const storedUser = localStorage.getItem("persist:root");
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, []);

    // Hàm fetch giỏ hàng (lấy từ Header.jsx của bạn)
    const fetchCart = async () => {
        if (!user?.id) {
            setCartCount(0);
            return;
        }

        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/cart/${user.id}`
            );
            if (response.ok) {
                const data = await response.json();
                const booksInCart = data.data || [];
                setCartCount(booksInCart.length);
            } else {
                console.error("Lỗi khi lấy giỏ hàng (Context)");
                setCartCount(0);
            }
        } catch (error) {
            console.error("Có lỗi xảy ra khi lấy giỏ hàng (Context):", error);
            setCartCount(0);
        }
    };

    // Tự động fetch khi user thay đổi
    useEffect(() => {
        fetchCart();
    }, [user]); // Phụ thuộc vào 'user' state

    // Cung cấp 'cartCount' và hàm 'fetchCart' cho các component con
    return (
        <CartContext.Provider value={{ cartCount, fetchCart }}>
            {children}
        </CartContext.Provider>
    );
};

// 3. Tạo một Hook tùy chỉnh (để dễ sử dụng)
export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error("useCart phải được dùng bên trong CartProvider");
    }
    return context;
};