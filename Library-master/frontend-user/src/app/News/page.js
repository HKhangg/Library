"use client";
import React from "react";
import { motion } from "framer-motion";
import { Newspaper } from "lucide-react";
import Link from "next/link";
import CardNew from "./CardNew";
import { Button } from "@/components/ui/button";
import ChatBotButton from "../components/ChatBoxButton";

const Page = () => {
  return (
    <div className="min-h-screen flex flex-col -mr-[190px]">
      <main className="pt-16 flex flex-1">
        <section className="py-6 px-4 rounded-2xl md:px-12 w-full">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="max-w-6xl mx-auto text-center"
          >
            <h1 className="text-l font-bold mb-4 text-blue-300 text-start w-fit bg-white p-2 rounded-lg shadow-md">
              <Newspaper className="inline-block w-6 h-6 mr-3" />
              Tin Tức Mới Nhất
            </h1>
            <div className="mt-4 items-center">
              <div className="grid grid-cols-3 justify-around items-center mb-8 gap-4">
                <Link href="/News/Detail">
                  <CardNew
                    title="Ra mắt bản dịch tác phẩm 'Cuốn sách hoang dã' của tác giả Juan Villoro"
                    date="Thứ Ba, 06/05/2025"
                    imageSrc="https://bizweb.dktcdn.net/100/363/455/articles/494621307-1097261965774870-6550418258675179038-n.jpg?v=1746519986820"
                  />
                </Link>
                <CardNew
                  title="Sự kiện giới thiệu tác phẩm 'Dọc đường 2' và gặp gỡ nhà văn Nguyên"
                  date="Thứ Hai, 21/04/2025"
                  imageSrc="https://bizweb.dktcdn.net/100/363/455/articles/491279363-1088490436652023-2743767814237791180-n.jpg?v=1745208865993"
                />
                <CardNew
                  title="Hội sách Nhã Nam chào hè 2025"
                  date="Thứ Ba, 08/04/2025"
                  imageSrc="https://bizweb.dktcdn.net/100/363/455/articles/489006758-1079586880875712-661463280947496865-n.jpg?v=1744100699603"
                />
                <CardNew
                  title="Sự kiện: NHỮNG CÂU CHUYỆN NGHỀ PHÁP Y - Giới thiệu bộ sách pháp y"
                  date="Thứ Hai, 24/03/2025"
                  imageSrc="https://bizweb.dktcdn.net/100/363/455/articles/484799317-1063744625793271-7677298375345374751-n.jpg?v=1742792125167"
                />
                <CardNew
                  title="Trò chuyện về cuốn sách: Chuyện nhà Tí của nhà văn Phan Thị Vàng Anh"
                  date="Thứ Hai, 17/03/2025"
                  imageSrc="https://bizweb.dktcdn.net/100/363/455/articles/website-a-nh-da-i-die-n-ba-i-vie-t-17-51a80241-426c-4785-b5e1-9aedf8dff8c0.png?v=1742197752157"
                />
                <CardNew
                  title="Sự kiện giao lưu với tác giả và dịch giả 'Bố con cá gai'"
                  date="Thứ Hai, 03/03/2025"
                  imageSrc="https://bizweb.dktcdn.net/100/363/455/articles/480203269-1042894241211643-9180551152830458713-n.jpg?v=1740994652690"
                />
                <CardNew
                  title="'Quyền lực' của đất đai"
                  date="Chủ Nhật, 02/03/2025"
                  imageSrc="https://bizweb.dktcdn.net/100/363/455/articles/website-a-nh-da-i-die-n-ba-i-vie-t-14-42424747-4313-46a1-a9d9-0375b3214194.png?v=1740891085440"
                />
                <CardNew
                  title="Sự kiện: Ra mắt cuốn sách ĐẤT ĐAI - Ham muốn sở hữu định hình thế giới hiện đại"
                  date="Thứ Sáu, 21/02/2025"
                  imageSrc="https://bizweb.dktcdn.net/100/363/455/articles/1-13cd774c-b58f-461e-9a81-9e614842fb12.png?v=1740115538713"
                />
              </div>
              {/* <Link href="/About">
                <button className="bg-yellow-400 text-white px-6 py-3 rounded-full hover:bg-yellow-500 transition">
                  See All
                </button>
              </Link> */}
            </div>
          </motion.div>
          <div className="flex justify-center items-center gap-2 mt-6">
            <Button className="bg-gray-700 hover:bg-gray-700 text-white">
              Trang trước
            </Button>
            Trang 1 / 1
            <Button className="bg-gray-700 hover:bg-gray-700 text-white">
              Trang sau
            </Button>
          </div>
        </section>
      </main>
      <ChatBotButton />
    </div>
  );
};

export default Page;
