package com.library_web.library.chat.tool;

import com.library_web.library.model.Book;
import com.library_web.library.service.BookService;
import dev.langchain4j.agent.tool.Tool;
import dev.langchain4j.rag.content.Content;
import dev.langchain4j.rag.content.retriever.ContentRetriever;
import dev.langchain4j.rag.query.Query;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Component
public class BookTool2 {

    @Autowired
    @Qualifier("bookRetriever")
    private ContentRetriever bookRetriever;

    @Autowired
    private BookService bookService; 

    @Tool("PHIÊN BẢN 2 (RAG + Verification): Dùng tool này để TÌM KIẾM SÁCH theo tên, tác giả, mô tả. Input là câu truy vấn.")
    public String findBookV2(String query) {
        if (query == null || query.trim().isEmpty()) return "Bạn muốn tìm sách gì á?";

        try {

            List<Content> retrievedContents = bookRetriever.retrieve(Query.from(query.trim()));
            if (retrievedContents.isEmpty()) {
                return "Xin lỗi, tui không tìm thấy cuốn sách nào khớp với '" + query + "'.";
            }
            List<Long> potentialIds = retrievedContents.stream()
                .map(Content::textSegment)
                .filter(Objects::nonNull)
                .map(seg -> seg.metadata().getString("ma_sach"))
                .filter(id -> id != null && !id.isBlank())
                .map(Long::parseLong)
                .distinct()
                .toList();

            if (potentialIds.isEmpty()) return "Tui tìm thấy thông tin nhưng không xác định được mã sách.";
            List<Book> verifiedBooks = bookService.getBooksByListIds(potentialIds).stream()
                .filter(b -> b.getTrangThai() != Book.TrangThai.DA_XOA)
                .toList();

            if (verifiedBooks.isEmpty()) {
                return "Tui tìm thấy sách trong dữ liệu nhưng hiện tại trong kho thư viện đã không còn (hoặc bị xóa).";
            }
            String examples = verifiedBooks.stream()
                .limit(5) 
                .map(b -> "'" + b.getTenSach() + "' (ID: " + b.getMaSach() + ")")
                .collect(Collectors.joining(", "));

            if (verifiedBooks.size() == 1) {
                 return "Tui tìm thấy đúng 1 cuốn khớp nè: " + examples + ".";
            } else {
                 return "Tui tìm thấy khoảng " + verifiedBooks.size() + " cuốn khớp với yêu cầu của bạn nè. Ví dụ: " + examples + ". Bạn muốn xem chi tiết cuốn nào?";
            }

        } catch (Exception e) {
            e.printStackTrace();
            return "Ui, lỗi hệ thống tìm kiếm rồi: " + e.getMessage();
        }
    }
}