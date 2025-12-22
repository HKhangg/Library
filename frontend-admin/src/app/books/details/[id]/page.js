"use client";

import React, { useEffect, useState, useRef } from "react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { useParams } from "next/navigation";
import { CalendarClock, Check, Search, X, Download, Printer } from "lucide-react";
import { ThreeDot } from "react-loading-indicators";
import toast, { Toaster } from "react-hot-toast";
import Barcode from "react-barcode";

import Sidebar from "@/app/components/sidebar/Sidebar";
import axios from "axios";
const Page = () => {
  const { id } = useParams();
  const [book, setBook] = useState(null);
  const [childBookList, setChildBookList] = useState([]);
  const [filterBooks, setFilterBooks] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const resBook = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/book/${id}`
        );
        if (!resBook.ok) throw new Error(`Lỗi khi lấy sách: ${resBook.status}`);
        const data = await resBook.json();
        setBook(data);

        const resChild = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/bookchild/book/${id}`
        );
        if (!resChild.ok)
          throw new Error(`Lỗi khi lấy sách con: ${resChild.status}`);
        const children = await resChild.json();
        setChildBookList(children);
      } catch (error) {
        console.error(error);
        window.alert(error.message || "Lỗi khi tải dữ liệu");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);
  const handleAddChild = async () => {
    setActionLoading(true);
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/bookchild/book/${id}/add`
      );
      const newChildBook = response.data;

      window.alert("Đã tạo sách con mới");

      setChildBookList((prev) => [
        ...prev,
        {
          id: newChildBook.id,
          barcode: newChildBook.barcode,
          status: "AVAILABLE",
        },
      ]);
    } catch (error) {
      console.error(error);
      window.alert("Không thể thêm sách con");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteChild = async (childId) => {
    setActionLoading(true);
    try {
      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL}/api/bookchild/${childId}`
      );
      toast.success("Xóa sách con thành công");
      setChildBookList((prev) =>
        prev.map((child) =>
          child.id === childId ? { ...child, status: "NOT_AVAILABLE" } : child
        )
      );
    } catch {
      toast.error("Xóa thất bại");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      const result = childBookList.filter(
        (cb) => cb.id.toString() === searchQuery.trim() || cb.barcode === searchQuery.trim()
      );
      if (result.length === 0) toast.error("Không tìm thấy kết quả");
      setFilterBooks(result);
    } else {
      setFilterBooks([]);
    }
  };

  const borrowedCount = childBookList.filter(
    (cb) => cb.status === "BORROWED"
  ).length;
  const availableCount = book ? book.tongSoLuong - borrowedCount : 0;

  const BookCard = ({ book }) => (
    <div className="flex bg-white w-full rounded-lg shadow-lg p-6 gap-8">
      <img
        src={book.hinhAnh?.[0] || "/placeholder.png"}
        className="w-64 h-96 object-cover rounded-md"
      />
      <div className="flex flex-col gap-3 flex-1 text-sm md:text-base">
        <p>
          <strong>ID:</strong> {book.maSach}
        </p>
        <p>
          <strong>Tên sách:</strong> {book.tenSach}
        </p>
        {/* <p><strong>Mô tả:</strong> {book.moTa}</p>*/}
        <p>
          <strong>Tác giả:</strong> {book.tenTacGia}
        </p>
        <p>
          <strong>Nhà xuất bản:</strong> {book.nxb}
        </p>
        <p>
          <strong>Năm xuất bản:</strong> {book.nam}
        </p>
        <p>
          <strong>Tổng số lượng:</strong> {book.tongSoLuong}
        </p>
        <p>
          <strong>Còn sẵn:</strong> {availableCount}
        </p>
        <p>
          <strong>Thể loại chính:</strong> {book.categoryParentName}
        </p>
        <p>
          <strong>Thể loại phụ:</strong> {book.categoryChildName}
        </p>
        <p>
          <strong>Đã mượn:</strong> {book.soLuongMuon}
        </p>
        <p>
          <strong>Đã xóa:</strong> {book.soLuongXoa}
        </p>
      </div>
    </div>
  );

  const ChildBookCard = ({ book }) => {
    const barcodeRef = useRef(null);

    const handleDownloadBarcode = () => {
      if (!barcodeRef.current) return;
      const svg = barcodeRef.current.querySelector("svg");
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
          a.download = `barcode-${book.barcode}.png`;
          a.click();
          URL.revokeObjectURL(url);
        });
      };
      
      img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
    };

    const handlePrintBarcode = () => {
      if (!barcodeRef.current) return;
      const printWindow = window.open("", "_blank");
      const barcodeHTML = barcodeRef.current.innerHTML;
      
      printWindow.document.write(`
        <html>
          <head>
            <title>Print Barcode - ${book.barcode}</title>
            <style>
              body { margin: 0; padding: 20px; display: flex; justify-content: center; align-items: center; height: 100vh; }
              @media print { body { margin: 0; padding: 10px; } }
            </style>
          </head>
          <body>${barcodeHTML}</body>
        </html>
      `);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    };

    return (
      <div className="flex flex-col bg-white rounded-lg shadow p-4 gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-medium text-sm">
            <span>ID: {book.id}</span>
            {book.status === "AVAILABLE" && (
              <Check className="w-5 h-5 text-green-500" />
            )}
            {book.status === "BORROWED" && (
              <CalendarClock className="w-5 h-5 text-yellow-500" />
            )}
            {book.status === "NOT_AVAILABLE" && (
              <X className="w-5 h-5 text-red-500" />
            )}
          </div>
          <Button
            disabled={actionLoading}
            onClick={() => handleDeleteChild(book.id)}
            size="sm"
            variant="destructive"
          >
            Xóa
          </Button>
        </div>
        
        {book.barcode && (
          <div className="flex flex-col gap-2 border-t pt-3">
            <div ref={barcodeRef} className="flex justify-center">
              <Barcode value={book.barcode} width={1.5} height={50} fontSize={12} />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleDownloadBarcode}
                size="sm"
                variant="outline"
                className="flex-1 text-xs"
              >
                <Download className="w-3 h-3 mr-1" />
                Tải về
              </Button>
              <Button
                onClick={handlePrintBarcode}
                size="sm"
                variant="outline"
                className="flex-1 text-xs"
              >
                <Printer className="w-3 h-3 mr-1" />
                In
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (loading)
    return (
      <div className="flex">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center min-h-screen">
          <ThreeDot color="#062D76" size="large" text="Đang tải..." />
        </div>
      </div>
    );

  return (
    <div className="flex flex-row w-full min-h-screen bg-[#EFF3FB]">
      <Sidebar />
      <div className="flex-1 p-6 md:ml-52">
        <div className="flex mb-6">
          <Input
            placeholder="Tìm kiếm sách con theo ID hoặc Barcode"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 h-10 px-4 rounded-lg"
          />
          <Button
            onClick={handleSearch}
            className="ml-4 w-12 h-10 bg-[#062D76] hover:bg-gray-700"
          >
            <Search className="w-6 h-6 text-white" />
          </Button>
        </div>
        {/* Book details */}
        {book && <BookCard book={book} />}
        <div className="mt-6"></div>
        {/* Child books grid */}
        <div className="grid grid-cols-4 gap-4 mt-8">
          {(filterBooks.length ? filterBooks : childBookList).map((cb) => (
            <ChildBookCard key={cb.id} book={cb} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Page;
