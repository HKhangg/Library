"use client";
import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

const UserQRCode = ({ user }) => {
  if (!user) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    const svg = document.getElementById('user-qr-code');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL('image/png');

      const downloadLink = document.createElement('a');
      downloadLink.download = `QR_${user.id}_${user.fullname}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  return (
    <div className="flex flex-col items-center gap-3 p-6 bg-white rounded-lg shadow-lg border border-gray-200">
      {/* QR Code */}
      <div className="p-4 bg-white rounded border-2 border-gray-300">
        <QRCodeSVG
          id="user-qr-code"
          value={user.id.toString()}
          size={200}
          level="H"
          includeMargin={true}
        />
      </div>

      {/* Thông tin người dùng */}
      <div className="text-center">
        <p className="font-bold text-xl text-gray-800">{user.fullname}</p>
        <p className="text-sm text-gray-600">ID: {user.id}</p>
        <p className="text-xs text-gray-500">{user.email}</p>
      </div>

      {/* Nút actions */}
      <div className="flex gap-2 mt-2">
        <button
          onClick={handlePrint}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-sm font-medium"
        >
          🖨️ In QR Code
        </button>
        <button
          onClick={handleDownload}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition text-sm font-medium"
        >
          💾 Tải xuống
        </button>
      </div>

      {/* Print styles */}
      <style jsx>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-area,
          .print-area * {
            visibility: visible;
          }
          .print-area {
            position: absolute;
            left: 0;
            top: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default UserQRCode;
