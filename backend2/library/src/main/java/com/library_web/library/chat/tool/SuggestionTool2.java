package com.library_web.library.chat.tool;

import com.library_web.library.model.Book;
import com.library_web.library.service.BookService;
import com.library_web.library.repository.BorrowCardRepository;
import com.library_web.library.model.BorrowCard;
import dev.langchain4j.agent.tool.Tool;
import dev.langchain4j.rag.content.Content;
import dev.langchain4j.rag.content.retriever.ContentRetriever;
import dev.langchain4j.rag.query.Query;
import dev.langchain4j.data.segment.TextSegment;
import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.data.embedding.Embedding;
import dev.langchain4j.store.embedding.EmbeddingMatch;
import dev.langchain4j.store.embedding.EmbeddingStore;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.stream.Collectors;

@Component
public class SuggestionTool2 {

    private static final Logger logger = LoggerFactory.getLogger(SuggestionTool2.class);

    @Autowired private BorrowCardRepository borrowCardRepository;
    @Autowired private BookService bookService;
    @Autowired @Qualifier("bookRetriever") private ContentRetriever bookRetriever;
    @Autowired @Qualifier("userMemoryEmbeddingStore") private EmbeddingStore<TextSegment> userMemoryEmbeddingStore;
    @Autowired private EmbeddingModel embeddingModel;

    @Tool(name = "suggestBooksV2", value = {
        "(Dùng RAG): Dùng tool này khi người dùng KHÔNG biết rõ tên sách, muốn xin LỜI KHUYÊN, GỢI Ý, ĐỀ XUẤT đọc gì, hoặc tìm kiếm dựa trên CẢM XÚC, TÂM TRẠNG, SỞ THÍCH. VÍ DỤ: 'buồn quá đọc gì', 'gợi ý sách trinh thám hay', 'sách gì chữa lành tâm hồn'. Đây là tool dùng để 'Tư vấn' chứ không phải 'Tra cứu'.",
        "Input bao gồm:",
        "- userId (bắt buộc): ID người dùng.",
        "- keywords (bắt buộc): Chủ đề/từ khóa người dùng muốn được gợi ý (ví dụ: 'sách buồn', 'sách hay', 'học tiếng anh')."
    })
    public String suggestBooksV2(Long userId, String keywords) {
        if (keywords == null || keywords.trim().isEmpty()) {
            return "Bạn muốn tui gợi ý sách về chủ đề gì á?";
        }

        String originalKeyword = keywords.trim().toLowerCase();
        Set<String> combinedKeywords = new LinkedHashSet<>();
        combinedKeywords.add(originalKeyword);
        boolean useHistory = false;
        boolean useMemory = false;
        Set<Long> borrowedBookIds = new HashSet<>();

        try {
            if (userId != null) {
                try {
                    Embedding queryEmbedding = embeddingModel.embed(originalKeyword).content();
                    
                    List<EmbeddingMatch<TextSegment>> relevantMemories = userMemoryEmbeddingStore.findRelevant(
                        queryEmbedding, 
                        10, 
                        0.60 
                    );
                    
                    List<String> userMemories = relevantMemories.stream()
                        .filter(match -> {
                            String storedUserId = match.embedded().metadata().getString("user_id");
                            return storedUserId != null && storedUserId.equals(String.valueOf(userId));
                        })
                        .map(match -> match.embedded().text())
                        .limit(3) 
                        .collect(Collectors.toList());

                    if (!userMemories.isEmpty()) {
                        useMemory = true;
                        combinedKeywords.addAll(userMemories);
                        logger.info("Combined user memories: {}", userMemories);
                    }
                } catch (Exception memEx) {
                    logger.warn("Failed to retrieve memory: {}", memEx.getMessage());
                }

                if (userId > 0) {
                    try {
                        List<BorrowCard> recent = borrowCardRepository.findTop5ByUserIdOrderByBorrowDateDesc(userId);
                        List<Long> ids = recent.stream()
                                .map(BorrowCard::getBookIdsAsLong)
                                .flatMap(Collection::stream)
                                .distinct()
                                .toList();
                        if (!ids.isEmpty()) {
                            useHistory = true;
                            borrowedBookIds.addAll(ids);
                            List<Book> borrowed = bookService.getBooksByListIds(ids);
                            borrowed.forEach(b -> {
                                if (b.getTenTacGia() != null) combinedKeywords.add(b.getTenTacGia().toLowerCase());
                                if (b.getCategoryChild() != null && b.getCategoryChild().getName() != null)
                                    combinedKeywords.add(b.getCategoryChild().getName().toLowerCase());
                            });
                        }
                    } catch (Exception e) {
                        logger.warn("Failed to fetch borrow history: {}", e.getMessage());
                    }
                }
            }

            String semanticQuery = String.join(" ; ", combinedKeywords);
            
            if (originalKeyword.length() > 10) {
                semanticQuery = originalKeyword + " " + originalKeyword;
            } else {
                semanticQuery = originalKeyword + " " + originalKeyword + " " + semanticQuery;
            }
            
            logger.info("Executing RAG query: {}", semanticQuery);

            List<Content> retrievedContents = bookRetriever.retrieve(Query.from(semanticQuery));

            if (retrievedContents.isEmpty()) {
                return "Hmm, tui chưa tìm được gợi ý nào về '" + originalKeyword + "'.";
            }

            List<Long> potentialIds = retrievedContents.stream()
                    .map(c -> c.textSegment().metadata().getString("ma_sach"))
                    .filter(Objects::nonNull)
                    .map(idStr -> {
                        try { return Long.parseLong(idStr); } catch (NumberFormatException e) { return null; }
                    })
                    .filter(Objects::nonNull)
                    .distinct()
                    .collect(Collectors.toList());

            List<Book> verified = bookService.getBooksByListIds(potentialIds);

            List<Book> candidates = verified.stream()
                    .filter(b -> b.getTrangThai() != Book.TrangThai.DA_XOA)
                    .filter(b -> !borrowedBookIds.contains(b.getMaSach()))
                    .collect(Collectors.toList());

            if (candidates.isEmpty()) {
                 if (!borrowedBookIds.isEmpty() && !verified.isEmpty()){
                      return "Tui tìm thấy vài sách nhưng có vẻ bạn đã mượn chúng rồi. Thử chủ đề khác nha!";
                  } else {
                      return "Tui không tìm thấy gợi ý nào phù hợp hoặc bạn đã mượn hết sách liên quan rồi.";
                  }
            }

            Collections.shuffle(candidates);

            String suggestions = candidates.stream()
                    .limit(5)
                    .map(b -> "- '" + b.getTenSach() + "' (ID: " + b.getMaSach() + ")")
                    .collect(Collectors.joining("\n"));

            String prefix;
            if (useMemory && useHistory) {
                prefix = "Dựa trên sở thích của bạn (và loại trừ sách đã mượn), với chủ đề '" + originalKeyword + "', tui gợi ý:\n";
            } else if (useMemory) {
                prefix = "Nhớ là bạn thích kiểu này, nên với chủ đề '" + originalKeyword + "', tui tìm được mấy cuốn này hay lắm:\n";
            } else if (useHistory){
                 prefix = "Dựa trên gu đọc sách gần đây (loại trừ sách đã mượn), tui thấy có mấy cuốn này hợp với '" + originalKeyword + "':\n";
            }
            else {
                prefix = "Với chủ đề '" + originalKeyword + "', tui thấy:\n";
            }

            return prefix + suggestions;

        } catch (Exception e) {
            logger.error("Error in suggestBooksV2", e);
            return "Tui bị lỗi phần gợi ý ròi, bạn thử lại sau nha.";
        }
    }
}