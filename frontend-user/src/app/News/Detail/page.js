"use client";
import React from "react";
import { motion } from "framer-motion";
import ChatBotButton from "../../components/ChatBoxButton";

const NewsDetailPage = () => {
  return (
    <div className="flex flex-col min-h-screen flex flex-col -mr-[180px] bg-white dark:bg-gray-900 text-foreground transition-colors duration-300">
      <main className="pt-16 flex z-10">
        <section className="flex-1 py-6 px-4 md:px-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="max-w-5xl mx-auto"
          >
            <div className="bg-blue-50 dark:bg-gray-800 rounded-3xl shadow-md p-6 transition-all duration-300 hover:shadow-xl">
              <h1 className="text-2xl font-semibold text-[#062D76] dark:text-[#30c9e8] mb-4">
                Ra mắt bản dịch tác phẩm <strong>Cuốn sách hoang dã</strong> của tác giả Juan Villoro
              </h1>

              <p className="text-gray-700 dark:text-gray-300 mb-6">
                <strong>Ngày đăng:</strong> Thứ Ba, 06/05/2025
              </p>

              <img
                src="https://bizweb.dktcdn.net/100/363/455/articles/494621307-1097261965774870-6550418258675179038-n.jpg?v=1746519986820"
                alt="Ra mắt bản dịch tác phẩm 'Cuốn sách hoang dã' của tác giả Juan Villoro"
                className="w-full h-auto rounded-2xl shadow-md mb-6 transition-transform duration-500 hover:scale-105"
              />

              <div className="space-y-6 text-gray-800 dark:text-gray-300">
                <p>
                  Tháng Năm này, nhân dịp kỷ niệm 50 năm quan hệ ngoại giao giữa
                  Mexico và Việt Nam, Nhã Nam trân trọng phối hợp cùng Đại sứ quán
                  Mexico tại Việt Nam và Khoa tiếng Tây Ban Nha – Trường Đại học
                  Hà Nội tổ chức sự kiện ra mắt tác phẩm “Cuốn sách hoang dã” của
                  tác giả Juan Villoro.
                </p>

                <p>
                  “Cuốn sách Hoang dã” là một tác phẩm dành cho thiếu nhi và thanh
                  thiếu niên đạt thành công vang dội trên thế giới. Sách đã được
                  dịch sang nhiều thứ tiếng, được chuyển sang bản chữ nổi Braille
                  dành cho người khiếm thị và đang trong quá trình chuyển thể điện
                  ảnh.
                </p>

                <p>
                  Tác giả Juan Villoro là nhà văn, nhà báo, dịch giả xuất sắc với
                  hơn 50 tác phẩm đã xuất bản và sở hữu giải thưởng văn học danh
                  giá nhất của tiếng Tây Ban Nha, trong đó có giải IBBY (Hội đồng
                  Sách Quốc tế dành cho Thanh thiếu niên) năm 1994 và giải Báo chí
                  Quốc tế Nhà vua Tây Ban Nha (2010).
                </p>

                <p>
                  Sự kiện ra mắt “Cuốn sách Hoang dã” bằng tiếng Việt là một trong
                  những sự kiện quan trọng nhất trong chuỗi hoạt động kỷ niệm 50
                  năm thiết lập quan hệ ngoại giao giữa Mexico và Việt Nam.
                </p>

                <p>
                  Đây là dịp để bạn đọc cùng trò chuyện về một tác phẩm văn học
                  Mexico nổi tiếng, cũng như tìm hiểu về ngôn ngữ Tây Ban Nha
                  trước nhu cầu thực tế đang ngày một tăng cao tại Việt Nam.
                </p>

                <p>Trân trọng mời bạn đọc tới tham dự!</p>

                <p><strong>Thông tin sự kiện:</strong></p>
                <p>⏰ Thời gian: 9:30 sáng thứ Sáu, ngày 9/5/2025</p>
                <p>📍 Địa điểm: Phòng 102C - Trường Đại học Hà Nội, Km9 Nguyễn Trãi, Nam Từ Liêm, Hà Nội</p>
                <p>
                  <strong>Đăng ký tham dự:</strong> Vui lòng đăng ký trước qua đường link:{" "}
                  <a
                    href="https://example.com"
                    className="text-blue-500 hover:underline"
                  >
                    Đăng ký tại đây
                  </a>
                </p>
              </div>
            </div>
          </motion.div>
        </section>
        <ChatBotButton />
      </main>
    </div>
  );
};

export default NewsDetailPage;
