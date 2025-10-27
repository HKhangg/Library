package com.library_web.library.chat.tool;

import com.library_web.library.model.Book;
import com.library_web.library.service.BookService;
import dev.langchain4j.agent.tool.Tool;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
// Bỏ import java.util.Optional; 

@Component
public class DescriptionTool {

    @Autowired
    private BookService bookService;

    @Tool("Dùng tool này để LẤY MÔ TẢ hoặc TÓM TẮT nội dung của một cuốn sách CỤ THỂ khi đã biết ID sách (ma_sach). Input là 'bookId' (ID của sách).")
    public String getBookDescription(Long bookId) {
        if (bookId == null || bookId <= 0) {
            return "Bạn cần cung cấp ID sách hợp lệ để tui lấy mô tả nha.";
        }

        try {
            Book book = bookService.getBookbyID(bookId); 
            if (book != null) {
                String description = book.getMoTa();
                String bookName = book.getTenSach();

                if (description != null && !description.trim().isEmpty()) {
                    return "Đây là mô tả cho cuốn '" + bookName + "' (ID: " + bookId + "):\n" + description;
                } else {
                    return "Xin lỗi, cuốn '" + bookName + "' (ID: " + bookId + ") chưa có mô tả trong hệ thống.";
                }
            } else {
                 return "Xin lỗi, tui không tìm thấy sách nào có ID " + bookId + " trong thư viện.";
            }

        } catch (Exception e) {
            System.err.println("Lỗi nghiêm trọng trong DescriptionTool.getBookDescription (DB Lookup): " + e.getMessage());
            e.printStackTrace();
            return "Ui, hệ thống lấy mô tả sách đang bị lỗi chút xíu khi truy vấn database. Bạn thử lại sau giúp tui nha!";
        }
    }
}