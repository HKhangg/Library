"use client";
import React, { useEffect, useState } from "react";
import { Button } from "../../components/ui/button";
import { ThreeDot } from "react-loading-indicators";
import toast from "react-hot-toast";

const UploadChild = ({ resultChild, setResultChild }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [text, setText] = useState("");
  // Hàm xử lý khi người dùng chọn ảnh
  const onFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  // Hàm gửi ảnh lên backend
  const handleUpload = async () => {
    if (!selectedFile) {
      alert("Vui lòng chọn ảnh trước khi tải lên.");
      return;
    }
    setLoading(true);
    const formData = new FormData();
    formData.append("file", selectedFile); // Đảm bảo rằng 'file' là tên trường mà backend mong đợi
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
        throw new Error("Đã có lỗi xảy ra khi tải ảnh lên.");
      }

      const result = await response.json();
      setResult(result);
    } catch (error) {
      console.error("Lỗi khi gửi ảnh:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (result) {
      setResultChild(result);
    }
  }, [result]);

  const handleEnter = async () => {
    if (text == "") {
      alert("Vui lòng nhập mã trước khi tìm kiếm");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/bookchild/${text}`,
        {
          method: "GET",
        }
      );

      if (!response.ok) {
        window.alert("Không tìm thấy sách");
        setLoading(false);
        return;
      }
      const result = await response.json();
      setResult(result);
      setText("");
    } catch (e) {
      console.log(e);
    }
    setLoading(false);
  };
  return (
    <div className="flex w-full flex-col gap-2 items-center">
      {loading ? (
        <div className="flex md:ml-52 w-full h-screen justify-center items-center">
          <ThreeDot
            color="#062D76"
            size="large"
            text="Vui lòng chờ"
            variant="bounce"
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
          <p className="text-2xl font-semibold mt-10">Hoặc</p>
          <p className="text-xl font-semibold ">Tải ảnh barcode mã sách</p>
          <div className="flex gap-0">
            <input type="file" onChange={onFileChange} />
            <Button onClick={handleUpload}>Tải ảnh lên</Button>
          </div>
        </div>
      )}
      {/*
        <div className="flex flex-col w-full h-full min-h-screen items-center h-[10px] py-6 gap-5 bg-[#EFF3FB]">
          <div className="flex flex-col bg-white w-1/2 rounded-lg mt-2 drop-shadow-lg p-5 gap-10 items-center">
            <h1>ID Sách:&nbsp;{result?.childBook?.id}</h1>
            <div className="flex space-x-20 items-center">
              <img
                src={`${result?.parentBook?.hinhAnh[0]}`}
                className="w-[145px] h-[205px] rounded"
              />
              <div className="flex flex-col gap-[10px] w-full">
                <p className="font-bold">
                  Tên sách:&nbsp;{result?.parentBook?.tenSach}
                </p>
                <p className="">
                  Tên tác giả:&nbsp;{result?.parentBook?.tenTacGia}
                </p>
                <p className="">Nhà xuất bản:&nbsp;{result?.parentBook?.nxb}</p>
                <p className="">Năm xuất bản:&nbsp;{result?.parentBook?.nam}</p>
                <p className="">
                  Còn sẵn:&nbsp;
                  {result?.parentBook?.tongSoLuong -
                    result?.parentBook?.soLuongMuon -
                    result?.parentBook?.soLuongXoa}
                </p>
              </div>
            </div>
            <div className="flex space-x-10 items-center w-2/3 items-center justify-center">
                <div className="flex flex-col gap-[10px] w-full">
                <p className="">Thể loại chính:&nbsp;{result?.parentBook?.tenTheLoaiCha}</p>
                <p className="">Thể loại phụ:&nbsp;{result?.parentBook?.tenTheLoaiCon}</p>
                </div>
                <div className="flex flex-col gap-[10px] w-full">
                <p className="">Vị trí:&nbsp;{result?.parentBook?.viTri}</p>
                </div>
            </div>
          </div>
        </div>
      )
      */}
    </div>
  );
};

export default UploadChild;
