package com.library_web.library.service;

import com.library_web.library.model.Book;
import com.library_web.library.model.BookChild;
import com.library_web.library.model.BorrowCard;
import com.library_web.library.model.CategoryChild;
import com.library_web.library.repository.BookChildRepository;
import com.library_web.library.repository.BookRepository;
import com.library_web.library.repository.CategoryRepository;
import com.library_web.library.repository.CategoryChildRepository;
import com.library_web.library.repository.BorrowCardRepository;

import jakarta.transaction.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class BookServiceImpl implements BookService {
    private final BookRepository repo;
    private final BookChildRepository bookChildRepository;
    private final BorrowCardRepository borrowCardRepository;

    // private final CategoryRepository categoryRepo;
    private final CategoryChildRepository childRepo;

    // private final Long defaultParentId = 1L;
    // public BookServiceImpl(BookRepository repo) { this.repo = repo; }
    public BookServiceImpl(
            BookRepository repo,
            CategoryRepository categoryRepo,
            CategoryChildRepository childRepo,
            BookChildRepository bookChildRepository
            , BorrowCardRepository borrowCardRepository) {
        this.repo = repo;
        // this.categoryRepo = categoryRepo;
        this.childRepo = childRepo;
        this.bookChildRepository = bookChildRepository;
        this.borrowCardRepository = borrowCardRepository;
    }

    @Override
    public List<Book> getAllBooks() {
        List<Book> books = repo.findAll();

        for (Book book : books) {
            book.updateTrangThai();
        }
        return books;
    }

    @Override
    public List<Book> getBooksByCategoryChild(String categoryChildId) {
        return repo.findByCategoryChild_Id(categoryChildId);
    }

    @Override
    @Transactional
    public void delBook(Long maSach) {
        Book book = repo.findById(maSach)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Không tìm thấy sách có mã: " + maSach));
        book.setTrangThai(Book.TrangThai.DA_XOA);
        List<BookChild> listChild = bookChildRepository.findByBookMaSachOrderByIdAsc(maSach);
        int countDeleted = 0;
        for (BookChild bc : listChild) {
            if (bc.getStatus() != BookChild.Status.NOT_AVAILABLE) {
                bc.setStatus(BookChild.Status.NOT_AVAILABLE);
                countDeleted++;
            }
        }
        book.setSoLuongXoa((book.getSoLuongXoa() == null ? 0 : book.getSoLuongXoa()) + countDeleted);
        book.setTongSoLuong(0);
        book.updateTrangThai();
        repo.save(book);
        bookChildRepository.saveAll(listChild);
    }

    @Override
    public Book getBookbyID(Long maSach) {
        Book book = repo.findById(maSach)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Không tìm thấy sách có mã: " + maSach));
        book.updateTrangThai();
        return book;
    }

    @Override
    @Transactional
    public Book addBook(Book book, int initialQuantity) {
        if (initialQuantity <= 0) {
            throw new IllegalArgumentException("Số lượng sách phải lớn hơn 0");
        }
        Optional<Book> existingOpt = repo
                .findByTenSachAndTenTacGia(book.getTenSach(), book.getTenTacGia())
                .filter(b -> Objects.equals(b.getNam(), book.getNam())
                        && Objects.equals(b.getNxb(), book.getNxb()));
        if (existingOpt.isPresent()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Sách đã tồn tại. Chuyển sang cập nhật dùm đi.");
        }

        if (book.getCategoryChild() == null
                || book.getCategoryChild().getId() == null
                || book.getCategoryChild().getId().isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Thiếu ID thể loại con cho sách.");
        }
        String childId = book.getCategoryChild().getId();
        CategoryChild child = childRepo.findById(childId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST, "Không tìm thấy thể loại con với id: " + childId));
        book.setCategoryChild(child);
        book.setTrangThai(Book.TrangThai.CON_SAN);
        Book saved = repo.save(book);
        for (int i = 0; i < initialQuantity; i++) {
            String suffix = generateSuffix(i);
            BookChild bc = new BookChild(book, suffix);
            saved.addChild(bc);
        }
        saved.setTongSoLuong(initialQuantity);
        saved.updateTrangThai();
        return repo.save(saved);
    }

    private String generateSuffix(int index) {
        StringBuilder sb = new StringBuilder();
        index++;
        while (index > 0) {
            index--;
            sb.insert(0, (char) ('a' + (index % 26)));
            index /= 26;
        }
        return sb.toString();
    }

    @Override
    @Transactional
    public Book updateBook(Long maSach, Map<String, Object> updates) {
        try {
            Book book = getBookbyID(maSach);
            if (updates == null || updates.isEmpty()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Không có dữ liệu cập nhật nào được cung cấp.");
            }

            updates.forEach((key, value) -> {
                if (value == null)
                    return;

                switch (key) {
                    case "tenSach" -> book.setTenSach((String) value);
                    case "moTa" -> book.setMoTa((String) value);
                    case "tenTacGia" -> book.setTenTacGia((String) value);
                    case "nxb" -> book.setNxb((String) value);
                    case "nam" -> {
                        try {
                            if (value instanceof Number) {
                                book.setNam(((Number) value).intValue());
                            } else if (value instanceof String) {
                                book.setNam(Integer.parseInt((String) value));
                            }
                        } catch (NumberFormatException e) {
                            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                                    "Năm xuất bản không hợp lệ: " + value);
                        }
                    }
                    case "trongLuong" -> {
                        try {
                            if (value instanceof Number) {
                                book.setTrongLuong(((Number) value).intValue());
                            } else if (value instanceof String) {
                                book.setTrongLuong(Integer.parseInt((String) value));
                            }
                        } catch (NumberFormatException e) {
                            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                                    "Trọng lượng không hợp lệ: " + value);
                        }
                    }

                    case "tongSoLuong" -> {
                        int newQty = ((Number) value).intValue();
                        if (newQty < 0) {
                            throw new ResponseStatusException(
                                    HttpStatus.BAD_REQUEST,
                                    "Số lượng bản sách mới phải lớn hơn hoặc bằng 0.");
                        }

                        long activeCount = bookChildRepository.countActiveByBookMaSach(maSach);
                        long totalCount = bookChildRepository.countByBookMaSach(maSach);
                        for (int i = 0; i < newQty; i++) {
                            String suffix = generateSuffix((int) totalCount + i);
                            BookChild child = new BookChild(book, suffix);
                            bookChildRepository.save(child);
                            // book.addChild(child);
                        }
                        book.setTongSoLuong((int) activeCount + newQty);
                        book.updateTrangThai();
                    }

                    case "donGia" -> {
                        try {
                            if (value instanceof Number) {
                                book.setDonGia(((Number) value).intValue());
                            } else if (value instanceof String) {
                                book.setDonGia(Integer.parseInt((String) value));
                            }
                        } catch (NumberFormatException e) {
                            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Đơn giá không hợp lệ: " + value);
                        }
                    }

                    case "trangThai" -> {
                        try {
                            if (value instanceof String) {
                                book.setTrangThai(
                                        Book.TrangThai.fromString((String) value));
                            } else {
                                book.setTrangThai(
                                        Book.TrangThai.valueOf(value.toString()));
                            }
                        } catch (IllegalArgumentException e) {
                            System.err.println(
                                    "Giá trị không hợp lệ cho enum TrangThai: " + value);
                        }
                    }

                    case "hinhAnh" -> {
                        if (value instanceof List<?>) {
                            List<String> imgs = ((List<?>) value).stream()
                                    .map(Object::toString)
                                    .toList();
                            book.setHinhAnh(imgs);
                        } else {
                            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                                    "Danh sách hình ảnh không hợp lệ: " + value);
                        }
                    }
                    case "categoryChildId" -> {
                        String childId = value.toString();
                        CategoryChild child = childRepo.findById(childId)
                                .orElseThrow(() -> new ResponseStatusException(
                                        HttpStatus.BAD_REQUEST,
                                        "Không tìm thấy thể loại con với ID: " + childId));
                        book.setCategoryChild(child);
                    }
                    default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Trường không hợp lệ: " + key);
                }
            });

            return repo.save(book);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Lỗi khi cập nhật sách: " + e.getMessage(), e);
        }
    }

    // @Override
    // public List<Book> searchBooks(String author, String category, String
    // publisher, Integer year, String title,
    // boolean sortByBorrowCount) {
    // List<Book> books = repo.findAll();

    // if (author != null && !author.isBlank()) {
    // String a = author.toLowerCase();
    // books = books.stream()
    // .filter(b -> b.getTenTacGia() != null &&
    // b.getTenTacGia().toLowerCase().contains(a))
    // .toList();
    // }
    // if (category != null && !category.isBlank()) {
    // String c = category.toLowerCase();
    // books = books.stream()
    // .filter(b -> b.getCategoryChild() != null
    // && b.getCategoryChild().getName().toLowerCase().contains(c))
    // .toList();
    // }
    // if (publisher != null && !publisher.isBlank()) {
    // String p = publisher.toLowerCase();
    // books = books.stream()
    // .filter(b -> b.getNxb() != null && b.getNxb().toLowerCase().contains(p))
    // .toList();
    // }
    // if (year != null) {
    // books = books.stream()
    // .filter(b -> b.getNam() != null && b.getNam().equals(year))
    // .toList();
    // }
    // if (title != null && !title.isBlank()) {
    // String t = title.toLowerCase();
    // books = books.stream()
    // .filter(b -> b.getTenSach() != null
    // && b.getTenSach().toLowerCase().contains(t))
    // .toList();
    // }

    // if (sortByBorrowCount) {
    // books = books.stream()
    // .sorted(Comparator.comparing(Book::getSoLuongMuon).reversed())
    // .toList();
    // }
    // for (Book book : books) {
    // book.updateTrangThai();
    // }
    // return books;
    // }
    @Override
    public List<Book> searchBooks(String all, String title, String author, String category, String publisher,
            Integer year, boolean sortByBorrowCount) {
        List<Book> books = repo.findAll();

        // Apply global search if 'all' is provided
        if (all != null && !all.trim().isEmpty()) {
            String lowerCaseAll = all.trim().toLowerCase();
            books = books.stream()
                    .filter(book -> {
                        return (book.getTenSach() != null && book.getTenSach().toLowerCase().contains(lowerCaseAll)) ||
                                (book.getTenTacGia() != null
                                        && book.getTenTacGia().toLowerCase().contains(lowerCaseAll))
                                ||
                                (book.getCategoryChild() != null && book.getCategoryChild().getName() != null &&
                                        book.getCategoryChild().getName().toLowerCase().contains(lowerCaseAll))
                                ||
                                (book.getNxb() != null && book.getNxb().toLowerCase().contains(lowerCaseAll)) ||
                                (book.getNam() != null && book.getNam().toString().contains(all.trim()));
                    })
                    .collect(Collectors.toList());
        } else {
            // Apply specific filters
            if (title != null && !title.trim().isEmpty()) {
                String lowerCaseTitle = title.trim().toLowerCase();
                books = books.stream()
                        .filter(book -> book.getTenSach() != null
                                && book.getTenSach().toLowerCase().contains(lowerCaseTitle))
                        .collect(Collectors.toList());
            }
            if (author != null && !author.trim().isEmpty()) {
                String lowerCaseAuthor = author.trim().toLowerCase();
                books = books.stream()
                        .filter(book -> book.getTenTacGia() != null
                                && book.getTenTacGia().toLowerCase().contains(lowerCaseAuthor))
                        .collect(Collectors.toList());
            }
            if (category != null && !category.trim().isEmpty()) {
                String lowerCaseCategory = category.trim().toLowerCase();
                books = books.stream()
                        .filter(book -> book.getCategoryChild() != null && book.getCategoryChild().getName() != null &&
                                book.getCategoryChild().getName().toLowerCase().contains(lowerCaseCategory))
                        .collect(Collectors.toList());
            }
            if (publisher != null && !publisher.trim().isEmpty()) {
                String lowerCasePublisher = publisher.trim().toLowerCase();
                books = books.stream()
                        .filter(book -> book.getNxb() != null
                                && book.getNxb().toLowerCase().contains(lowerCasePublisher))
                        .collect(Collectors.toList());
            }
            if (year != null) {
                books = books.stream()
                        .filter(book -> book.getNam() != null && book.getNam().equals(year))
                        .collect(Collectors.toList());
            }
        }

        // Apply sorting if requested
        if (sortByBorrowCount) {
            books = books.stream()
                    .sorted(Comparator.comparing(Book::getSoLuongMuon, Comparator.nullsLast(Comparator.reverseOrder())))
                    .collect(Collectors.toList());
        }

        // Update trangThai for all filtered books
        for (Book book : books) {
            if (book != null) {
                book.updateTrangThai(); // Assuming updateTrangThai() is a method in the Book entity
            }
        }

        return books;
    }

    @Override
    public long getTotalBooks() {
        return repo.findByTrangThaiNot(Book.TrangThai.DA_XOA).size();
    }

    @Override
    public long getTotalBookQuantity() {
        return repo.findByTrangThaiNot(Book.TrangThai.DA_XOA).stream()
                .mapToLong(book -> book.getTongSoLuong() != null ? book.getTongSoLuong() : 0)
                .sum();
    }

    // @Override
    // public long getNewBooksThisWeek() {
    // LocalDate startOfWeek = LocalDate.now().minusDays(7);
    // return repo.findByCreatedAtAfterAndTrangThaiNot(startOfWeek,
    // Book.TrangThai.DA_XOA).size();
    // }
    @Override
    public long getNewBooksThisMonth() {
        LocalDate startOfWeek = LocalDate.now().minusDays(30);
        return repo.findByCreatedAtAfterAndTrangThaiNot(startOfWeek, Book.TrangThai.DA_XOA).size();
    }

    @Override
    public long getNewBooksInRange(LocalDate startDate, LocalDate endDate) {
        return repo.findByCreatedAtBetweenAndTrangThaiNot(startDate, endDate, Book.TrangThai.DA_XOA)
                .size();
    }

    @Override
    public long getBorrowCountInRange(LocalDate startDate, LocalDate endDate) {
        return borrowCardRepository.findByBorrowDateBetween(startDate.withDayOfMonth(1).atStartOfDay(),
                endDate.withDayOfMonth(endDate.lengthOfMonth()).atTime(23, 59, 59))
                .stream()
                .mapToLong(borrowCard -> borrowCard.getBorrowedBooks().size())
                .sum();
    }

    @Override
    public List<Book> findBooksNeedingRestock(int quantity) {
        return repo.findBooksNeedingRestock(quantity);
    }


    // @Override
    // public List<Book> searchBooks2(String query) {
    //     // Kiểm tra nếu query không phải là null hoặc rỗng
    //     if (query == null || query.trim().isEmpty()) {
    //         return List.of(); // Trả về danh sách rỗng nếu không có input
    //     }

    //     // Tìm kiếm theo tên sách, tên tác giả hoặc thể loại (kiểm tra đầy đủ các trường
    //     // hợp)
    //     List<Book> books = repo.findByTenSachContainingIgnoreCase(query);
    //     if (books.isEmpty()) {
    //         books = repo.findByTenTacGiaContainingIgnoreCase(query);
    //     }
    //     // if (books.isEmpty()) {
    //     // books = repo.findByTheLoaiContainingIgnoreCase(query);
    //     // }

    //     return books;
    // }
//     @Override
// public List<Book> searchBooks2(String query) {
//     if (query == null || query.trim().isEmpty()) {
//         return List.of();
//     }
//     String trimmed = query.trim().toLowerCase();
//     List<Book> all = repo.findAll();

//     return all.stream()
//         .filter(book -> {
//             if (book.getTenSach() != null && book.getTenSach().toLowerCase().contains(trimmed)) {
//                 return true;
//             }
//             if (book.getTenTacGia() != null && book.getTenTacGia().toLowerCase().contains(trimmed)) {
//                 return true;
//             }
//             if (book.getMoTa() != null && book.getMoTa().toLowerCase().contains(trimmed)) {
//                 return true;
//             }
//             if (book.getNxb() != null && book.getNxb().toLowerCase().contains(trimmed)) {
//                 return true;
//             }
//             if (book.getCategoryChild() != null &&
//                 book.getCategoryChild().getName() != null &&
//                 book.getCategoryChild().getName().toLowerCase().contains(trimmed)) {
//                 return true;
//             }
//             try {
//                 int year = Integer.parseInt(trimmed);
//                 if (book.getNam() != null && book.getNam().equals(year)) {
//                     return true;
//                 }
//             } catch (NumberFormatException e) {
//                 // bỏ qua
//             }
//             return false;
//         })
//         .collect(Collectors.toList());
// }

@Override
public List<Book> searchBooks2(String query) {
    if (query == null || query.trim().isEmpty()) {
        return List.of();
    }
    String trimmed = query.trim().toLowerCase();
    List<Book> all = repo.findAll();

    return all.stream()
        .filter(book -> {
            // Chuyển tất cả các trường thành chuỗi và kiểm tra contain
            String bookData = (
                (book.getTenSach() != null ? book.getTenSach().toLowerCase() : "") +
                (book.getTenTacGia() != null ? book.getTenTacGia().toLowerCase() : "") +
                (book.getMoTa() != null ? book.getMoTa().toLowerCase() : "") +
                (book.getNxb() != null ? book.getNxb().toLowerCase() : "") +
                (book.getCategoryChild() != null && book.getCategoryChild().getName() != null 
                    ? book.getCategoryChild().getName().toLowerCase() : "") +
                (book.getNam() != null ? book.getNam().toString() : "") +
                (book.getTrongLuong() != null ? book.getTrongLuong().toString() : "")
            );

            return bookData.contains(trimmed);
        })
        .collect(Collectors.toList());
}


    @Override
    // Gợi ý theo phiếu mượn (nếu có userId)
    public List<Book> getPersonalizedSuggestions(Long userId, List<String> keywords) {
        // 1. Lấy 5 phiếu mượn gần nhất
        List<BorrowCard> recentBorrows = borrowCardRepository.findTop5ByUserIdOrderByBorrowDateDesc(userId);

        // 2. Lấy tất cả bookIds từ phiếu mượn
        List<String> borrowedBookIds = recentBorrows.stream()
                .map(BorrowCard::getBookIds)
                .flatMap(Collection::stream)
                .distinct()
                .collect(Collectors.toList());

        // Convert List<String> to List<Long>
        List<Long> borrowedBookIdLongs = borrowedBookIds.stream()
                .map(idStr -> {
                    try {
                        return Long.parseLong(idStr);
                    } catch (NumberFormatException e) {
                        return null;
                    }
                })
                .filter(Objects::nonNull)
                .collect(Collectors.toList());

        if (borrowedBookIdLongs.isEmpty()) {
            // Nếu user chưa mượn sách nào, fallback sang gợi ý thường
            return getGeneralSuggestions(keywords);
        }

        // 3. Lấy thông tin sách đã mượn
        List<Book> borrowedBooks = repo.findAllByMaSachIn(borrowedBookIdLongs);

        // 4. Set id sách đã mượn để lọc
        Set<Long> borrowedBookIdSet = borrowedBooks.stream()
                .map(Book::getMaSach)
                .collect(Collectors.toSet());

        // 5. Gộp từ khóa + tên tác giả của sách đã mượn
        List<String> authors = borrowedBooks.stream()
                .map(Book::getTenTacGia)
                .distinct()
                .toList();

        List<String> allKeywords = new ArrayList<>(keywords);
        allKeywords.addAll(authors);

        // 6. Lọc sách chưa mượn, tên/tác giả/thể loại/mô tả chứa keyword
        return repo.findAll().stream()
                .filter(book -> !borrowedBookIdSet.contains(book.getMaSach()))
                .filter(book -> allKeywords.stream()
                        .anyMatch(kw -> book.getTenSach().toLowerCase().contains(kw.toLowerCase()) ||
                                book.getTenTacGia().toLowerCase().contains(kw.toLowerCase()) ||
                                book.getCategoryChild().getName().toLowerCase().contains(kw.toLowerCase()) ||
                                book.getMoTa().toLowerCase().contains(kw.toLowerCase())))
                .limit(10)
                .collect(Collectors.toList());
    }

    @Override
    // Gợi ý không cá nhân hóa (không cần userId)
    public List<Book> getGeneralSuggestions(List<String> keywords) {
        return repo.findAll().stream()
                .filter(book -> keywords.stream()
                        .anyMatch(kw -> book.getTenSach().toLowerCase().contains(kw.toLowerCase()) ||
                                book.getTenTacGia().toLowerCase().contains(kw.toLowerCase()) ||
                                book.getCategoryChild().getName().toLowerCase().contains(kw.toLowerCase()) ||
                                book.getMoTa().toLowerCase().contains(kw.toLowerCase())))
                .limit(10)
                .collect(Collectors.toList());
    }

    @Override
public List<Book> getAllBooksV2(String filter) {
    List<Book> list = getAllBooks();
    List<Book> filtered = list.stream()
            .filter(b -> b.getTrangThai() != Book.TrangThai.DA_XOA)
            .collect(Collectors.toList());
    filtered.forEach(Book::updateTrangThai);
    switch (filter) {
        case "NEWEST":
            filtered = filtered.stream()
                    .sorted(Comparator.comparing(Book::getCreatedAt).reversed())
                    .collect(Collectors.toList());
            break;
        case "MOST_BORROWED":
            filtered = filtered.stream()
                    .sorted(Comparator.comparing(Book::getSoLuongMuon).reversed())
                    .collect(Collectors.toList());
            break;
        default:
            break;
    }
    return filtered;
}

@Override
public List<Book> getBooksByCategoryChildV2(String categoryChildId, String filter) {
    List<Book> list = getBooksByCategoryChild(categoryChildId);
    List<Book> filtered = list.stream()
            .filter(b -> b.getTrangThai() != Book.TrangThai.DA_XOA)
            .collect(Collectors.toList());
    filtered.forEach(Book::updateTrangThai);
    switch (filter) {
        case "NEWEST":
            filtered = filtered.stream()
                    .sorted(Comparator.comparing(Book::getCreatedAt).reversed())
                    .collect(Collectors.toList());
            break;
        case "MOST_BORROWED":
            filtered = filtered.stream()
                    .sorted(Comparator.comparing(Book::getSoLuongMuon).reversed())
                    .collect(Collectors.toList());
            break;
        default:
            break;
    }
    return filtered;
}

@Override
public List<Book> getBooksByCategoryParentV2(Long categoryParentId, String filter) {
    List<String> childIds = childRepo.findByParentId(categoryParentId)
                .stream()
                .map(child -> child.getId())
                .collect(Collectors.toList());

        List<Book> combined = childIds.stream()
                .flatMap(childId -> repo.findByCategoryChild_Id(childId).stream())
                .filter(b -> b.getTrangThai() != Book.TrangThai.DA_XOA)
                .collect(Collectors.toList());

        combined.forEach(Book::updateTrangThai);
        switch (filter) {
            case "NEWEST":
                combined = combined.stream()
                        .sorted(Comparator.comparing(Book::getCreatedAt).reversed())
                        .collect(Collectors.toList());
                break;
            case "MOST_BORROWED":
                combined = combined.stream()
                        .sorted(Comparator.comparing(Book::getSoLuongMuon).reversed())
                        .collect(Collectors.toList());
                break;
            default:
                break;
        }
        return combined;
}

}