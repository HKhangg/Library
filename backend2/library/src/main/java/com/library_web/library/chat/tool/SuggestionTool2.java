package com.library_web.library.chat.tool;

import com.library_web.library.model.Book;
import com.library_web.library.repository.BorrowCardRepository;
import com.library_web.library.model.BorrowCard;
import com.library_web.library.repository.BookRepository;
import dev.langchain4j.agent.tool.Tool;
import dev.langchain4j.data.segment.TextSegment;
import dev.langchain4j.rag.content.retriever.ContentRetriever;
import dev.langchain4j.rag.content.Content;
import dev.langchain4j.rag.query.Query;
import dev.langchain4j.agent.tool.ToolExecutionRequest;
import dev.langchain4j.agent.tool.ToolParameters;
import dev.langchain4j.agent.tool.ToolSpecifications;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.stream.Collectors;

@Component
public class SuggestionTool2 {

    @Autowired
    private BorrowCardRepository borrowCardRepository;
    @Autowired
    private BookRepository bookRepository;

    @Autowired
    @Qualifier("bookRetriever")
    private ContentRetriever bookRetriever;

    @Tool(name = "suggestBooksV2", value = {
        "PHIÊN BẢN 2 (Dùng RAG): Gợi ý sách dựa trên CHỦ ĐỀ, LỊCH SỬ MƯỢN, và (nếu có) BỐI CẢNH SỞ THÍCH.",
        "Input bao gồm:",
        "- userId (bắt buộc): ID người dùng.",
        "- keywords (bắt buộc): Chủ đề/từ khóa người dùng yêu cầu.",
        "- memoryContext (tùy chọn): Thông tin về sở thích/trí nhớ dài hạn của người dùng (lấy từ prompt, có thể là null hoặc chuỗi rỗng)."
    })
    public String suggestBooksV2(Long userId, String keywords, String memoryContext) {
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
            if (memoryContext != null && !memoryContext.isBlank()) {
                useMemory = true;
                combinedKeywords.add(memoryContext.toLowerCase());
                System.out.println("SuggestionTool2: Đã thêm memoryContext vào keywords: " + combinedKeywords);
            }

            if (userId != null && userId > 0) {
                useHistory = true;
                try {
                    List<BorrowCard> recent = borrowCardRepository.findTop5ByUserIdOrderByBorrowDateDesc(userId);
                    List<Long> ids = recent.stream()
                            .map(BorrowCard::getBookIdsAsLong)
                            .flatMap(Collection::stream)
                            .distinct()
                            .toList();
                    if (!ids.isEmpty()) {
                        borrowedBookIds.addAll(ids);
                        List<Book> borrowed = bookRepository.findAllByMaSachIn(ids);
                        borrowed.forEach(b -> {
                            if (b.getTenTacGia() != null) combinedKeywords.add(b.getTenTacGia().toLowerCase());
                            if (b.getCategoryChild() != null && b.getCategoryChild().getName() != null)
                                combinedKeywords.add(b.getCategoryChild().getName().toLowerCase());
                        });
                    }
                } catch (Exception e) {
                    System.err.println("SuggestionTool2: lỗi lấy lịch sử mượn: " + e.getMessage());
                }
            }

            String semanticQuery = String.join(" ; ", combinedKeywords);
            System.out.println("SuggestionTool2: Đang tìm RAG với query: " + semanticQuery);

            Query bookQuery = Query.from(semanticQuery);
            List<Content> retrievedContents = bookRetriever.retrieve(bookQuery);

            if (retrievedContents.isEmpty()) {
                return "Hmm, tui chưa tìm được gợi ý nào về '" + originalKeyword + "'.";
            }

            List<FoundBook> suggestions = retrievedContents.stream()
                .map(Content::textSegment)
                .filter(Objects::nonNull)
                .map(segment -> {
                    String id = segment.metadata().getString("ma_sach");
                    String name = segment.metadata().getString("ten_sach");
                    Long bookId = (id != null && !id.isBlank()) ? Long.parseLong(id) : null;
                    return (bookId != null && name != null) ? new FoundBook(bookId, name) : null;
                })
                .filter(Objects::nonNull)
                .distinct()
                .toList();

            List<FoundBook> finalSuggestions = suggestions.stream()
                .filter(b -> !borrowedBookIds.contains(b.id()))
                .limit(5)
                .toList();

            if (finalSuggestions.isEmpty()) {
                if (!borrowedBookIds.isEmpty() && !suggestions.isEmpty()){
                     return "Tui tìm thấy vài sách nhưng có vẻ bạn đã mượn chúng rồi. Thử chủ đề khác nha!";
                 } else {
                     return "Tui không tìm thấy gợi ý nào phù hợp hoặc bạn đã mượn hết sách liên quan rồi.";
                 }
            }

            String prefix;
            if (useMemory && useHistory) {
                prefix = "Dựa trên sở thích của bạn (và loại trừ sách đã mượn), với chủ đề '" + originalKeyword + "', tui gợi ý:\n";
            } else if (useMemory) {
                prefix = "Dựa trên sở thích của bạn và chủ đề '" + originalKeyword + "', tui gợi ý:\n";
            } else if (useHistory){
                 prefix = "Loại trừ sách bạn đã mượn, với chủ đề '" + originalKeyword + "', tui thấy:\n";
            }
            else {
                prefix = "Với chủ đề '" + originalKeyword + "', tui thấy:\n";
            }

            String bookList = finalSuggestions.stream()
                    .map(b -> "- '" + b.name() + "' (ID: " + b.id() + ")")
                    .collect(Collectors.joining("\n"));

            return prefix + bookList;

        } catch (Exception e) {
            System.err.println("Lỗi nghiêm trọng trong SuggestionTool2 (RAG): " + e.getMessage());
            e.printStackTrace();
            return "Tui bị lỗi phần gợi ý (V2), bạn thử lại sau nha.";
        }
    }

    private record FoundBook(Long id, String name) {}
}