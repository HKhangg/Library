package com.library_web.library.chat.tool;

import com.library_web.library.model.Book; // 
import com.library_web.library.model.CategoryChild; // 
import com.library_web.library.repository.CategoryChildRepository; // 
import com.library_web.library.service.BookService; // Dùng BookServiceImpl 
import dev.langchain4j.agent.tool.Tool;
import dev.langchain4j.data.segment.TextSegment;
import dev.langchain4j.rag.content.Content;
import dev.langchain4j.rag.content.retriever.ContentRetriever;
import dev.langchain4j.rag.query.Query;
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

    @Autowired
    private BookService bookService; 

    @Autowired
    @Qualifier("categoryRetriever2") 
    private ContentRetriever categoryRetriever;

    @Autowired
    private CategoryChildRepository categoryChildRepository; 

    @Tool("PHIÊN BẢN 2 (Dùng RAG từ CSV): Dùng tool này khi người dùng muốn LẤY DANH SÁCH SÁCH thuộc một THỂ LOẠI CỤ THỂ hoặc CHỦ ĐỀ (ví dụ: 'tìm sách văn học', 'sách chữa lành', 'sách cho người thất tình'). Input là tên thể loại hoặc chủ đề.")
    public String findBooksByCategoryNameV2(String categoryNameOrTopic) {

        if (categoryNameOrTopic == null || categoryNameOrTopic.trim().isEmpty()) {
            return "Bạn muốn tìm thể loại nào á?";
        }

        String searchTerm = categoryNameOrTopic.trim();

        try {
          
            Query categoryQuery = Query.from(searchTerm);
            List<Content> retrievedContents = categoryRetriever.retrieve(categoryQuery);

            if (retrievedContents.isEmpty()) {
                return "Xin lỗi, tui không tìm thấy thể loại nào giống hoặc tương đồng với '" + searchTerm + "' trong thư viện.";
            }

            List<TextSegment> relevantSegments = retrievedContents.stream()
                .map(Content::textSegment)
                .filter(Objects::nonNull)
                .distinct()
                .toList();

            Set<String> childIdsToSearch = new HashSet<>();
            List<String> foundCategoryNames = new ArrayList<>();

            for (TextSegment segment : relevantSegments) {
                 String type = segment.metadata().getString("type");
                 String name = segment.metadata().getString("name");
                 String id = segment.metadata().getString("id"); 

                 if (name != null && !foundCategoryNames.contains(name)) {
                      foundCategoryNames.add(name);
                 }

                 if ("parent".equals(type)) {
                      try {

                           Long parentId = Long.parseLong(id); 
                           List<String> childrenOfParent = categoryChildRepository.findByParentId(parentId).stream()
                                                            .map(CategoryChild::getId) 
                                                            .toList();
                           if (!childrenOfParent.isEmpty()) {
                                childIdsToSearch.addAll(childrenOfParent);
                           } else {
                                System.err.println("CategoryTool2: Không tìm thấy CategoryChild nào cho Parent ID: " + parentId);
                           }
                      } catch (Exception e) {
                           System.err.println("CategoryTool2: Lỗi khi xử lý Parent ID '" + id + "': " + e.getMessage());
                      }
                 } else if ("child".equals(type)) {
                      if (id != null && !id.isEmpty()) {
                           childIdsToSearch.add(id); 
                       }
                 }
            }
            
            if (childIdsToSearch.isEmpty()) {
                return "Tui tìm thấy thông tin về thể loại '" + String.join(", ", foundCategoryNames) + "' nhưng chưa liên kết được với sách nào.";
            }

            List<Book> booksInCategory = new ArrayList<>();
            if (!childIdsToSearch.isEmpty()) {
                 childIdsToSearch.forEach(childId -> {
                     try {
 
                          booksInCategory.addAll(bookService.getBooksByCategoryChild(childId));
                     } catch (Exception e) {
                          System.err.println("Lỗi khi lấy sách cho category child ID " + childId + ": " + e.getMessage());
                     }
                 });
            }
            List<Book> finalBookList = booksInCategory.stream()
                .filter(b -> b.getTrangThai() != Book.TrangThai.DA_XOA) // Dùng enum TrangThai từ Book.java 
                .distinct()
                .toList();

            String foundCategoryNamesStr = String.join(" hoặc ", foundCategoryNames);

            if (finalBookList.isEmpty()) {
                return "Tui tìm thấy thể loại '" + foundCategoryNamesStr + "' (khớp với '" + searchTerm + "') nhưng tiếc là hiện chưa có cuốn sách nào thuộc thể loại này.";
            }

            String examples = finalBookList.stream()
                                     .limit(3)
                                     .map(book -> "'" + book.getTenSach() + "' (ID: " + book.getMaSach() + ")") // 
                                     .collect(Collectors.joining(", "));

            if (finalBookList.size() == 1) {
                 Book foundBook = finalBookList.get(0);
                 return "Okela, trong các thể loại tương đồng với '" + foundCategoryNamesStr + "', tui tìm thấy đúng 1 cuốn là: '"
                         + foundBook.getTenSach() + "' (ID sách là: " + foundBook.getMaSach() + "). Bạn muốn làm gì tiếp nè?";
                 
            } else {
                 return "Okela, trong các thể loại tương đồng với '" + foundCategoryNamesStr + "', tui tìm thấy "
                         + finalBookList.size() + " cuốn sách á! Ví dụ như: " + examples
                         + ". Bạn muốn tui liệt kê hết tên sách hong?";
            }

        } catch (Exception e) {
            System.err.println("Lỗi nghiêm trọng trong CategoryTool2.findBooksByCategoryNameV2 (RAG): " + e.getMessage());
            e.printStackTrace();
            return "Ui, hệ thống tìm kiếm thể loại đang bị lỗi chút xíu. Bạn thử lại sau giúp tui nha!";
        }
    }
}