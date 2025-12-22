package com.library_web.library.model;

import com.fasterxml.jackson.annotation.JsonBackReference;

import jakarta.persistence.*;

@Entity
@Table(name = "borrowed_books")
public class BorrowedBook {

  public enum Status {
    REQUESTED, // mới tạo phiếu, chưa gán sách con
    BORROWING, // đã gán childBookId, đang mượn
    RETURNED, // đã trả cuốn này
    LOST // mất cuốn này
  }

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @JsonBackReference
  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "borrow_card_id", nullable = false)
  private BorrowCard borrowCard;

  @Column(name = "book_id")
  private Long bookId;

  @Column(name = "child_book_id")
  private String childBookId;

  @Enumerated(EnumType.STRING)
  @Column(name = "status", nullable = false)
  private Status status = Status.REQUESTED; // default khi mới tạo phiếu

  public BorrowedBook() {
  }

  public BorrowedBook(Long bookId, String childBookId) {
    this.bookId = bookId;
    this.childBookId = childBookId;
    this.status = Status.REQUESTED;
  }

  public Long getId() {
    return id;
  }

  public void setId(Long id) {
    this.id = id;
  }

  public BorrowCard getBorrowCard() {
    return borrowCard;
  }

  public void setBorrowCard(BorrowCard borrowCard) {
    this.borrowCard = borrowCard;
  }

  public Long getBookId() {
    return bookId;
  }

  public void setBookId(Long bookId) {
    this.bookId = bookId;
  }

  public String getChildBookId() {
    return childBookId;
  }

  public void setChildBookId(String childBookId) {
    this.childBookId = childBookId;
  }

  public Status getStatus() {
    return status;
  }

  public void setStatus(Status status) {
    this.status = status;
  }
}