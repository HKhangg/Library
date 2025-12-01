/*
 * package com.library_web.library.controller;
 * 
 * import lombok.RequiredArgsConstructor;
 * import org.springframework.http.ResponseEntity;
 * import org.springframework.web.bind.annotation.*;
 * import com.library_web.library.repository.BookRepository;
 * import com.library_web.library.model.Book;
 * 
 * import java.util.LinkedHashMap;
 * import java.util.Map;
 * 
 * @RestController
 * 
 * @RequestMapping("/api/scan")
 * 
 * @RequiredArgsConstructor
 * public class ScanController {
 * 
 * private final BookRepository bookRepo;
 * 
 * @GetMapping("/barcode/{code}")
 * public ResponseEntity<Map<String, Object>> scanBarcode(@PathVariable String
 * code) {
 * 
 * return bookRepo.findByBarcode(code)
 * .map(book -> {
 * Map<String, Object> result = new LinkedHashMap<>();
 * result.put("type", "BOOK");
 * result.put("id", book.getMaSach());
 * result.put("tenSach", book.getTenSach());
 * result.put("tenTacGia", book.getTenTacGia());
 * result.put("nxb", book.getNxb());
 * result.put("nam", book.getNam());
 * result.put("trangThai",
 * book.getTrangThai() != null ? book.getTrangThai().name() : null);
 * result.put("hinhAnh", book.getHinhAnh());
 * return ResponseEntity.ok(result);
 * })
 * .orElse(ResponseEntity.status(404).body(Map.of("error", "NOT_FOUND")));
 * }
 * }
 */