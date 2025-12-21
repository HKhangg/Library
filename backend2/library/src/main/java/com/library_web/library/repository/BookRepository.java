package com.library_web.library.repository;

import com.library_web.library.model.Book;
import com.library_web.library.model.Book.TrangThai;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface BookRepository extends JpaRepository<Book, Long> {
    
    Optional<Book> findByTenSachAndTenTacGia(String tenSach, String tenTacGia);

    List<Book> findByCategoryChild_Id(String categoryChildId);

    List<Book> findByCreatedAtAfter(LocalDate date);

    List<Book> findByTrangThaiNot(TrangThai trangThai);

    List<Book> findByCreatedAtAfterAndTrangThaiNot(LocalDate date, TrangThai trangThai);

    @Query("SELECT b FROM Book b WHERE b.createdAt BETWEEN :startDate AND :endDate AND b.trangThai != :trangThai")
    List<Book> findByCreatedAtBetweenAndTrangThaiNot(@Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate, @Param("trangThai") Book.TrangThai trangThai);

    @Query("SELECT b FROM Book b WHERE b.tongSoLuong < :quantity OR b.trangThai != 'CON_SAN'")
    List<Book> findBooksNeedingRestock(@Param("quantity") int quantity);

    List<Book> findByTenSachContainingIgnoreCase(String query);

    List<Book> findByTenTacGiaContainingIgnoreCase(String query);

    List<Book> findAllByMaSachIn(List<Long> borrowedBookIds);

    @Query("SELECT b FROM Book b WHERE b.categoryChild.id IN :ids")
    List<Book> findByCategoryChild_IdIn(@Param("ids") List<String> ids);

}