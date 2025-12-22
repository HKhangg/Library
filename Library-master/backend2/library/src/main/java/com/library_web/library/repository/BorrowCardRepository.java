package com.library_web.library.repository;

import com.library_web.library.model.BorrowCard;

import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

public interface BorrowCardRepository extends JpaRepository<BorrowCard, Long> {
  List<BorrowCard> findByUserId(Long userId);

  List<BorrowCard> findByGetBookDateAfter(LocalDateTime date);

  List<BorrowCard> findByBorrowDateBetween(LocalDateTime startDate, LocalDateTime endDate);

  List<BorrowCard> findTop5ByUserIdOrderByBorrowDateDesc(Long userId);
}