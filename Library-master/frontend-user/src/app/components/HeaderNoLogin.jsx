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
                <div className="hidden lg:flex mx-4 items-center justify-center ml-8 mr-8 w-[300px]">
                  <div className="relative w-[300px]">
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