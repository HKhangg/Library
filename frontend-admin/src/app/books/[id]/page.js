"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Sidebar from "@/app/components/sidebar/Sidebar";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { ArrowUpFromLine, ChevronDown, CircleCheck, Undo2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import { ThreeDot } from "react-loading-indicators";
import axios from "axios";

import useSWR, { mutate } from "swr";
import { fetcher } from "@/lib/fetcher"; 

axios.defaults.baseURL = process.env.NEXT_PUBLIC_API_URL;

function Page() {
  const router = useRouter();
  const { id } = useParams();

  const fileInputRef = useRef(null);
  const fileInputRef1 = useRef(null);
  const fileInputRef2 = useRef(null);
  const fileInputRef3 = useRef(null);

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
  const [status, setStatus] = useState(""); // Trạng thái sách

  const [image, setImage] = useState(
    Array(4).fill({ filePreview: null, selectedFile: null })
  );

  const [isCateListOpen, setIsCateListOpen] = useState(false);
  const [isCateList2Open, setIsCateList2Open] = useState(false);

  const { data: totalCate = [], isLoading: loadingCategories } = useSWR(
    `${process.env.NEXT_PUBLIC_API_URL}/api/category`,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    }
  );

  // useSWR: Lấy chi tiết Sách
  const { data: bookData, isLoading: loadingBook, mutate: mutateBook } = useSWR(
    id ? `${process.env.NEXT_PUBLIC_API_URL}/api/book/${id}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
    }
  );

  // Populate Data vào Form 
  useEffect(() => {
    if (bookData) {
      setStatus(bookData.trangThai || "");
      setBookname(bookData.tenSach || "");
      setAuthor(bookData.tenTacGia || "");
      setPublisher(bookData.nxb || "");
      setYear(bookData.nam?.toString() || "");
      // Logic riêng cho số lượng: Input để trống để nhập số lượng thêm
      setQuantity("");
      setDescription(bookData.moTa || "");

      // Populate Categories
      setCategory(bookData.categoryChild?.parent?.name || "");
      setCategory2(bookData.categoryChild?.name || "");

      setWeight(bookData.trongLuong?.toString() || "");
      setPrice(bookData.donGia?.toString() || "");

      // Populate Images
      setImage((prev) =>
        prev.map((_, idx) => ({
          filePreview: bookData.hinhAnh?.[idx] || null,
          selectedFile: null,
        }))
      );
    }
  }, [bookData]);

  // Derived State cho Categories
  const cateList = useMemo(() => totalCate.map((c) => c.name), [totalCate]);

  const cate2List = useMemo(() => {
    if (!category) return [];
    const selectedCate = totalCate.find((c) => c.name === category);
    return selectedCate?.children?.map((ch) => ch.name) || [];
  }, [category, totalCate]);

  const isDeleted = status === "DA_XOA";
  const loading = loadingCategories || loadingBook;

  // Handlers
  const handleGoBack = () => router.back();

  const handleFileChange = (index, e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImage((prev) => {
      const arr = [...prev];
      arr[index] = {
        filePreview: URL.createObjectURL(file),
        selectedFile: file,
      };
      return arr;
    });
  };

  const uploadImagesToCloudinary = async () => {
    const formData = new FormData();
    let hasFile = false;
    image.forEach((img) => {
      if (img.selectedFile) {
        formData.append("files", img.selectedFile);
        hasFile = true;
      }
    });

    if (!hasFile) return [];

    const res = await axios.post(
      `${process.env.NEXT_PUBLIC_API_URL}/api/upload/image`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    return res.data;
  };

  const handleSubmit = async () => {
    if (!id) {
      toast.error("ID sách không hợp lệ");
      return;
    }

    // Validation cơ bản
    if (
      !bookname || !author || !year || !publisher ||
      !description || !category || !category2 || !weight || !price
    ) {
      toast.error("Vui lòng điền đầy đủ thông tin");
      return;
    }

    // Xử lý logic khôi phục sách nếu đã xóa
    if (isDeleted) {
      const newQ = +quantity;
      if (isNaN(newQ) || newQ <= 0) {
        toast.error("Số lượng khôi phục phải > 0");
        return;
      }

      const toastId = toast.loading("Đang khôi phục sách...");
      try {
        await axios.patch(`${process.env.NEXT_PUBLIC_API_URL}/api/book/${id}`, { tongSoLuong: newQ });

        // Refresh lại data
        mutateBook();

        toast.success("Sách đã được phục hồi thành công", { id: toastId });
        setTimeout(() => router.back(), 1000);
      } catch (err) {
        console.error("Lỗi:", err);
        toast.error("Khôi phục thất bại", { id: toastId });
      }
      return;
    }

    // Xử lý logic CẬP NHẬT SÁCH
    const addQty = quantity === "" ? 0 : +quantity; // Nếu không nhập thì coi là 0 (không thêm)
    if (isNaN(addQty) || addQty < 0) {
      toast.error("Số lượng thêm phải >= 0");
      return;
    }

    // So sánh sự thay đổi để tạo payload
    const bookUpdates = {};
    if (bookname !== bookData.tenSach) bookUpdates.tenSach = bookname;
    if (description !== bookData.moTa) bookUpdates.moTa = description;
    if (author !== bookData.tenTacGia) bookUpdates.tenTacGia = author;
    if (publisher !== bookData.nxb) bookUpdates.nxb = publisher;
    if (+year !== bookData.nam) bookUpdates.nam = +year;
    if (+weight !== bookData.trongLuong) bookUpdates.trongLuong = +weight;
    if (+price !== bookData.donGia) bookUpdates.donGia = +price;

    bookUpdates.tongSoLuong = addQty;

    // Logic cập nhật Category
    if (category2) {
      const selParent = totalCate.find((c) => c.name === category);
      const selChild = selParent?.children.find((ch) => ch.name === category2);

      if (selChild && selChild.id !== bookData.categoryChild?.id) {
        bookUpdates.categoryChildId = selChild.id;
      }
    }

    if (Object.keys(bookUpdates).length === 0 && addQty === 0 && !image.some(i => i.selectedFile)) {
      toast("Không có thay đổi nào để cập nhật", { icon: "⚠️" });
      return;
    }

    const toastId = toast.loading("Đang cập nhật sách...");

    try {
      // Upload ảnh nếu có
      let newImgs = await uploadImagesToCloudinary();
      if (Array.isArray(newImgs) && newImgs.length > 0) {
        bookUpdates.hinhAnh = newImgs;
      }

      // Gửi request cập nhật
      await axios.patch(`${process.env.NEXT_PUBLIC_API_URL}/api/book/${id}`, bookUpdates);

      // Refresh SWR
      mutateBook();

      toast.success("Cập nhật sách thành công", { id: toastId });

    } catch (err) {
      console.error("Lỗi:", err);
      const msg = err.response?.data?.message || "Cập nhật thất bại";
      toast.error(msg, { id: toastId });
    }
  };

  return (
    <div className="flex flex-row w-full h-full min-h-screen bg-[#EFF3FB] pb-15">
      <Toaster position="top-center" reverseOrder={false} />
      <Sidebar />
      {loading ? (
        <div className="flex md:ml-52 w-full h-screen justify-center items-center">
          <ThreeDot
            color="#062D76"
            size="large"
            text="Đang tải dữ liệu..."
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

          {/* Form Fields */}
          <div className="flex flex-col w-full gap-[5px] md:gap-[10px]">
            <p className="font-semibold text-lg mt-3">Tên Sách</p>
            <Input
              type="text"
              placeholder="Nhập tên sách"
              className="font-semibold rounded-lg w-full h-10 flex items-center px-5 bg-white"
              disabled={isDeleted}
              value={bookname}
              onChange={(e) => setBookname(e.target.value)}
            />
          </div>

          <div className="flex flex-col w-full gap-[5px] md:gap-[10px]">
            <p className="font-semibold text-lg mt-3">Tên Tác Giả</p>
            <Input
              type="text"
              placeholder="Nhập tên tác giả"
              className="font-semibold rounded-lg w-full h-10 flex items-center px-5 bg-white"
              disabled={isDeleted}
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
            />
          </div>

          <div className="flex w-full justify-between gap-10">
            <div className="flex flex-col w-2/3 gap-[5px] md:gap-[10px]">
              <p className="font-semibold text-lg mt-3">Năm Xuất Bản</p>
              <Input
                type="number"
                placeholder="Nhập năm xuất bản"
                className="font-semibold rounded-lg w-full h-10 flex items-center px-5 bg-white"
                disabled={isDeleted}
                value={year}
                onChange={(e) => setYear(e.target.value)}
              />
            </div>
            <div className="flex flex-col w-full gap-[5px] md:gap-[10px]">
              <p className="font-semibold text-lg mt-3">Nhà Xuất Bản</p>
              <Input
                type="text"
                placeholder="Nhập tên nhà xuất bản"
                className="font-semibold rounded-lg w-full h-10 flex items-center px-5 bg-white"
                disabled={isDeleted}
                value={publisher}
                onChange={(e) => setPublisher(e.target.value)}
              />
            </div>
          </div>

          <div className="flex w-full justify-between gap-10">
            <div className="flex flex-col w-2/3 gap-[5px] md:gap-[10px]">
              <p className="font-semibold text-lg mt-3">
                {isDeleted ? "Số lượng khôi phục" : "Số Sách Thêm (Nhập 0 nếu không thêm)"}
              </p>
              <Input
                type="number"
                placeholder="Nhập số lượng"
                className="font-semibold rounded-lg w-full h-10 flex items-center px-5 bg-white"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>

            {/* Dropdown Category Parent */}
            <div className="flex flex-col w-full gap-[5px] md:gap-[10px] space-y-2 relative inline-block text-left">
              <p className="font-semibold text-lg mt-3">Thể Loại Chính</p>
              <Button
                title={"Thể Loại Chính"}
                className="bg-white text-black rounded-lg w-full h-10 hover:bg-gray-300 flex justify-between"
                onClick={() => setIsCateListOpen(!isCateListOpen)}
                disabled={isDeleted}
              >
                {category || "Chọn Thể Loại Chính"}
                <ChevronDown className="w-12 h-12" color="#062D76" />
              </Button>
              {isCateListOpen && (
                <div className="absolute bg-white rounded-lg w-full z-50 shadow-lg max-h-60 overflow-y-auto">
                  {cateList.map((cate, index) => (
                    <Button
                      key={index}
                      className="flex justify-start block w-full px-4 py-2 text-left bg-white text-black hover:bg-gray-300 items-center gap-2"
                      onClick={() => {
                        setCategory(cate);
                        setCategory2(""); // Reset con khi cha thay đổi
                        setIsCateListOpen(false);
                      }}
                    >
                      {cate}
                    </Button>
                  ))}
                </div>
              )}
            </div>

            {/* Dropdown Category Child */}
            <div className="flex flex-col w-full gap-[5px] md:gap-[10px] space-y-2 relative inline-block text-left">
              <p className="font-semibold text-lg mt-3">Thể Loại Phụ</p>
              <Button
                title={"Thể Loại Phụ"}
                className="bg-white text-black rounded-lg w-full h-10 hover:bg-gray-300 flex justify-between"
                onClick={() => setIsCateList2Open(!isCateList2Open)}
                disabled={isDeleted || !category}
              >
                {category2 || "Chọn Thể Loại Phụ"}
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
              <p className="font-semibold text-lg mt-3">Trọng Lượng (gram)</p>
              <Input
                type="number"
                placeholder="Nhập trọng lượng"
                className="font-semibold rounded-lg w-full h-10 px-5 bg-white"
                disabled={isDeleted}
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
              />
            </div>
            <div className="flex flex-col w-full gap-[5px] md:gap-[10px]">
              <p className="font-semibold text-lg mt-3">Đơn Giá (VND)</p>
              <Input
                type="number"
                placeholder="Nhập đơn giá"
                className="font-semibold rounded-lg w-full h-10 px-5 bg-white"
                disabled={isDeleted}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col w-full gap-[5px] md:gap-[10px]">
            <p className="font-semibold text-lg mt-3">Mô Tả</p>
            <Input
              type="text"
              placeholder="Nhập mô tả sách"
              className="font-semibold rounded-lg w-full h-10 flex px-5 bg-white"
              disabled={isDeleted}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="flex flex-col w-full gap-[5px] md:gap-[10px]">
            <p className="font-semibold text-lg mt-3">Hình ảnh</p>
            <div className="grid grid-cols-4 gap-4">
              {[0, 1, 2, 3].map((index) => (
                <div key={index} className="flex flex-col space-y-3">
                  {image[index].filePreview ? (
                    <img
                      src={image[index].filePreview}
                      className="w-[290px] h-[410px] rounded-lg object-cover"
                      alt={`Ảnh ${index}`}
                    />
                  ) : (
                    <div className="w-[290px] h-[410px] bg-gray-300 rounded-lg flex justify-center items-center text-gray-700">
                      Không có hình ảnh
                    </div>
                  )}
                  <Button
                    className="flex w-[290px] bg-[#062D76] hover:bg-gray-700"
                    disabled={isDeleted}
                    onClick={() => {
                      const refs = [fileInputRef, fileInputRef1, fileInputRef2, fileInputRef3];
                      refs[index].current.click();
                    }}
                  >
                    <ArrowUpFromLine className="w-12 h-12" color="white" />
                    {index === 0 ? "Tải Ảnh Bìa" : "Tải Ảnh Xem Trước"}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
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