"use client";
import React, { useEffect, useState } from "react";
import { Button } from "../components/ui/button";
import { ThreeDot } from "react-loading-indicators";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { Book, CalendarClock, Undo2 } from "lucide-react";
import UploadChild from "./childBook/page";
import Link from "next/link";

const UploadImage = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState("");
  const [borrowCard, setBorrowCard] = useState(null);
  const [result, setResult] = useState(null);
  const [currentChoose, setCurrent] = useState(null);
  const [currentInfo, setInfo] = useState(null);
  const [resultChild, setResultChild] = useState(null);
  const [done, setDone] = useState(false);
  const [children, setChildren] = useState([]);
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
    formData.append("type", "user");
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/upload/barcodeImage`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        const error = await response.json();
        window.alert(error.error);
        setLoading(false);
        return;
      }

      const result = await response.json();
      setResult(result);
      setSelectedFile(null);
    } catch (error) {
      console.error("Lỗi khi gửi ảnh:", error);
    }
    setLoading(false);
  };
  //hàm xử lý khi nhập id
  const handleEnter = async () => {
    if (text == "") {
      alert("Vui lòng nhập mã trước khi tìm kiếm");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/user/${text}`,
        {
          method: "GET",
        }
      );
      if (!response.ok) {
        window.alert("Không tìm thấy người dùng");
        setLoading(false);
        return;
      }
      const result = await response.json();
      console.log(result);
      setResult(result);
      setText("");
    } catch (e) {
      console.log(e);
    }
    setLoading(false);
  };
  //hàm lấy phiếu mượn
  const getBorrowCard = async () => {
    setLoading(true);
    try {
      const userId = result?.id;
      var response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/borrow-cards/user/${userId}`,
        {
          method: "POST",
        }
      );
      if (!response.ok) {
        console.log("Không tìm thấy phiếu mượn nào");
        setLoading(false);
        return;
      }
      if (response.length === 0) {
        window.alert("Không tìm thấy phiếu mượn nào");
        setLoading(false);
        return;
      }
      const res = await response.json();
      setBorrowCard(res);
    } catch (e) {
      console.log("Lỗi khi tìm phiếu mượn của user ", result?.id, ": ", e);
    }
    setLoading(false);
  };
  useEffect(() => {
    if (result) {
      getBorrowCard();
    }
  }, [result]);

  const fetchBookInfo = async (bookId) => {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/book/${bookId}`
    );
    const data = await res.json();
    console.log(data);
    return data;
  };
  const getBookIdsInfo = async () => {
    if (currentChoose?.status === "Đã yêu cầu") {
      if (currentChoose?.borrowedBooks?.length > 0) {
        try {
          const books = await Promise.all(
            currentChoose.borrowedBooks.map(async (bookId) => {
              const data = await fetchBookInfo(bookId.bookId);
              return { ...data, checked: false };
            })
          );
          console.log(books);
          setInfo(books);
        } catch (error) {
          console.error("Lỗi khi tải thông tin sách:", error);
        }
      }
    } else {
      if (currentChoose?.borrowedBooks?.length > 0) {
        try {
          const books = await Promise.all(
            currentChoose.borrowedBooks.map(async (bookId) => {
              const childBook = bookId;
              const data = await fetchBookInfo(bookId.bookId);
              return { ...data, childId: childBook, checked: false };
            })
          );
          console.log(books);
          setInfo(books);
        } catch (error) {
          console.error("Lỗi khi tải thông tin sách:", error);
        }
      }
    }
  };
  useEffect(() => {
    if (currentChoose && !resultChild) {
      getBookIdsInfo();
    } else if (currentChoose && resultChild) {
    } else {
      setInfo(null);
    }
  }, [currentChoose]);

  const handleGoBack = () => {
    setResult(null);
    setSelectedFile(null);
    setText("");
    setLoading(false);
    setBorrowCard(null);
  };
  const BookInfo = ({ book }) => {
    return (
      <div
        className={`w-full h-[200px] flex justify-between items-center rounded-xl ${
          book?.checked === false ? "bg-gray-200" : "bg-green-100"
        } my-3 px-5`}
      >
        <div className="flex flex-col mr-4">
          <p
            className={`font-semibold ${
              currentChoose?.status !== "Đã yêu cầu" ? "" : "hidden"
            }`}
          >
            Id:&nbsp;{book?.maSach}
          </p>
          <p className="font-semibold">Tên: {book?.tenSach}</p>
          <p>Tên tác giả: {book?.tenTacGia}</p>
          <p>Tên NXB: {book?.nxb}</p>
          <p>Vị trí:&nbsp;{book?.viTri}</p>
        </div>
        <img src={book?.hinhAnh[0]} width={140} height={140} />
      </div>
    );
  };
  const CardInfo = ({ card }) => {
    return (
      <div>
        <p>
          <strong>Id phiếu mượn:</strong>&nbsp;{card?.id}
        </p>
        <p>
          <strong>Ngày đăng ký mượn:</strong>&nbsp;
          {format(new Date(card?.borrowDate), "dd/MM/yyyy HH:mm:ss")}
        </p>
        <p className={`${card?.status === "Đã yêu cầu" ? "" : "hidden"}`}>
          <strong>Ngày lấy sách dự kiến:</strong>&nbsp;
          {format(new Date(card?.getBookDate), "dd/MM/yyyy HH:mm:ss")}
        </p>
        <p className={`${card?.status === "Đã yêu cầu" ? "hidden" : ""}`}>
          <strong>Ngày trả sách dự kiến:</strong>&nbsp;
          {format(
            new Date(
              card?.dueDate ? card?.dueDate : "2025-01-01T10:15:16.696+00:00"
            ),
            "dd/MM/yyyy HH:mm:ss"
          )}
        </p>
        <p>
          <strong>Trạng thái:</strong>&nbsp;{card?.status}
        </p>
      </div>
    );
  };
  const BorrowCard = ({ card }) => {
    return (
      <div
        className="w-5/6 my-2 px-10 py-5 bg-white rounded-lg hover:cursor-pointer drop-shadow-md"
        onClick={() => setCurrent(card)}
      >
        <CardInfo card={card} />
      </div>
    );
  };
  useEffect(() => {
    console.log("resultChild", resultChild);
    if (resultChild && resultChild?.bookId) {
      if (currentChoose?.status === "Đã yêu cầu") {
        const parentId = resultChild.bookId;
        const foundBook = currentInfo.find((book) => book.maSach === parentId);
        if (!foundBook) {
          window.alert("Sách cha không tồn tại trong danh sách!");
          return;
        }
        if (foundBook.checked) {
          window.alert("Sách cha đã được chọn!");
          return;
        }
        const updatedBooks = currentInfo.map((book) =>
          book.maSach === parentId ? { ...book, checked: true } : book
        );
        setInfo(updatedBooks);
        children.push(resultChild.id);
      } else {
        const childId = resultChild.id;
        console.log("tới đay");
        const foundBook = currentInfo.find(
          (book) => book.childId.childBookId === childId
        );
        if (!foundBook) {
          window.alert("Sách không tồn tại trong danh sách đã mượn!");
          return;
        }
        if (foundBook.checked) {
          window.alert("Sách này đã được chọn!");
          return;
        }
        const updatedBooks = currentInfo.map((book) =>
          book.childId.childBookId === childId
            ? { ...book, checked: true }
            : book
        );
        setInfo(updatedBooks);
      }
    }
  }, [resultChild]);
  useEffect(() => {
    if (currentInfo?.length > 0) {
      const allChecked = currentInfo.every((book) => book.checked === true);
      setDone(allChecked);
      console.log("allChecked", allChecked);
    } else {
      setDone(false); // reset nếu danh sách rỗng
    }
  }, [currentInfo]);
  const handleCloseCard = () => {
    setCurrent(null);
    setInfo(null);
    setResultChild(null);
    setDone(false);
  };
  const handleUpdateBorrowCard = async () => {
    setLoading(true);
    try {
      let response;
      console.log(children)
      if (currentChoose.status === "Đã yêu cầu") {
        response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/borrow-cards/borrow/${currentChoose?.id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(children),
          }
        );
        setChildren([])
        console.log(children)
      } else {
        response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/borrow-cards/return/${currentChoose?.id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(children),
          }
        );
         setChildren([])
        console.log(children)
      }

      if (!response.ok) {
        window.alert("Không thể cập nhật phiếu mượn");
      } else {
        window.alert("Updated");
        handleCloseCard();
        await getBorrowCard();
      }
    } catch (error) {
      console.error(error);
      window.alert("Có lỗi xảy ra khi cập nhật");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex w-full min-h-screen h-full flex-col gap-2 items-center bg-[#EFF3FB]">
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
      ) : !result ? (
        <div className="flex flex-col items-center h-auto w-fit mt-10 mb-10 gap-5 px-10 py-6 bg-white rounded-lg drop-shadow-lg">
          <Link href="/">
            <img width={460} height={230} src="/images/logoN.png" />
          </Link>
          <p className="text-3xl font-semibold text-#062D76">Library Web</p>
          <p className="text-xl font-semibold w-fit">
            Vui lòng nhập mã người dùng của bạn
          </p>
          <div className="flex flex-col w-full items-center justify-center gap-1">
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Nhập user ID của bạn"
              className="bg-white rounded w-fit"
              onKeyDown={(e) => e.key === "Enter" && handleEnter()}
            />
            <p className="text-sm italic text-[#062D76]">
              Nhập Enter để tiến hành tìm kiếm
            </p>
          </div>
          <p className="text-2xl font-semibold mt-10">Hoặc</p>
          <p className="text-xl font-semibold ">
            Tải ảnh barcode mã người dùng của bạn
          </p>
          <div className="flex gap-5">
            <input
              type="file"
              onChange={onFileChange}
              className="bg-white self-center rounded"
            />
            <Button onClick={handleUpload}>Tải ảnh lên</Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col w-full h-full min-h-screen items-center py-6 gap-5 bg-[#EFF3FB]">
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
          {/*Phiếu mượn đang chọn*/}
          {currentChoose && (
            <div className="fixed inset-0 items-center justify-center z-50 flex">
              <div
                className="w-full h-full bg-black opacity-[80%] absolute top-0 left-0"
                onClick={() => handleCloseCard()}
              ></div>
              <div className="flex lg:w-2/3 h-[400px] w-fit lg:h-[600px] bg-white p-6 rounded-lg shadow-lg fixed justify-between py-10">
                <div className="flex flex-col w-1/2 mr-4">
                  <CardInfo card={currentChoose} />
                  <div className="h-[400px] overflow-y-auto flex flex-col items-center">
                    {currentInfo?.map((book, index) => {
                      return <BookInfo book={book} key={index} />;
                    })}
                  </div>
                  <Button
                    className="self-center w-fit flex z-100 bg-[#062D76] hover:bg-white hover:text-[#062D76] text-white rounded-lg mt-4"
                    disabled={!done}
                    onClick={() => {
                      handleUpdateBorrowCard();
                    }}
                  >
                    Hoàn tất
                  </Button>
                </div>
                <div className="flex flex-col ml-4 w-1/2 items-center justify-center">
                  <UploadChild
                    resultChild={resultChild}
                    setResultChild={setResultChild}
                  />
                </div>
              </div>
              <p className="absolute bottom-5 flex text-white italic z-100 text-sm">
                Nhấn vào khoảng trống để đóng
              </p>
            </div>
          )}
          <div className="flex flex-col bg-white w-1/2 rounded-lg mt-2 drop-shadow-lg p-5 gap-4">
            <h1 className="rounded-full bg-blue-200 text-blue-400 font-bold px-2 py-2 w-fit">
              ID:&nbsp;{result?.id}
            </h1>
            <div className="flex flex-col gap-[10px] w-full items-start">
              <p className="font-bold">Họ và tên:&nbsp;{result?.fullname}</p>
              <p className="">Email:&nbsp;{result?.email}</p>
              <p className="">Ngày sinh:&nbsp;{result?.birthday}</p>
              <p className="">Số điện thoại:&nbsp;{result?.phone}</p>
            </div>
          </div>
          <div className="w-full px-10 md:px-40">
            {!borrowCard ? (
              <p className="text-xl font-semibold ">
                Không có lịch sử phiếu mượn nào
              </p>
            ) : (
              <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <div className="flex bg-white text-[#062D76] rounded-xl p-5 justify-center items-center gap-5">
                    <Book width={24} height={24} />
                    <p className="text-lg font-semibold">
                      {" "}
                      Phiếu mượn đã yêu cầu
                    </p>
                  </div>
                  <div className="flex flex-col items-center">
                    {borrowCard
                      ?.filter(
                        (c) =>
                          c.status == "Đã yêu cầu" &&
                          new Date(c.getBookDate) > new Date()
                      )
                      .map((card, index) => {
                        return <BorrowCard key={index} card={card} />;
                      })}
                  </div>
                </div>
                <div>
                  <div className="flex bg-white text-[#062D76] rounded-xl p-5 justify-center items-center gap-5">
                    <CalendarClock width={24} height={24} />
                    <p className="text-lg font-semibold">
                      Phiếu mượn đang mượn
                    </p>
                  </div>
                  <div className="flex flex-col items-center">
                    {borrowCard
                      ?.filter((c) => c.status == "Đang mượn")
                      .map((card, index) => {
                        return <BorrowCard key={index} card={card} />;
                      })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadImage;
