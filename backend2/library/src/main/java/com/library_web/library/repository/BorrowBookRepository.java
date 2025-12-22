package com.library_web.library.repository;

import com.library_web.library.model.BorrowedBook;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
 
@Repository
public interface BorrowBookRepository extends JpaRepository<BorrowedBook, Long> {

    @Query("SELECT COUNT(bb) FROM BorrowedBook bb " +
           "JOIN bb.borrowCard bc " +
           "WHERE bc.userId = :userId AND bc.status <> 'RETURNED'")
    int countBooksBeingBorrowedByUser(Long userId);
}
