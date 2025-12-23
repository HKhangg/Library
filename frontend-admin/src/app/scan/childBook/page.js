"use client";
import React, { useState } from "react";
import { Button } from "@/app/components/ui/button";
import { ThreeDot } from "react-loading-indicators";
import toast from "react-hot-toast";
import { Scan } from "lucide-react";

const UploadChild = ({ resultChild, setResultChild, onOpenBarcodeScanner }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [text, setText] = useState("");

  const onFileChange = (event) => {
    const file = event.target.files[0];
    if (file && !file.type.startsWith("image/")) {
      toast.error("Vui lòng chỉ chọn file ảnh (JPG, PNG...)");
      return;
    }
    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("Vui lòng chọn ảnh trước khi tải lên.");
      return;
    }

    setIsUploading(true);
    const toastId = toast.loading("Đang xử lý ảnh...");

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("type", "book");

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/upload/barcodeImage`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error("Không thể đọc mã vạch từ ảnh.");
      }

      const result = await response.json();

      if (!result || result.error) {
        throw new Error(result.error || "Không nhận diện được sách");
      }

      setResultChild(result);
      toast.success("Quét mã thành công!", { id: toastId });

    } catch (error) {
      console.error("Lỗi upload:", error);
      toast.error(error.message || "Lỗi khi xử lý ảnh", { id: toastId });
    } finally {
      setIsUploading(false);
    }
  };

  const handleEnter = async () => {
    if (!text.trim()) {
      toast.error("Vui lòng nhập mã sách.");
      return;
    }

    setIsSearching(true);
    const toastId = toast.loading("Đang tìm kiếm...");

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/bookchild/${text.trim()}`,
        { method: "GET" }
      );

      if (!response.ok) {
        if (response.status === 404) throw new Error("Không tìm thấy sách với mã này");
        throw new Error("Lỗi kết nối server");
      }

      const result = await response.json();

      setResultChild(result);
      toast.success("Đã tìm thấy sách!", { id: toastId });
      setText("");

    } catch (e) {
      console.error(e);
      toast.error(e.message, { id: toastId });
    } finally {
      setIsSearching(false);
    }
  };

  const isLoading = isUploading || isSearching;

  return (
    <div className="flex w-full flex-col gap-4 items-center p-4 bg-gray-50 rounded-lg border border-dashed border-gray-300">
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-10">
          <ThreeDot
            color="#062D76"
            size="medium"
            text={isUploading ? "Đang quét ảnh..." : "Đang tìm kiếm..."}
            textColor="#062D76"
          />
        </div>
      ) : (
        <div className="flex flex-col w-full justify-center items-center h-[10px] mb-10 gap-5 px-10 py-6 ">
          <p className="text-xl font-semibold ">Vui lòng nhập mã sách</p>
          <div className="flex flex-col w-full items-center justify-center gap-1">
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Nhập ID sách"
              className="bg-white rounded w-fit border-1"
              onKeyDown={(e) => e.key === "Enter" && handleEnter()}
            />
            <p className="text-sm italic text-[#062D76]">
              Nhập Enter để tiến hành tìm kiếm
            </p>
          </div>

          <p className="text-2xl font-semibold mt-6">Hoặc</p>

          {onOpenBarcodeScanner && (
            <button
              onClick={onOpenBarcodeScanner}
              className="flex items-center gap-2 px-6 py-3 bg-[#062D76] text-white rounded-lg hover:bg-[#04204F] transition-colors shadow-md"
            >
              <Scan size={24} />
              <span className="font-semibold">Quét barcode sách</span>
            </button>
          )}

          <p className="text-2xl font-semibold mt-6">Hoặc</p>
          <p className="text-xl font-semibold ">Tải ảnh barcode mã sách</p>
          <div className="flex gap-0">
            <input type="file" onChange={onFileChange} />
            <Button onClick={handleUpload}>Tải ảnh lên</Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadChild;