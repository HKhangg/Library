import React from "react";

const StatisticsCard = ({ icon, title, value }) => {
  return (
    <article className="bg-[#162457] rounded-2xl p-4 flex flex-col justify-between h-[130px]">
      <header className="flex items-start gap-2">
        {icon && (
          <img
            src={icon}
            alt=""
            className="w-5 h-5 mt-1 shrink-0" // canh giữa icon với tiêu đề
          />
        )}
        <h2 className="text-[1.25rem] font-medium leading-snug text-white line-clamp-2 break-words">
          {title}
        </h2>
      </header>

      <section className="text-xl font-bold text-white mt-2">
        {value}
      </section>
    </article>
  );
};

export default StatisticsCard;
