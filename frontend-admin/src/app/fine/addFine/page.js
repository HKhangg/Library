"use client";
import Sidebar from "@/app/components/sidebar/Sidebar";
import { Button } from "@/app/components/ui/button";
import { ChevronDown, CircleCheck, Undo2 } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import toast from "react-hot-toast";
import { ThreeDot } from "react-loading-indicators";

function AddFine() {
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null); //user đang chọn
  const [userText, setUserText] = useState("");
  const [isBorrowDropDownOpen, setBorrowDropDownOpen] = useState(false);
  const [money, setMoney] = useState(0);
  const [reason, setReason] = useState(null);
  const [more, setMore] = useState("");
  const [borrow, setBorrow] = useState(null); //phiếu mượn đang chọn
  const [book, setBook] = useState(null); //sách đang chọn
  const [bookText, setBookText] = useState("");
  const route = useRouter();
  const handleGoBack = () => {
    route.back();
  };
  const [userList, setUserList] = useState([]);
  const [borrowList, setBorrowList] = useState([]);
  const fetchUser = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/user`,
        {
          method: "GET",
        }
      );
      if (!response.ok) {
        console.log("Không tìm thấy người dùng nào");
        setLoading(false);
        setUserList([]);
        return;
      }
      const res = await response.json();
      setUserList(res);
      setLoading(false);
    } catch (error) {
      console.log(error);
      return [];
    }
  };
  const fetchBorrow = async (userId) => {
    setLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/borrow-cards/user/${userId}`,
        {
          method: "POST",
        }
      );
      if (response.status == 204) {
        console.log("Không tìm thấy phiếu mượn nào");
        setLoading(false);
        setBorrowList([]);
        return;
      }
      const res = await response.json();
      setBorrowList(res);
      setLoading(false);
    } catch (error) {
      console.log(error);
    }
  };
  useEffect(() => {
    fetchUser();
  }, []);
  useEffect(() => {
    if (user) {
      fetchBorrow(user?.id);
    }
  }, [user]);
  const openDropDownBorrowList = () => {
    setBorrowDropDownOpen(!isBorrowDropDownOpen);
  };
  const handleReasonChange = (e) => {
    setReason(e.target.value);
  };
  const handleSubmit = async () => {
    if (!user) {
      toast.error("Vui lòng chọn ID người dùng.");
      return;
    }
    if (!money) {
      toast.error("Vui lòng nhập số tiền phạt");
      return;
    }
    if (money <= 0) {
      toast.error("Số tiền không được nhỏ hơn hoặc bằng 0");
      return;
    }
    if (!reason) {
      toast.error("Vui lòng chọn nội dung");
      return;
    }
    if (reason === "Trả sách trễ hạn" && !borrow) {
      toast.error("Vui lòng chọn phiếu mượn");
      return;
    }
    if (reason === "Khác" && !more) {
      toast.error("Vui lòng nhập nội dung");
      return;
    }
    if (reason === "Làm mất sách" && !book) {
      toast.error("Vui lòng nhập ID sách");
      return;
    }
    setLoading(true);
    const data = {
      userId: user?.id,
      soTien: Number.parseFloat(money),
      noiDung: reason,
      cardId:
        reason === "Trả sách trễ hạn"
          ? borrow.id
          : reason === "Khác"
          ? more
          : book.id,
    };
    console.log(data);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/addFine`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        }
      );
      if (!response.ok) {
        toast.error("Đã xảy ra lỗi. Vui lòng thử lại.");
        return;
      }
      setLoading(false);
      toast.success("Thêm phiếu phạt thành công.");
      handleGoBack();
    } catch (error) {
      console.log(error);
      toast.error("Đã xảy ra lỗi. Vui lòng thử lại.");
    }
  };

  const handleEnterUser = () => {
    const selected = userList.filter((user) => user?.id == userText);
    if (selected.length < 1) {
      toast.error("Không tìm thấy người dùng với id này");
      return;
    }
    setUser(selected.at(0));
  };

  const handleEnterBook = async () => {
    const selected = await (
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/bookchild/${bookText}`
      )
    ).json();
    if (!selected) {
      toast.error("Không tìm thấy sách con với id này");
      return;
    } else {
      toast.success("Đã tìm thấy sách");
    }
    console.log(selected);
    setBook(selected);
  };
  return (
    <div className="flex flex-row w-full h-dvh bg-[#EFF3FB]">
      <Sidebar />
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
        <div className="flex w-full flex-col py-6 md:ml-52 relative mt-10 gap-2 items-center px-10">
          {/*Nút Back*/}
          <div className="absolute top-5 left-5 md:left-57 fixed">
            <Button
              title={"Quay Lại"}
              className="bg-[#062D76] rounded-3xl w-10 h-10"
              onClick={() => {
                handleGoBack();
              }}
            >
              <Undo2 className="w-12 h-12" color="white" />
            </Button>
          </div>
          {/*Dòng user*/}
          <div className="flex w-full justify-between">
            <div className="flex flex-col w-full space-y-2 relative text-left">
              <p className="font-semibold text-lg mt-3">ID Người Dùng</p>
              <Input
                placeholder="Nhập ID người dùng"
                className="bg-white text-black rounded-lg w-120 h-10 flex justify-between"
                value={userText}
                onChange={(e) => {
                  setUserText(e.target.value);
                }}
                onKeyDown={(e) => e.key === "Enter" && handleEnterUser()}
              />
            </div>
            {/*Tên người dùng*/}
            <div className="flex flex-col w-full gap-[5px] md:gap-[10px]">
              <p className="font-semibold text-lg mt-3">Tên Người Dùng</p>
              <p className="font-semibold text-gray-700 rounded-lg w-120 h-10 flex items-center bg-gray-300 px-5">
                {user?.fullname}
              </p>
            </div>
          </div>
          {/*Dòng số tiền*/}
          <div className="flex flex-col w-full gap-[5px] md:gap-[10px]">
            <p className="font-semibold text-lg mt-3">Số Tiền</p>
            <Input
              type="number"
              placeholder="Nhập số tiền phạt"
              className="font-semibold rounded-lg w-full h-10 flex items-center px-5 bg-white"
              value={money}
              onChange={(e) => setMoney(e.target.value)}
            />
          </div>
          {/*Dòng nội dung*/}
          <div className="flex flex-col w-full gap-[5px] md:gap-[10px]">
            <p className="font-semibold text-lg mt-3">Nội Dung</p>
            {/*Nội dung 1*/}
            <div className="flex items-center gap-2">
              <Input
                type="radio"
                name="Nội dung phiếu phạt"
                className="font-semibold w-5 h-10 flex items-center px-5"
                value="Trả sách trễ hạn"
                onChange={(e) => handleReasonChange(e)}
              />
              <p className="font-semibold text-md">Trả sách trễ hạn</p>
              <p className="font-semibold text-md ml-50">ID Phiếu Mượn</p>
              <div className="space-y-2 relative inline-block text-left">
                <Button
                  title={"ID Phiếu Mượn"}
                  className="bg-white text-black rounded-lg w-64 h-10 hover:bg-gray-300 flex justify-between"
                  onClick={() => {
                    openDropDownBorrowList();
                  }}
                >
                  {borrow ? borrow?.id : "Chọn ID Phiếu Mượn"}
                  <ChevronDown className="w-12 h-12" color="#062D76" />
                </Button>
                {isBorrowDropDownOpen && (
                  <div className="absolute bg-white rounded-lg w-full z-50 shadow-lg max-h-[200px] overflow-y-auto">
                    {borrowList?.map((borrow, index) => {
                      return (
                        <Button
                          key={index}
                          className="flex justify-start w-full px-4 py-2 text-left bg-white text-black hover:bg-gray-300 items-center gap-2"
                          onClick={() => {
                            setBorrow(borrow);
                            setBorrowDropDownOpen(false);
                          }}
                        >
                          {borrow?.id}
                        </Button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
            {/*Nội dung 2*/}
            <div className="flex items-center gap-2">
              <Input
                type="radio"
                name="Nội dung phiếu phạt"
                className="font-semibold w-5 h-10 flex items-center px-5"
                value="Làm mất sách"
                onChange={(e) => handleReasonChange(e)}
              />
              <p className="font-semibold text-md">Làm mất sách</p>
              <p className="font-semibold text-md ml-53">ID Sách</p>
              <div className="space-y-2 relative inline-block text-left">
                <Input
                  placeholder="Nhập ID sách"
                  className="bg-white text-black rounded-lg w-64 h-10 flex justify-between"
                  value={bookText}
                  onChange={(e) => {
                    setBookText(e.target.value);
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleEnterBook()}
                />
              </div>
            </div>
            {/*Nội dung 3*/}
            <div className="flex items-center gap-2">
              <Input
                type="radio"
                name="Nội dung phiếu phạt"
                className="font-semibold w-5 h-10 flex items-center px-5"
                value="Khác"
                onChange={(e) => handleReasonChange(e)}
              />
              <p className="font-semibold text-md">Khác</p>
              <p className="font-semibold text-md ml-70">Nội Dung</p>
              <Input
                type="text"
                placeholder="Nhập nội dung khác"
                className="font-semibold bg-white w-120 h-10 flex items-center px-5"
                value={more}
                onChange={(e) => setMore(e.target.value)}
              />
            </div>
          </div>
          <div className="w-full bottom-0 px-10 left-0 md:left-52 md:w-[calc(100%-208px)] fixed h-20 bg-white flex items-center justify-between">
            {/*Control Bar*/}
            <div></div>
            <Button
              title={"Hoàn Tất"}
              className={`rounded-3xl w-40 h-12 bg-[#062D76]`}
              onClick={() => {
                handleSubmit();
              }}
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

export default AddFine;
