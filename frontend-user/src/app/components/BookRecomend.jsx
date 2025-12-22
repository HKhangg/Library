"use client";
import React from "react";
import { useRouter } from "next/navigation";

const BookRecommend = ({ id, imageSrc, title, author }) => {
  const router = useRouter();
  const handleCardClick = () => router.push(`/book-detail/${id}`);

  return (
    <article
      onClick={handleCardClick}
      className="flex flex-col items-center cursor-pointer p-3 rounded-xl bg-blue-50 dark:bg-gray-800 w-[230px]"
    >
      <img src={imageSrc} alt={title} className="object-cover w-[200px] rounded-md aspect-[0.67]" />
      <h3 className="mt-2 text-center font-bold text-gray-900 dark:text-white">{title}</h3>
      {author && <p className="text-sm text-gray-800 dark:text-gray-200">Tác giả: {author}</p>}
    </article>
  );
};

export default BookRecommend;
