"use client";
import { usePathname } from "next/navigation";
import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
  Menu,
} from "@headlessui/react";
import { Menu as MenuIcon, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";
import didYouMean from "didyoumean";
import { useEffect, useState } from "react";
import Image from "next/image";
import SearchIcon from "./SearchIcon";
import { Sun, Moon } from "lucide-react";
const navigation = [
  { name: "Trang chủ", href: "/" },
  { name: "Thể loại", href: "/Categories" },
  { name: "Giới thiệu", href: "/About" },
  { name: "Tin sách", href: "/News" },
];

const HeaderNoLogin = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [books, setBooks] = useState([]);
  const [bookTitles, setBookTitles] = useState([]);
  const [bookAuthors, setBookAuthors] = useState([]);
  const [bookPublishers, setBookPublishers] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);

const DarkModeToggle = () => {
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("darkMode") === "true";
    }
    return false;
  });
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (darkMode) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
    localStorage.setItem("darkMode", darkMode);
  }, [darkMode]);

  const handleToggle = () => {
    setAnimate(true);
    setTimeout(() => {
      setDarkMode(!darkMode);
      setAnimate(false);
    }, 200);
  };

  return (
    <button
      onClick={handleToggle}
      className="relative w-8 h-8 flex items-center justify-center"
    >
      <span
        className={`absolute transition-all duration-200 ${
          animate ? "-translate-y-2 opacity-0" : "translate-y-0 opacity-100"
        } text-[#9ce5f4]`}
      >
        {darkMode ? <Moon size={29} /> : <Sun size={29} />}
      </span>
      <span
        className={`absolute transition-all duration-200 ${
          animate ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
        } text-[#9ce5f4]`}
      >
        {darkMode ? <Sun size={29} /> : <Moon size={29} />}
      </span>
    </button>
  );
};

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

  const handleLogin = () => {
    router.push("/user-login");
  };

  useEffect(() => {
    setSearchTerm("");
    setSuggestions([]);
    setSearchResults([]);
    setShowResults(false);
  }, [pathname]);

   return (
      <header className="fixed top-0 left-0 w-full z-50 h-15 border-b bg-white dark:bg-gray-800 dark:border-gray-700 shadow-md">
        <Disclosure as="nav" className="mx-auto">
          {({ open }) => (
            <>
  
  
              <div className="flex items-center justify-between w-full">
  
                {/* Logo */}
                <div className="flex items-center space-x-6 ml-6">
                  <Link href="/" className="flex items-center">
                    <Image
                      src="/images/logoN.png"
                      alt="Logo"
                      width={100}
                      height={55}
                    />
                  </Link>
                </div>
  
                <div className="hidden sm:flex items-center justify-center space-x-6">
                  {navigation.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
              className={`group relative px-2 py-2 font-bold text-xl transition-colors duration-300 ${
                                pathname === item.href
                                  ? "text-[#052259] dark:text-white"
                                  : "text-gray-700 dark:text-gray-300 hover:text-[#66d7ee] dark:hover:text-[#30c9e8]"
                              }`}
                            >
                              <span className="relative">
                                {item.name}
                                <span className="absolute left-0 right-0 bottom-[-2px] h-[2px] bg-[#1663c7] scale-x-0 origin-center transition-transform duration-300 group-hover:scale-x-100"></span>
                                {pathname === item.href && (
                                  <span className="absolute left-0 right-0 bottom-[-2px] h-[2px] bg-[#1663c7] scale-x-100 origin-center"></span>
                                )}
                              </span>

                                  </Link>
                  ))}
                </div>
  
  
                <div className="flex items-center space-x-4">
                  <div className="hidden lg:flex mx-9 items-center justify-center w-[330px] relative">
                    <div className="relative w-[350px]">
                      <div className="flex items-center px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-full shadow-sm">
                        <SearchIcon/>
                        <input
                          type="search"
                          id="search-input"
                          placeholder="Nhập để tìm kiếm sách hehe"
                          className="flex-1 text-sm bg-transparent border-none outline-none px-2 text-gray-700 dark:text-gray-200 placeholder-gray-400"
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
                        <ul className="absolute left-0 right-0 mt-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-50 max-h-[250px] overflow-y-auto">
                          {suggestions.map((book, idx) => (
                            <li
                              key={idx}
                              onClick={() => handleSelect(book)}
                              onMouseDown={(e) => e.preventDefault()}
                              className="px-4 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200"
                            >
                              <strong>{book.title}</strong>
                              {book.author && <span> — {book.author}</span>}
                              {book.publisher && (
                                <span className="text-sm text-gray-500 dark:text-gray-300"> (NXB: {book.publisher})</span>
                              )}
                              {book.year && (
                                <span className="text-sm text-gray-500 dark:text-gray-300"> (Năm: {book.year})</span>
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
                            <p className="px-4 py-2 text-bold text-gray-500">Không tìm thấy sách nào.</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>


                 <DarkModeToggle />
                <Menu as="div" className="relative">
                  <Menu.Button
                    onClick={handleLogin}
                    className="text-blue-300 font-medium px-4 py-2 rounded-md hover:bg-blue-100 transition mr-6 cursor-pointer"
                  >
                    Đăng nhập / Đăng ký
                  </Menu.Button>
                </Menu>
              </div>

              {/* Mobile Menu Button */}
              <div className="sm:hidden">
                <DisclosureButton className="p-2 rounded-md hover:bg-blue-700">
                  {open ? <X className="size-6" /> : <MenuIcon className="size-6" />}
                </DisclosureButton>
              </div>
            </div>

            {/* Mobile Menu Panel */}
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

export default HeaderNoLogin;