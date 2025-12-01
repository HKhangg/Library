package com.library_web.library.dto;

import java.util.List;

public class BorrowStatsDTO {
    private long totalBorrows; // Tổng lượt mượn trong tuần
    private List<BookBorrowDetail> bookDetails; // Chi tiết lượt mượn theo sách

    public static class BookBorrowDetail {
        private Long bookId; // ID sách
        private String tenSach; // Tên sách
        private String tenTacGia; // Tên tác giả
        private long borrowCount; // Số lượt mượn

        public BookBorrowDetail(Long bookId, String tenSach, String tenTacGia, long borrowCount) {
            this.bookId = bookId;
            this.tenSach = tenSach;
            this.tenTacGia = tenTacGia;
            this.borrowCount = borrowCount;
        }

        // Getters và Setters
        public Long getBookId() {
            return bookId;
        }

        public void setBookId(Long bookId) {
            this.bookId = bookId;
        }

        public String getTenSach() {
            return tenSach;
        }

        public void setTenSach(String tenSach) {
            this.tenSach = tenSach;
        }

        public String getTenTacGia() {
            return tenTacGia;
        }

        public void setTenTacGia(String tenTacGia) {
            this.tenTacGia = tenTacGia;
        }

        public long getBorrowCount() {
            return borrowCount;
        }

        public void setBorrowCount(long borrowCount) {
            this.borrowCount = borrowCount;
        }
    }

    public BorrowStatsDTO(long totalBorrows, List<BookBorrowDetail> bookDetails) {
        this.totalBorrows = totalBorrows;
        this.bookDetails = bookDetails;
    }

    // Getters và Setters
    public long getTotalBorrows() {
        return totalBorrows;
    }

    public void setTotalBorrows(long totalBorrows) {
        this.totalBorrows = totalBorrows;
    }

    public List<BookBorrowDetail> getBookDetails() {
        return bookDetails;
    }

    public void setBookDetails(List<BookBorrowDetail> bookDetails) {
        this.bookDetails = bookDetails;
    }
}