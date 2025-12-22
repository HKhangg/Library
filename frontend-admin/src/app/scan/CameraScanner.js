"use client";
import React, { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { X } from "lucide-react";

const CameraScanner = ({ onScanSuccess, scanType, isOpen, onClose }) => {
  const html5QrCodeRef = useRef(null);
  const isScanning = useRef(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) {
      // Dọn dẹp khi modal đóng
      if (html5QrCodeRef.current && isScanning.current) {
        html5QrCodeRef.current
          .stop()
          .then(() => {
            console.log("Camera stopped");
            isScanning.current = false;
            html5QrCodeRef.current = null;
          })
          .catch((err) => {
            console.error("Error stopping camera:", err);
          });
      }
      setError("");
      return;
    }

    // Khởi động camera khi modal mở
    const startScanning = async () => {
      try {
        if (isScanning.current) {
          console.log("Already scanning");
          return;
        }

        const html5QrCode = new Html5Qrcode("qr-reader");
        html5QrCodeRef.current = html5QrCode;

        const qrCodeSuccessCallback = (decodedText, decodedResult) => {
          console.log(`Scan result: ${decodedText}`, decodedResult);
          
          // Dừng camera
          html5QrCode
            .stop()
            .then(() => {
              console.log("Camera stopped after successful scan");
              isScanning.current = false;
              onScanSuccess(decodedText);
            })
            .catch((err) => {
              console.error("Error stopping camera:", err);
            });
        };

        const qrCodeErrorCallback = (errorMessage) => {
          // Không log error liên tục khi đang quét
        };

        const config = {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        };

        await html5QrCode.start(
          { facingMode: "environment" },
          config,
          qrCodeSuccessCallback,
          qrCodeErrorCallback
        );

        isScanning.current = true;
        console.log("Camera started successfully");
        setError("");
      } catch (err) {
        console.error("Error starting camera:", err);
        setError("Không thể truy cập camera. Vui lòng kiểm tra quyền truy cập camera.");
      }
    };

    startScanning();

    // Cleanup khi unmount
    return () => {
      if (html5QrCodeRef.current && isScanning.current) {
        html5QrCodeRef.current
          .stop()
          .then(() => {
            console.log("Camera stopped on cleanup");
            isScanning.current = false;
          })
          .catch((err) => {
            console.error("Error stopping camera on cleanup:", err);
          });
      }
    };
  }, [isOpen, onScanSuccess]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
      <div className="relative bg-white rounded-lg shadow-2xl p-8 w-full max-w-2xl mx-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-[#062D76]">
            {scanType === "qrcode" ? "Quét mã QR người dùng" : "Quét Barcode sách"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Đóng"
          >
            <X size={28} className="text-gray-600" />
          </button>
        </div>

        {/* Camera preview area */}
        <div className="mb-6 rounded-lg overflow-hidden border-4 border-[#062D76]">
          <div id="qr-reader" className="w-full min-h-[400px]"></div>
        </div>

        {/* Error display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-lg">
            <p className="text-base text-red-600 font-medium">{error}</p>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 rounded-lg p-5 border-2 border-blue-200">
          <p className="text-base font-bold text-[#062D76] mb-3">
            Hướng dẫn:
          </p>
          <ul className="text-base text-gray-700 space-y-2">
            <li>• Hướng camera vào {scanType === "qrcode" ? "mã QR" : "barcode"}</li>
            <li>• Giữ thiết bị ổn định</li>
            <li>• Đảm bảo đủ ánh sáng</li>
            <li>• Camera sẽ tự động quét và đóng</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CameraScanner;
