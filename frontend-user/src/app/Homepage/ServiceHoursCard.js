import React from "react";

const ServiceHoursCard = () => {
  return (
    <article className="flex flex-col p-5 rounded-xl bg-blue-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 shadow-md hover:shadow-xl transition-all duration-300 w-full h-full min-h-0">
      <h2 className="px-5 py-2.5 text-center text-lg font-bold text-white dark:text-white bg-[#9ce5f4] rounded-lg">
        Thời gian phục vụ
      </h2>
      <div className="mt-4 text-gray-800 dark:text-gray-200 text-base font-medium">
        <p>
          <strong className="font-semibold text-gray-900 dark:text-white">Thứ 2 - Thứ 6</strong>
          <span> : 7:30 - 16:30 </span>
        </p>
        <p>
          <strong className="font-semibold text-gray-900 dark:text-white">Thứ 7</strong>
          <span> : 8:00 - 16:00</span>
        </p>
        <p className="mt-2">
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
        className="object-contain w-full mt-4 rounded-md"
      />
    </article>
  );
};

export default ServiceHoursCard;
