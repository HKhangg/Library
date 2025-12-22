"use client";
import React, { useEffect, useRef, useState } from "react";
import { Button } from "../components/ui/button";
import { ThreeDot } from "react-loading-indicators";
import toast from "react-hot-toast";
import { format } from 'date-fns';
import { Book, BookDashed, CalendarClock, Camera, FolderSearch, Undo2, Upload } from "lucide-react";
import UploadChild from "./childBook/page";
import VideoPlayer from "../components/ui/VideoPlayer";
import ParticlesBackground from "../components/ui/ParticlesBackground";

const UploadImage = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [borrowCard,setBorrowCard] = useState(null)
  const [result, setResult] = useState(null);
  const [currentChoose, setCurrent] = useState(null)
  const [currentInfo, setInfo] = useState(null)
  const [resultChild, setResultChild] = useState(null);
  const [done, setDone] = useState(false);
  const [children, setChildren] = useState([])
  const [loadingLost, setLoadingLoad] = useState(false)
  // Hàm xử lý khi người dùng chọn ảnh
  const onFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };
  
  // Hàm gửi vừa tải ảnh lên backend
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
        "http://localhost:8080/api/upload/barcodeImage",
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.error) 
        setLoading(false);       
        return;
      }

      const result = await response.json();
      setResult(result);
      setSelectedFile(null)
    } catch (error) {
      console.error("Lỗi khi gửi ảnh:", error);
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
          "http://localhost:8080/api/upload/barcodeImage",
          {
            method: "POST",
            body: formData,
          }
        );
  
        if (!response.ok) {
          const error = await response.json();
          toast.error(error.error) 
          setLoading(false);       
          return;
        }
  
        const result = await response.json();
        setResult(result);
        setSelectedFile(null)
      } catch (error) {
        console.error("Lỗi khi gửi ảnh:", error);
      }
      setLoading(false);
    }
  };
  //thêm Event để nhận message (ảnh chụp)
  useEffect(()=>{
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  },[])
  //hàm chuyển ảnh chụp -> ảnh gửi được
  const base64ToFile = (base64, filename) => {
    const arr = base64.split(",");
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) u8arr[n] = bstr.charCodeAt(n);
    return new File([u8arr], filename, { type: mime });
  };
  //hàm mở tab camera
  const openCamera = () => {
    const width = 800;
    const height = 600;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    window.open("/scan/camera", "_blank", `width=${width},height=${height},left=${left},top=${top}`);
  };
  //hàm xử lý khi nhập id
  const handleEnter = async(text) =>{
    if(text==""){
      alert("Vui lòng nhập mã trước khi tìm kiếm");
      return;
    }
    setLoading(true);
    try{
      const response = await fetch(
        `http://localhost:8080/api/user/${text}`,
        {
          method: "GET",
        }
      );
      if (!response.ok) {
        toast.error("Không tìm thấy người dùng") 
        setLoading(false);       
        return;
      }  
      const result = await response.json();
      setResult(result);
    }
    catch(e){
      console.log(e)
    }
    setLoading(false);
  }
  //hàm lấy phiếu mượn của người dùng
  const getBorrowCard = async()=>{
    setLoading(true)
    try{
      const userId = result?.id;
      var response = await fetch(
        `http://localhost:8080/api/borrow-cards/user/${userId}`,
        {
          method: "POST",
        }
      );
      if(!response.ok){
        console.log("Không tìm thấy phiếu mượn nào")
        setLoading(false);       
        return;
      }
      if(response.json.length === 0){
        setBorrowCard([])
      }
      const res = await response.json();
      setBorrowCard(res)
      console.log(res)
    }catch(e){
      console.log("Lỗi khi tìm phiếu mượn của user ",result?.id,": ",e)
    }
    setLoading(false)
  }
  useEffect(()=>{
    if(result){
      getBorrowCard()
    }
  },[result])
  //hàm lấy thông tin sách cha
  const fetchBookInfo = async (bookId) => {
    const res = await fetch(`http://localhost:8080/api/book/${bookId}`);
    return res.json();
  };
  //hàm lấy thông tin sách của phiếu mượn
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
  // gọi hàm khi phiếu mượn đc chọn và chưa quét mã nào
  useEffect(()=>{
    if(currentChoose && !resultChild){
      getBookIdsInfo()
    }
    else if(currentChoose && resultChild){}
    else{
      setInfo(null)
    }
  },[currentChoose])
  //hàm đi về giao diện quét mã người dùng
  const handleGoBack = () =>{
    setResult(null)
    setSelectedFile(null)
    setLoading(false)
    setBorrowCard(null)
  }
  //Nút quay lại
  const BackButton = () =>{
    return(
    <div className="top-5 left-5 md:left-57 fixed">
            <Button
              title={"Quay Lại"}
              className="bg-[#062D76] rounded-3xl w-10 h-10 cursor-pointer"
              onClick={() => {
                handleGoBack();
              }}
            >
              <Undo2 className="w-12 h-12" color="white" />
            </Button>
    </div>
    )
  }
  //Thẻ sách trong phiếu mượn
  const BookInfo = ({book}) =>{
    return(
      <div className={`w-full flex justify-between items-center border-1 ${book?.checked===false?"bg-white":"bg-green-100"} my-3 px-5`}>
        <div className="flex flex-col">
          {/*<p className={`font-semibold ${currentChoose?.status!=="Đã yêu cầu"?"":"hidden"}`}>Id:&nbsp;{book?.childId}</p> // dòng này chỉ show khi debug*/}
          <p className="font-semibold">{book?.tenSach}</p>
          <p>{book?.tenTacGia}</p>
          <p>{book?.nxb}</p>
          <p>Vị trí:&nbsp;{book?.viTri}</p>
        </div>
        <img src={book?.hinhAnh[0]} width={140} height={140}/>
      </div>
    )
  }
  //Thông tin phiếu (dùng chung)
  const CardInfo = ({card, className}) =>{
    return(
      <div className={`flex flex-col gap-3 ${className}`}>
        <p><strong>ID phiếu mượn:</strong>&nbsp;{card?.id}</p>
        <p><strong>Ngày đăng ký mượn:</strong>&nbsp;{format(new Date(card?.borrowDate), "dd/MM/yyyy HH:mm:ss")}</p>
        <p className={`${card?.status==="Đã yêu cầu"?"":"hidden"}`}><strong>Ngày lấy sách dự kiến:</strong>&nbsp;{format(new Date(card?.getBookDate), "dd/MM/yyyy HH:mm:ss")}</p>
        <p className={`${card?.status==="Đã yêu cầu"?"hidden":""}`}><strong>Ngày trả sách dự kiến:</strong>&nbsp;{format(new Date(card?.dueDate?card?.dueDate:"2025-01-01T10:15:16.696+00:00"), "dd/MM/yyyy HH:mm:ss")}</p>
        <p><strong>Trạng thái:</strong>&nbsp;{card?.status}</p>
      </div>
    )
  }
  //Thẻ phiếu mượn đang mở
  const CurrentCard = () =>{
    return(
      <div className="fixed inset-0 items-center justify-center z-50 flex">
            <div className="w-full h-full bg-black opacity-[80%] absolute top-0 left-0" onClick={()=>handleCloseCard()}></div>
            <div className="flex w-3/4 lg:w-2/3 h-[400px] lg:h-[600px] bg-white p-6 rounded-lg shadow-lg fixed justify-between py-10 bg-[url('/images/CurrentCard.png')] bg-cover bg-center">
              <div className="flex flex-col w-1/2">
              <CardInfo card={currentChoose} className="ml-5"/>
              <div className="h-[400px] overflow-y-auto flex flex-col items-center">
                {currentInfo?.map((book,index)=>{
                    return <BookInfo book={book} key={index}/>
                })}
              </div>
              <Button className={`self-end w-[150px] flex z-100 bg-red-700 mb-2 ${currentChoose.status == "Đang mượn"?"":"hidden"}`} onClick={()=>{handleLost()}}>
                <BookDashed className="w-12 h-12" color="white"/>
                {loadingLost?"Đang lập phiếu phạt":"Báo mất sách"}
                </Button>
              <Button className="self-end w-full flex z-100 bg-[#062D76]" disabled={!done} onClick={()=>{handleUpdateBorrowCard()}}>Hoàn tất</Button>
              </div>
              <div className="flex flex-col w-1/2 items-center justify-center">
                <UploadChild resultChild={resultChild} setResultChild={setResultChild}/>              
              </div>
            </div>
            <p className="absolute bottom-5 flex text-white italic z-100 text-sm">Nhấn vào khoảng trống để đóng</p>
      </div>
    )
  }
  //Thẻ phiếu mượn trong danh sách phiếu
  const BorrowCard = ({card}) =>{
    return(
      <div className="w-5/6 my-2 px-10 py-5 bg-white rounded-lg hover:cursor-pointer drop-shadow-md"
      onClick={()=>setCurrent(card)}
      >
      <CardInfo card={card}/>
      </div>
    )
  }
  //Khi mã sách con được quét
  useEffect(()=>{
    if (resultChild && resultChild?.parentBook?.id) {
      if(currentChoose?.status==="Đã yêu cầu"){  
      const parentId = resultChild.parentBook.id;      
      const foundBook = currentInfo.find((book) => book.id === parentId);
      if (!foundBook) {
        toast.error("Sách cha không tồn tại trong danh sách!");
        return;
      }
      if (foundBook.checked) {
        toast.error("Sách cha đã được chọn!");
        return;
      }
      const updatedBooks = currentInfo.map((book) =>
        book.id === parentId ? { ...book, checked: true } : book
      );
      setInfo(updatedBooks);
      children.push(resultChild.childBook.id)
      }
      else{        
      const childId = resultChild.childBook.id;
      const foundBook = currentInfo.find((book) => book.childId === childId);
      if (!foundBook) {
        toast.error("Sách không tồn tại trong danh sách đã mượn!");
        return;
      }
      if (foundBook.checked) {
        toast.error("Sách này đã được chọn!");
        return;
      }
      const updatedBooks = currentInfo.map((book) =>
        book.childId === childId ? { ...book, checked: true } : book
      );
      setInfo(updatedBooks);
      }
    }
  },[resultChild])
  //Kiểm tra xem danh sách sách trong phiếu đã được quét hết chưa
  useEffect(()=>{
    if (currentInfo?.length > 0) {
      const allChecked = currentInfo.every(book => book.checked === true);
      setDone(allChecked);
    } else {
      setDone(false); // reset nếu danh sách rỗng
    }
  },[currentInfo])
  //Đóng phiếu đang mở
  const handleCloseCard = () =>{
    setCurrent(null)
    setInfo(null)
    setResultChild(null)
    setDone(false)
  }
  //Cập nhật lại phiếu mượn (lấy/trả)
  const handleUpdateBorrowCard = async()=>{
    setLoading(true)
    try {
      if(currentChoose.status==="Đã yêu cầu"){
      const response = await fetch(
        `http://localhost:8080/api/borrow-cards/borrow/${currentChoose?.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(children),
        }
      );
      if(!response.ok){
        toast.error("Không thể cập nhật phiếu mượn")
        setLoading(false);       
        return;
      }
     }
     else{
      const response = await fetch(
        `http://localhost:8080/api/borrow-cards/return/${currentChoose?.id}`,
        {
          method: "PUT",
        }
      );
      if(!response.ok){
        toast.error("Không thể cập nhật phiếu mượn")
        setLoading(false);       
        return;
      }
      }
    } catch (error) {
      console.log(error)
      return;
    }
    toast.success("Updated")
    handleCloseCard()
    getBorrowCard()
    setLoading(false)
  }

  //hàm báo mất sách
  const handleLost = async() =>{
    const lostBooks = currentInfo.filter(book => book.checked === false);
    const lostNumber = lostBooks.length;
    if (confirm(`Lập phiếu phạt Mất sách cho ${lostNumber} quyển sách chưa quét?`)) {
      setLoadingLoad(true);
      try {
        for (const book of lostBooks) {          
            // Gọi API cho từng cuốn sách
            const data = {
              userId: result?.id,
              noiDung: "Làm mất sách",
              soTien: 0,
              cardId: book?.childId
            }
            const response = await fetch('http://localhost:8081/addFine',{
              method: 'POST',
              headers: {
                "Content-Type": "application/json"
              },
              body: JSON.stringify(data)
            })  
            // Đánh dấu sách là đã xử lý
            setInfo(prevInfo =>
              prevInfo.map(b =>
                b.id === book.id ? { ...b, checked: true } : b
              )
            );
        }
      } catch (error) {
        console.error("Lỗi khi xử lý phiếu phạt:", error);
        alert("Đã xảy ra lỗi khi xử lý phiếu phạt.");
      }
      setLoadingLoad(false);
      }
  }
  const inputRef = useRef(null);

  const handleClick = () => {
    inputRef.current?.click(); // bấm nút sẽ trigger input file ẩn
  };
  // Các phương thức lấy mã người dùng (quét, tải, chụp)
  const ScanUser = () =>{
    const [text, setText] = useState("")  // tránh re-render
    return(
      <div className="flex flex-col w-full items-center mb-10 gap-5 px-10 py-6">
          <img width={200} height={200} className="rounded-4xl" src="/images/logo.jpg"/>
          <p className="text-3xl font-semibold text-#062D76">ReadHub</p>
          <p className="text-xl font-semibold ">Vui lòng nhập mã người dùng của bạn</p>
          <div className="flex flex-col w-full items-center justify-center gap-1">
            <input type="text" value={text} onChange={(e)=>setText(e.target.value)} 
            placeholder="Nhập user ID của bạn"
            className="bg-white rounded w-80 h-10"
            onKeyDown={(e) => e.key === "Enter" && handleEnter(text)}
            />
            <p className="text-sm italic text-[#062D76]">Nhập Enter để tiến hành tìm kiếm</p>
          </div>
          <p className="text-2xl font-semibold ">Hoặc</p>
          <p className="text-xl font-semibold ">Tải ảnh barcode mã người dùng của bạn</p>
          <div className="flex gap-5">
            <input type="file" onChange={onFileChange} className="bg-white self-center rounded hidden" ref={inputRef}/>
            {/* Nút chọn file */}
            <Button onClick={handleClick} className="bg-white text-black border border-gray-300 hover:bg-gray-100" >
              <FolderSearch className="w-12 h-12"/>
              Chọn ảnh
            </Button>
            {/* Hiển thị tên file đã chọn */}
            {selectedFile && (<div className="text-sm self-center text-gray-600 italic max-w-64 truncate">{selectedFile.name}</div>)}
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
    )
  }
  //Hiển thị kết quả là thông tin người dùng
  const ResultCard = () =>{
    return(
      <div className="flex bg-[url('/images/ResultCard.png')] bg-cover bg-center w-1/2 rounded-lg mt-2 drop-shadow-lg p-5 gap-10 items-center justify-center">
          <img src={`${result?.gioiTinh==="Nu"?"/images/avatar-girl.svg":"/images/avatar-boy.svg"}`} className="w-48 h-48 rounded-full ml-10"/>
          <div className="flex flex-col gap-[10px] w-2/3">
          <p><span className="font-bold">ID Người dùng:</span>&nbsp;{result?.id}</p>
          <p><span className="font-bold">Tên người dùng:</span>&nbsp;{result?.fullname}</p>
          <p><span className="font-bold">Email:</span>&nbsp;{result?.email}</p>
          <p><span className="font-bold">Ngày sinh:</span>&nbsp;{formatDate(result?.ngaySinh)}</p>
          <p><span className="font-bold">Giới tính:</span>&nbsp;{result?.gioiTinh==="Nu"?"Nữ":"Nam"}</p>
          </div>
        </div>
    )
  }
  //"yyyy-MM-dd" => "dd/MM/yyyy"
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN"); // Kết quả: 22/04/2025
  };
  //Trang quét mã người dùng (2 video và component phương thức quét)
  const ScanPage = () =>{
    return(
    <div className="relative w-full h-screen overflow-hidden flex">
        {/* Video bên trái */}
        <VideoPlayer
        src="/videos/left.mp4"
        startTime={0}
        className="absolute left-0 top-0 h-full object-cover w-1/3 z-0"
        />
        {/* Video bên phải */}
        <VideoPlayer
        src="/videos/right.mp4"
        startTime={0}
        className="absolute right-0 top-0 h-full object-cover w-1/3 z-0"
      /> 
        {/* Component chính nằm giữa */}
        <div className="relative z-10 m-auto w-[600px] max-w-full px-6 bg-white/80 backdrop-blur-md rounded-xl shadow-xl">
          <ScanUser />
        </div>
      </div>
    )
  }
  return (
    <div className="flex w-full min-h-screen h-full flex-col gap-2 items-center bg-[#EFF3FB]">
      {loading ? (
        <div className="flex w-full h-screen justify-center items-center">
          <ThreeDot
            color="#062D76"
            size="large"
            text="Vui lòng chờ"
            variant="bounce"
            textColor="#062D76"
          />
        </div>
      ) : !result ? (
        <ScanPage />
      ) : (
        <div className="flex flex-col w-full h-full min-h-screen items-center py-6 gap-5 bg-[#EFF3FB]">
          {/*Nút Back*/}
          <BackButton />
          {/*Phiếu mượn đang chọn*/}
          {currentChoose && <CurrentCard />}
          {/*Thông tin người dùng*/}
          <ResultCard />
          {/*Danh sách phiếu mượn của người dùng*/}
          <div className="w-full px-10 md:px-40 z-10">
            <div className="w-full grid grid-cols-1 lg:grid-cols-2">
              <div>
                <div className="flex bg-white text-[#062D76] rounded p-5 justify-center items-center gap-5">
                  <Book width={24} height={24} />
                  <p className="text-lg font-semibold">Phiếu mượn đã yêu cầu</p>
                </div>
                <div className="flex flex-col items-center w-full">
                  {(
                    borrowCard?.filter(
                      (c) =>
                        c.status === "Đã yêu cầu" &&
                        new Date(c.getBookDate) > new Date()
                    ) || []
                  ).length < 1 ? (
                    <div className="w-4/5 h-[300px] flex flex-col justify-center items-center">
                      <img
                        src={"/images/not found.png"}
                        width={300}
                        height={300}
                      />
                      <p className="font-semibold text-gray-700 italic text-xl text-center">
                        Bạn đang không có phiếu mượn đã yêu cầu nào vào lúc này.
                      </p>
                    </div>
                  ) : (
                    borrowCard
                      ?.filter(
                        (c) =>
                          c.status === "Đã yêu cầu" &&
                          new Date(c.getBookDate) > new Date()
                      )
                      .map((card, index) => (
                        <BorrowCard key={index} card={card} />
                      ))
                  )}
                </div>
              </div>
              <div>
                <div className="flex bg-white text-[#062D76] rounded p-5 justify-center items-center gap-5">
                  <CalendarClock width={24} height={24} />
                  <p className="text-lg font-semibold">Phiếu mượn đang mượn</p>
                </div>
                <div className="flex flex-col items-center w-full">
                  {borrowCard?.filter((c) => c.status === "Đang mượn").length <
                  1 ? (
                    <div className="w-4/5 h-[300px] flex flex-col justify-center items-center">
                      <img
                        src={"/images/not found.png"}
                        width={300}
                        height={300}
                      />
                      <p className="font-semibold text-gray-700 italic text-xl text-center">
                        Bạn đang không có phiếu mượn đang mượn nào vào lúc này.
                      </p>
                    </div>
                  ) : (
                    borrowCard
                      ?.filter((c) => c.status === "Đang mượn")
                      .map((card, index) => {
                        return <BorrowCard key={index} card={card} />;
                      })
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadImage;
