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
    <div className="flex gap-1.5 justify-center items-center self-start px-2 py-1 rounded bg-slate-200">
      <span className="self-stretch my-auto text-sm font-medium text-[#062D76]">
        {label}
      </span>
      <div className="self-stretch my-auto w-4">
        <div className={`flex shrink-0 w-4 h-4 ${dotClass} rounded-full`} />
      </div>
    </div>
  );
};
const BookRecommend = ({
  id,
  imageSrc,
  //status chị thêm điều kiện status còn thì hiển thị nhe chị
  title,
  author,
}) => {
  const router = useRouter();
  const handleCardClick = () => {
    router.push(`/book-detail/${id}`);
  };
  return (
    <article
      className="gap-2 items-center w-[230px] cursor-pointer rounded-xl"
      onClick={handleCardClick}
    >
      <img
        src={imageSrc}
        alt={title}
        className="object-cover shrink rounded-sm aspect-[0.67] w-[250px]"
      />
      <div className="flex flex-col flex-1 basis-0">
        <h3 className="gap-1 w-full text-l h[50px] text-center font-bold text-black">
          {title}
        </h3>
      </div>
    </article>
  );
};
export default BookRecommend;
