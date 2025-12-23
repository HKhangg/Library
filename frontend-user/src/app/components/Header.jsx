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
import { Menu as MenuIcon, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import axios from "axios";
import didYouMean from "didyoumean";
import CartIcon from "./CartIcon";
import BellIcon from "./BellIcon";
import AccountIcon from "./AccountIcon";
import SearchIcon from "./SearchIcon";
import { Sun, Moon } from "lucide-react";
import { useCart } from "@/app/context/CartContext";
import { useNotification } from "@/app/context/NotificationContext";

/* -------------------- CONSTANTS -------------------- */

const navigation = [
  { name: "Trang chủ", href: "/" },
  { name: "Thể loại", href: "/Categories" },
  { name: "Giới thiệu", href: "/About" },
  { name: "Tin sách", href: "/News" },
];

/* -------------------- BADGES -------------------- */

const CartBadge = ({ count }) => (
  <div className="absolute top-0.5 right-0.5 px-1.5 text-[0.8rem] font-medium text-white bg-[#F7302E] rounded-full">
    {count}
  </div>
);

const NotificationBadge = ({ count }) => (
  <div className="absolute top-0.5 right-0.5 px-1.5 text-[0.8rem] font-medium text-white bg-[#F7302E] rounded-full">
    {count}
  </div>
);

/* -------------------- HEADER -------------------- */

const Header = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { cartCount } = useCart();
  const { unreadCount, updateUnreadCount, notifications, loading, error } =
    useNotification();

  const [isHovered, setIsHovered] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [books, setBooks] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);

  const [readStatus, setReadStatus] = useState(() => {
    if (typeof window !== "undefined") {
      return JSON.parse(localStorage.getItem("notificationReadStatus") || "{}");
    }
    return {};
  });

  useEffect(() => {
    localStorage.setItem(
      "notificationReadStatus",
      JSON.stringify(readStatus)
    );
  }, [readStatus]);

  /* -------------------- DARK MODE -------------------- */

  const DarkModeToggle = () => {
    const [darkMode, setDarkMode] = useState(
      typeof window !== "undefined" &&
        localStorage.getItem("darkMode") === "true"
    );

    useEffect(() => {
      document.documentElement.classList.toggle("dark", darkMode);
      localStorage.setItem("darkMode", darkMode);
    }, [darkMode]);

    return (
      <button onClick={() => setDarkMode(!darkMode)} className="w-8 h-8">
        {darkMode ? <Moon size={26} /> : <Sun size={26} />}
      </button>
    );
  };

  /* -------------------- HANDLERS -------------------- */

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("persist:root");
    router.push("/");
  };

  const handleBellClick = () => router.push("/notification");

  const handleNotificationClick = (id, link) => {
    if (!readStatus[id]) {
      updateUnreadCount(Math.max(0, unreadCount - 1));
    }
    setReadStatus((prev) => ({ ...prev, [id]: true }));
    router.push(link);
  };

  /* -------------------- RENDER -------------------- */

  return (
    <header className="fixed top-0 left-0 w-full z-50 border-b bg-white dark:bg-gray-800 shadow">
      <Disclosure as="nav">
        {({ open }) => (
          <>
            <div className="flex items-center justify-between px-6 h-16">
              {/* Logo */}
              <Link href="/">
                <Image
                  src="/images/logoB.png"
                  alt="Logo"
                  width={100}
                  height={55}
                />
              </Link>

              {/* Desktop Navigation */}
              <div className="hidden sm:flex gap-6">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`font-bold ${
                      pathname === item.href
                        ? "text-blue-700"
                        : "text-gray-600 hover:text-blue-500"
                    }`}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>

              {/* Right icons */}
              <div className="flex items-center gap-3">
                <DarkModeToggle />

                {/* Cart */}
                <Link href="/cart" className="relative">
                  {cartCount > 0 && <CartBadge count={cartCount} />}
                  <CartIcon />
                </Link>

                {/* Notification */}
                <div
                  className="relative"
                  onMouseEnter={() => setIsHovered(true)}
                  onMouseLeave={() => setIsHovered(false)}
                >
                  <button onClick={handleBellClick}>
                    {unreadCount > 0 && (
                      <NotificationBadge count={unreadCount} />
                    )}
                    <BellIcon />
                  </button>

                  {isHovered && (
                    <div className="absolute right-0 mt-2 w-80 bg-white shadow rounded">
                      {notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() =>
                            handleNotificationClick(n.id, n.link)
                          }
                          className="px-4 py-2 cursor-pointer hover:bg-gray-100"
                        >
                          {n.message}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Account Menu – GIỮ QR */}
                <Menu as="div" className="relative">
                  <MenuButton className="p-2 rounded-full hover:bg-gray-200">
                    <AccountIcon />
                  </MenuButton>

                  <MenuItems className="absolute right-0 mt-2 w-44 bg-white rounded shadow">
                    <MenuItem>
                      <Link className="block px-4 py-2" href="/user-profile">
                        Hồ sơ
                      </Link>
                    </MenuItem>
                    <MenuItem>
                      <Link className="block px-4 py-2" href="/borrowed-card">
                        Phiếu mượn
                      </Link>
                    </MenuItem>
                    <MenuItem>
                      <Link className="block px-4 py-2" href="/change-password">
                        Đổi mật khẩu
                      </Link>
                    </MenuItem>

                    {/* ✅ QR CODE */}
                    <MenuItem>
                      <Link className="block px-4 py-2" href="/user-qrcode">
                        Mã QR của tôi
                      </Link>
                    </MenuItem>

                    <MenuItem>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2"
                      >
                        Đăng xuất
                      </button>
                    </MenuItem>
                  </MenuItems>
                </Menu>

                {/* Mobile */}
                <div className="sm:hidden">
                  <DisclosureButton>
                    {open ? <X /> : <MenuIcon />}
                  </DisclosureButton>
                </div>
              </div>
            </div>

            {/* Mobile menu */}
            <DisclosurePanel className="sm:hidden bg-blue-50">
              {navigation.map((item) => (
                <DisclosureButton
                  key={item.name}
                  as={Link}
                  href={item.href}
                  className="block px-4 py-2"
                >
                  {item.name}
                </DisclosureButton>
              ))}
            </DisclosurePanel>
          </>
        )}
      </Disclosure>
    </header>
  );
};

export default Header;
