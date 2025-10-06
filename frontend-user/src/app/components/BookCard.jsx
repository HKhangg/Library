"use client";
import React from "react";
import { useRouter } from "next/navigation";

const StatusIndicator = ({ status }) => {
  let label, dotClass;
  switch (status) {
    case "DA_HET":
      label = "Đã hết";
      dotClass = "bg-[#F7302E]";
      break;
    default:
      label = "Còn sẵn";
      dotClass = "bg-green-400";
  }
  return (
    <div
      className="flex gap-1.5 justify-center items-center self-start px-2 py-1 rounded 
                 bg-[#f0f0f0] dark:bg-gray-700 
                 transition-colors duration-300 hover:bg-gray-200 dark:hover:bg-gray-600"
    >
      <span className="text-sm font-medium text-gray-900 dark:text-white">{label}</span>
      <div className="w-4 h-4">
        <div className={`w-4 h-4 ${dotClass} rounded-full`} />
      </div>
    </div>
  );
};

const BookCard = ({ id, imageSrc, status, title, author, publisher, borrowCount }) => {
  const router = useRouter();
  const handleCardClick = () => router.push(`/book-detail/${id}`);

  return (
    <article
  onClick={handleCardClick}
  className="flex gap-3 min-w-60 cursor-pointer p-3 rounded-xl 
             bg-white dark:bg-gray-800 border border-[#e4e4e4] dark:border-gray-700 
             shadow-md hover:shadow-xl transition-all duration-300"
>
  <img src={imageSrc} alt={title} className="object-cover w-[100px] rounded-md aspect-[0.67]" />
  <div className="flex flex-col flex-1 gap-2">
    <StatusIndicator status={status} />
    <h3 className="text-lg font-medium text-gray-900 dark:text-white">{title}</h3>
    <p className="text-base text-gray-800 dark:text-gray-200">Tác giả: {author}</p>
    <p className="text-base text-gray-800 dark:text-gray-200">NXB: {publisher}</p>
    <p className="text-base text-gray-800 dark:text-gray-200">Lượt mượn: {borrowCount}</p>
  </div>
</article>

  );
};

export default BookCard;
