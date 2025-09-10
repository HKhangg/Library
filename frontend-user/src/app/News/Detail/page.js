"use client";
import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import ChatBotButton from "../../components/ChatBoxButton";

const page = () => {
  return (
    <div className="min-h-screen flex flex-col -mr-[180px]">
      <main className="pt-16 flex flex-1">
        <section className="py-6 px-4 rounded-2xl md:px-12 w-full max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="max-w-6xl mx-auto text-center"
          >
            <div className="bg-white p-4 text-start rounded-lg shadow-md mb-6">
              <h1 className="text-xl font-normal mb-4 text-black text-start w-fit rounded-lg">
                Ra mắt bản dịch tác phẩm <strong>Cuốn sách hoang dã</strong> của
                tác giả Juan Villoro
              </h1>

              <p className="text-gray-700 mb-8">
                <strong>Ngày đăng:</strong> Thứ Ba, 06/05/2025
              </p>

              <img
                src="https://bizweb.dktcdn.net/100/363/455/articles/494621307-1097261965774870-6550418258675179038-n.jpg?v=1746519986820"
                alt="Ra mắt bản dịch tác phẩm 'Cuốn sách hoang dã' của tác giả Juan Villoro"
                className="w-full h-auto rounded-lg mb-8"
              />
              <p className="text-gray-700 mb-8">
                Tháng Năm này, nhân dịp kỷ niệm 50 năm quan hệ ngoại giao giữa
                Mexico và Việt Nam, Nhã Nam trân trọng phối hợp cùng Đại sứ quán
                Mexico tại Việt Nam và Khoa tiếng Tây Ban Nha – Trường Đại học
                Hà Nội tổ chức sự kiện ra mắt tác phẩm “Cuốn sách hoang dã” của
                tác giả Juan Villoro.{" "}
              </p>
              <p className="text-gray-700 mb-8">
                “Cuốn sách Hoang dã” là một tác phẩm dành cho thiếu nhi và thanh
                thiếu niên đạt thành công vang dội trên thế giới. Sách đã được
                dịch sang nhiều thứ tiếng, được chuyển sang bản chữ nổi Braille
                dành cho người khiếm thị và đang trong quá trình chuyển thể điện
                ảnh.
              </p>

              <p className="text-gray-700 mb-8">
                Tác giả Juan Villoro là nhà văn, nhà báo, dịch giả xuất sắc với
                hơn 50 tác phẩm đã xuất bản và sở hữu giải thưởng văn học danh
                giá nhất của tiếng Tây Ban Nha, trong đó có giải IBBY (Hội đồng
                Sách Quốc tế dành cho Thanh thiếu niên) năm 1994 và giải Báo chí
                Quốc tế Nhà vua Tây Ban Nha (2010).
              </p>

              <p className="text-gray-700 mb-8">
                Sự kiện ra mắt “Cuốn sách Hoang dã” bằng tiếng Việt là một trong
                những sự kiện quan trọng nhất trong chuỗi hoạt động kỷ niệm 50
                năm thiết lập quan hệ ngoại giao giữa Mexico và Việt Nam.
              </p>

              <p className="text-gray-700 mb-8">
                Đây là dịp để bạn đọc cùng trò chuyện về một tác phẩm văn học
                Mexico nổi tiếng, cũng như tìm hiểu về ngôn ngữ Tây Ban Nha
                trước nhu cầu thực tế đang ngày một tăng cao tại Việt Nam.
              </p>

              <p className="text-gray-700 mb-8">
                Trân trọng mời bạn đọc tới tham dự!
              </p>

              <p className="text-gray-700 mb-8">
                <strong>Thông tin sự kiện:</strong>
              </p>
              <p className="text-gray-700 mb-8">
                ⏰Thời gian: 9:30 sáng thứ Sáu, ngày 9/5/2025
              </p>
              <p className="text-gray-700 mb-8">
                📍 Địa điểm: Phòng 102C - Trường Đại học Hà Nội, Km9 Nguyễn
                Trãi, Nam Từ Liêm, Hà Nội
              </p>

              <p className="text-gray-700 mb-8">
                <strong>Đăng ký tham dự:</strong> Vui lòng đăng ký trước qua
                đường link:{" "}
                <a
                  href="https://example.com"
                  className="text-blue-500 hover:underline"
                >
                  Đăng ký tại đây
                </a>
              </p>
            </div>
          </motion.div>
        </section>
        <ChatBotButton />
      </main>
    </div>
  );
};

export default page;
