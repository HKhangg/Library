"use client";
import Sidebar from "@/app/components/sidebar/Sidebar";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { ArrowUpFromLine, ChevronDown, CircleCheck, Undo2 } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useRef, useState, useMemo } from "react";
import toast, { Toaster } from "react-hot-toast";
import { ThreeDot } from "react-loading-indicators";
import axios from "axios";

import useSWR from "swr";
import { fetcher } from "@/lib/fetcher"; 

function Page() {
  const router = useRouter();

  const [bookname, setBookname] = useState("");
  const [author, setAuthor] = useState("");
  const [publisher, setPublisher] = useState("");
  const [year, setYear] = useState("");
  const [quantity, setQuantity] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(""); // Tên thể loại chính
  const [category2, setCategory2] = useState(""); // Tên thể loại phụ
  const [weight, setWeight] = useState("");
  const [price, setPrice] = useState("");

  // Refs & Images
  const fileInputRef = useRef(null);
  const fileInputRef1 = useRef(null);
  const fileInputRef2 = useRef(null);
  const fileInputRef3 = useRef(null);
  const [image, setImage] = useState([
    { filePreview: null, selectedFile: null },
    { filePreview: null, selectedFile: null },
    { filePreview: null, selectedFile: null },
    { filePreview: null, selectedFile: null },
  ]);

  // Dropdown UI State
  const [isCateListOpen, setIsCateListOpen] = useState(false);
  const [isCateList2Open, setIsCateList2Open] = useState(false);

  // 2. useSWR: Lấy danh sách danh mục (Thay thế useEffect cũ)
  const { data: totalCate = [], isLoading: loadingCategories } = useSWR(
    `${process.env.NEXT_PUBLIC_API_URL}/api/category`,
    fetcher,
    {
      revalidateOnFocus: false, // Danh mục ít thay đổi
      dedupingInterval: 60000,
    }
  );

  // 3. Derived State: Tạo danh sách tên thể loại chính
  const cateList = useMemo(() => totalCate.map((item) => item.name), [totalCate]);

  // 4. Derived State: Tự động lọc danh sách thể loại phụ (Thay thế useEffect cũ)
  const cate2List = useMemo(() => {
    if (!category) return [];
    const selectedCate = totalCate.find((cate) => cate.name === category);
    if (selectedCate && selectedCate.children) {
      return selectedCate.children.map((child) => child.name);
    }
    return [];
  }, [category, totalCate]);

  const handleGoBack = () => {
    router.back();
  };

  const handleFileChange = (number, event) => {
    const file = event.target.files[0];
    if (file) {
      setImage((prev) => {
        const updated = [...prev];
        updated[number] = {
          ...updated[number],
          filePreview: URL.createObjectURL(file),
          selectedFile: file,
        };
        return updated;
      });
    }
  };

  const uploadImagesToCloudinary = async () => {
    const formData = new FormData();
    image.forEach((img) => {
      if (img.selectedFile) {
        formData.append("files", img.selectedFile);
      }
    });

    const res = await axios.post(
      `${process.env.NEXT_PUBLIC_API_URL}/api/upload/image`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return res.data;
  };

  const handleSubmit = async () => {
    // Validation cơ bản với Toast
    if (
      !bookname || !author || !year || !publisher ||
      !description || !category || !category2 || !quantity
    ) {
      toast.error("Vui lòng điền đầy đủ thông tin");
      return;
    }
    if (parseInt(quantity) < 1) {
      toast.error("Số lượng sách phải lớn hơn 0");
      return;
    }
    if (!weight || isNaN(+weight) || +weight <= 0) {
      toast.error("Nhập trọng lượng hợp lệ (> 0)");
      return;
    }
    if (!price || isNaN(+price) || +price <= 0) {
      toast.error("Nhập đơn giá hợp lệ (> 0)");
      return;
    }

    const toastId = toast.loading("Đang xử lý dữ liệu...");

    try {
      // 1. Upload ảnh
      let finalImageURLs = [];
      if (image.some((img) => img.selectedFile)) {
        const newImages = await uploadImagesToCloudinary();
        finalImageURLs = newImages;
      }

      // 2. Tìm ID danh mục
      const selectedParent = totalCate.find((cate) => cate.name === category);
      if (!selectedParent) throw new Error("Thể loại chính không hợp lệ");

      const selectedChild = selectedParent.children.find(
        (child) => child.name === category2
      );
      if (!selectedChild) throw new Error("Thể loại phụ không hợp lệ");

      const childId = selectedChild.id;

      const bookData = {
        book: {
          tenSach: bookname,
          moTa: description,
          tenTacGia: author,
          nxb: publisher,
          nam: parseInt(year),
          hinhAnh: finalImageURLs,
          trongLuong: parseInt(weight),
          donGia: parseInt(price),
          categoryChild: { id: childId },
          trangThai: "CON_SAN",
        },
        quantity: parseInt(quantity),
      };

      // 3. Gọi API tạo sách
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/book`,
        bookData
      );

      toast.success("Thêm sách thành công!", { id: toastId });
      const newId = res.data.maSach;

      // Delay một chút để người dùng đọc thông báo trước khi chuyển trang
      setTimeout(() => {
        router.push(`/books/details/${newId}`);
      }, 1000);

    } catch (error) {
      console.error("Lỗi:", error);
      const msg = error.response?.data?.message || error.message || "Thêm sách thất bại";
      toast.error(msg, { id: toastId });
    }
  };

  return (
    <div className="flex flex-row w-full h-full min-h-screen bg-[#EFF3FB] pb-15">
      <Toaster position="top-center" reverseOrder={false} />
      <Sidebar />
      {loadingCategories ? (
        <div className="flex md:ml-52 w-full h-screen justify-center items-center">
          <ThreeDot
            color="#062D76"
            size="large"
            text="Đang tải danh mục..."
            variant="bounce"
            textColor="#062D76"
          />
        </div>
      ) : (
        <div className="flex w-full flex-col py-6 md:ml-52 relative mt-10 gap-2 items-center px-10">
          {/* Nút Quay Lại */}
          <div className="absolute top-5 left-5 md:left-57 fixed z-10">
            <Button
              title={"Quay Lại"}
              className="bg-[#062D76] rounded-3xl w-10 h-10 hover:bg-gray-700"
              onClick={handleGoBack}
            >
              <Undo2 className="w-12 h-12" color="white" />
            </Button>
          </div>

          {/* Form Input */}
          <div className="flex flex-col w-full gap-[5px] md:gap-[10px]">
            <p className="font-semibold text-lg mt-3">
              Tên Sách<span className="text-red-500"> *</span>
            </p>
            <Input
              type="text"
              placeholder="Nhập tên sách"
              className="font-semibold rounded-lg w-full h-10 flex items-center px-5 bg-white"
              value={bookname}
              onChange={(e) => setBookname(e.target.value)}
            />
          </div>

          <div className="flex flex-col w-full gap-[5px] md:gap-[10px]">
            <p className="font-semibold text-lg mt-3">
              Tên Tác Giả<span className="text-red-500"> *</span>
            </p>
            <Input
              type="text"
              placeholder="Nhập tên tác giả"
              className="font-semibold rounded-lg w-full h-10 flex items-center px-5 bg-white"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
            />
          </div>

          <div className="flex w-full justify-between gap-10">
            <div className="flex flex-col w-2/3 gap-[5px] md:gap-[10px]">
              <p className="font-semibold text-lg mt-3">
                Năm Xuất Bản<span className="text-red-500"> *</span>
              </p>
              <Input
                type="number"
                placeholder="Nhập năm xuất bản"
                className="font-semibold rounded-lg w-full h-10 flex items-center px-5 bg-white"
                value={year}
                onChange={(e) => setYear(e.target.value)}
              />
            </div>
            <div className="flex flex-col w-full gap-[5px] md:gap-[10px]">
              <p className="font-semibold text-lg mt-3">
                Nhà Xuất Bản<span className="text-red-500"> *</span>
              </p>
              <Input
                type="text"
                placeholder="Nhập tên nhà xuất bản"
                className="font-semibold rounded-lg w-full h-10 flex items-center px-5 bg-white"
                value={publisher}
                onChange={(e) => setPublisher(e.target.value)}
              />
            </div>
          </div>

          <div className="flex w-full justify-between gap-10">
            <div className="flex flex-col w-2/3 gap-[5px] md:gap-[10px]">
              <p className="font-semibold text-lg mt-3">
                Số lượng<span className="text-red-500"> *</span>
              </p>
              <Input
                type="number"
                placeholder="Nhập số lượng"
                className="font-semibold rounded-lg w-full h-10 flex items-center px-5 bg-white"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>
            {/* Dropdown Thể Loại Chính */}
            <div className="flex flex-col w-full gap-[5px] md:gap-[10px] space-y-2 relative inline-block text-left">
              <p className="font-semibold text-lg mt-3">
                Thể Loại Chính<span className="text-red-500"> *</span>
              </p>
              <Button
                title={"Thể Loại Chính"}
                className="bg-white text-black rounded-lg w-full h-10 hover:bg-gray-300 flex justify-between"
                onClick={() => setIsCateListOpen(!isCateListOpen)}
              >
                {category !== "" ? category : "Chọn Thể Loại Chính"}
                <ChevronDown className="w-12 h-12" color="#062D76" />
              </Button>
              {isCateListOpen && (
                <div className="absolute bg-white rounded-lg w-full z-50 shadow-lg max-h-60 overflow-y-auto">
                  {cateList?.map((cate, index) => (
                    <Button
                      key={index}
                      className="flex justify-start block w-full px-4 py-2 text-left bg-white text-black hover:bg-gray-300 items-center gap-2"
                      onClick={() => {
                        setCategory(cate);
                        setCategory2(""); // Reset thể loại phụ
                        setIsCateListOpen(false);
                      }}
                    >
                      {cate}
                    </Button>
                  ))}
                </div>
              )}
            </div>
            {/* Dropdown Thể Loại Phụ */}
            <div className="flex flex-col w-full gap-[5px] md:gap-[10px] space-y-2 relative inline-block text-left">
              <p className="font-semibold text-lg mt-3">
                Thể Loại Phụ<span className="text-red-500"> *</span>
              </p>
              <Button
                title={"Thể Loại Phụ"}
                className="bg-white text-black rounded-lg w-full h-10 hover:bg-gray-300 flex justify-between"
                onClick={() => setIsCateList2Open(!isCateList2Open)}
                disabled={!category} // Vô hiệu hóa nếu chưa chọn cha
              >
                {category2 !== "" ? category2 : "Chọn Thể Loại Phụ"}
                <ChevronDown className="w-12 h-12" color="#062D76" />
              </Button>
              {isCateList2Open && (
                <div className="absolute bg-white rounded-lg w-full z-50 shadow-lg max-h-60 overflow-y-auto">
                  {cate2List.length > 0 ? (
                    cate2List.map((cate, index) => (
                      <Button
                        key={index}
                        className="flex justify-start block w-full px-4 py-2 text-left bg-white text-black hover:bg-gray-300 items-center gap-2"
                        onClick={() => {
                          setCategory2(cate);
                          setIsCateList2Open(false);
                        }}
                      >
                        {cate}
                      </Button>
                    ))
                  ) : (
                    <p className="p-2 text-gray-500 text-center">Không có danh mục con</p>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex w-full justify-between gap-10">
            <div className="flex flex-col w-2/3 gap-[5px] md:gap-[10px]">
              <p className="font-semibold text-lg mt-3">
                Trọng Lượng (gram)<span className="text-red-500"> *</span>
              </p>
              <Input
                type="number"
                placeholder="Nhập trọng lượng"
                className="font-semibold rounded-lg w-full h-10 px-5 bg-white"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
              />
            </div>
            <div className="flex flex-col w-full gap-[5px] md:gap-[10px]">
              <p className="font-semibold text-lg mt-3">
                Đơn Giá (VND)<span className="text-red-500"> *</span>
              </p>
              <Input
                type="number"
                placeholder="Nhập đơn giá"
                className="font-semibold rounded-lg w-full h-10 px-5 bg-white"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col w-full gap-[5px] md:gap-[10px]">
            <p className="font-semibold text-lg mt-3">
              Mô Tả<span className="text-red-500"> *</span>
            </p>
            <Input
              type="text"
              placeholder="Nhập mô tả sách"
              className="font-semibold rounded-lg w-full h-10 flex px-5 bg-white"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="flex flex-col w-full gap-[5px] md:gap-[10px]">
            <p className="font-semibold text-lg mt-3">Hình ảnh</p>
            <div className="grid grid-cols-4 gap-4">
              {/* Image Inputs Loop */}
              {[0, 1, 2, 3].map((index) => (
                <div key={index} className="flex flex-col space-y-3">
                  {image[index].filePreview ? (
                    <img
                      src={image[index].filePreview}
                      className="w-[290px] h-[410px] rounded-lg object-cover"
                      alt={`Ảnh ${index === 0 ? "Bìa" : `Xem Trước ${index}`}`}
                    />
                  ) : (
                    <div className="w-[290px] h-[410px] bg-gray-300 rounded-lg flex justify-center items-center text-gray-700">
                      Không có hình ảnh
                    </div>
                  )}
                  <Button
                    className="flex w-[290px] bg-[#062D76] hover:bg-gray-700"
                    onClick={() => {
                      if (index === 0) fileInputRef.current.click();
                      else if (index === 1) fileInputRef1.current.click();
                      else if (index === 2) fileInputRef2.current.click();
                      else if (index === 3) fileInputRef3.current.click();
                    }}
                  >
                    <ArrowUpFromLine className="w-12 h-12" color="white" />
                    {index === 0 ? "Tải Ảnh Bìa" : "Tải Ảnh Xem Trước"}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden input-new-file"
                      onChange={(e) => handleFileChange(index, e)}
                      ref={
                        index === 0 ? fileInputRef :
                          index === 1 ? fileInputRef1 :
                            index === 2 ? fileInputRef2 :
                              fileInputRef3
                      }
                    />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Controls */}
          <div className="w-full bottom-0 px-10 left-0 md:left-52 md:w-[calc(100%-208px)] fixed h-18 bg-white flex items-center justify-between z-20 shadow-md">
            <div></div>
            <Button
              title={"Hoàn Tất"}
              className={`rounded-3xl w-40 h-12 bg-[#062D76] hover:bg-gray-700`}
              onClick={handleSubmit}
            >
              <CircleCheck className="w-12 h-12" color="white" />
              Hoàn Tất
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Page;