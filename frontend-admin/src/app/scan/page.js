"use client";
import React, { useState, useEffect, useMemo } from "react";
import { Button } from "../components/ui/button";
import { ThreeDot } from "react-loading-indicators";
import toast, { Toaster } from "react-hot-toast";
import { format } from "date-fns";
import { Book, CalendarClock, Undo2 } from "lucide-react";
import UploadChild from "./childBook/page";
import Link from "next/link";
import useSWR from "swr";

// Fetcher
const fetcher = async (url) => {
  const res = await fetch(url);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "API Error");
  }
  return res.json();
};

// Custom Hooks

// 1. Hook xử lý User (Search & Upload)
const useUserScan = () => {
  const [userResult, setUserResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const searchUser = async (text) => {
    if (!text) {
      toast.error("Vui lòng nhập mã trước khi tìm kiếm");
      return;
    }
    setLoading(true);
    try {
      const data = await fetcher(`${process.env.NEXT_PUBLIC_API_URL}/api/user/${text}`);
      setUserResult(data);
      toast.success("Tìm thấy người dùng!");
    } catch (e) {
      toast.error(e.message || "Không tìm thấy người dùng"); // Hiển thị message từ API nếu có
      setUserResult(null);
    } finally {
      setLoading(false);
    }
  };

  const uploadBarcode = async (file) => {
    if (!file) {
      toast.error("Vui lòng chọn ảnh trước khi tải lên.");
      return;
    }
    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", "user");

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/upload/barcodeImage`, {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Lỗi upload");
      }
      const result = await response.json();
      setUserResult(result);
      toast.success("Quét mã thành công!");
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Lỗi khi xử lý ảnh");
    } finally {
      setLoading(false);
    }
  };

  const resetUser = () => setUserResult(null);

  return { userResult, loading, searchUser, uploadBarcode, resetUser };
};

// 2. Hook lấy Borrow Cards (Dùng useSWR)
const useBorrowCards = (userId) => {
  const { data: borrowCards, error, isLoading, mutate } = useSWR(
    userId ? [`${process.env.NEXT_PUBLIC_API_URL}/api/borrow-cards/user/${userId}`, userId] : null,
    ([url, uid]) => fetch(url, { method: "POST" }).then(res => {
      if (!res.ok) throw new Error("Failed to fetch borrow cards");
      return res.json();
    })
  );

  // Xử lý lỗi trong useEffect để tránh render loop nếu error thay đổi liên tục
  useEffect(() => {
    if (error) {
      toast.error(error.message || "Lỗi khi tải danh sách phiếu mượn");
    }
  }, [error]);

  return {
    borrowCards: borrowCards || [],
    isLoading,
    isError: error,
    refreshCards: mutate
  };
};

// 3. Hook xử lý chi tiết sách trong phiếu mượn
const useBorrowDetails = (borrowCard) => {
  const [booksInfo, setBooksInfo] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!borrowCard?.borrowedBooks?.length) {
      setBooksInfo([]);
      return;
    }

    const fetchBooks = async () => {
      setLoading(true);
      try {
        const promises = borrowCard.borrowedBooks.map(async (item) => {
          const bookId = item.bookId;
          try {
            const data = await fetcher(`${process.env.NEXT_PUBLIC_API_URL}/api/book/${bookId}`);
            return { ...data, childId: item, checked: false };
          } catch (err) {
            console.error(`Error fetching book ${bookId}:`, err);
            // Trả về một object lỗi hoặc null để xử lý sau, tránh crash Promise.all
            return { error: true, bookId, message: "Lỗi tải thông tin sách" };
          }
        });
        const results = await Promise.all(promises);
        // Lọc bỏ các kết quả lỗi nếu cần hoặc hiển thị thông báo
        const validBooks = results.filter(b => !b.error);
        if (results.some(b => b.error)) toast.error("Một số sách không tải được thông tin");

        setBooksInfo(validBooks);
      } catch (error) {
        console.error(error);
        toast.error("Lỗi tải thông tin sách");
      } finally {
        setLoading(false);
      }
    };

    fetchBooks();
  }, [borrowCard]);

  // Logic update checkbox khi quét sách con
  const updateCheckStatus = (scannedChildId) => {
    if (!scannedChildId) return;

    setBooksInfo(prev => {
      const isRequesting = borrowCard?.status === "Đã yêu cầu";
      const targetId = isRequesting ? scannedChildId.bookId : scannedChildId.id;

      const exists = prev.find(b =>
        isRequesting ? b.maSach === targetId : b.childId?.childBookId === targetId
      );

      if (!exists) {
        toast.error("Sách không có trong phiếu này!");
        return prev;
      }
      if (exists.checked) {
        toast.error("Sách này đã được quét rồi!");
        return prev;
      }

      toast.success("Đã xác nhận sách!"); // Thêm thông báo thành công
      return prev.map(b => {
        const match = isRequesting ? b.maSach === targetId : b.childId?.childBookId === targetId;
        return match ? { ...b, checked: true } : b;
      });
    });
  };

  const isAllChecked = useMemo(() => booksInfo.length > 0 && booksInfo.every(b => b.checked), [booksInfo]);

  return { booksInfo, loading, updateCheckStatus, isAllChecked, setBooksInfo };
};


// Sub-Components

const UserInfoSection = ({ user }) => (
  <div className="flex flex-col bg-white w-1/2 rounded-lg mt-2 drop-shadow-lg p-5 gap-4">
    <h1 className="rounded-full bg-blue-200 text-blue-400 font-bold px-2 py-2 w-fit">
      ID:&nbsp;{user?.id}
    </h1>
    <div className="flex flex-col gap-[10px] w-full items-start">
      <p className="font-bold">Họ và tên:&nbsp;{user?.fullname}</p>
      <p>Email:&nbsp;{user?.email}</p>
      <p>Ngày sinh:&nbsp;{user?.birthday}</p>
      <p>Số điện thoại:&nbsp;{user?.phone}</p>
    </div>
  </div>
);

const BorrowCardItem = ({ card, onClick }) => (
  <div
    className="w-5/6 my-2 px-10 py-5 bg-white rounded-lg hover:cursor-pointer drop-shadow-md transition-all hover:bg-gray-50"
    onClick={() => onClick(card)}
  >
    <p><strong>Id phiếu mượn:</strong>&nbsp;{card?.id}</p>
    <p><strong>Ngày đăng ký:</strong>&nbsp;{format(new Date(card?.borrowDate), "dd/MM/yyyy HH:mm")}</p>
    {card?.status === "Đã yêu cầu" ? (
      <p><strong>Ngày lấy dự kiến:</strong>&nbsp;{format(new Date(card?.getBookDate), "dd/MM/yyyy")}</p>
    ) : (
      <p><strong>Hạn trả:</strong>&nbsp;{format(new Date(card?.dueDate || Date.now()), "dd/MM/yyyy")}</p>
    )}
    <p className={`font-bold ${card?.status === "Đã yêu cầu" ? "text-orange-500" : "text-green-600"}`}>
      {card?.status}
    </p>
  </div>
);

const BookItem = ({ book, isHiddenId }) => (
  <div className={`w-full flex justify-between items-center rounded-xl p-3 my-2 border ${book.checked ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"}`}>
    <div className="flex flex-col mr-4">
      {!isHiddenId && <p className="font-semibold text-sm text-gray-500">Mã: {book.maSach}</p>}
      <p className="font-bold text-[#062D76]">{book.tenSach}</p>
      <p className="text-sm">TG: {book.tenTacGia} | NXB: {book.nxb}</p>
      <p className="text-sm">Vị trí: {book.viTri}</p>
    </div>
    {book.hinhAnh?.[0] && <img src={book.hinhAnh[0]} className="w-16 h-24 object-cover rounded" alt={book.tenSach} />}
  </div>
);


// MAIN COMPONENT

const ScanPage = () => {
  // State
  const [text, setText] = useState("");
  const [currentCard, setCurrentCard] = useState(null);
  const [scannedChild, setScannedChild] = useState(null);
  const [childIds, setChildIds] = useState([]);

  // Hooks
  const { userResult, loading: userLoading, searchUser, uploadBarcode, resetUser } = useUserScan();
  const { borrowCards, isLoading: cardsLoading, refreshCards } = useBorrowCards(userResult?.id);
  const { booksInfo, updateCheckStatus, isAllChecked } = useBorrowDetails(currentCard);

  // Effects
  useEffect(() => {
    if (scannedChild) {
      updateCheckStatus(scannedChild);

      const idToAdd = scannedChild.id;
      // Kiểm tra xem ID đã tồn tại trong danh sách chưa trước khi thêm
      setChildIds(prev => {
        if (prev.includes(idToAdd)) return prev;
        return [...prev, idToAdd];
      });
    }
  }, [scannedChild]);

  // Handlers
  const handleUploadFile = (e) => {
    const file = e.target.files[0];
    if (file) uploadBarcode(file);
  };

  const handleUpdateCard = async () => {
    if (!currentCard) return;
    const isRequesting = currentCard.status === "Đã yêu cầu";
    const endpoint = isRequesting ? "borrow" : "return";

    const toastId = toast.loading("Đang cập nhật phiếu...");

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/borrow-cards/${endpoint}/${currentCard.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(childIds),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Cập nhật thất bại");
      }

      toast.success("Cập nhật thành công!", { id: toastId });

      handleCloseModal();
      refreshCards();
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Có lỗi xảy ra", { id: toastId });
    }
  };

  const handleCloseModal = () => {
    setCurrentCard(null);
    setScannedChild(null);
    setChildIds([]);
  };

  const handleGoBack = () => {
    resetUser();
    setText("");
  };

  // Render

  return (
    <div className="flex w-full min-h-screen h-full flex-col gap-2 items-center bg-[#EFF3FB]">
      <Toaster position="top-center" />

      {/* LOADING SCREEN */}
      {(userLoading || (cardsLoading && !userResult && !borrowCards.length)) && ( // Điều chỉnh điều kiện loading
        <div className="flex w-full h-screen justify-center items-center">
          <ThreeDot color="#062D76" size="large" text="Đang xử lý..." textColor="#062D76" />
        </div>
      )}

      {/* STEP 1: SCAN USER */}
      {!userResult && !userLoading && (
        <div className="flex flex-col items-center h-auto w-fit mt-10 mb-10 gap-5 px-10 py-6 bg-white rounded-lg drop-shadow-lg">
          <Link href="/">
            <img width={200} height={100} src="/images/logoN.png" alt="Logo" className="object-contain" />
          </Link>
          <p className="text-3xl font-bold text-[#062D76]">Thư Viện Số</p>
          <p className="text-lg text-gray-600">Quét mã thành viên để bắt đầu</p>

          <div className="flex flex-col w-full gap-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Nhập User ID..."
                className="border p-2 rounded flex-1 outline-none focus:border-[#062D76]"
                onKeyDown={(e) => e.key === "Enter" && searchUser(text)}
              />
              <Button onClick={() => searchUser(text)}>Tìm</Button>
            </div>

            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-gray-300"></div>
              <span className="flex-shrink-0 mx-4 text-gray-400">Hoặc tải ảnh barcode</span>
              <div className="flex-grow border-t border-gray-300"></div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="flex items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <p className="text-sm text-gray-500">Nhấn để chọn ảnh</p>
                </div>
                <input type="file" className="hidden" onChange={handleUploadFile} />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: USER DASHBOARD */}
      {userResult && (
        <div className="flex flex-col w-full h-full min-h-screen items-center py-6 gap-5 bg-[#EFF3FB]">
          {/* Back Button */}
          <div className="absolute top-5 left-5 md:left-20">
            <Button onClick={handleGoBack} className="bg-[#062D76] rounded-full w-10 h-10 p-0">
              <Undo2 className="w-5 h-5 text-white" />
            </Button>
          </div>

          <UserInfoSection user={userResult} />

          <div className="w-full px-4 md:px-20 lg:px-40 grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
            {/* List: Đã yêu cầu */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3 bg-white p-4 rounded-xl text-[#062D76]">
                <Book size={24} />
                <h2 className="font-bold text-lg">Phiếu mượn cần lấy sách</h2>
              </div>
              <div className="flex flex-col items-center w-full">
                {borrowCards.filter(c => c.status === "Đã yêu cầu").length === 0 && <p className="text-gray-400 mt-4">Trống</p>}
                {borrowCards
                  .filter(c => c.status === "Đã yêu cầu")
                  .map(card => <BorrowCardItem key={card.id} card={card} onClick={setCurrentCard} />)
                }
              </div>
            </div>

            {/* List: Đang mượn */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3 bg-white p-4 rounded-xl text-[#062D76]">
                <CalendarClock size={24} />
                <h2 className="font-bold text-lg">Phiếu đang mượn (Trả sách)</h2>
              </div>
              <div className="flex flex-col items-center w-full">
                {borrowCards.filter(c => c.status === "Đang mượn").length === 0 && <p className="text-gray-400 mt-4">Trống</p>}
                {borrowCards
                  .filter(c => c.status === "Đang mượn")
                  .map(card => <BorrowCardItem key={card.id} card={card} onClick={setCurrentCard} />)
                }
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: SCAN BOOKS MODAL */}
      {currentCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={handleCloseModal}>
          <div className="bg-white rounded-xl w-full max-w-5xl h-[80vh] flex flex-col lg:flex-row overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>

            {/* Left: Book List */}
            <div className="flex-1 p-6 flex flex-col border-r border-gray-100 bg-gray-50">
              <h3 className="font-bold text-xl text-[#062D76] mb-4">
                {currentCard.status === "Đã yêu cầu" ? "Xác nhận lấy sách" : "Xác nhận trả sách"}
              </h3>
              <div className="flex-1 overflow-y-auto pr-2">
                {booksInfo.map((book, idx) => (
                  <BookItem key={idx} book={book} isHiddenId={currentCard.status !== "Đã yêu cầu"} />
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <Button
                  className="w-full bg-[#062D76] hover:bg-blue-800 text-white h-12 text-lg font-bold disabled:opacity-50"
                  disabled={!isAllChecked}
                  onClick={handleUpdateCard}
                >
                  {currentCard.status === "Đã yêu cầu" ? "Hoàn tất mượn" : "Hoàn tất trả"}
                </Button>
              </div>
            </div>

            {/* Right: Scanner */}
            <div className="flex-1 p-6 flex flex-col items-center justify-center bg-white relative">
              <UploadChild resultChild={scannedChild} setResultChild={setScannedChild} />
              <p className="mt-4 text-gray-500 italic text-sm text-center">
                Quét mã vạch trên sách để xác nhận. <br />
                Trạng thái sẽ tự động cập nhật bên trái.
              </p>
              <button
                onClick={handleCloseModal}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              >
                ✕ Đóng
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default ScanPage;