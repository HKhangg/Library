import React from "react";

const CardNew = ({ title, date, imageSrc }) => {
  return (
    <div className=" flex flex-col bg-blue-50 dark:bg-gray-800 rounded-3xl shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden z-10">
      <img
        src={imageSrc}
        alt={title}
        className="w-full h-48 object-cover rounded-t-3xl transition-transform duration-500 hover:scale-105"
      />
      <div className="p-4 flex flex-col h-[150px]">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 line-clamp-2">{title}</h3>
        <p className="text-gray-600 dark:text-gray-400 mt-2">{date}</p>
      </div>
    </div>
  );
};

export default CardNew;
