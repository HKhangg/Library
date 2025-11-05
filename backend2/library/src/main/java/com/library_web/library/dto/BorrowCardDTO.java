package com.library_web.library.dto;

import java.time.LocalDateTime;
import java.util.List;


public class BorrowCardDTO {
  private Long id;
  private Long userId;
  private String userName;
  private List<BookInfo> bookIds;
  private LocalDateTime borrowDate;
  private LocalDateTime dueDate;
  private LocalDateTime getBookDate;
  private String status;
  private int totalBooks;
  private Long maSach;
  private String tenSach;


  public BorrowCardDTO() {
  }

  public BorrowCardDTO(Long id, Long userId, String username, List<BookInfo> bookInfos, LocalDateTime borrowDate,
      LocalDateTime getBookDate, LocalDateTime dueDate, int bookCount) {
    this.id = id;
    this.userId = userId;
    this.userName = username;
    this.bookIds = bookInfos;
    this.borrowDate = borrowDate;
    this.getBookDate = getBookDate;
    this.dueDate = dueDate;
    this.totalBooks = bookCount;
  }

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

  public String getUserName() {
    return userName;
  }

  public void setUserName(String userName) {
    this.userName = userName;
  }

  public List<BookInfo> getBookIds() {
    return bookIds;
  }

  public void setBookIds(List<BookInfo> bookIds) {
    this.bookIds = bookIds;
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

  public int getTotalBooks() {
    return totalBooks;
  }

  public void setTotalBooks(int totalBooks) {
    this.totalBooks = totalBooks;
  }

  public Long getMaSach() {
    return maSach;
  }

  public void setMaSach(Long maSach) {
    this.maSach = maSach;
  }

  public String getTenSach() {
    return tenSach;
  }

  public void setTenSach(String tenSach) {
    this.tenSach = tenSach;
  }


  public static class BookInfo {
    private String image;
    private String name;
    private String author;
    private String category;
    private String publisher;
    private int borrowCount;
    private Long maSach;

    public BookInfo() {
    }

    public String getImage() {
      return image;
    }

    public void setImage(String image) {
      this.image = image;
    }

    public String getName() {
      return name;
    }

    public void setName(String name) {
      this.name = name;
    }

    public String getAuthor() {
      return author;
    }

    public void setAuthor(String author) {
      this.author = author;
    }

    public String getCategory() {
      return category;
    }

    public void setCategory(String category) {
      this.category = category;
    }

    public String getPublisher() {
      return publisher;
    }

    public void setPublisher(String publisher) {
      this.publisher = publisher;
    }

    public int getBorrowCount() {
      return borrowCount;
    }

    public void setBorrowCount(int borrowCount) {
      this.borrowCount = borrowCount;
    }

    public Long getMaSach() {
      return maSach;
    }

    public void setMaSach(Long maSach) {
      this.maSach = maSach;
    }

    public BookInfo(String image, String bookName, String authorName, String categoryName, String publisher,
        Integer borrowQuantity) {
      this.image = image;
      this.name = bookName;
      this.author = authorName;
      this.category = categoryName;
      this.publisher = publisher;
      this.borrowCount = (borrowQuantity != null) ? borrowQuantity : 0;
    }
  }
}