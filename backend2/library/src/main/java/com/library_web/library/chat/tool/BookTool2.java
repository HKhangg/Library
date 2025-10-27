package com.library_web.library.chat.tool;

import dev.langchain4j.agent.tool.Tool;
import dev.langchain4j.data.segment.TextSegment;
import dev.langchain4j.rag.content.Content;
import dev.langchain4j.rag.content.retriever.ContentRetriever;
import dev.langchain4j.rag.query.Query;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Component
public class BookTool2 { 

    @Autowired
    @Qualifier("bookRetriever") 
    private ContentRetriever bookRetriever;

    @Tool("PHIÊN BẢN 2 (Dùng RAG từ CSV): Dùng tool này để TÌM KIẾM SÁCH theo tên sách, tác giả, mô tả, chủ đề, hoặc từ khóa (ví dụ: 'sách về robot mèo màu xanh', 'sách của Nguyễn Nhật Ánh', 'sách kinh doanh'). Input là một câu truy vấn.")
    public String findBookV2(String query) { 
        if (query == null || query.trim().isEmpty()) {
            return "Bạn muốn tìm sách gì á?";
        }

        String searchTerm = query.trim();

        try {
            Query bookQuery = Query.from(searchTerm);
            List<Content> retrievedContents = bookRetriever.retrieve(bookQuery);

            if (retrievedContents.isEmpty()) {
                return "Xin lỗi, tui không tìm thấy cuốn sách nào khớp với '" + searchTerm + "' trong thư viện hết á.";
            }
            
            List<FoundBook> foundBooks = retrievedContents.stream()
                .map(Content::textSegment)
                .filter(Objects::nonNull)
                .map(segment -> {
                    String id = segment.metadata().getString("ma_sach");
                    String name = segment.metadata().getString("ten_sach");
                    String description = segment.text();
                    
                    Long bookId = (id != null && !id.isBlank()) ? Long.parseLong(id) : null;
                    return (bookId != null && name != null) ? new FoundBook(bookId, name, description) : null;
                })
                .filter(Objects::nonNull)
                .distinct() 
                .toList();

             if (foundBooks.isEmpty()) {
                 return "Tui tìm thấy vài thông tin liên quan đến '" + searchTerm + "' nhưng chưa xác định được sách cụ thể nào.";
             }
            if (foundBooks.size() == 1) {
                FoundBook foundBook = foundBooks.get(0);
                
                return "Okela, tui tìm thấy đúng 1 cuốn khớp là: '" + foundBook.name() + "' (ID sách là: " + foundBook.id() + ").\n"
                     + "Mô tả: " + foundBook.description(); 

            } else {
                String examples = foundBooks.stream()
                                    .limit(3) 
                                    .map(book -> "'" + book.name() + "' (ID: " + book.id() + ")")
                                    .collect(Collectors.joining(", "));
                return "Okela, tui tìm thấy tổng cộng " + foundBooks.size() + " cuốn sách khớp lận á! Ví dụ như: " + examples + ". Bạn muốn tui liệt kê hết tên sách ra hong?";
            }

        } catch (Exception e) {
            System.err.println("Lỗi nghiêm trọng trong BookTool2.findBookV2 (RAG): " + e.getMessage());
            e.printStackTrace();
            return "Ui, hệ thống tìm kiếm sách đang bị lỗi chút xíu. Bạn thử lại sau giúp tui nha!";
        }
    }

    private record FoundBook(Long id, String name, String description) {}
}