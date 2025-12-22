import React from "react";

const CollectionCard = ({ title, category, imageSrc, bgColor = "bg-blue-50", buttonTextColor = "text-gray-900" }) => {
  return (
    <article className="flex flex-col rounded-xl overflow-hidden w-[750px] h-[500px] border border-gray-300 dark:border-gray-700 shadow-md hover:shadow-xl transition-all duration-300">
      <img src={imageSrc} alt="" className="object-cover w-full h-full" />
      <div className={`${bgColor} dark:bg-gray-800 absolute bottom-0 left-0 right-0 flex justify-between p-5`}>
        <div className="text-gray-900 dark:text-white">
          <p className="text-base font-medium">{category}</p>
          <h2 className="mt-2 text-lg font-semibold">{title}</h2>
        </div>
        <button className={`${buttonTextColor} bg-white rounded-full px-5 py-2.5`}>Truy cập</button>
      </div>
    </article>
  );
};

export default CollectionCard;
