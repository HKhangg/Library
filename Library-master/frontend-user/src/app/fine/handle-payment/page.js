"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";

function PaymentResultPopup({ title, content, videoSrc, onClose }) {
  return (
    <div
      className="fixed inset-0 bg-black/40 bg-opacity-50 flex items-center justify-center mt-10"
      onClick={onClose}
    >
      <div
        className="bg-white p-6 rounded-2xl shadow-2xl max-w-sm text-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Video animation */}
        <video
          src={videoSrc}
          autoPlay
          muted
          loop
          playsInline
          className="object-fill w-40 h-40 mx-auto"
        />
        {/* Tiêu đề */}
        <h2 className="text-2xl font-bold mb-2">{title}</h2>
        {/* Nội dung */}
        <p>{content}</p>

        <button
          onClick={onClose}
          className="mt-6 px-5 py-2 bg-gradient-to-r from-[#8CFDFE] to-blue-400  text-[#131313] rounded-2xl cursor-pointer"
        >
          Đóng
        </button>
      </div>
    </div>
  );
}

export default function PaymentCallback() {
  const [showPopup, setShowPopup] = useState(false);
  const [popupTitle, setPopupTitle] = useState("");
  const [popupContent, setPopupContent] = useState("");
  const [videoSrc, setVideoSrc] = useState("/success.mp4"); // mặc định success

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const resultCode = params.get("resultCode");
    const orderId = params.get("orderId");
    const amount = params.get("amount");

    if (resultCode === "0") {
      axios
        .post(
          `${process.env.NEXT_PUBLIC_API_URL}/api/fine/payment/confirm`,
          { orderId, amount },
          { withCredentials: true }
        )
        .then(() => {
          setPopupTitle("Thanh toán thành công!");
          setPopupContent("Phiếu phạt của bạn đã được thanh toán.");
          setVideoSrc("/success.mp4");
          setShowPopup(true);
        })
        .catch((error) => {
          setPopupTitle("Lỗi xác nhận thanh toán");
          if (error.response?.data) {
            setPopupContent(error.response.data);
          } else {
            setPopupContent("Lỗi kết nối server khi xác nhận thanh toán.");
          }
          setVideoSrc("/fail.mp4");
          setShowPopup(true);
        });
    } else {
      setPopupTitle("Thanh toán thất bại!");
      setPopupContent("Thanh toán thất bại hoặc bị hủy. Vui lòng thử lại!");
      setVideoSrc("/fail.mp4");
      setShowPopup(true);
    }
  }, []);

  const handleClosePopup = () => {
    setShowPopup(false);
    window.location.href = "/fine";
  };

  return (
    <>
      {showPopup && (
        <PaymentResultPopup
          title={popupTitle}
          content={popupContent}
          videoSrc={videoSrc}
          onClose={handleClosePopup}
        />
      )}
      {!showPopup && (
        <div className="flex items-center justify-center h-screen">
          Đang xử lý, vui lòng đợi...
        </div>
      )}
    </>
  );
}
