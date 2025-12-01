package com.library_web.library.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Setting {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private int finePerDay;
    private int waitingToTake;
    private int borrowDay;
    private int startToMail;
    @Column(name = "max_borrowed_books")
    private Integer maxBorrowedBooks;

    public Setting(int finePerDay, int waitingToTake, int borrowDay, int startToMail, int maxBorrowedBooks) {
        this.finePerDay = finePerDay;
        this.waitingToTake = waitingToTake;
        this.borrowDay = borrowDay;
        this.startToMail = startToMail;
        this.maxBorrowedBooks = maxBorrowedBooks;
    }

    public int getFinePerDay() {
        return finePerDay;
    }

    public void setFinePerDay(int finePerDay) {
        this.finePerDay = finePerDay;
    }

    public int getWaitingToTake() {
        return waitingToTake;
    }

    public void setWaitingToTake(int waitingToTake) {
        this.waitingToTake = waitingToTake;
    }

    public int getBorrowDay() {
        return borrowDay;
    }

    public void setBorrowDay(int borrowDay) {
        this.borrowDay = borrowDay;
    }

    public int getStartToMail() {
        return startToMail;
    }

    public void setStartToMail(int startToMail) {
        this.startToMail = startToMail;
    }

    public int getMaxBorrowedBooks() {
        return maxBorrowedBooks;
    }

    public void setMaxBorrowedBooks(int maxBorrowedBooks) {
        this.maxBorrowedBooks = maxBorrowedBooks;
    }
}
