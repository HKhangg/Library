package com.library_web.library.repository;

import com.library_web.library.model.BookChild;
import com.library_web.library.model.BookChild.Status;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional; // 👈 THÊM IMPORT NÀY

public interface BookChildRepository extends JpaRepository<BookChild, String> {
  List<BookChild> findByBookMaSachOrderByIdAsc(Long bookId);

  List<BookChild> findByStatus(Status status);

  long countByBookMaSachAndStatus(Long bookId, Status status);

  long countByBookMaSach(Long bookId);

  @Query("""
      SELECT COUNT(bc) FROM BookChild bc
      WHERE bc.book.maSach = :maSach
        AND bc.status IN (com.library_web.library.model.BookChild.Status.AVAILABLE,
                          com.library_web.library.model.BookChild.Status.BORROWED)
      """)
  long countActiveByBookMaSach(@Param("maSach") Long maSach);

  // Lấy barcode lớn nhất (để +1 khi sinh barcode mới)
  @Query(value = "SELECT barcode FROM book_child WHERE barcode IS NOT NULL ORDER BY barcode DESC LIMIT 1", nativeQuery = true)
  String findMaxBarcode();

  // tìm BookChild theo barcode (dùng khi quét mã)
  Optional<BookChild> findByBarcode(String barcode);
}
