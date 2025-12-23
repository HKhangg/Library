package com.library_web.library.service;

import com.library_web.library.model.Book;
import com.library_web.library.model.BookChild;
import com.library_web.library.repository.BookChildRepository;
import com.library_web.library.repository.BookRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class BookChildServiceImpl implements BookChildService {
    private final BookChildRepository childRepo;
    private final BookRepository bookRepo;

    public BookChildServiceImpl(BookChildRepository childRepo, BookRepository bookRepo) {
        this.childRepo = childRepo;
        this.bookRepo = bookRepo;
    }

    @Override
    public List<BookChild> getChildrenByBook(Long bookId) {
        return childRepo.findByBookMaSachOrderByIdAsc(bookId);
    }

    @Override
    public List<BookChild> findByStatus(BookChild.Status status) {
        return childRepo.findByStatus(status);
    }

    @Override
    @Transactional
    public BookChild addChild(Long bookId) {
        Book book = bookRepo.findById(bookId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Không tìm thấy sách: " + bookId));

        // 1. Tạo suffix nội bộ (id con), theo kiểu "a", "b", "c"
        List<BookChild> existing = childRepo.findByBookMaSachOrderByIdAsc(bookId);
        char suffix = (char) ('a' + existing.size());

        BookChild child = new BookChild(book, String.valueOf(suffix));

        // 2. Lấy barcode lớn nhất hiện tại trong DB
        String lastBarcode = childRepo.findMaxBarcode();
        String nextBarcode;

        if (lastBarcode == null || lastBarcode.isEmpty()) {
            nextBarcode = "LIB00000001";
        } else {
            String number = lastBarcode.substring(3); // bỏ "LIB"
            int n = Integer.parseInt(number) + 1;
            nextBarcode = String.format("LIB%08d", n);
        }
        // 3. Gán barcode mới cho sách con
        child.setBarcode(nextBarcode);

        // 4. Lưu bookChild vào DB
        childRepo.save(child);

        // 5. Cập nhật số lượng sách cha
        book.setTongSoLuong(book.getTongSoLuong() + 1);
        book.updateTrangThai();
        bookRepo.save(book);

        return child;
    }

    @Override
    @Transactional
    public void deleteChild(String childId) {
        BookChild child = childRepo.findById(childId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Không tìm thấy sách con: " + childId));
        Book book = child.getBook();
        child.markNotAvailable();
        childRepo.save(child);
        book.decreaseTotalQuantity();
        book.setSoLuongXoa((book.getSoLuongXoa() == null ? 0 : book.getSoLuongXoa()) + 1);
        book.updateTrangThai();
        bookRepo.save(book);
    }

    @Override
    @Transactional
    public BookChild borrowChild(String childId) {
        BookChild child = childRepo.findById(childId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Không tìm thấy sách con: " + childId));
        try {
            child.borrow();
            Book book = child.getBook();
            book.updateTrangThai();
        } catch (IllegalStateException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        }
        return childRepo.save(child);
    }

    @Override
    @Transactional
    public BookChild returnChild(String childId) {
        BookChild child = childRepo.findById(childId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Không tìm thấy sách con: " + childId));
        try {
            child.returnBack();
            Book book = child.getBook();
            book.updateTrangThai();
        } catch (IllegalStateException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        }
        return childRepo.save(child);
    }

    @Override
    @Transactional
    public Map<String, Object> getChildAndParent(String childId) {
        BookChild child = childRepo.findById(childId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy sách con với id: " + childId));
        Book parent = bookRepo.findById(child.getBook().getMaSach())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy sách với id: " + child.getBook().getMaSach()));
        Map<String, Object> result = new HashMap<>();
        result.put("childBook", child);
        result.put("parentBook", parent);
        return result;
    }
}
