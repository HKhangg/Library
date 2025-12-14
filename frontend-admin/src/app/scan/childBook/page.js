"use client";
import React, { useState } from "react";
import { Button } from "@/app/components/ui/button"; // Đảm bảo đường dẫn import đúng
import { ThreeDot } from "react-loading-indicators";
import toast from "react-hot-toast";

const UploadChild = ({ resultChild, setResultChild }) => {
  const [selectedFile, setSelectedFile] = useState(null);

  // 7. Rename loading -> isUploading / isSearching
  const [isUploading, setIsUploading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const [text, setText] = useState("");

  // Hàm xử lý khi người dùng chọn ảnh
  const onFileChange = (event) => {
    const file = event.target.files[0];
    // 6. File type validation
    if (file && !file.type.startsWith("image/")) {
      toast.error("Vui lòng chỉ chọn file ảnh (JPG, PNG...)");
      return;
    }
    setSelectedFile(file);
  };

  // Hàm gửi ảnh lên backend
  const handleUpload = async () => {
    // 4. Add validation
    if (!selectedFile) {
      toast.error("Vui lòng chọn ảnh trước khi tải lên.");
      return;
    }

    setIsUploading(true);
    // 3. Replace alert -> toast
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

      // 5. Improve error messages
      if (!result || result.error) {
        throw new Error(result.error || "Không nhận diện được sách");
      }

      // 2. Remove useEffect - Gọi trực tiếp
      setResultChild(result);
      toast.success("Quét mã thành công!", { id: toastId });

    } catch (error) {
      console.error("Lỗi upload:", error);
      toast.error(error.message || "Lỗi khi xử lý ảnh", { id: toastId });
    } finally {
      setIsUploading(false);
    }
  };

  // Hàm xử lý nhập tay
  const handleEnter = async () => {
    // 4. Add validation
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

      // 2. Remove useEffect - Gọi trực tiếp
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

  // State loading chung để hiển thị UI
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
        <>
          {/* Nếu đã có kết quả trả về, hiển thị thông báo nhỏ (Optional) */}
          {resultChild && (
            <div className="p-2 bg-green-100 text-green-700 rounded mb-2 w-full text-center text-sm">
              Đang chọn sách ID: <strong>{resultChild.id}</strong>
            </div>
          )}

          <div className="flex flex-col w-full items-center gap-4">
            {/* Cách 1: Nhập tay */}
            <div className="w-full">
              <p className="text-sm font-semibold text-[#062D76] mb-2">Nhập mã sách thủ công</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="VD: 12345"
                  className="flex-1 p-2 border rounded-md outline-none focus:border-[#062D76] text-sm"
                  onKeyDown={(e) => e.key === "Enter" && handleEnter()}
                />
                <Button onClick={handleEnter} className="bg-[#062D76] h-auto">Tìm</Button>
              </div>
            </div>

            <div className="relative flex py-1 items-center w-full">
              <div className="flex-grow border-t border-gray-300"></div>
              <span className="flex-shrink-0 mx-4 text-gray-400 text-xs">HOẶC</span>
              <div className="flex-grow border-t border-gray-300"></div>
            </div>

            {/* Cách 2: Upload ảnh */}
            <div className="w-full">
              <p className="text-sm font-semibold text-[#062D76] mb-2">Quét Barcode</p>
              <div className="flex flex-col gap-2">
                <input
                  type="file"
                  onChange={onFileChange}
                  accept="image/*"
                  className="block w-full text-sm text-gray-500
                                file:mr-4 file:py-2 file:px-4
                                file:rounded-full file:border-0
                                file:text-xs file:font-semibold
                                file:bg-blue-50 file:text-[#062D76]
                                hover:file:bg-blue-100 cursor-pointer"
                />
                <Button
                  onClick={handleUpload}
                  className="w-full mt-2 bg-[#062D76]"
                  disabled={!selectedFile}
                >
                  Tải ảnh lên & Quét
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default UploadChild;