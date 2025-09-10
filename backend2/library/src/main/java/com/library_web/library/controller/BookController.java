package com.library_web.library.controller;

import com.library_web.library.dto.BookWithQuantity;
import com.library_web.library.dto.BookDTO;
import com.library_web.library.model.Book;
import com.library_web.library.service.BookService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/book")
@CrossOrigin
public class BookController {
        private final BookService service;

        public BookController(BookService service) {
                this.service = service;


        }

        @GetMapping("/v2")
        public List<Book> getAllBooksV2(
                @RequestParam(value = "filter", required = false, defaultValue = "ALL") String filter
        ) {
                return service.getAllBooksV2(filter);
        }

       @GetMapping("/v2/category-child/{categoryChildId}")
        public List<Book> getBooksByCategoryChildV2(
                @PathVariable String categoryChildId,
                @RequestParam(value = "filter", required = false, defaultValue = "ALL") String filter
        ) {
                return service.getBooksByCategoryChildV2(categoryChildId, filter);
        }

        @GetMapping("/v2/category-parent/{categoryParentId}")
        public List<Book> getBooksByCategoryParentV2(
                @PathVariable Long categoryParentId,
                @RequestParam(value = "filter", required = false, defaultValue = "ALL") String filter
        ) {
                return service.getBooksByCategoryParentV2(categoryParentId, filter);

        }

        @GetMapping
        public List<BookDTO> getAll() {
                return service.getAllBooks().stream()
                                .map(b -> new BookDTO(
                                                b.getMaSach(), b.getTenSach(), b.getMoTa(),
                                                b.getTenTacGia(), b.getNxb(), b.getNam(),
                                                b.getTrongLuong(), b.getDonGia(),
                                                b.getTongSoLuong(), b.getSoLuongMuon(), b.getSoLuongXoa(),
                                                b.getTrangThai().name(), b.getHinhAnh(),
                                                b.getCategoryChild().getId(), b.getCategoryChild().getName(),
                                                b.getCategoryChild().getCategoryName()))
                                .collect(Collectors.toList());
        }

        @GetMapping("/{id}")
        public BookDTO getById(@PathVariable Long id) {
                Book b = service.getBookbyID(id);
                return new BookDTO(
                                b.getMaSach(), b.getTenSach(), b.getMoTa(),
                                b.getTenTacGia(), b.getNxb(), b.getNam(),
                                b.getTrongLuong(), b.getDonGia(),
                                b.getTongSoLuong(), b.getSoLuongMuon(), b.getSoLuongXoa(),
                                b.getTrangThai().name(), b.getHinhAnh(),
                                b.getCategoryChild().getId(), b.getCategoryChild().getName(),
                                b.getCategoryChild().getCategoryName());
        }

        @PostMapping
        @ResponseStatus(HttpStatus.CREATED)
        public BookDTO add(@RequestBody BookWithQuantity payload) {
                Book book = payload.getBook();
                int initialQuantity = payload.getQuantity();
                Book b = service.addBook(book, initialQuantity);
                // b.updateTrangThai();
                return new BookDTO(
                                b.getMaSach(),
                                b.getTenSach(),
                                b.getMoTa(),
                                b.getTenTacGia(),
                                b.getNxb(),
                                b.getNam(),
                                b.getTrongLuong(),
                                b.getDonGia(),
                                b.getTongSoLuong(),
                                b.getSoLuongMuon(),
                                b.getSoLuongXoa(),
                                b.getTrangThai().name(),
                                b.getHinhAnh(),
                                b.getCategoryChild().getId(),
                                b.getCategoryChild().getName(),
                                b.getCategoryChild().getCategoryName());
        }

        @PatchMapping("/{id}")
        public BookDTO update(@PathVariable Long id, @RequestBody Map<String, Object> updates) {
                Book b = service.updateBook(id, updates);
                return new BookDTO(
                                b.getMaSach(), b.getTenSach(), b.getMoTa(),
                                b.getTenTacGia(), b.getNxb(), b.getNam(),
                                b.getTrongLuong(), b.getDonGia(),
                                b.getTongSoLuong(), b.getSoLuongMuon(), b.getSoLuongXoa(),
                                b.getTrangThai().name(), b.getHinhAnh(),
                                b.getCategoryChild().getId(), b.getCategoryChild().getName(),
                                b.getCategoryChild().getCategoryName());
        }

        @DeleteMapping("/{id}")
        @ResponseStatus(HttpStatus.NO_CONTENT)
        public void delete(@PathVariable Long id) {
                service.delBook(id);
        }

        @PostMapping("/suggest")
        public List<Book> suggestBooks(@RequestBody Map<String, Object> requestBody) {
                List<String> keywords = (List<String>) requestBody.get("keywords");

                // Nếu có userId và không rỗng thì gợi ý cá nhân hóa
                Object userIdObj = requestBody.get("userId");

                if (userIdObj != null && userIdObj instanceof Long userId) {
                        return service.getPersonalizedSuggestions(userId, keywords);
                }

                // Nếu không có userId thì gợi ý bình thường
                return service.getGeneralSuggestions(keywords);
        }

        @GetMapping("/search")
        public List<BookDTO> searchBooks(
                        @RequestParam(required = false) String all,
                        @RequestParam(required = false) String title,
                        @RequestParam(required = false) String author,
                        @RequestParam(required = false) String category,
                        @RequestParam(required = false) String publisher,
                        @RequestParam(required = false) Integer year,
                        @RequestParam(defaultValue = "false") boolean sortByBorrowCount) {
                return service.searchBooks(all, title, author, category, publisher, year, sortByBorrowCount).stream()
                                .map(b -> new BookDTO(
                                                b.getMaSach(), b.getTenSach(), b.getMoTa(),
                                                b.getTenTacGia(), b.getNxb(), b.getNam(),
                                                b.getTrongLuong(), b.getDonGia(),
                                                b.getTongSoLuong(), b.getSoLuongMuon(), b.getSoLuongXoa(),
                                                b.getTrangThai().name(), b.getHinhAnh(),
                                                b.getCategoryChild().getId(), b.getCategoryChild().getName(),
                                                b.getCategoryChild().getCategoryName()))
                                .collect(Collectors.toList());
        }

        @GetMapping("/category/{categoryChildId}")
        public List<BookDTO> getByCategory(
                        @PathVariable String categoryChildId) {
                return service.getBooksByCategoryChild(categoryChildId).stream()
                                .map(b -> new BookDTO(
                                                b.getMaSach(), b.getTenSach(), b.getMoTa(),
                                                b.getTenTacGia(), b.getNxb(), b.getNam(),
                                                b.getTrongLuong(), b.getDonGia(),
                                                b.getTongSoLuong(), b.getSoLuongMuon(), b.getSoLuongXoa(),
                                                b.getTrangThai().name(), b.getHinhAnh(),
                                                b.getCategoryChild().getId(),
                                                b.getCategoryChild().getName(),
                                                b.getCategoryChild().getCategoryName()))
                                .collect(Collectors.toList());
        }

        // @GetMapping("/dashboard")
        // public ResponseEntity<Map<String, Object>> getDashboardStats() {
        // Map<String, Object> stats = new HashMap<>();

        // // Total books
        // long totalBooks = service.getTotalBooks();
        // stats.put("totalBooks", totalBooks);

        // // Total book quantity
        // long totalBookQuantity = service.getTotalBookQuantity();
        // stats.put("totalBookQuantity", totalBookQuantity);

        // // New books this week
        // long newBooksThisWeek = service.getNewBooksThisWeek();
        // stats.put("newBooksThisWeek", newBooksThisWeek);

        // // Borrow stats last week
        // // Placeholder since borrowCardService is not injected yet
        // Map<String, Object> borrowStartLastWeek = new HashMap<>();
        // borrowStartLastWeek.put("totalBorrows", 0L);
        // borrowStartLastWeek.put("bookDetails", List.of());
        // stats.put("borrowStartLastWeek", borrowStartLastWeek);

        // // Books needing restock
        // List<BookDTO> booksToRestock = service.findBooksNeedingRestock(5).stream()
        // .map(b -> new BookDTO(
        // b.getMaSach(), b.getTenSach(), b.getMoTa(),
        // b.getTenTacGia(), b.getNxb(), b.getNam(),
        // b.getTrongLuong(), b.getDonGia(),
        // b.getTongSoLuong(), b.getSoLuongMuon(), b.getSoLuongXoa(),
        // b.getTrangThai().name(), b.getHinhAnh(),
        // b.getCategoryChild().getId(), b.getCategoryChild().getName(),
        // b.getCategoryChild().getCategoryName()))
        // .collect(Collectors.toList());
        // stats.put("booksToRestock", booksToRestock);

        // return ResponseEntity.ok(stats);
        // }

        @GetMapping("/dashboard")
        public ResponseEntity<Map<String, Object>> getDashboardStats() {
                Map<String, Object> stats = new HashMap<>();

                // Total books
                long totalBooks = service.getTotalBooks();
                stats.put("totalBooks", totalBooks);

                // Total book quantity
                long totalBookQuantity = service.getTotalBookQuantity();
                stats.put("totalBookQuantity", totalBookQuantity);

                // New books this month
                LocalDate today = LocalDate.now(); // June 03, 2025
                LocalDate monthStart = today.withDayOfMonth(1); // June 01, 2025
                long newBooksThisMonth = service.getNewBooksInRange(monthStart, today);
                stats.put("newBooksThisMonth", newBooksThisMonth);

                // Borrowed books this month
                long borrowedBooksThisMonth = service.getBorrowCountInRange(monthStart, today);
                stats.put("borrowedBooksThisMonth", borrowedBooksThisMonth);

                // Monthly stats (current and previous month)
                List<Map<String, Object>> monthlyStats = new ArrayList<>();
                for (int i = 1; i >= 0; i--) {
                        LocalDate monthStartDate = today.minusMonths(i).withDayOfMonth(1);
                        LocalDate monthEndDate = monthStartDate.plusMonths(1).minusDays(1);
                        Map<String, Object> monthData = new HashMap<>();
                        monthData.put("monthLabel", i == 0 ? "Tháng này" : "Tháng trước");
                        monthData.put("totalBooks", totalBooks); // Placeholder, could vary by month if implemented
                        monthData.put("totalBookQuantity", totalBookQuantity); // Placeholder
                        monthData.put("newBooks", i == 0 ? newBooksThisMonth
                                        : service.getNewBooksInRange(monthStartDate, monthEndDate));
                        monthData.put("borrowedBooks", i == 0 ? borrowedBooksThisMonth
                                        : service.getBorrowCountInRange(monthStartDate, monthEndDate));
                        monthlyStats.add(monthData);
                }
                stats.put("monthlyStats", monthlyStats);

                // Books needing restock
                List<BookDTO> booksToRestock = service.findBooksNeedingRestock(5).stream()
                                .map(b -> new BookDTO(
                                                b.getMaSach(), b.getTenSach(), b.getMoTa(),
                                                b.getTenTacGia(), b.getNxb(), b.getNam(),
                                                b.getTrongLuong(), b.getDonGia(),
                                                b.getTongSoLuong(), b.getSoLuongMuon(), b.getSoLuongXoa(),
                                                b.getTrangThai().name(), b.getHinhAnh(),
                                                b.getCategoryChild().getId(), b.getCategoryChild().getName(),
                                                b.getCategoryChild().getCategoryName()))
                                .collect(Collectors.toList());
                stats.put("booksToRestock", booksToRestock);

                return ResponseEntity.ok(stats);
        }

        @GetMapping("/search2")
        public ResponseEntity<List<Book>> searchBooks(@RequestParam String query) {
                List<Book> books = service.searchBooks2(query);
                return books.isEmpty() ? ResponseEntity.noContent().build() : ResponseEntity.ok(books);
        }
}