import React from "react";

const ImageCard = (imageSrc) => {
  return (
    <article className="flex  rounded-xl w-[750px] h-[500px]">
      <img
        src={imageSrc}
        alt="anh bi loi"
        className="object-cover max-md:size-full size-auto"
      />
    </article>
  );
};

export default ImageCard;
