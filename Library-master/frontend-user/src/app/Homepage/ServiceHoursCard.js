import React from "react";
const ServiceHoursCard = () => {
  return (
    <article className="flex flex-col flex-1 items-start self-stretch p-5 my-auto bg-white rounded-xl basis-0 w-[750px] h-[500px]">
      <h2 className="self-start text-center px-5 py-2.5 text-[1.25rem] text-white bg-blue-300 rounded-lg">
        Thời gian phục vụ
      </h2>
      <div className="self-stretch my-[1rem] text-[1rem] font-medium text-black">
        <p>
          <strong className="font-semibold text-black">Thứ 2 - Thứ 6</strong>
          <span className="font-normal"> : 7:30 - 16:30 </span>
        </p>
        <p>
          <strong className="font-semibold text-black">Thứ 7</strong>
          <span className="font-normal"> : 8:00 - 16:00</span>
        </p>
        <p className="font-normal">
          Thư viện không phục vụ vào chủ nhật, ngày lễ, tết theo quy định và các
          ngày nghỉ đột xuất khác (có thông báo). Để đảm bảo chất lượng phục vụ,
          thư viện có thể điều chỉnh thời gian mở cửa trong các kỳ thi, sự kiện
          hoặc bảo trì hệ thống. Bạn đọc vui lòng theo dõi thông báo trên bảng
          tin hoặc website thư viện để cập nhật các thay đổi mới nhất về lịch
          làm việc. Ngoài ra, dịch vụ mượn/trả sách trực tuyến vẫn hoạt động
          liên tục trên hệ thống điện tử ngay cả khi thư viện đóng cửa.
        </p>
      </div>
      <img
        src="https://cdn.builder.io/api/v1/image/assets/TEMP/41cb49d1baeb39b397272fcd2a82b4a7de38aa75?placeholderIfAbsent=true&apiKey=d911d70ad43c41e78d81b9650623c816"
        alt="Service hours illustration"
        className="object-contain flex-1 w-full aspect-[4] "
      />
    </article>
  );
};

export default ServiceHoursCard;
