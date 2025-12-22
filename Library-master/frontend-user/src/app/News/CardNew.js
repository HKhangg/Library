import React from "react";

const CardNew = ({ title, date, imageSrc }) => {
  return (
    <div className="bg-white w-[350px] h-[320px] items-center shadow-md hover:scale-105 hover:shadow-xl hover:brightness-110 transition-transform duration-300 rounded-lg">
      <img src={imageSrc} alt="" className="w-75 h-50 mx-auto mt-4" />
      <div className="justify-center items-center p-4">
        <h3 className="text-l font-semibold h-[50px]">{title}</h3>
        <p className="text-gray-600">{date}</p>
      </div>
    </div>
  );
};

export default CardNew;
