package com.library_web.library.service;

import com.library_web.library.model.Book;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

public interface BookService {
    List<Book> getAllBooks();

    List<Book> getBooksByCategoryChild(String categoryChildId);

    Book addBook(Book book, int initialQuantity);

    void delBook(Long maSach);

    Book getBookbyID(Long maSach);

    Book updateBook(Long maSach, Map<String, Object> updates);

    List<Book> searchBooks(String all, String title, String author, String category, String publisher, Integer year,
            boolean sortByBorrowCount);

    long getTotalBooks();

    long getTotalBookQuantity();

    // long getNewBooksThisWeek();
    long getNewBooksThisMonth();

    long getNewBooksInRange(LocalDate startDate, LocalDate endDate);

    long getBorrowCountInRange(LocalDate startDate, LocalDate endDate);

    List<Book> findBooksNeedingRestock(int quantity);

    List<Book> searchBooks2(String query);

    List<Book> getGeneralSuggestions(List<String> keywords);

    List<Book> getPersonalizedSuggestions(Long userId, List<String> keywords);

    // List<Book> getBooksByFilter(String filter, String categoryChildId);
     List<Book> getAllBooksV2(String filter);
    List<Book> getBooksByCategoryChildV2(String categoryChildId, String filter);
     List<Book> getBooksByCategoryParentV2(Long categoryParentId, String filter);

}