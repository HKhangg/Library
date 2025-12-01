"use client";
import React from "react";
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
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import ChatBotButton from "../components/ChatBoxButton";

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
];

const teamMembers = [
  {
    avt: "/images/Huyen1.jpg",
    name: "Nguyễn Lê Thanh Huyền",
    mssv: "22520590",
    role: "Leader",
    nghanh: "Công nghệ thông tin",
  },
  {
    avt: "/images/Tri.jpg",
    name: "Nguyễn Thanh Trí",
    mssv: "23521645",
    role: "Member",
    nghanh: "Công nghệ Nhật Bản",
  },
  {
    avt: "/images/Thao1.jpg",
    name: "Lê Thị Phương Thảo",
    mssv: "23521468",
    role: "Member",
    nghanh: "Hệ thống thông tin",
  },
  {
    avt: "/images/Trang.jpg",
    name: "Lê Thị Thùy Trang",
    mssv: "23521627",
    role: "Member",
    nghanh: "Công nghệ Nhật Bản",
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
  "Tài liệu học tập",
  "Sách tham khảo",
  "Sách thiếu nhi",
  "... và nhiều thể loại khác",
];

const benefits = [
  "Tiết kiệm thời gian tra cứu và mượn/trả sách",
  "Tránh thất lạc dữ liệu, lưu trữ tập trung",
  "Thống kê tự động và chính xác",
  "Trải nghiệm người dùng hiện đại, dễ sử dụng",
  "Hỗ trợ nhiều vai trò: sinh viên, thủ thư, quản trị viên",
  "Đăng nhập nhanh bằng tài khoản Google/Facebook",
];

const Page = () => {
  return (
    <div className="min-h-screen flex flex-col -mr-[180px] mt-20">
      <div className="flex-1 bg-white max-w-5xl mx-auto px-4 rounded-2xl">
        <section className="container mx-auto px-4 py-10">
          <h2 className="text-3xl font-bold text-start ml-2 mb-8 text-blue-900">
            Về 8ooK - Website quản lý thư viện
          </h2>
          {/* Image */}
          <Link href="/" className="flex-shrink-0 items-center">
            <img
              src="https://i.pinimg.com/736x/bc/fd/9a/bcfd9a2d158eb0f2c36bf5b1126c0bfc.jpg"
              alt="Library Management System"
              width={950}
              height={650}
              className="object-cover rounded-lg border-2 border-blue-200 shadow-md transition-transform duration-300 ease-in-out hover:scale-95 hover:shadow-xl hover:brightness-110"
            />
          </Link>
          {/* Text */}
          <div className="flex-1">
            <p className="text-gray-600 text-lg mt-10 mb-6">
              <strong>8ook,</strong> là đồ án môn học được thực hiện bởi nhóm
              sinh viên trong khuôn khổ môn học IS216 - Lập trình Java với mục
              tiêu xây dựng một nền tảng trực tuyến hỗ trợ toàn diện cho hoạt
              động quản lý thư viện. Sản phẩm hướng đến việc hiện đại hóa quá
              trình tra cứu, mượn, trả và quản lý sách, giúp người dùng và quản
              trị viên có thể thao tác nhanh chóng, chính xác và tiện lợi trong
              môi trường số.
            </p>
            <p className="text-gray-600 text-lg mt-6 mb-6">
              Trong bối cảnh chuyển đổi số đang diễn ra mạnh mẽ trong mọi lĩnh
              vực, việc duy trì mô hình thư viện truyền thống dựa trên ghi chép
              thủ công, giấy tờ, và thao tác quản lý thủ công đang bộc lộ nhiều
              hạn chế rõ rệt. Các vấn đề như mất thời gian tìm kiếm sách, khó
              khăn trong việc theo dõi lịch sử mượn/trả, dễ xảy ra thất thoát
              sách, và thiếu tính đồng bộ trong hệ thống quản lý là những điểm
              yếu cần được cải thiện.
            </p>
            <p className="text-gray-600 text-lg mt-6 mb-6">
              Từ thực tế đó, nhóm đã nảy ra ý tưởng phát triển 8ooK - một hệ
              thống quản lý thư viện hiện đại, tiện lợi và thân thiện với người
              dùng, giúp cải thiện hiệu quả hoạt động của thư viện, đồng thời
              nâng cao trải nghiệm cho cả người đọc và người quản lý.
            </p>
            <p className="text-gray-600 text-lg mt-6 mb-6">
              Bên cạnh đó, đây cũng là cơ hội để nhóm áp dụng các kiến thức đã
              học và thực hiện đồ án môn IS216-Lập trình Java như phát triển
              frontend bằng <strong>Next.js</strong>, xây dựng backend với{" "}
              <strong>Spring Boot</strong>, sử dụng cơ sở dữ liệu{" "}
              <strong>Supabase</strong>.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-gray-700 text-sm mt-2">
              <div className="bg-blue-50 p-4 rounded-xl shadow text-sm font-medium text-gray-700 flex items-center gap-2 hover:shadow-md transition">
                <BracesIcon className="text-gray-500 w-5 h-5" /> Next.js
              </div>
              <div className="bg-blue-50 p-4 rounded-xl shadow text-sm font-medium text-gray-700 flex items-center gap-2 hover:shadow-md transition">
                <ShellIcon className="text-pink-500 w-5 h-5" /> Spring Boot
              </div>
              <div className="bg-blue-50 p-4 rounded-xl shadow text-sm font-medium text-gray-700 flex items-center gap-2 hover:shadow-md transition">
                <Database className="w-5 h-5" /> Supabase
              </div>
            </div>
            <p className="text-gray-600 text-lg mt-6 mb-6">
              Thông qua dự án này, nhóm không chỉ phát triển một ứng dụng có
              tính ứng dụng thực tế cao, mà còn rèn luyện được các kỹ năng quan
              trọng như làm việc nhóm, thiết kế hệ thống, lập trình full-stack
              và triển khai sản phẩm hoàn chỉnh. Đây là bước đệm quý giá để nhóm
              tiến gần hơn đến môi trường làm việc thực tế trong ngành công nghệ
              thông tin.
            </p>
          </div>
        </section>

        <section className="container px-4 py-4 bg-blue-50 rounded-xl text-3xl font-bold ml-2 mb-8  justify-center items-center">
          <h2 className="text-2xl font-bold mt-2 mb-9 text-blue-900 text-start">
            Các tính năng nổi bật
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4  gap-8 max-w-5xl">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition"
              >
                <div className="mb-4">{feature.icon}</div>
                <h3 className="font-semibold text-lg text-gray-800 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 text-sm">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Đa dạng thể loại sách */}
        <section className="container mx-auto px-4 py-10 mb-10">
          <h2 className="text-2xl font-bold mt-2 mb-9 text-blue-900 text-start">
            Đa dạng thể loại sách
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 max-w-5xl">
            {genres.map((genre, idx) => (
              <div
                key={idx}
                className="bg-white p-4 rounded-xl shadow text-sm font-medium text-gray-700 flex items-center gap-2 hover:shadow-md transition"
              >
                <BookIcon className="w-5 h-5 text-blue-300" />
                {genre}
              </div>
            ))}
          </div>
        </section>

        <section className="container px-4 py-4 bg-blue-50 rounded-xl text-3xl font-bold ml-2 mb-8  justify-center items-center">
          <h2 className="text-2xl font-bold text-start ml-2 mb-8 text-blue-900">
            Lợi ích khi sử dụng
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 text-gray-700 text-sm mt-6 max-w-5xl">
            {benefits.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 bg-white shadow p-3 rounded-xl"
              >
                <CheckCircle className="text-green-500 w-5 h-5" />
                {item}
              </div>
            ))}
          </div>
        </section>

        {/* Meet our team */}
        <section className="container mx-auto px-4 py-10 mb-10">
          <h2 className="text-2xl font-bold mt-2 mb-9 text-blue-900 text-start">
            Nhóm phát triển
          </h2>
          <div className="flex flex-col sm:flex-row justify-center text-center items-center gap-6 mb-0">
            {teamMembers.map((member, index) => (
              <div
                key={index}
                className="bg-white  rounded-xl shadow-md h-[400px] w-full sm:w-60"
              >{/*
                <Image
                  src={member.avt}
                  alt={member.name}
                  width={150}
                  height={200}
                  className="rounded-t-xl mx-auto mb-0 w-full"
                />*/}
                <div className="p-4">
                  <h3 className="text-l font-semibold text-gray-800">
                    {member.name}
                  </h3>
                  <p className="text-gray-600">{member.mssv}</p>
                  <p className="text-gray-600">{member.role}</p>
                  <p className="text-gray-600">{member.nganh}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
      <ChatBotButton />

      {/* Contact */}
      <footer className=" py-4 text-center">
        <h3 className="text-2xl text-blue-900 font-semibold mb-2">Liên hệ</h3>
        <div className="flex flex-col sm:flex-row justify-center gap-4 text-white">
          <a
            href="mailto:8386@gmail.com"
            className="flex text-blue-900 items-center gap-2 hover:text-black"
          >
            <Mail className="w-5 h-5" />
            8386@gmail.com
          </a>
          <a
            href=""
            target="_blank"
            rel="noopener noreferrer"
            className="flex text-blue-900 items-center gap-2 hover:text-black"
          >
            <Github className="w-5 h-5" />
            github.com/haha
          </a>
        </div>
      </footer>
    </div>
  );
};

export default Page;
