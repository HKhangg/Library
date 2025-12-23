"use client";

import React, { useEffect, useState, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Download, Printer, User } from "lucide-react";

const UserQRCodePage = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const qrRef = useRef(null);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const userId = localStorage.getItem("id");

      if (!token || !userId) {
        window.location.href = "/user-login";
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/user/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch user data");

      const data = await response.json();
      console.log("User data:", data); // Debug log
      setUser(data);
    } catch (error) {
      console.error("Error fetching user data:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadQR = () => {
    if (!qrRef.current) return;

    const svg = qrRef.current.querySelector("svg");
    if (!svg) return;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const svgData = new XMLSerializer().serializeToString(svg);
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);

      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `qr-code-${user?.username || "user"}.png`;
        a.click();
        URL.revokeObjectURL(url);
      });
    };

    img.src =
      "data:image/svg+xml;base64," +
      btoa(unescape(encodeURIComponent(svgData)));
  };

  const handlePrintQR = () => {
    if (!qrRef.current) return;

    const printWindow = window.open("", "_blank");
    const qrHTML = qrRef.current.innerHTML;

    printWindow.document.write(`
      <html>
        <head>
          <title>QR Code - ${user?.fullname || "User"}</title>
          <style>
            body {
              margin: 0;
              padding: 40px;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              font-family: Arial, sans-serif;
            }
            .qr-container {
              border: 2px solid #333;
              padding: 20px;
              border-radius: 8px;
              text-align: center;
            }
            h2 { margin: 10px 0; color: #062D76; }
            p { margin: 5px 0; color: #666; }
            @media print {
              body { padding: 20px; }
            }
          </style>
        </head>
        <body>
          <div class="qr-container">
            <h2>${user?.fullname || "User"}</h2>
            <p>ID: ${user?.id || ""}</p>
            <p>Email: ${user?.email || ""}</p>
            <div style="margin: 20px 0;">
              ${qrHTML}
            </div>
            <p style="font-size: 12px; color: #999;">Thư viện - QR Code cá nhân</p>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#062D76] mx-auto"></div>
            <p className="mt-4 text-gray-600">Đang tải...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center">
            <p className="text-red-500">Không thể tải thông tin người dùng</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-8" style={{ margin: '0 -180px 0 0' }}>
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              {user.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.fullname}
                  className="w-24 h-24 rounded-full object-cover border-4 border-[#062D76]"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-[#062D76] flex items-center justify-center">
                  <User className="w-12 h-12 text-white" />
                </div>
              )}
            </div>
            <h1 className="text-3xl font-bold text-[#062D76] mb-2">
              Mã QR của bạn
            </h1>
            <p className="text-gray-600">
              Sử dụng mã này để mượn/trả sách tại thư viện
            </p>
          </div>

          {/* User Info */}
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Thông tin cá nhân
            </h2>
            <div className="space-y-2 text-gray-700">
              <p>
                <strong>Họ tên:</strong> {user.fullname}
              </p>
              <p>
                <strong>Email:</strong> {user.email}
              </p>
              <p>
                <strong>ID:</strong> {user.id}
              </p>
              <p>
                <strong>Username:</strong> {user.username}
              </p>
            </div>
          </div>

          {/* QR Code */}
          <div className="flex flex-col items-center">
            <div
              ref={qrRef}
              className="bg-white p-6 rounded-lg border-2 border-gray-200"
            >
              <QRCodeSVG
                value={user.id.toString()}
                size={250}
                level="H"
                includeMargin={true}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 mt-6">
              <button
                onClick={handleDownloadQR}
                className="flex items-center gap-2 px-6 py-3 bg-[#062D76] text-white rounded-lg hover:bg-[#051f4d] transition-colors"
              >
                <Download className="w-5 h-5" />
                Tải xuống
              </button>
              <button
                onClick={handlePrintQR}
                className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Printer className="w-5 h-5" />
                In mã QR
              </button>
            </div>
          </div>

          {/* Instructions */}
          <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-blue-900 mb-2">
              Hướng dẫn sử dụng:
            </h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Xuất trình mã QR này cho thủ thư khi mượn sách</li>
              <li>• Mã QR sẽ được quét để xác nhận danh tính của bạn</li>
              <li>• Bạn có thể tải về hoặc in mã QR để tiện sử dụng</li>
              <li>• Không chia sẻ mã QR này với người khác</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserQRCodePage;
