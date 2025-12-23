package com.library_web.library.controller;

import com.library_web.library.dto.BookChildDTO;
import com.library_web.library.model.Book;
import com.library_web.library.model.BookChild;
import com.library_web.library.service.BookChildService;
import com.library_web.library.repository.BookChildRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@CrossOrigin
@RestController
@RequestMapping("/api/bookchild")
public class BookChildController {
    private final BookChildService service;

    @Autowired
    private BookChildRepository bookChildRepository;

    public BookChildController(BookChildService service) {
        this.service = service;
    }

    @PostMapping("/book/{bookId}/add")
    public BookChildDTO addOne(@PathVariable Long bookId) {
        BookChild c = service.addChild(bookId);
        return new BookChildDTO(c.getId(), c.getStatus().name(), c.getBook().getMaSach(), c.getBarcode());
    }

    @GetMapping("/book/{bookId}")
    public List<BookChildDTO> getByBook(@PathVariable Long bookId) {
        return service.getChildrenByBook(bookId).stream()
                .map(c -> new BookChildDTO(c.getId(), c.getStatus().name(), c.getBook().getMaSach(), c.getBarcode()))
                .collect(Collectors.toList());
    }

    @PatchMapping("/borrow/{id}")
    public BookChildDTO borrow(@PathVariable String id) {
        BookChild c = service.borrowChild(id);
        return new BookChildDTO(c.getId(), c.getStatus().name(), c.getBook().getMaSach(), c.getBarcode());
    }

    @PatchMapping("/return/{id}")
    public BookChildDTO returnBook(@PathVariable String id) {
        BookChild c = service.returnChild(id);
        return new BookChildDTO(c.getId(), c.getStatus().name(), c.getBook().getMaSach(), c.getBarcode());
    }

    @GetMapping("/borrowed")
    public List<BookChildDTO> getBorrowed() {
        return service.findByStatus(BookChild.Status.BORROWED).stream()
                .map(c -> new BookChildDTO(c.getId(), c.getStatus().name(), c.getBook().getMaSach(), c.getBarcode()))
                .collect(Collectors.toList());
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteChild(@PathVariable String id) {
        service.deleteChild(id);
    }

    @GetMapping("/{id}")
    public BookChildDTO laySachConTheoId(@PathVariable String id) {
        return bookChildRepository.findById(id)
                .map(c -> new BookChildDTO(c.getId(), c.getStatus().name(), c.getBook().getMaSach()))
                .orElse(null);
    }

    @GetMapping("/barcode/{barcode}")
    public ResponseEntity<Map<String, Object>> getByBarcode(@PathVariable String barcode) {
        BookChild child = bookChildRepository.findByBarcode(barcode)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Không tìm thấy sách con với barcode: " + barcode));

        Book book = child.getBook();

        Map<String, Object> response = new HashMap<>();
        response.put("id", child.getId());
        response.put("barcode", child.getBarcode());
        response.put("bookId", book.getMaSach());
        response.put("status", child.getStatus().name());

        // Thông tin sách con
        Map<String, Object> childBook = new HashMap<>();
        childBook.put("id", child.getId());
        childBook.put("barcode", child.getBarcode());
        childBook.put("status", child.getStatus().name());
        childBook.put("addedDate", child.getAddedDate());
        response.put("childBook", childBook);

        // Thông tin sách cha
        Map<String, Object> parentBook = new HashMap<>();
        parentBook.put("maSach", book.getMaSach());
        parentBook.put("tenSach", book.getTenSach());
        parentBook.put("tenTacGia", book.getTenTacGia());
        parentBook.put("nxb", book.getNxb());
        parentBook.put("hinhAnh", book.getHinhAnh());
        response.put("parentBook", parentBook);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/available/{bookId}")
    public ResponseEntity<List<Map<String, Object>>> getAvailableChildren(@PathVariable Long bookId) {
        List<BookChild> availableChildren = bookChildRepository.findByBookMaSachOrderByIdAsc(bookId)
                .stream()
                .filter(BookChild::isAvailable)
                .collect(Collectors.toList());

        List<Map<String, Object>> response = availableChildren.stream()
                .map(child -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", child.getId());
                    map.put("barcode", child.getBarcode());
                    map.put("status", child.getStatus().name());
                    return map;
                })
                .collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }

}