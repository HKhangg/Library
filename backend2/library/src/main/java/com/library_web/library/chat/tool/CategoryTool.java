package com.library_web.library.chat.tool;

import com.library_web.library.model.Book;
import com.library_web.library.model.Category;
import com.library_web.library.model.CategoryChild;
import com.library_web.library.repository.CategoryChildRepository;
import com.library_web.library.repository.CategoryRepository;
import com.library_web.library.service.BookService;
import dev.langchain4j.agent.tool.Tool;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Component
public class CategoryTool {

    @Autowired
    private BookService bookService;

    @Autowired
    private CategoryChildRepository categoryChildRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Tool("Dùng tool này KHI VÀ CHỈ KHI người dùng hỏi sách thuộc một TÊN THỂ LOẠI CỤ THỂ, RÕ RÀNG (cha hoặc con) ĐÃ CÓ TRONG DATABASE (ví dụ: 'sách Văn Học', 'sách Kinh Dị', 'Sách Việt Nam'). KHÔNG dùng cho mô tả chung chung. Input là tên thể loại.")
    public String findBooksByCategoryNameDB(String categoryName) {

        if (categoryName == null || categoryName.trim().isEmpty()) {
            return "Bạn muốn tìm thể loại nào á?";
        }

        String searchTerm = categoryName.trim();
        Set<String> childIdsToSearch = new HashSet<>();
        List<String> foundDisplayNames = new ArrayList<>();
        boolean foundSomething = false;

        try {
            Optional<CategoryChild> childOpt = categoryChildRepository.findByName(searchTerm);

            if (childOpt.isPresent()) {
                CategoryChild child = childOpt.get();
                childIdsToSearch.add(child.getId());
                foundDisplayNames.add(child.getName());
                foundSomething = true;
                System.out.println("CategoryTool: Tìm thấy thể loại con trực tiếp: " + child.getName());
            } else {
                Optional<Category> parentOpt = categoryRepository.findByName(searchTerm);

                if (parentOpt.isPresent()) {
                    Category parent = parentOpt.get();
                    foundDisplayNames.add(parent.getName());
                    foundSomething = true;
                    System.out.println("CategoryTool: Tìm thấy thể loại cha: " + parent.getName());

                    List<CategoryChild> childrenOfParent = categoryChildRepository.findByParentId(parent.getId());
                    if (childrenOfParent != null && !childrenOfParent.isEmpty()) {
                        childrenOfParent.forEach(child -> childIdsToSearch.add(child.getId()));
                         System.out.println("CategoryTool: Sẽ tìm sách cho các ID con: " + childIdsToSearch);
                    } else {
                         System.err.println("CategoryTool: Không tìm thấy con nào cho cha ID: " + parent.getId());
                         foundSomething = false;
                    }
                }
            }

            if (!foundSomething) {
                 return "Xin lỗi, tui không tìm thấy thể loại nào tên chính xác là '" + searchTerm + "' trong thư viện.";
            }

            List<Book> booksInCategory = new ArrayList<>();
            if (!childIdsToSearch.isEmpty()) {
                for (String childId : childIdsToSearch) {
                    try {
                        booksInCategory.addAll(bookService.getBooksByCategoryChild(childId));
                    } catch (Exception e) {
                        System.err.println("Lỗi khi lấy sách cho category child ID " + childId + ": " + e.getMessage());
                    }
                }
            }

            List<Book> finalBookList = booksInCategory.stream()
                .filter(b -> b.getTrangThai() != Book.TrangThai.DA_XOA)
                .distinct()
                .toList();

            String displayNamesStr = foundDisplayNames.stream().distinct().collect(Collectors.joining(" hoặc "));

            if (finalBookList.isEmpty()) {
                 if (childIdsToSearch.isEmpty() && foundSomething) {
                     return "Tui tìm thấy thể loại '" + displayNamesStr + "' nhưng chưa có thể loại con cụ thể nào được liên kết.";
                 } else {
                     return "Tui tìm thấy thể loại '" + displayNamesStr + "' nhưng tiếc là chưa có sách nào thuộc thể loại này.";
                 }
            }

            String examples = finalBookList.stream()
                                     .limit(3)
                                     .map(book -> "'" + book.getTenSach() + "' (ID: " + book.getMaSach() + ")")
                                     .collect(Collectors.joining(", "));

            if (finalBookList.size() == 1) {
                 Book foundBook = finalBookList.get(0);
                 return "Okela, trong thể loại '" + displayNamesStr + "', tui tìm thấy đúng 1 cuốn là: '"
                         + foundBook.getTenSach() + "' (ID: " + foundBook.getMaSach() + ").";
            } else {
                 return "Okela, trong thể loại '" + displayNamesStr + "', tui tìm thấy "
                         + finalBookList.size() + " cuốn! Ví dụ: " + examples
                         + ". Bạn muốn tui liệt kê hết hong?";
            }

        } catch (Exception e) {
            System.err.println("Lỗi nghiêm trọng trong CategoryTool.findBooksByCategoryNameDB: " + e.getMessage());
            e.printStackTrace();
            return "Ui, hệ thống tìm kiếm thể loại đang bị lỗi. Bạn thử lại sau nha!";
        }
    }
}