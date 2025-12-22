package com.library_web.library.chat.tool;

import com.library_web.library.model.Book;
import com.library_web.library.model.CategoryChild;
import com.library_web.library.repository.CategoryChildRepository;
import com.library_web.library.service.BookService;
import dev.langchain4j.agent.tool.Tool;
import dev.langchain4j.data.segment.TextSegment;
import dev.langchain4j.rag.content.Content;
import dev.langchain4j.rag.content.retriever.ContentRetriever;
import dev.langchain4j.rag.query.Query;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

@Component
public class CategoryTool2 {

    private static final Logger logger = LoggerFactory.getLogger(CategoryTool2.class);

    @Autowired private BookService bookService;
    @Autowired @Qualifier("categoryRetriever2") private ContentRetriever categoryRetriever;
    @Autowired private CategoryChildRepository categoryChildRepository;

    @Tool("PHIÊN BẢN 3 (Hybrid Search): Tìm sách theo thể loại. Ưu tiên tìm chính xác tên trước, nếu không thấy mới dùng AI suy luận.")
    public String findBooksByCategoryNameV2(String categoryNameOrTopic) {

        if (categoryNameOrTopic == null || categoryNameOrTopic.trim().isEmpty()) {
            return "Bạn muốn tìm thể loại nào á?";
        }

        String searchTerm = categoryNameOrTopic.trim();
        List<Book> booksInCategory = new ArrayList<>();
        Set<String> foundCategoryNames = new HashSet<>();

        try {
            // BƯỚC 1: TÌM CHÍNH XÁC TRONG DB
            List<CategoryChild> directMatches = categoryChildRepository.findByNameContainingIgnoreCase(searchTerm);
            
            if (!directMatches.isEmpty()) {
                List<String> directIds = new ArrayList<>();
                for (CategoryChild cat : directMatches) {
                    directIds.add(cat.getId());
                    foundCategoryNames.add(cat.getName());
                }
                booksInCategory.addAll(bookService.getBooksByListCategoryChildIds(directIds));
            } 
            // BƯỚC 2: NẾU DB KHÔNG CÓ -> DÙNG RAG
            else {
                Query categoryQuery = Query.from(searchTerm);
                List<Content> retrievedContents = categoryRetriever.retrieve(categoryQuery);

                if (retrievedContents.isEmpty()) {
                    return "Tui không tìm thấy thể loại nào giống với '" + searchTerm + "'.";
                }

                Set<String> childIdsFromRAG = new HashSet<>();

                for (Content content : retrievedContents) {
                    TextSegment segment = content.textSegment();
                    if (segment == null) continue;

                    String type = segment.metadata().getString("type");
                    String id = segment.metadata().getString("id");
                    String name = segment.metadata().getString("name");

                    if (name != null) foundCategoryNames.add(name);

                    try {
                        if ("parent".equals(type)) {
                            List<String> children = categoryChildRepository.findByParentId(Long.parseLong(id)) 
                                    .stream().map(CategoryChild::getId).toList();
                            childIdsFromRAG.addAll(children);
                        } else if ("child".equals(type)) {
                            childIdsFromRAG.add(id);
                        }
                    } catch (Exception e) {
                        // Bỏ qua nếu lỗi parse ID
                    }
                }
                
                if (!childIdsFromRAG.isEmpty()) {
                    booksInCategory.addAll(bookService.getBooksByListCategoryChildIds(new ArrayList<>(childIdsFromRAG)));
                }
            }

            // BƯỚC 3: XỬ LÝ KẾT QUẢ
            List<Book> finalBookList = booksInCategory.stream()
                .filter(b -> b.getTrangThai() != Book.TrangThai.DA_XOA)
                .distinct()
                .toList();

            String foundCategoryNamesStr = String.join(" hoặc ", foundCategoryNames);

            if (finalBookList.isEmpty()) {
                if (!foundCategoryNames.isEmpty()) {
                    return "Tui tìm thấy danh mục '" + foundCategoryNamesStr + "' nhưng tiếc là trong kho đang hết sách loại này rồi.";
                }
                return "Tui không tìm thấy sách nào phù hợp với '" + searchTerm + "'.";
            }

            StringBuilder sb = new StringBuilder();
            sb.append("Tìm thấy ").append(finalBookList.size()).append(" cuốn thuộc thể loại '")
              .append(foundCategoryNamesStr).append("'. Dưới đây là danh sách:\n");
            
            for (Book b : finalBookList) {
                sb.append("- ").append(b.getTenSach()).append(" (Mã: ").append(b.getMaSach()).append(")\n");
            }

            return sb.toString();

        } catch (Exception e) {
            logger.error("Error in CategoryTool2", e);
            return "Hệ thống đang gặp chút trục trặc, bạn thử lại sau nha.";
        }
    }
}