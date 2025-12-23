"use client";
import useSWR from "swr";
import React, { useEffect, useState, useRef, useCallback } from "react";
import { Button } from "../components/ui/button";
import { ThreeDot } from "react-loading-indicators";
import toast, { Toaster } from "react-hot-toast";
import { format } from "date-fns";
import { Book, CalendarClock, Undo2, Camera, QrCode, Scan } from "lucide-react";
import UploadChild from "./childBook/page";
import Link from "next/link";
import CameraScanner from "./CameraScanner";


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
  const [text, setText] = useState("");
  const [borrowCard, setBorrowCard] = useState(null);
  const [result, setResult] = useState(null);
  const [currentChoose, setCurrent] = useState(null);
  const [currentInfo, setInfo] = useState(null);
  const [resultChild, setResultChild] = useState(null);
  const [done, setDone] = useState(false);
  const [children, setChildren] = useState([]);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const lastFetchedUserId = useRef(null);
  const isFetchingRef = useRef(false);
  // Hàm xử lý khi người dùng chọn ảnh
  const onFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const searchUser = async (text) => {
    if (!text) {
      toast.error("Vui lòng nhập mã trước khi tìm kiếm");
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
      const userData = await response.json();
      console.log(userData);
      setResult(userData);
      setText("");
      
      // Gọi fetchBorrowCardsForUser trực tiếp
      await fetchBorrowCardsForUser(userData.id);
    } catch (e) {
      console.log(e);
      setLoading(false);
    }
  };

  // Xử lý khi quét QR code thành công
  const handleQRScanSuccess = async (decodedText, scanType) => {
    console.log("QR Code scanned:", decodedText);
    if (scanType === "qrcode") {
      // Quét mã QR người dùng
      setShowQRScanner(false);
      setText(decodedText);
      // Tự động tìm kiếm user
      setLoading(true);
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/user/${decodedText}`,
          {
            method: "GET",
          }
        );
        if (!response.ok) {
          window.alert("Không tìm thấy người dùng với ID: " + decodedText);
          setLoading(false);
          return;
        }
        const userData = await response.json();
        setResult(userData);
        toast.success("Quét mã QR thành công!");
        
        // Gọi getBorrowCard trực tiếp sau khi có user data
        await fetchBorrowCardsForUser(userData.id);
      } catch (e) {
        console.log(e);
        toast.error("Có lỗi xảy ra khi tìm kiếm người dùng");
        setLoading(false);
      }
      // Không set loading = false ở đây vì fetchBorrowCardsForUser sẽ xử lý
    }
  };

  // Xử lý khi quét barcode sách thành công
  const handleBarcodeScanSuccess = async (decodedText, scanType) => {
    console.log("Barcode scanned:", decodedText);
    if (scanType === "barcode") {
      setShowBarcodeScanner(false);
      // Tìm sách con theo barcode
      setLoading(true);
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/bookchild/barcode/${decodedText}`,
          {
            method: "GET",
          }
        );
        if (!response.ok) {
          window.alert("Không tìm thấy sách với barcode: " + decodedText);
          setLoading(false);
          return;
        }
        const childBook = await response.json();
        setResultChild(childBook);
        toast.success("Quét barcode sách thành công!");
        setLoading(false);
      } catch (e) {
        console.log(e);
        toast.error("Có lỗi xảy ra khi tìm kiếm sách");
        setLoading(false);
      }
    }
  };
  //hàm lấy phiếu mượn
  const fetchBorrowCardsForUser = useCallback(async (userId) => {
    console.log("🔍 fetchBorrowCardsForUser called with userId:", userId);
    console.log("🔍 lastFetchedUserId.current:", lastFetchedUserId.current);
    console.log("🔍 isFetchingRef.current:", isFetchingRef.current);
    
    if (!userId) {
      console.log("❌ No userId provided");
      return;
    }
    
    // Kiểm tra xem đang fetch hay đã fetch cho userId này chưa
    if (isFetchingRef.current) {
      console.log("⏳ Already fetching, skipping...");
      return;
    }
    
    if (lastFetchedUserId.current === userId) {
      console.log("✅ Already fetched borrow cards for user", userId);
      return;
    }
    
    console.log("🚀 Fetching borrow cards for user", userId);
    isFetchingRef.current = true;
    lastFetchedUserId.current = userId;
    setLoading(true);
    try {
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
      console.log("Lỗi khi tìm phiếu mượn của user ", userId, ": ", e);
    } finally {
      isFetchingRef.current = false;
      setLoading(false);
    }
  }, []); // Empty dependency array - hàm này không bị tạo lại
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
    lastFetchedUserId.current = null;
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
          setResultChild(null); // Reset sau khi xử lý
          return;
        }
        if (foundBook.checked) {
          window.alert("Sách cha đã được chọn!");
          setResultChild(null); // Reset sau khi xử lý
          return;
        }
        const updatedBooks = currentInfo.map((book) =>
          book.maSach === parentId ? { ...book, checked: true } : book
        );
        setInfo(updatedBooks);
        // Push barcode thay vì id vì backend cần barcode
        children.push(resultChild.barcode);
        setResultChild(null); // Reset sau khi xử lý thành công
      } else {
        // Trả sách - so sánh với childBookId (là String)
        const childId = resultChild.id;
        console.log("Tìm sách con với ID:", childId);
        console.log("Danh sách sách hiện tại:", currentInfo);
        
        // ✅ Kiểm tra currentInfo có null không
        if (!currentInfo || !Array.isArray(currentInfo)) {
          console.error("currentInfo không hợp lệ:", currentInfo);
          window.alert("Danh sách sách không hợp lệ!");
          return;
        }
        
        const foundBook = currentInfo.find(
          (book) => {
            // childId có thể là object hoặc string
            const bookChildId = typeof book.childId === 'object' 
              ? book.childId?.childBookId 
              : book.childId;
            console.log("So sánh:", bookChildId, "===", childId);
            return bookChildId === childId || bookChildId === String(childId);
          }
        );
        
        if (!foundBook) {
          console.error("Không tìm thấy sách với childBookId:", childId);
          window.alert("Sách không tồn tại trong danh sách đã mượn!");
          setResultChild(null); // Reset sau khi xử lý
          return;
        }
        if (foundBook.checked) {
          window.alert("Sách này đã được chọn!");
          setResultChild(null); // Reset sau khi xử lý
          return;
        }
        const updatedBooks = currentInfo.map((book) => {
          const bookChildId = typeof book.childId === 'object'
            ? book.childId?.childBookId
            : book.childId;
          return bookChildId === childId || bookChildId === String(childId)
            ? { ...book, checked: true }
            : book;
        });
        setInfo(updatedBooks);
        setResultChild(null); // Reset sau khi xử lý thành công
      }
    }
  }, [resultChild]);
  useEffect(() => {
    if (currentInfo?.length > 0) {
      // ✅ Với trả sách: cho phép hoàn tất ngay cả khi chưa quét hết
      // Với mượn sách: phải quét đủ tất cả sách
      const isReturning = currentChoose?.status === "Đang mượn" || currentChoose?.status === "Đã hết hạn";
      
      if (isReturning) {
        // Trả sách: cho phép hoàn tất nếu ít nhất 1 sách đã được check
        const atLeastOneChecked = currentInfo.some((book) => book.checked === true);
        setDone(atLeastOneChecked);
        console.log("Trả sách - atLeastOneChecked:", atLeastOneChecked);
      } else {
        // Mượn sách: phải quét đủ tất cả sách
        const allChecked = currentInfo.every((book) => book.checked === true);
        setDone(allChecked);
        console.log("Mượn sách - allChecked:", allChecked);
      }
    } else {
      setDone(false); // reset nếu danh sách rỗng
    }
  }, [currentInfo, currentChoose]);
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
        // MƯỢN SÁCH: gọi API /borrow với danh sách barcode
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
        // TRẢ SÁCH: gọi API /return-one cho từng sách đã check
        const checkedBooks = currentInfo.filter(book => book.checked);
        
        for (const book of checkedBooks) {
          // ✅ Lấy barcode đúng: có thể là string hoặc nested object
          let barcode;
          if (typeof book.childId === 'object' && book.childId?.childBookId) {
            barcode = book.childId.childBookId;
          } else if (typeof book.childId === 'string') {
            barcode = book.childId;
          } else {
            console.error("Không xác định được barcode từ book:", book);
            continue;
          }
          
          console.log("Trả sách với barcode:", barcode);
          
          const returnResponse = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/borrow-cards/return-one/${currentChoose?.id}`,
            {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ barcode: String(barcode) }),
            }
          );
          
          if (!returnResponse.ok) {
            const errorText = await returnResponse.text();
            throw new Error(`Không thể trả sách ${barcode}: ${errorText}`);
          }
        }
        
        response = { ok: true }; // Đánh dấu thành công
        setChildren([])
        console.log("Đã trả các sách:", checkedBooks.map(b => b.childId))
      }

      if (!response.ok) {
        window.alert("Không thể cập nhật phiếu mượn");
      } else {
        window.alert("Updated");
        
        // ✅ Refresh dữ liệu trước
        await getBorrowCard();
        
        // ✅ Nếu đang trả sách, reload lại thông tin phiếu mượn để cập nhật
        if (currentChoose.status === "Đang mượn" || currentChoose.status === "Đã hết hạn") {
          // Tìm phiếu mượn đã cập nhật từ server
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/borrow-cards/${currentChoose.id}`,
            { method: "GET" }
          );
          
          if (response.ok) {
            const updatedCard = await response.json();
            setCurrent(updatedCard); // Cập nhật currentChoose với data mới
            // getBookIdsInfo sẽ tự động chạy lại nhờ useEffect
          } else {
            handleCloseCard(); // Nếu lỗi thì đóng modal
          }
        } else {
          handleCloseCard(); // Mượn sách xong thì đóng modal
        }
      }
    } catch (error) {
      console.error(error);
      window.alert(error.message || "Có lỗi xảy ra khi cập nhật");
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
    <>
      <Toaster position="top-center" />

      {/* LOADING SCREEN */}
      {(userLoading || (cardsLoading && !userResult && !borrowCards.length)) && (
      <div className="flex w-full h-screen justify-center items-center">
        <ThreeDot color="#062D76" size="large" text="Đang xử lý..." textColor="#062D76" />
      </div>
      )}

      {/* STEP 1: SCAN USER hoặc màn hình chính */}
      {(!userResult && !userLoading)
        ? (
        <div className="flex flex-col items-center h-auto w-fit mt-10 mb-10 gap-5 px-10 py-6 bg-white rounded-lg drop-shadow-lg">
          <Link href="/">
          <img width={200} height={100} src="/images/logoN.png" alt="Logo" className="object-contain" />
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

          <p className="text-2xl font-semibold mt-6">Hoặc</p>

          {/* Nút quét QR code */}
          <button
          onClick={() => setShowQRScanner(true)}
          className="flex items-center gap-2 px-6 py-3 bg-[#062D76] text-white rounded-lg hover:bg-[#04204F] transition-colors"
          >
          <QrCode size={24} />
          <span className="font-semibold">Quét mã QR người dùng</span>
          </button>

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
        )
        : (
        <div className="flex flex-col w-full h-full min-h-screen items-center py-6 gap-5 bg-[#EFF3FB]">
          {/*Nút Back*/}
          <div className="fixed top-5 left-5 md:left-57">
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
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
            className="w-full h-full bg-black opacity-[80%] absolute top-0 left-0"
            onClick={() => handleCloseCard()}
            ></div>
            <div className="flex lg:w-2/3 h-[400px] w-fit lg:h-[600px] bg-white p-6 rounded-lg shadow-lg justify-between py-10 relative">
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
              onOpenBarcodeScanner={() => setShowBarcodeScanner(true)}
              />
            </div>
            <p className="absolute bottom-5 flex text-white italic z-100 text-sm">
              Nhấn vào khoảng trống để đóng
            </p>
            </div>
          </div>
          )}
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
        )}

      {/* Modal quét QR code người dùng */}
      <CameraScanner
      isOpen={showQRScanner}
      scanType="qrcode"
      onScanSuccess={(decodedText) => handleQRScanSuccess(decodedText, "qrcode")}
      onClose={() => setShowQRScanner(false)}
      />

      {/* Modal quét barcode sách */}
      <CameraScanner
      isOpen={showBarcodeScanner}
      scanType="barcode"
      onScanSuccess={(decodedText) => handleBarcodeScanSuccess(decodedText, "barcode")}
      onClose={() => setShowBarcodeScanner(false)}
      />

    </>
    );
};

export default ScanPage;