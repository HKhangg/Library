"use client";
import React, { useEffect, useRef, useState } from "react";
import { Button } from "../../components/ui/button";
import { ThreeDot } from "react-loading-indicators";
import toast from "react-hot-toast";
import { Camera, FolderSearch, Upload } from "lucide-react";

const UploadChild = ({resultChild, setResultChild}) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [text, setText] = useState("")
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
        "http://localhost:8080/api/upload/barcodeImage",
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

  useEffect(()=>{
    if(result){
      setResultChild(result)
    }
  },[result])

  const handleEnter = async() =>{
    if(text==""){
      alert("Vui lòng nhập mã trước khi tìm kiếm");
      return;
    }
    setLoading(true);
    try{
      const response = await fetch(
        `http://localhost:8080/api/bookchild/${text}`,
        {
          method: "GET",
        }
      );
      if (!response.ok) {
        toast.error("Không tìm thấy sách") 
        setLoading(false);       
        return;
      }  
      const result = await response.json();
      console.log("oke", result)
      setResult(result);
      setText("")
    }
    catch(e){
      console.log(e)
    }
    setLoading(false);
  }
  //gửi ảnh vừa chụp lên backend
  const handleMessage = async (event) => {
    if (event.origin !== window.origin) return;
    if (event.data.type === "captured-image") {
      const base64 = event.data.image;
      const file = base64ToFile(base64, "captured.png");

      setLoading(true);
      const formData = new FormData();
      formData.append("file", file); // Đảm bảo rằng 'file' là tên trường mà backend mong đợi
      formData.append("type", "user");

      try {
        const response = await fetch(
          `http://localhost:8080/api/bookchild/${text}`,
          {
            method: "GET",
          }
        );
        if (!response.ok) {
          toast.error("Không tìm thấy sách") 
          setLoading(false);       
          return;
        }  
        const result = await response.json();
        setResult(result);
        setText("")
      } catch (error) {
        console.error("Lỗi khi gửi ảnh:", error);
      }
      setLoading(false);
    }
  };
  useEffect(()=>{
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  },[])
  const base64ToFile = (base64, filename) => {
    const arr = base64.split(",");
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) u8arr[n] = bstr.charCodeAt(n);
    return new File([u8arr], filename, { type: mime });
  };
  const openCamera = () => {
    const width = 800;
    const height = 600;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    window.open("/scan/camera", "_blank", `width=${width},height=${height},left=${left},top=${top}`);
  };
  const inputRef = useRef(null);

  const handleClick = () => {
    inputRef.current?.click(); // bấm nút sẽ trigger input file ẩn
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
            <input type="text" value={text} onChange={(e)=>setText(e.target.value)} 
            placeholder="Nhập ID sách"
            className="bg-white rounded w-80 h-10 border-1"
            onKeyDown={(e) => e.key === "Enter" && handleEnter()}
            />
            <p className="text-sm italic text-[#062D76]">Nhập Enter để tiến hành tìm kiếm</p>
          </div>
          <p className="text-2xl font-semibold ">Hoặc</p>
          <p className="text-xl font-semibold ">Tải ảnh barcode mã sách</p>
          <div className="flex gap-5">
            <input type="file" onChange={onFileChange} className="bg-white self-center rounded hidden" ref={inputRef}/>
            {/* Nút chọn file */}
            <Button onClick={handleClick} className="bg-white text-black border border-gray-300 hover:bg-gray-100" >
              <FolderSearch className="w-12 h-12"/>
              Chọn ảnh
            </Button>
            {/* Hiển thị tên file đã chọn */}
            {selectedFile && (<div className="text-sm self-center text-gray-600 italic max-w-40 truncate">{selectedFile.name}</div>)}
            <Button className="bg-[#062D76]" onClick={handleUpload}>
              <Upload className="w-12 h-12" color="white"/>
              Tải ảnh lên
            </Button>
          </div>
          <div className="flex gap-5">
            <Button className="bg-[#062D76]" onClick={openCamera}>
              <Camera className="w-12 h-12" color="white"/>
              Chụp ảnh mới
            </Button>
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
