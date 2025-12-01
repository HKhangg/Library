"use client";

import React, { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import axios from "axios";

export default function ScanPage() {
  const videoRef = useRef(null);
  const [code, setCode] = useState("");
  const [book, setBook] = useState(null);
  const [error, setError] = useState("");
  const API = process.env.NEXT_PUBLIC_API_URL; // đã khai trong .env.local

  // B1: Khởi động camera và bắt đầu quét
  useEffect(() => {
    const codeReader = new BrowserMultiFormatReader();
    let isMounted = true;
    let controls;

    (async () => {
      try {
        const devices = await BrowserMultiFormatReader.listVideoInputDevices();
        const deviceId = devices?.[0]?.deviceId;
        controls = await codeReader.decodeFromVideoDevice(
          deviceId,
          videoRef.current,
          (result, err) => {
            if (result && isMounted) {
              const text = result.getText();
              setCode(text);
            }
          }
        );
      } catch (e) {
        console.error("Không thể mở camera:", e);
        setError("Không thể truy cập camera, hãy kiểm tra quyền truy cập.");
      }
    })();

    return () => {
      isMounted = false;
      controls?.stop();
    };
  }, []);

  // B2: Khi quét được mã → gọi API backend
  useEffect(() => {
    if (!code) return;
    const fetchBook = async () => {
      try {
        setError("");
        const res = await axios.get(`${API}/api/scan/resolve/${code}`);
        setBook(res.data);
      } catch (err) {
        setError("Không tìm thấy mã này hoặc lỗi kết nối backend.");
        setBook(null);
      }
    };
    fetchBook();
  }, [code]);

  return (
    <div className="p-6 flex flex-col items-center min-h-screen bg-gray-50">
      <h1 className="text-2xl font-bold text-[#062D76] mb-4">
        📷 Quét mã sách
      </h1>

      <video
        ref={videoRef}
        className="w-full max-w-md rounded-lg shadow-md border border-gray-300"
        autoPlay
        muted
        playsInline
      />

      <p className="mt-4 text-gray-600">
        {code ? `Đã quét được mã: ${code}` : "Đưa mã vào trước camera..."}
      </p>

      {error && <p className="text-red-500 mt-2">{error}</p>}

      {book && (
        <div className="mt-6 bg-white shadow-lg rounded-xl p-4 w-full max-w-md">
          <h2 className="text-lg font-semibold text-[#062D76]">
            {book.book.tenSach}
          </h2>
          <p>Tác giả: {book.book.tenTacGia}</p>
          <p>NXB: {book.book.nxb}</p>
          <p>Trạng thái: {book.status}</p>
          <button
            onClick={() => handleBorrow(code)}
            className="mt-4 px-4 py-2 bg-[#062D76] text-white rounded hover:bg-blue-700"
          >
            Mượn sách
          </button>
          <button
            onClick={() => handleReturn(code)}
            className="mt-4 ml-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Trả sách
          </button>
        </div>
      )}
    </div>
  );
}

// --- Gửi yêu cầu mượn ---
async function handleBorrow(barcode) {
  const userId = localStorage.getItem("id"); // hoặc persist:root
  const API = process.env.NEXT_PUBLIC_API_URL;

  try {
    await axios.post(`${API}/api/borrow-cards/scan-borrow`, {
      userId,
      barcode,
      dueDate: new Date(new Date().setDate(new Date().getDate() + 14)).toISOString(),
    });
    alert("Đã mượn thành công!");
  } catch (err) {
    alert("Lỗi khi mượn sách: " + err.message);
  }
}

// --- Gửi yêu cầu trả ---
async function handleReturn(barcode) {
  const API = process.env.NEXT_PUBLIC_API_URL;
  try {
    await axios.post(`${API}/api/borrow-cards/scan-return`, { barcode });
    alert("Đã trả sách!");
  } catch (err) {
    alert("Lỗi khi trả sách: " + err.message);
  }
}
