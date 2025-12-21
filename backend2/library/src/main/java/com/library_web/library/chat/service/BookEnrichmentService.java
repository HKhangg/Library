/*
package com.library_web.library.chat.service;

import com.library_web.library.model.Book;
import dev.langchain4j.data.document.Metadata;
import dev.langchain4j.data.embedding.Embedding;
import dev.langchain4j.data.segment.TextSegment;
import dev.langchain4j.model.chat.ChatLanguageModel;
import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.model.output.Response;
import dev.langchain4j.store.embedding.EmbeddingStore;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
public class BookEnrichmentService {

    private static final Logger logger = LoggerFactory.getLogger(BookEnrichmentService.class);

    @Autowired
    private ChatLanguageModel chatModel; 

    @Autowired
    private EmbeddingModel embeddingModel; 
    @Autowired
    @Qualifier("bookEmbeddingStore") 
    private EmbeddingStore<TextSegment> embeddingStore;
    @Async
    public void enrichAndIngestBook(Book book) {
        logger.info("AI đang bắt đầu đọc và phân tích sách: {}", book.getTenSach());

        try {
            String categoryName = (book.getCategoryChild() != null) ? book.getCategoryChild().getName() : "Chưa phân loại";
            String prompt = String.format("""
                Đóng vai chuyên gia phê bình văn học. Hãy viết đoạn mô tả dữ liệu (metadata) cho sách để phục vụ tìm kiếm Vector (Semantic Search).
                
                THÔNG TIN SÁCH:
                - Tên: %s
                - Tác giả: %s
                - Thể loại: %s
                - Năm: %s
                
                YÊU CẦU OUTPUT:
                Viết một đoạn văn liền mạch (khoảng 100 từ) bao gồm: Nội dung chính, Cảm xúc chủ đạo (vui, buồn, kịch tính...), Bài học/Giá trị và 5-7 từ khóa tìm kiếm quan trọng.
                Yêu cầu đầu ra (Định dạng text liền mạch, khoảng 100-150 từ):
                Ví dụ format mong muốn:
                "Tên sách: [Tên]. Tác giả: [Tác giả]... Mô tả: [Nội dung]... Cảm xúc: [Cảm xúc]... Từ khóa: [Keywords]..."
                Không cần chào hỏi, đi thẳng vào nội dung.
                """, 
                book.getTenSach(), book.getTenTacGia(), categoryName, book.getNam()
            );
            String richDescription = chatModel.generate(prompt);
            logger.debug("AI Description generated: {}", richDescription);
            Metadata metadata = new Metadata();
            metadata.put("ma_sach", String.valueOf(book.getMaSach()));
            metadata.put("ten_sach", book.getTenSach());
            metadata.put("category", categoryName); 
            TextSegment segment = TextSegment.from(richDescription, metadata);
            Response<Embedding> embeddingResponse = embeddingModel.embed(segment);
            
            embeddingStore.add(embeddingResponse.content(), segment);

            logger.info("Đã lưu Vector + Mô tả vào bảng 'book_embeddings' cho sách ID: {}", book.getMaSach());

        } catch (Exception e) {
            logger.error("Lỗi khi AI xử lý sách ID {}: {}", book.getMaSach(), e.getMessage());

        }
    }
}
*/