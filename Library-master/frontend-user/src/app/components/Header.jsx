"use client";
import { usePathname } from "next/navigation";
import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
} from "@headlessui/react";
import { Menu as MenuIcon, X, Bell, ShoppingCart, User2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import axios from "axios";
import didYouMean from "didyoumean";

const navigation = [
  { name: "Trang chủ", href: "/" },
  { name: "Thể loại", href: "/Categories" },
  { name: "Giới thiệu", href: "/About" },
  { name: "Tin sách", href: "/News" },
];

const CartBadge = ({ count }) => {
  return (
    <div
      className="absolute self-center items-center right-0.5 px-1 text-[0.65rem] font-medium text-center justify-center text-white bg-[#F7302E] rounded-full"
      role="status"
      aria-label={`${count} items`}
    >
      {count}
    </div>
  );
};

const NotificationBadge = ({ count }) => {
  return (
    <div
      className="absolute self-center items-center right-0.5 px-1 text-[0.65rem] font-medium text-center justify-center text-white bg-[#F7302E] rounded-full"
      role="status"
      aria-label={`${count} unread notifications`}
    >
      {count}
    </div>
  );
};

const Header = () => {
  const pathname = usePathname();
  const router = useRouter();

  const [cartCount, setCartCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isHovered, setIsHovered] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [books, setBooks] = useState([]);
  const [bookTitles, setBookTitles] = useState([]);
  const [bookAuthors, setBookAuthors] = useState([]);
  const [bookPublishers, setBookPublishers] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);

  const removeVietnameseTones = (str) => {
    return str
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D")
      .toLowerCase();
  };

  useEffect(() => {
    if (!searchTerm) {
      setSuggestions([]);
      return;
    }

    const normalizedTerm = removeVietnameseTones(searchTerm);
    let filtered = books.filter((book) => {
      const bookData = [
        book.title,
        book.author,
        book.publisher,
        book.year?.toString(),
      ]
        .filter((field) => field != null)
        .map((field) => removeVietnameseTones(field));
      return bookData.some((field) => field.includes(normalizedTerm));
    });

    if (filtered.length === 0) {
      const correctionTitle = didYouMean(
        normalizedTerm,
        bookTitles.map(removeVietnameseTones)
      );
      const correctionAuthor = didYouMean(
        normalizedTerm,
        bookAuthors.map(removeVietnameseTones)
      );
      const correctionPublisher = didYouMean(
        normalizedTerm,
        bookPublishers.map(removeVietnameseTones)
      );

      if (correctionTitle) {
        filtered = books.filter((book) =>
          removeVietnameseTones(book.title).includes(
            removeVietnameseTones(correctionTitle)
          )
        );
      } else if (correctionAuthor) {
        filtered = books.filter((book) =>
          removeVietnameseTones(book.author).includes(
            removeVietnameseTones(correctionAuthor)
          )
        );
      } else if (correctionPublisher) {
        filtered = books.filter((book) =>
          removeVietnameseTones(book.publisher).includes(
            removeVietnameseTones(correctionPublisher)
          )
        );
      }
    }

    setSuggestions(filtered);
  }, [searchTerm, books, bookTitles, bookAuthors, bookPublishers]);

  const MAX_KEYWORDS = 5;

  const saveSearchTermToCache = (term) => {
    if (!term.trim()) return;
    const stored = JSON.parse(localStorage.getItem("searchKeywords") || "[]");
    const updated = stored.filter((item) => item !== term);
    updated.unshift(term);
    const limited = updated.slice(0, MAX_KEYWORDS);
    localStorage.setItem("searchKeywords", JSON.stringify(limited));
  };

  const handleSelect = (book) => {
    console.log("Selected book:", book);
    setSearchTerm(book.title);
    setSuggestions([]);
    router.push(`/book-detail/${book.id}`);
  };

  const handleSearch = async () => {
    try {
      let res;
      if (!searchTerm.trim()) {
        res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/book`);
      } else {
        res = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/book/search2`,
          { params: { query: searchTerm } }
        );
      }
      console.log("API Response:", res.data);
      saveSearchTermToCache(searchTerm.trim());
      const data = res?.data || [];

      const convertedBooks = Array.isArray(data)
        ? data.map((book) => ({
            id: book.maSach,
            imageSrc: book.hinhAnh?.[0]?.trimEnd() || "/placeholder.png", // Làm sạch URL
            available: book.tongSoLuong > 0,
            title: book.tenSach,
            author: book.tenTacGia,
            publisher: book.nxb,
            year: book.nam,
          }))
        : [];

      setBooks(convertedBooks);
      setSearchResults(convertedBooks);
      setBookTitles(convertedBooks.map((book) => book.title));
      setBookAuthors(convertedBooks.map((book) => book.author));
      setBookPublishers(convertedBooks.map((book) => book.publisher));
      setShowResults(true);
    } catch (error) {
      console.error("Lỗi khi tìm kiếm sách:", error);
      setBooks([]);
      setSearchResults([]);
      setShowResults(false);
    }
  };

  const [readStatus, setReadStatus] = useState(() => {
    const saved = localStorage.getItem("notificationReadStatus");
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    localStorage.setItem("notificationReadStatus", JSON.stringify(readStatus));
  }, [readStatus]);

  const user = JSON.parse(localStorage.getItem("persist:root")) || { id: "54" };

  const fetchCart = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/cart/${user.id}`
      );
      if (response.ok) {
        const data = await response.json();
        const booksInCart = data.data || [];
        setCartCount(booksInCart.length);
      } else {
        console.error("Lỗi khi lấy giỏ hàng");
      }
    } catch (error) {
      console.error("Có lỗi xảy ra khi lấy giỏ hàng:", error);
    }
  };

  const fetchNotifications = async () => {
    const notificationList = [];
    try {
      const dashboardResponse = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/book/dashboard`
      );
      if (dashboardResponse.status === 200) {
        const newBooksCount = dashboardResponse.data.newBooksThisWeek || 0;
        if (newBooksCount > 0) {
          notificationList.push({
            id: `new-books-${new Date().toISOString()}`,
            type: "new-books",
            message: `Có ${newBooksCount} sách mới trong tuần này!`,
            link: "/Homepage",
            timestamp: new Date().toISOString(),
          });
        }
      }

      const userId = user.id;
      const borrowCardsResponse = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/borrow-cards/user/${userId}`
      );
      if (borrowCardsResponse.status === 200) {
        const borrowCards = borrowCardsResponse.data;
        const currentDate = new Date();

        for (const card of borrowCards) {
          if (card.borrowedBooks && Array.isArray(card.borrowedBooks)) {
            for (const borrowedBook of card.borrowedBooks) {
              const bookResponse = await axios.get(
                `${process.env.NEXT_PUBLIC_API_URL}/api/book/${borrowedBook.bookId}`
              );
              const bookName =
                bookResponse.status === 200
                  ? bookResponse.data.tenSach
                  : `Sách ${borrowedBook.bookId}`;
              const dueDate = card.dueDate ? new Date(card.dueDate) : null;
              const daysDiff = dueDate
                ? Math.ceil((dueDate - currentDate) / (1000 * 60 * 60 * 24))
                : null;
              const daysSinceDue = dueDate
                ? Math.ceil((currentDate - dueDate) / (1000 * 60 * 60 * 24))
                : null;

              if (card.status === "Đã yêu cầu") {
                notificationList.push({
                  id: `borrow-request-${card.id}-${borrowedBook.bookId}`,
                  type: "borrow-request",
                  message: `Bạn đã yêu cầu mượn sách ${bookName} thành công.`,
                  link: `/borrowed-card/${card.id}`,
                  timestamp: card.borrowDate || new Date().toISOString(),
                });
              }

              if (card.status === "Đang mượn") {
                notificationList.push({
                  id: `borrow-success-${card.id}-${borrowedBook.bookId}`,
                  type: "borrow-success",
                  message: `Bạn đã mượn sách ${bookName} thành công.`,
                  link: `/borrowed-card/${card.id}`,
                  timestamp: card.getBookDate || new Date().toISOString(),
                });

                if (daysDiff === 7 || daysDiff === 1) {
                  notificationList.push({
                    id: `due-reminder-${card.id}-${borrowedBook.bookId}-${daysDiff}`,
                    type: "due-reminder",
                    message: `Sách ${bookName} đã gần tới hạn mượn sách. Hãy gia hạn hoặc trả sách.`,
                    link: `/borrowed-card/${card.id}`,
                    timestamp: new Date().toISOString(),
                  });
                }

                if (daysSinceDue === 1) {
                  notificationList.push({
                    id: `overdue-${card.id}-${borrowedBook.bookId}`,
                    type: "overdue",
                    message: `Bạn đã quá hạn mượn sách ${bookName}!`,
                    link: `/borrowed-card/${card.id}`,
                    timestamp: new Date().toISOString(),
                  });
                }
              }

              if (card.status === "Đã trả") {
                notificationList.push({
                  id: `return-success-${card.id}-${borrowedBook.bookId}`,
                  type: "return-success",
                  message: `Bạn đã trả sách ${bookName} thành công.`,
                  link: `/borrowed-card/${card.id}`,
                  timestamp: card.dueDate || new Date().toISOString(),
                });
              }
            }
          }
        }
      }

      const sortedNotifications = notificationList.sort(
        (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
      );
      setNotifications(sortedNotifications);
      const unread = sortedNotifications.filter(
        (n) => !readStatus[n.id]
      ).length;
      setUnreadCount(unread);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching notifications:", err);
      setError(err.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
    fetchNotifications();
  }, [user.id]);

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("persist:root");
    router.push("/");
  };

  const handleNotificationClick = (notificationId, link) => {
    setReadStatus((prev) => ({ ...prev, [notificationId]: true }));
    router.push(link);
  };

  const handleBellClick = () => {
    router.push("/notification");
  };

  useEffect(() => {
    setSearchTerm("");
    setSuggestions([]);
    setSearchResults([]);
    setShowResults(false);
  }, [pathname]);

  return (
    <header className="bg-white text-blue-300 shadow-lg fixed top-0 left-0 w-full z-50 h-[64px] border-b-2 border-blue-300">
      <Disclosure as="nav" className="mx-auto">
        {({ open }) => (
          <>
            <div className="flex justify-between items-center h-14 px-2 md:px-5">
              {/* Logo */}
              <div className="flex items-center ml-16">
                <Link href="/" className="flex items-center">
                  <Image
                    src="/images/logoN.png"
                    alt="Logo"
                    width={100}
                    height={55}
                  />
                </Link>
              </div>

              {/* Navigation Links */}
              <div className="hidden sm:flex space-x-15 ml-20">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`px-3 py-2 rounded-md text-lg font-medium transition duration-200 ${
                      pathname === item.href
                        ? "bg-blue-200 text-white"
                        : "hover:bg-blue-200 hover:text-white"
                    }`}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>

              {/* Right Icons */}
              <div className="flex items-center space-x-4">
                <div className="hidden lg:flex mx-4 items-center justify-center ml-8 mr-8 w-[300px] relative">
                  <div className="relative w-[350px]">
                    <div className="flex items-center px-4 py-2 bg-white border border-blue-300 rounded-full shadow-md">
                      <img
                        src="https://cdn.builder.io/api/v1/image/assets/TEMP/669888cc237b300e928dbfd847b76e4236ef4b5a?placeholderIfAbsent=true&apiKey=d911d70ad43c41e78d81b9650623c816"
                        alt="Search icon"
                        className="w-5 h-5"
                      />
                      <input
                        type="search"
                        id="search-input"
                        placeholder="Tìm kiếm sách"
                        className="flex-1 text-sm bg-transparent border-none outline-none px-2 text-gray-400 placeholder-gray-400"
                        value={searchTerm}
                        onChange={(e) => {
                          setSearchTerm(e.target.value);
                          setShowResults(false);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            setSuggestions([]);
                            handleSearch();
                          }
                        }}
                      />
                    </div>

                    {suggestions.length > 0 && !showResults && (
                      <ul className="absolute left-0 right-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-[250px] overflow-y-auto">
                        {suggestions.map((book, idx) => (
                          <li
                            key={idx}
                            onClick={() => handleSelect(book)}
                            onMouseDown={(e) => e.preventDefault()}
                            className="px-4 py-2 cursor-pointer hover:bg-[#f2f2f2] transition-colors text-black"
                          >
                            <strong>{book.title}</strong>
                            {book.author && <span> — {book.author}</span>}
                            {book.publisher && (
                              <span className="text-sm text-gray-600"> (NXB: {book.publisher})</span>
                            )}
                            {book.year && (
                              <span className="text-sm text-gray-600"> (Năm: {book.year})</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}

                    {showResults && (
                      <div className="absolute left-0 right-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-[300px] overflow-y-auto">
                        <h3 className="px-4 py-2 text-lg font-semibold">
                          Kết quả tìm kiếm cho: "{searchTerm}"
                        </h3>
                        {searchResults.length > 0 ? (
                          searchResults.map((book, idx) => (
                            <Link
                              key={idx}
                              href={`/book-detail/${book.id}`}
                              onClick={() => setShowResults(false)}
                              className="flex items-center px-4 py-2 hover:bg-[#f2f2f2] transition-colors text-black"
                            >
                              <Image
                                src={book.imageSrc}
                                alt={book.title}
                                width={50}
                                height={70}
                                className="mr-4 rounded"
                                onError={(e) => (e.target.src = "/placeholder.png")} // Fallback nếu Cloudinary lỗi
                              />
                              <div>
                                <strong>{book.title}</strong>
                                {book.author && (
                                  <p className="text-sm text-gray-600">— {book.author}</p>
                                )}
                                {book.publisher && (
                                  <p className="text-sm text-gray-600">NXB: {book.publisher}</p>
                                )}
                                {book.year && (
                                  <p className="text-sm text-gray-600">Năm: {book.year}</p>
                                )}
                                <p
                                  className={`text-sm font-medium ${
                                    book.available ? "text-green-500" : "text-red-500"
                                  }`}
                                >
                                  {book.available ? "Còn sẵn" : "Hết sách"}
                                </p>
                              </div>
                            </Link>
                          ))
                        ) : (
                          <p className="px-4 py-2 text-gray-500">Không tìm thấy sách nào.</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <button
                  className={`relative pr-2 pl-1.5 py-2 rounded-full cursor-pointer hover:bg-white hover:text-[#052259] ${
                    pathname === "/cart"
                      ? "bg-white text-[#052259]"
                      : "hover:bg-white hover:text-[#052259]"
                  }`}
                >
                  <Link href="/cart">
                    <CartBadge count={cartCount} />
                    <ShoppingCart
                      style={{
                        width: "1.5rem",
                        height: "1.5rem",
                        strokeWidth: "1.5px",
                      }}
                      className="size-6"
                    />
                  </Link>
                </button>

                <div
                  className="relative"
                  onMouseEnter={() => setIsHovered(true)}
                  onMouseLeave={() => setIsHovered(false)}
                >
                  <button
                    onClick={handleBellClick}
                    className={`relative p-2 rounded-full cursor-pointer hover:bg-white hover:text-[#052259] transition duration-200 ${
                      pathname === "/notification"
                        ? "bg-white text-[#052259]"
                        : ""
                    }`}
                  >
                    {unreadCount > 0 && <NotificationBadge count={unreadCount} />}
                    <Bell
                      style={{
                        width: "1.5rem",
                        height: "1.5rem",
                        strokeWidth: "1.5px",
                      }}
                      className="size-6"
                    />
                  </button>
                  {isHovered && (
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg ring-1 ring-black/5 max-h-96 overflow-y-auto z-50">
                      {loading && (
                        <div className="px-4 py-2 text-gray-500 w-full">
                          Đang tải thông báo...
                        </div>
                      )}
                      {error && (
                        <div className="px-4 py-2 text-red-500 w-full">
                          Lỗi: {error}
                        </div>
                      )}
                      {!loading && !error && notifications.length === 0 && (
                        <div className="px-4 py-2 text-gray-500 w-full">
                          Không có thông báo nào.
                        </div>
                      )}
                      {!loading &&
                        !error &&
                        notifications.length > 0 &&
                        notifications.map((notification) => (
                          <div
                            key={notification.id}
                            className={`w-full h-16 px-4 py-2 text-gray-700 cursor-pointer flex items-center justify-between hover:bg-gray-100 ${
                              readStatus[notification.id]
                                ? "opacity-75"
                                : "font-semibold"
                            }`}
                            onClick={() =>
                              handleNotificationClick(
                                notification.id,
                                notification.link
                              )
                            }
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-sm truncate">
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-500 truncate">
                                {new Date(
                                  notification.timestamp
                                ).toLocaleString()}
                              </p>
                            </div>
                            {!readStatus[notification.id] && (
                              <span className="w-2 h-2 bg-blue-500 rounded-full ml-2 flex-shrink-0"></span>
                            )}
                          </div>
                        ))}
                    </div>
                  )}
                </div>

                <Menu as="div" className="relative">
                  <MenuButton className="flex rounded-full">
                    <User2
                      width={24}
                      height={24}
                      className="text-blue-300 cursor-pointer mr-16"
                    />
                  </MenuButton>
                  <MenuItems className="absolute mr-16 right-0 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black/5">
                    <MenuItem>
                      {({ active }) => (
                        <Link
                          href="/user-profile"
                          className={`block px-4 py-2 text-gray-700 ${
                            active && "bg-gray-100"
                          }`}
                        >
                          Hồ sơ của bạn
                        </Link>
                      )}
                    </MenuItem>
                    <MenuItem>
                      {({ active }) => (
                        <Link
                          href="/borrowed-card"
                          className={`block px-4 py-2 text-gray-700 ${
                            active && "bg-gray-100"
                          }`}
                        >
                          Phiếu mượn
                        </Link>
                      )}
                    </MenuItem>
                    <MenuItem>
                      {({ active }) => (
                        <Link
                          href="/fine"
                          className={`block px-4 py-2 text-gray-700 ${
                            active && "bg-gray-100"
                          }`}
                        >
                          Phiếu phạt
                        </Link>
                      )}
                    </MenuItem>
                    <MenuItem>
                      {({ active }) => (
                        <Link
                          href="/change-password"
                          className={`block px-4 py-2 text-gray-700 ${
                            active && "bg-gray-100"
                          }`}
                        >
                          Đổi mật khẩu
                        </Link>
                      )}
                    </MenuItem>
                    <MenuItem>
                      {({ active }) => (
                        <button
                          onClick={handleLogout}
                          className={`w-full text-left px-4 py-2 text-gray-700 ${
                            active && "bg-gray-100"
                          }`}
                        >
                          Đăng xuất
                        </button>
                      )}
                    </MenuItem>
                  </MenuItems>
                </Menu>
              </div>

              <div className="sm:hidden">
                <DisclosureButton className="p-2 rounded-md hover:bg-blue-700">
                  {open ? <X className="size-6" /> : <MenuIcon className="size-6" />}
                </DisclosureButton>
              </div>
            </div>

            <DisclosurePanel className="sm:hidden">
              <div className="px-2 pt-2 pb-3 space-y-1">
                {navigation.map((item) => (
                  <DisclosureButton
                    key={item.name}
                    as={Link}
                    href={item.href}
                    className={`block px-3 py-2 rounded-md text-base font-medium transition ${
                      pathname === item.href
                        ? "bg-white text-[#052259]"
                        : "hover:bg-blue-700 hover:text-gray-100"
                    }`}
                  >
                    {item.name}
                  </DisclosureButton>
                ))}
              </div>
            </DisclosurePanel>
          </>
        )}
      </Disclosure>
    </header>
  );
};

export default Header;