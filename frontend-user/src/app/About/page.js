"use client";
import React, { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import {
  BookOpen,
  BookIcon,
  Search,
  Users,
  BarChart2,
  Mail,
  Github,
  CheckCircle,
  BracesIcon,
  ShellIcon,
  Database,
  MessageCircleMore,
  Settings,
   Bell,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import ChatBotButton from "../components/ChatBoxButton";
import { Typewriter } from "react-simple-typewriter";
import Image from "next/image";
import FloatingIcons from "@/app/components/FloatingIcons";

import {   Instagram } from "lucide-react";

const contacts = [
    { name: "Email", icon: Mail, link: "mailto:23521468@uit.edu.vn" },
    { name: "GitHub", icon: Github, link: "https://github.com/PhTee2412" },
    { name: "Instagram", icon: Instagram, link: "https://instagram.com" },
  ];
/* ---------- Data ---------- */
const features = [
  {
    icon: <Search className="w-6 h-6 text-blue-600" />,
    title: "Tra cứu sách",
    description:
      "Tìm kiếm sách theo tên, tác giả, thể loại một cách nhanh chóng.",
  },
  {
    icon: <BookOpen className="w-6 h-6 text-green-600" />,
    title: "Quản lý mượn/trả",
    description: "Giao diện dễ dùng để mượn, trả và gia hạn sách.",
  },
  {
    icon: <Users className="w-6 h-6 text-purple-600" />,
    title: "Tài khoản người dùng",
    description: "Quản lý sinh viên, giảng viên và thủ thư trong hệ thống.",
  },
  {
    icon: <BarChart2 className="w-6 h-6 text-orange-600" />,
    title: "Thống kê",
    description: "Tự động thống kê số lượng sách, lượt mượn theo thời gian.",
  },
  {
    icon: <MessageCircleMore className="w-6 h-6 text-blue-600" />,
    title: "Chat trực tuyến",
    description: "Hỗ trợ chat trực tuyến với AI các thắc mắc về sách.",
  },
  {
    icon: <Database className="w-6 h-6 text-teal-600" />,
    title: "Lưu trữ dữ liệu an toàn",
    description:
      "Dữ liệu được lưu trữ trên máy chủ bảo mật, đảm bảo toàn vẹn và ổn định.",
  },
  {
    icon: <Sparkles className="w-6 h-6 text-pink-600" />,
    title: "Giao diện hiện đại",
    description:
      "Thiết kế trực quan, tương thích đa nền tảng và dễ sử dụng cho mọi người.",
  },
   {
    icon: <Bell className="w-6 h-6 text-yellow-600" />,
    title: "Hệ thống thông báo",
    description:
      "Gửi thông báo khi sắp đến hạn trả sách hoặc có sách mới trong thư viện.",
  },
];


const teamMembers = [
  {
    img: "/images/Thao.jpg",
    name: "Lê Thị Phương Thảo",
    mssv: "23521468",
  },
  {
    img: "/images/Duc.jpg",
    name: "Vòng Việt Đức",
    mssv: "23521645",
  },
  {
    img: "/images/Bao.jpg",
    name: "Nguyễn Gia Bảo",
    mssv: "23520120",

  },
  {
    img: "/images/Khang.jpg",
    name: "Huy Khang",
    mssv: "23520692",
  },
];

const genres = [
  "Khoa học – Công nghệ",
  "Kinh tế – Quản trị",
  "Văn học – Nghệ thuật",
  "Ngoại ngữ",
  "Tâm lý – Giáo dục",
  "Lịch sử – Địa lý",
  "Truyện – Tiểu thuyết",
  "... Và nhiều thể loại khác",
];

const benefits = [
  "Tiết kiệm thời gian tra cứu và mượn/trả sách",
  "Tránh thất lạc dữ liệu, lưu trữ tập trung",
  "Thống kê tự động và chính xác",
  "Trải nghiệm người dùng hiện đại, dễ sử dụng",
  "Hỗ trợ nhiều vai trò: sinh viên, thủ thư, quản trị viên",
  "Đăng nhập nhanh bằng tài khoản Google/Facebook",
];


const sliderImages = [
  "https://i.pinimg.com/736x/bc/fd/9a/bcfd9a2d158eb0f2c36bf5b1126c0bfc.jpg",
  "https://i.pinimg.com/736x/bc/fd/9a/bcfd9a2d158eb0f2c36bf5b1126c0bfc.jpg",
  "https://i.pinimg.com/736x/bc/fd/9a/bcfd9a2d158eb0f2c36bf5b1126c0bfc.jpg",
];


const Page = () => {

  const leftCol = {
    hidden: { opacity: 0, x: -30 },
    show: { opacity: 1, x: 0, transition: { duration: 0.8 } },
  };

  const card = {
    hidden: { opacity: 0, y: 20 },
    show: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08 } }),
  };

  const [teamCurrent, setTeamCurrent] = useState(0);
  const teamTimerRef = useRef(null);

useEffect(() => {
  teamTimerRef.current = setInterval(() => {
    setTeamCurrent((s) => (s + 1) % teamMembers.length);
  }, 3800);

  return () => {
    if (teamTimerRef.current) clearInterval(teamTimerRef.current);
  };
}, []);

  const [current, setCurrent] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    startTimer();
    return () => stopTimer();

  }, []);

  const startTimer = () => {
    stopTimer();
    timerRef.current = window.setInterval(() => {
      setCurrent((s) => (s + 1) % sliderImages.length);
    }, 3800);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleMouseEnter = () => stopTimer();
  const handleMouseLeave = () => startTimer();

  const goTo = (i) => {
    setCurrent(i);
    startTimer();
  };

  const techs = [
    { name: "Next.js", icon: <BracesIcon className="w-5 h-5 text-gray-600" /> },
    { name: "Spring Boot", icon: <ShellIcon className="w-5 h-5 text-pink-500" /> },
    { name: "Supabase", icon: <Database className="w-5 h-5 text-teal-600" /> },
  ];

  return (

    <div className="relative flex flex-col min-h-screen -mr-[180px] mt-5 -mr-[180px] bg-blue-50 dark:bg-gray-800 transition-colors duration-300 overflow-x-hidden ">
      <div
        className="fixed inset-0 bg-blue-50 dark:bg-gray-800 transition-colors duration-300 pointer-events-none"
        aria-hidden="true"
      />
      <FloatingIcons/>

      {/* Main content, ê cái chỗ căn trái phải ở đây nè Mô Phậtttt */}
      <div className="relative z-10 w-full px-[6vw] lg:py-20">
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <motion.div className="lg:col-span-7" variants={leftCol} initial="hidden" animate="show" >
            
           <motion.h2
            className="mb-2 font-extrabold text-[48px] sm:text-[60px] md:text-[70px] leading-tight text-pink-400 dark:text-pink-300"
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            viewport={{ once: false, amount: 0.3 }} 
          >
           <Typewriter
            words={["Hello, we are"]}
            loop={false}
            cursor
            cursorStyle="_"
            typeSpeed={80}
            deleteSpeed={40}
          />
        </motion.h2>

  <div className="relative inline-block mb-6 translate-x-3 md:translate-x-6">
  <motion.h1
    className="text-[72px] sm:text-[84px] md:text-[96px] font-extrabold leading-tight text-emerald-700 dark:text-emerald-200 relative z-20"
    initial={{ opacity: 0, y: 20, scale: 0.95 }}
    whileInView={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ duration: 0.8, ease: "easeOut" }}
    viewport={{ once: false, amount: 0.3 }}
  >
    8ooK !
  </motion.h1>


  <motion.div
    className="absolute left-0 bottom-2 md:bottom-3 w-76 md:h-6 bg-pink-200 opacity-90 dark:opacity-40 z-10"
    initial={{ scaleX: 0 }}
    whileInView={{ scaleX: 1 }}
    transition={{ duration: 0.8, ease: "easeOut" }}
    viewport={{ once: false, amount: 0.3 }}
  />
</div>
<motion.p
      className="max-w-xl text-lg font-roboto font-bold text-gray-700 dark:text-gray-300 mb-6"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      viewport={{ once: false, amount: 0.3 }}
    >
      8ooK - Hệ thống quản lý thư viện trực tuyến giúp tra cứu, mượn trả và quản lý sách một cách dễ dàng. Giao diện thân thiện, hỗ trợ vai trò sinh viên, thủ thư và admin.
    </motion.p>

{/* Tech badges */}
<div className="flex gap-7 items-center mb-6 flex-wrap">
  {techs.map((t, i) => (
    <motion.button
      key={t.name}
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 120, damping: 10, delay: i * 0.05 }}
      viewport={{ once: false, amount: 0.3 }} 
      whileHover={{
        scale: 1.08,
        y: -4,
        boxShadow: "0 12px 30px rgba(0,0,0,0.15)",
        transition: { type: "spring", stiffness: 120, damping: 8 },
      }}
      whileTap={{ scale: 0.96 }}
      className="inline-flex items-center gap-3 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 rounded-2xl shadow-md transition"
    >
      <span className="p-1 rounded bg-gray-50 dark:bg-gray-800">{t.icon}</span>
      <span className="text-sm text-gray-800 dark:text-gray-100 font-roboto font-bold">{t.name}</span>
    </motion.button>
  ))}
</div>

{/* Buttons */}
<div className="flex items-center gap-8">
  <Link href="/Homepage" className="inline-block">
    <motion.button
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.8 }}
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      viewport={{ once: false, amount: 0.3 }}
      className="relative inline-flex shadow-ms items-center justify-center px-6 py-3 bg-[#66d7ee] hover:bg-emerald-700 text-white font-roboto font-bold rounded-3xl shadow-md transition"
    >
      Khám phá
    </motion.button>
  </Link>

  <a href="#features" className="inline-flex font-roboto font-bold items-center gap-1 text-sm text-[#30c9e8] dark:text-emerald-200 hover:underline">
    <BookOpen className="w-4 h-4" />
    Các tính năng ôk
  </a>
</div>
          </motion.div>

          <div className="lg:col-span-5 mt-10 flex justify-center lg:justify-end" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
            <div className="relative flex items-center justify-center translate-y-3 md:translate-y-6">
        
              <motion.div
                className="absolute right-0 md:-right-6 -top-9 md:-top-10 w-[460px] h-[460px] md:w-[520px] md:h-[520px] border-4 border-[#30c9e8] dark:border-emerald-500/60"
                style={{ boxSizing: "border-box", zIndex: 5 }}
                animate={{
                  rotate: [-6, 6, -6],
                  skewX: [0, 4, -4, 0],
                  scale: [1, 1.02, 1],
                  borderRadius: [
                    "48% 52% 50% 50% / 50% 48% 52% 50%",
                    "40% 60% 60% 40% / 45% 55% 45% 55%",
                    "48% 52% 50% 50% / 50% 48% 52% 50%",
                  ],
                }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              />

              {/* ring ring ở đây: */}
              <motion.div
                className="absolute right-0 md:-right-3 -top-3 md:-top-6 w-[340px] h-[340px] md:w-[500px] md:h-[500px] border-2 border-[#9cf4df] dark:border-emerald-500/30"
                style={{ zIndex: 6, background: "transparent" }}
                animate={{
                  borderRadius: [
                    "48% 52% 50% 50% / 50% 48% 52% 50%",
                    "60% 40% 40% 60% / 40% 60% 40% 60%",
                    "48% 52% 50% 50% / 50% 48% 52% 50%",
                  ],
                  rotate: [1, -2, 1],
                  scale: [1, 1.01, 1],
                }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
              />

              <motion.div
                className="relative z-10 w-[300px] h-[300px] md:w-[460px] md:h-[460px] overflow-hidden shadow-2xl bg-transparent"
                style={{
                  borderRadius: "48% 52% 50% 50% / 50% 48% 52% 50%",
                }}
                whileHover={{ scale: 1.03, rotate: 1 }}
                animate={{
                  y: [0, -10, 0],
                  rotate: [0, 1.2, 0],
                  borderRadius: [
                    "48% 52% 50% 50% / 50% 48% 52% 50%",
                    "60% 40% 55% 45% / 45% 55% 50% 50%",
                    "48% 52% 50% 50% / 50% 48% 52% 50%",
                  ],
                }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              >
                <div
                  className="flex h-full transition-transform duration-700"
                  style={{
                    transform: `translateX(-${(current * 100) / sliderImages.length}%)`,
                    width: `${sliderImages.length * 100}%`,
                    background: "transparent",
                  }}
                >
                  {sliderImages.map((src, idx) => (
                    <div
                      key={idx}
                      className="flex-shrink-0 h-full bg-transparent"
                      style={{ width: `${100 / sliderImages.length}%` }}
                    >
                      <motion.img
                        src={src}
                        alt={`slide-${idx}`}
                        className="w-full h-full object-cover bg-transparent"
                        initial={{
                          borderRadius: "50% 50% 48% 52% / 45% 55% 50% 50%",
                        }}
                        animate={{
                          borderRadius: [
                            "50% 50% 48% 52% / 45% 55% 50% 50%",
                            "60% 40% 40% 60% / 40% 60% 45% 55%",
                            "50% 50% 48% 52% / 45% 55% 50% 50%",
                          ],
                        }}
                        transition={{
                          duration: 6,
                          repeat: Infinity,
                          ease: "easeInOut",
                          delay: idx * 0.15,
                        }}
                      />
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </section>





        {/*chỗ ni là tính năng */}
        <section id="features" className="mt-32 relative w-full overflow-hidden">
          <div className="w-full flex justify-end items-center">
            
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              whileInView={{ width: "85%", opacity: 1 }}
              transition={{ duration: 1.3, ease: "easeOut" }}
              viewport={{ once: true }}
              className="absolute left-0 flex items-center justify-end space-x-2 translate-y-[-50px] z-1" // xuống ngang hàng với chữ
            >
            
              {Array.from({ length: 70 }).map((_, i) => (
                <motion.span
                  key={i}
                  animate={{
                    y: [0, -2, 0], 
                  }}
                  transition={{
                    duration: 1.8,
                    delay: i * 0.04, 
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="block w-3 h-[4px] bg-emerald-500/80 rounded-full"
                />
              ))}
            </motion.div>

      
            <motion.div
              className="flex flex-col items-end mb-14"
              initial={{ opacity: 0, x: 100 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.9, ease: "easeOut" }}
              viewport={{ once: false, amount: 0.3 }}
            >
              <h2 className="text-[22px] md:text-[44px] font-lora font-extrabold text-emerald-800 dark:text-emerald-200 leading-none z-10">
                Tính năng
              </h2>

              <div className="relative w-full">
                <h3 className="text-[22px] md:text-[40px] font-lora font-extrabold text-pink-400 dark:text-pink-300 text-center relative z-20">
                  NỔI BẬT
                </h3>

          
                <motion.div
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  viewport={{ once: false, amount: 0.3 }}
                  className="absolute left-1/2 -translate-x-1/2 bottom-0 w-48 md:h-6 bg-pink-200 opacity-90 dark:opacity-40 z-10"
                />
              </div>
            </motion.div>
          </div>

    <div className="pt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 w-full">
  {features.map((f, i) => (
    <motion.div
      key={i}
      initial={{ opacity: 0, y: 50, scale: 0.97 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        type: "spring",
        stiffness: 90,
        damping: 14,
        mass: 0.8,
        delay: i * 0.12,
      }}
      viewport={{ once: false, amount: 0.3 }}
      whileHover={{
        y: -12,
        scale: 1.06,
        boxShadow:
          "0 25px 45px rgba(0,0,0,0.15), 0 0 20px rgba(52,211,153,0.25)",
        transition: {
          type: "spring",
          stiffness: 120,
          damping: 10,
          duration: 0.6,
        },
      }}
      whileTap={{ scale: 0.98 }}
      className="bg-white dark:bg-gray-700 p-6 rounded-2xl shadow-md hover:shadow-2xl transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] cursor-pointer"
    >

      <div className="flex items-center justify-center gap-3 mb-3">
        <motion.div
          whileHover={{ rotate: 10 }}
          transition={{ type: "spring", stiffness: 120, damping: 8 }}
          className="text-emerald-500 text-3xl"
        >
          {f.icon}
        </motion.div>
        <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-100">
          {f.title}
        </h3>
      </div>

  
      <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed text-center">
        {f.description}
      </p>
    </motion.div>
  ))}
</div>

  </section>


{/* CÁI THỂ LOẠIII*/}

<section id="genres" className="mt-15 relative w-full overflow-visible">
  <div className="w-full flex justify-start items-center">
    

    <motion.div
      initial={{ width: 0, opacity: 0 }}
      whileInView={{ width: "85%", opacity: 1 }}
      transition={{ duration: 1.3, ease: "easeOut" }}
      viewport={{ once: true }}
      className="absolute right-0 flex items-center justify-start space-x-2 translate-y-[-50px] z-0"
    >
      {Array.from({ length: 70 }).map((_, i) => (
        <motion.span
          key={i}
          animate={{ y: [0, -2, 0] }}
          transition={{
            duration: 1.8,
            delay: i * 0.04,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="block w-3 h-[4px] bg-emerald-500/80 rounded-full"
        />
      ))}
    </motion.div>


    <motion.div
      className="flex flex-col items-start mb-14"
      initial={{ opacity: 0, x: -100 }}
      whileInView={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.9, ease: "easeOut" }}
      viewport={{ once: false, amount: 0.3 }}
    >
      <h2 className="text-[22px] md:text-[44px] font-lora font-extrabold text-emerald-800 dark:text-emerald-200 leading-none z-10">
        Đa dạng
      </h2>

      <div className="relative w-full">
        <h3 className="text-[22px] md:text-[40px] font-lora font-extrabold text-pink-400 dark:text-pink-300 text-center relative z-20">
          THỂ LOẠI
        </h3>

    
        <motion.div
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          viewport={{ once: false, amount: 0.3 }}
          className="absolute left-1/2 -translate-x-1/2 bottom-0 w-48 md:h-6 bg-pink-200 opacity-90 dark:opacity-40 z-10"
        />
      </div>
    </motion.div>
  </div>

  {/* Genres grid */}
  <div className="pt-3 grid grid-cols-2 sm:grid-cols-4 gap-8 w-full relative z-10">
    {genres.map((genre, idx) => (
      <motion.div
        key={idx}
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        transition={{
          type: "spring",
          stiffness: 90,
          damping: 14,
          mass: 0.8,
          delay: idx * 0.08,
        }}
        viewport={{ once: false, amount: 0.3 }}
        whileHover={{
          y: -8,
          scale: 1.05,
          boxShadow:
            "0 20px 35px rgba(0,0,0,0.15), 0 0 15px rgba(52,211,153,0.25)",
          transition: { type: "spring", stiffness: 120, damping: 10, duration: 0.6 },
        }}
        className="bg-white dark:bg-gray-700 p-4 rounded-3xl shadow text-sm font-medium text-gray-700 dark:text-gray-200 flex items-center gap-3 cursor-pointer transition-all duration-400"
      >
        <BookIcon className="w-5 h-5 text-blue-300" />
        {genre}
      </motion.div>
    ))}
  </div>
</section>


{/*Chỗ nì là lợi ích nèee */}
       <section id="benefits" className="mt-15 relative w-full overflow-visible">
  <div className="w-full flex justify-end items-center">
    
    {/* Animated bars */}
    <motion.div
              initial={{ width: 0, opacity: 0 }}
              whileInView={{ width: "87%", opacity: 1 }}
              transition={{ duration: 1.3, ease: "easeOut" }}
              viewport={{ once: true }}
              className="absolute left-0 flex items-center justify-end space-x-2 translate-y-[-50px] z-1" // xuống ngang hàng với chữ
            >
            
              {Array.from({ length: 70 }).map((_, i) => (
                <motion.span
                  key={i}
                  animate={{
                    y: [0, -2, 0], 
                  }}
                  transition={{
                    duration: 1.8,
                    delay: i * 0.04, 
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="block w-3 h-[4px] bg-emerald-500/80 rounded-full"
                />
              ))}
            </motion.div>
            <motion.div
              className="flex flex-col items-end mb-14"
              initial={{ opacity: 0, x: 100 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.9, ease: "easeOut" }}
              viewport={{ once: false, amount: 0.3 }}
            >
              <h2 className="text-[22px] md:text-[44px] font-lora font-extrabold text-emerald-800 dark:text-emerald-200 leading-none z-10">
                Tiện ích
              </h2>

              <div className="relative w-full">
                <h3 className="text-[22px] md:text-[40px] font-lora font-extrabold text-pink-400 dark:text-pink-300 text-center relative z-20">
                  SỬ DỤNG
                </h3>
                <motion.div
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  viewport={{ once: false, amount: 0.3 }}
                  className="absolute left-1/2 -translate-x-1/2 bottom-0 w-50 md:h-6 bg-pink-200 opacity-90 dark:opacity-40 z-10"
                />
              </div>
            </motion.div>
         

   </div>

  {/* Benefits grid */}
  <div className="pt-3 grid grid-cols-1 sm:grid-cols-3 gap-6 w-full relative z-10">
    {benefits.map((item, idx) => (
      <motion.div
        key={idx}
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        transition={{
          type: "spring",
          stiffness: 90,
          damping: 14,
          mass: 0.8,
          delay: idx * 0.08,
        }}
        viewport={{ once: false, amount: 0.3 }}
        whileHover={{
          y: -8,
          scale: 1.05,
          boxShadow:
            "0 20px 35px rgba(0,0,0,0.15), 0 0 15px rgba(236,72,153,0.35)",
          transition: { type: "spring", stiffness: 120, damping: 10, duration: 0.6 },
        }}
        className="flex items-center gap-2 bg-white dark:bg-gray-700 p-3 rounded-3xl cursor-pointer transition-all duration-400 relative overflow-hidden
          border-2 border-transparent hover:border-gradient-to-r hover:from-pink-400 hover:via-pink-500 hover:to-pink-600 dark:hover:from-pink-600 dark:hover:via-pink-500 dark:hover:to-pink-400"
      >
        <CheckCircle className="text-green-500 w-5 h-5 z-10" />
        <span className="z-10">{item}</span>
        <motion.div
          className="absolute top-0 left-0 w-full h-full border-r-2 border-b-2 border-transparent rounded-3xl pointer-events-none
            group-hover:border-gradient-to-r group-hover:from-emerald-400 group-hover:via-emerald-500 group-hover:to-emerald-600 dark:group-hover:from-emerald-600 dark:group-hover:via-emerald-500 dark:group-hover:to-emerald-400"
          initial={{ rotate: 10, scaleX: 0 }}
          whileInView={{ rotate: 0, scaleX: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          viewport={{ once: false, amount: 0.3 }}
        />
      </motion.div>
    ))}
  </div>
</section>


{/*CHỖ NI LÀ CONTACT TV */}

  <section className="mt-15 relative w-full overflow-visible">
    <div className="w-full flex justify-start items-center">

    <motion.div
      initial={{ width: 0, opacity: 0 }}
      whileInView={{ width: "89%", opacity: 1 }}
      transition={{ duration: 1.3, ease: "easeOut" }}
      viewport={{ once: true }}
      className="absolute right-0 flex items-center justify-start space-x-2 translate-y-[-50px] z-0"
    >
      {Array.from({ length: 70 }).map((_, i) => (
        <motion.span
          key={i}
          animate={{ y: [0, -2, 0] }}
          transition={{
            duration: 1.8,
            delay: i * 0.04,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="block w-3 h-[4px] bg-emerald-500/80 rounded-full"
        />
      ))}
    </motion.div>
    <motion.div
      className="flex flex-col items-start mb-14"
      initial={{ opacity: 0, x: -100 }}
      whileInView={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.9, ease: "easeOut" }}
      viewport={{ once: false, amount: 0.3 }}
    >
      <h2 className="text-[22px] md:text-[44px] font-lora font-extrabold text-emerald-800 dark:text-emerald-200 leading-none z-10">
        Nhóm
      </h2>

      <div className="relative w-full">
        <h3 className="text-[22px] md:text-[40px] font-lora font-extrabold text-pink-400 dark:text-pink-300 text-center relative z-20">
          PHÁT TRIỂN
        </h3>
        <motion.div
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          viewport={{ once: false, amount: 0.3 }}
          className="absolute left-1/2 -translate-x-1/2 bottom-0 w-65 md:h-6 bg-pink-200 opacity-90 dark:opacity-40 z-10"
        />
      </div>
    </motion.div>
  </div>



{/**Team nèeeeeeeeeeeeee */}

         <section className="grid grid-cols-1 lg:grid-cols-12 gap-10 ml-29 mt-6">
  <div className="lg:col-span-7 flex justify-start relative">
    <div className="relative flex items-center justify-center">
      {/* Outer animated ring */}
      <motion.div
        className="absolute w-[460px] h-[460px] md:w-[520px] md:h-[520px] border-4 border-[#30c9e8] dark:border-emerald-500/60"
        style={{ boxSizing: "border-box", zIndex: 5 }}
        animate={{
          rotate: [-6, 6, -6],
          skewX: [0, 4, -4, 0],
          scale: [1, 1.02, 1],
          borderRadius: [
            "48% 52% 50% 50% / 50% 48% 52% 50%",
            "40% 60% 60% 40% / 45% 55% 45% 55%",
            "48% 52% 50% 50% / 50% 48% 52% 50%",
          ],
        }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute w-[340px] h-[340px] md:w-[500px] md:h-[500px] border-2 border-[#9cf4df] dark:border-emerald-500/30"
        style={{ zIndex: 6 }}
        animate={{
          borderRadius: [
            "48% 52% 50% 50% / 50% 48% 52% 50%",
            "60% 40% 40% 60% / 40% 60% 40% 60%",
            "48% 52% 50% 50% / 50% 48% 52% 50%",
          ],
          rotate: [1, -2, 1],
          scale: [1, 1.01, 1],
        }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
      />
      <motion.div
        className="relative z-10 w-[300px] h-[300px] md:w-[460px] md:h-[460px] overflow-hidden shadow-2xl bg-transparent"
        style={{ borderRadius: "48% 52% 50% 50%" }}
        whileHover={{ scale: 1.03, rotate: 1 }}
        animate={{
          y: [0, -10, 0],
          rotate: [0, 1.2, 0],
          borderRadius: [
            "48% 52% 50% 50% / 50% 48% 52% 50%",
            "60% 40% 55% 45% / 45% 55% 50% 50%",
            "48% 52% 50% 50% / 50% 48% 52% 50%",
          ],
        }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      >
        <div
          className="flex h-full transition-transform duration-700"
          style={{
            transform: `translateX(-${teamCurrent * (100 / teamMembers.length)}%)`,
            width: `${teamMembers.length * 100}%`,
          }}
        >
          {teamMembers.map((member, idx) => (
            <div
              key={idx}
              className="flex-shrink-0 h-full"
              style={{ width: `${100 / teamMembers.length}%` }}
            >
              <motion.img
                src={member.img}
                alt={member.name}
                className="w-full h-full object-cover"
                initial={{ borderRadius: "50% 50% 48% 52% / 45% 55% 50% 50%" }}
                animate={{
                  borderRadius: [
                    "50% 50% 48% 52% / 45% 55% 50% 50%",
                    "60% 40% 40% 60% / 40% 60% 45% 55%",
                    "50% 50% 48% 52% / 45% 55% 50% 50%",
                  ],
                }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: idx * 0.15,
                }}
                onMouseEnter={() => setCurrent(idx)}
              />
            </div>
          ))}
        </div>
      </motion.div>

     
      {teamMembers[teamCurrent] && (
          <div className="absolute left-0 bottom-[-88px] p-2 md:p-4 z-20">
            <h3 className="text-lg sm:text-[24px] md:text-[35px] font-lora font-extrabold leading-tight text-[#107c91] dark:text-emerald-200">
              {teamMembers[teamCurrent].name}
            </h3>
            <p className="text-sm sm:text-[20px] md:text-[20px] font-extrabold leading-tight text-[#107c91] dark:text-emerald-200">
              {teamMembers[teamCurrent].mssv}
            </p>
          </div>
        )}
            </div>
  </div>



  <section
  id="contact"
  className="flex flex-col justify-start items-center text-center mt-[-40px] ml-90 relative"
>
  {/* Title */}
  <motion.h2
    initial={{ opacity: 0, x: 50 }}
    whileInView={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.7 }}
    whileHover={{
      scale: 1.1,
      color: "#97A97C",
      textShadow: "0px 0px 10px #F3D3D3",
    }}
    className="text-2xl md:text-4xl font-extrabold text-pink-400 mb-10 tracking-wide drop-shadow-[3px_3px_0_#F3D3D3] cursor-pointer"
  >
    CONTACT
  </motion.h2>
  <motion.div
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, amount: 0.3 }}
    variants={{
      visible: { transition: { staggerChildren: 0.2 } },
    }}
    className="flex flex-col items-end gap-6 w-fit"
  >
    {contacts.map((item, index) => {
      const Icon = item.icon;
      return (
        <motion.a
          key={index}
          href={item.link}
          target="_blank"
          rel="noopener noreferrer"
          viewport={{ once: false, amount: 0.3 }}
          variants={{
            hidden: { opacity: 0, x: 30, scale: 0.8 },
            visible: {
              opacity: 1,
              x: 0,
              scale: 1,
              transition: { type: "spring", stiffness: 120, damping: 12 },
            },
          }}
          whileHover={{
            scale: 1.1,
            backgroundColor: "#97A97C",
            color: "#fff",
            boxShadow: "0px 6px 0px #F3D3D3",
            transition: { type: "spring", stiffness: 300 },
          }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-3 px-8 py-4 border-4 border-[#97A97C] rounded-full bg-[#E7E1D7] text-[#53624E] font-semibold shadow-[4px_4px_0_#F3D3D3] transition-all duration-300"
        >
          <Icon size={24} />
          {item.name}
        </motion.a>
      );
    })}
  </motion.div>
</section>



</section>

        </section>
      </div>

      <ChatBotButton />
    </div>
  );
};

export default Page;
