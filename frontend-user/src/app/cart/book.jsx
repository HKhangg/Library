"use client";
import React from "react";
import { useRouter } from "next/navigation";

const StatusIndicator = ({ available }) => (
  <div className="flex gap-1.5 justify-center items-center self-start px-2 py-1 rounded bg-slate-200 dark:bg-gray-700 transition-colors duration-300">
    <span className="text-sm font-medium text-[#062D76] dark:text-[#30c9e8] w-fit">
      {available ? "Còn sẵn" : "Đã hết"}
    </span>
    <div
      className={`flex shrink-0 w-4 h-4 rounded-full ${
        available ? "bg-green-400" : "bg-[#F7302E]"
      }`}
    />
  </div>
);

const BookCard = ({
  id,
  imageSrc,
  available,
  title,
  author,
  publisher,
  borrowCount,
  checked = false,          
  onCheck = () => {},
  hoverEffect = true,      
  showThreeDot = false,    
}) => {
  const router = useRouter();

  const slugifyTitle = (str) =>
    str
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^\w\-]+/g, "")
      .replace(/\-\-+/g, "-")
      .replace(/^-+/, "")
      .replace(/-+$/, "");


  const handleCardClick = () => {
    router.push(`/book-detail/${id}`);
  };


  const stopPropagation = (e) => e.stopPropagation();

  return (
    <article
      className={`relative flex gap-5 min-w-60  rounded-2xl py-5 bg-blue-50 dark:bg-gray-600 transition-transform duration-300 shadow-sm hover:shadow-xl ${
        hoverEffect ? "hover:scale-105 hover:brightness-105 cursor-pointer" : ""
      }`}
    >
      {/* Checkbox */}
      <input
        type="checkbox"
        className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 cursor-pointer accent-[#F7302E]"
        checked={checked}
        onChange={(e) => onCheck(e.target.checked)}
        onClick={stopPropagation}
      />

      {/* Image */}
      <img
        src={imageSrc}
        alt={title}
        className="ml-12 w-[100px] aspect-[0.67] object-cover rounded-sm"
        onClick={handleCardClick}
      />

      {/* Info */}
      <div className="flex flex-col flex-1">
        <StatusIndicator available={available} />
        <h3
          className="mt-2 w-full text-[1.125rem] font-lora font-bold text-black dark:text-gray-100"
          onClick={handleCardClick}
        >
          {title}
        </h3>
        <p className="mt-1 text-base text-gray-800 dark:text-gray-300">
          Tác giả: {author}
        </p>
        <p className="mt-1 text-base text-gray-800 dark:text-gray-300">
          NXB: {publisher}
        </p>
        <p className="mt-1 text-base text-gray-800 dark:text-gray-300">
          Lượt mượn: {borrowCount}
        </p>
      </div>

    </article>
  );
};

export default BookCard;
