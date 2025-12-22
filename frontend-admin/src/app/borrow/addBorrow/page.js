"use client";
import Sidebar from "@/app/components/sidebar/Sidebar";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { ChevronDown, CircleCheck, Plus, Undo2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { ThreeDot } from "react-loading-indicators";

function Page() {
  const [loading, setLoading] = useState(false);
  const route = useRouter();
  const handleGoBack = () => {
    route.back();
  };
  const [user, setUser] = useState(null); //user đang chọn
  const [book, setBook] = useState(null); //book đang chọn
  const [userList, setUserList] = useState([]);
  const [bookList, setBookList] = useState([]);
  const [borrowList, setBorrowList] = useState([]);
  const [userText, setUserText] = useState(""); //ô điền user
  const [isDropDownOpen, setOpen] = useState(false);
  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user`, {
          method: "GET",
        });
        if (!res.ok) {
          throw new Error("Không thể lấy danh sách người dùng");
        }
        const users = await res.json();
        setUserList(users);
      } catch (e) {
        console.log("Lỗi khi tải danh sách người dùng: ", e);
      }
      setLoading(false);
    };
    fetchUser();
    const fetchBook = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/book`, {
          method: "GET",
        });
        if (!res.ok) {
          throw new Error("Không thể lấy danh sách sách");
        }
        const books = await res.json();
        setBookList(books);
        // console.log(books)
      } catch (e) {
        console.log("Lỗi khi tải danh sách sách: ", e);
      }
      setLoading(false);
    };
    fetchBook();
  }, []);
  const handleEnterUser = () => {
    const selected = userList.filter((user) => user?.id == userText);
    if (selected.length < 1) {
      window.alert("Không tìm thấy người dùng với id này");
      return;
    }
    setUser(selected.at(0));
  };
  const handleEnterBook = (book) => {
    setBook(book);
  };
  const handleAddIntoList = () => {
    if (book) {
      if (!borrowList.find((bk) => bk?.maSach === book?.maSach)) {
        borrowList.push(book);
        setBook(null);
      } else {
        window.alert("Sách này đã có trong danh sách mượn");
      }
    } else {
      window.alert("Vui lòng nhập thông tin sách");
    }
  };
  const handleRemoveBook = (selectedBook) => {
    setBorrowList((prev) =>
      prev.filter((book) => book.maSach !== selectedBook.maSach)
    );
  };
  const BookCard = ({ book }) => {
    return (
      <div className="w-full h-[200px] p-5 flex justify-between items-center my-3 px-5">
        <div className="flex flex-col">
          <p className="font-semibold">Id:&nbsp;{book?.maSach}</p>
          <p className="font-semibold">{book?.tenSach}</p>
          <p>{book?.tenTacGia}</p>
          <p>{book?.nxb}</p>
          <Button
            className="w-10 h-10 bg-red-700 self-end"
            title="Xóa khỏi danh sách mượn"
            onClick={() => {
              handleRemoveBook(book);
            }}
          >
            <X className="w-12 h-12 text-white" />
          </Button>
        </div>
        <img src={book?.hinhAnh[0]} width={140} height={140} />
      </div>
    );
  };
  const handleCreateBorrowCard = async () => {
    try {
      setLoading(true);
      const borrowedBooks = borrowList.map((book) => ({
        bookId: book.maSach,
        childBookId: null,
      }));

      const borrowCardRequest = {
        userId: user.id,
        borrowedBooks,
        borrowDate: new Date().toISOString(),
        status: "REQUESTED",
        dueDate: new Date(
          new Date().setDate(new Date().getDate() + 7)
        ).toISOString(), // Ngày trả sách là 14 ngày sau
      };
      console.log(borrowCardRequest);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/borrow-cards`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(borrowCardRequest),
        }
      );
      if (response.status === 200) {
        window.alert("Tạo phiếu mượn thành công");
        handleGoBack();
      }
    } catch (error) {
      window.alert("Đã xảy ra lỗi");
      console.error("Lỗi khi tạo phiếu mượn:", error);
    }
    setLoading(false);
  };
  const handleSubmit = () => {
    if (!user) {
      window.alert("Vui lòng nhập thông tin người mượn");
      return;
    }
    if (borrowList.length < 1) {
      window.alert("Vui lòng nhập thông tin danh sách mượn");
      return;
    }
    if (confirm("Bạn chắc chắn muốn tạo phiếu mượn với các thông tin sau?")) {
      handleCreateBorrowCard();
    }
  };

  return (
    <div className="flex flex-row w-full h-full min-h-screen bg-[#EFF3FB] pb-15">
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
                {user?.username}
              </p>
            </div>
          </div>
          {/*Dòng sách*/}
          <div className="flex w-full justify-between">
            <div className="flex flex-col w-full space-y-2 relative text-left">
              <p className="font-semibold text-lg mt-3">Sách</p>
              <div className="flex gap-3">
                <Button
                  className="bg-white text-black rounded-lg w-200 h-10 flex relative justify-between hover:bg-gray-100"
                  onClick={() => setOpen(!isDropDownOpen)}
                >
                  <p>
                    {book
                      ? `${book?.maSach}-${book?.tenSach}-${book?.tenTacGia}-${book?.nxb}`
                      : "Vui lòng chọn sách"}
                  </p>
                  <ChevronDown className="w-12 h-12 text-[#062D76]" />
                  {isDropDownOpen && (
                    <div className="absolute top-12 left-0 w-full h-[300px] overflow-y-auto bg-white rounded border-3">
                      {bookList?.map((book, index) => {
                        return (
                          <div
                            key={index}
                            className="flex items-center text-left h-8 w-full p-1 pl-10 hover:bg-gray-100"
                            onClick={() => handleEnterBook(book)}
                          >
                            <p>
                              {book?.maSach}-{book?.tenSach}-{book?.tenTacGia}-
                              {book?.nxb}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Button>
                <Button
                  className="w-10 h-10 bg-[#062D76] rounded"
                  onClick={() => {
                    handleAddIntoList();
                  }}
                  title="Thêm vào danh sách mượn"
                >
                  <Plus className="w-12 h-12 text-white" />
                </Button>
              </div>
            </div>
          </div>
          {/*Danh sách mượn*/}
          <div className="w-full h-[350px] rounded bg-white mt-5 overflow-y-auto grid grid-cols-1 lg:grid-cols-2">
            {borrowList.length < 1 ? (
              <div className="col-span-full text-center py-4 text-gray-500">
                Không có sách nào
              </div>
            ) : (
              borrowList?.map((book, index) => {
                return <BookCard key={index} book={book} />;
              })
            )}
          </div>
          {/*Control Bar*/}
          <div className="bottom-0 px-10 right-0 md:left-52 fixed h-18 bg-white flex items-center justify-end">
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
export default Page;
