package com.library_web.library.model;

import com.fasterxml.jackson.annotation.JsonManagedReference;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Entity
@Table(name = "borrow_cards")
public class BorrowCard {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "user_id", nullable = false)
  private Long userId;

  @JsonManagedReference
  @OneToMany(mappedBy = "borrowCard", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
  private List<BorrowedBook> borrowedBooks = new ArrayList<>();

  @Column(name = "borrow_date", nullable = false)
  private LocalDateTime borrowDate;

  @Column(name = "due_date")
  private LocalDateTime dueDate;

  @Column(name = "get_book_date")
  private LocalDateTime getBookDate;

  @Column(name = "status", nullable = false)
  private String status;

  private Integer soNgayTre;

  public enum Status {
    REQUESTED("Đã yêu cầu"),
    BORROWED("Đang mượn"),
    EXPIRED("Đã hết hạn"),
    RETURNED("Đã trả"),
    CANCELLED("Đã hủy");

    private final String statusDescription;

    Status(String statusDescription) {
      this.statusDescription = statusDescription;
    }

    public String getStatusDescription() {
      return statusDescription;
    }
  }

  // Constructor mặc định
  public BorrowCard() {
  }

  public void updateStatus() {
    if (this.status.equals(Status.BORROWED.getStatusDescription())) {
      // Kiểm tra nếu đã quá hạn trả sách
      if (this.dueDate != null && LocalDateTime.now().isAfter(this.dueDate)) {
        this.status = Status.EXPIRED.getStatusDescription(); // Đặt trạng thái là "Hết hạn"
      }
    }
  }

  public BorrowCard(Long userId, LocalDateTime borrowDate, int waitingToTake, List<BorrowedBook> borrowedBooks) {
    this.userId = userId;
    this.borrowDate = LocalDateTime.now();
    this.getBookDate = borrowDate.plusDays(waitingToTake);
    this.dueDate = borrowDate.plusDays(14);
    this.borrowedBooks = borrowedBooks != null ? borrowedBooks : new ArrayList<>();
    this.status = Status.REQUESTED.getStatusDescription();
  }

  public List<String> getBookIds() {
    return borrowedBooks.stream()
        .map(BorrowedBook::getChildBookId)
        .filter(childBookId -> childBookId != null && !childBookId.isEmpty())
        .collect(Collectors.toList());
  }

  public List<Long> getParentBookIds() {
    return borrowedBooks.stream()
        .map(BorrowedBook::getBookId)
        .collect(Collectors.toList());
  }

  // Getter và Setter
  public Long getId() {
    return id;
  }

  public void setId(Long id) {
    this.id = id;
  }

  public Long getUserId() {
    return userId;
  }

  public void setUserId(Long userId) {
    this.userId = userId;
  }

  public List<BorrowedBook> getBorrowedBooks() {
    return borrowedBooks;
  }

  public void setBorrowedBooks(List<BorrowedBook> borrowedBooks) {
    this.borrowedBooks = borrowedBooks;
  }

  public LocalDateTime getBorrowDate() {
    return borrowDate;
  }

  public void setBorrowDate(LocalDateTime borrowDate) {
    this.borrowDate = borrowDate;
  }

  public LocalDateTime getDueDate() {
    return dueDate;
  }

  public void setDueDate(LocalDateTime dueDate) {
    this.dueDate = dueDate;
  }

  public LocalDateTime getGetBookDate() {
    return getBookDate;
  }

  public void setGetBookDate(LocalDateTime getBookDate) {
    this.getBookDate = getBookDate;
  }

  public String getStatus() {
    return status;
  }

  public void setStatus(String status) {
    this.status = status;
  }

  public Integer getSoNgayTre() {
    return soNgayTre;
  }

  public void setSoNgayTre(Integer soNgayTre) {
    this.soNgayTre = soNgayTre;
  }
}