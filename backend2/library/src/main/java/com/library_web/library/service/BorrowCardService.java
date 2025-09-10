package com.library_web.library.service;

import com.library_web.library.dto.BorrowCardDTO;
import com.library_web.library.dto.BorrowStatsDTO;
import com.library_web.library.dto.FineDTO;
import com.library_web.library.model.Book;
import com.library_web.library.model.BookChild;
import com.library_web.library.model.User;
import com.library_web.library.model.BorrowCard;
import com.library_web.library.model.CategoryChild;
import com.library_web.library.model.Fine;
import com.library_web.library.model.BorrowedBook;
import com.library_web.library.repository.BookChildRepository;
import com.library_web.library.repository.BookRepository;
import com.library_web.library.repository.BorrowCardRepository;
import com.library_web.library.repository.CategoryChildRepository;
import com.library_web.library.repository.UserRepository;
import com.library_web.library.repository.BorrowBookRepository;
import com.library_web.library.exception.MaxBorrowLimitExceededException;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.time.temporal.ChronoUnit;

@Service
public class BorrowCardService {

    @Autowired
    private BorrowCardRepository repository;
    @Autowired
    private BookRepository BookRepository;
    @Autowired
    private UserRepository UserRepository;
    @Autowired
    private CategoryChildRepository CategoryChildRepository;
    @Autowired
    private BookChildRepository childBookRepo;

    @Autowired
    private FineService fineService;
    @Autowired
    private EmailService EmailService;
    @Autowired
    private SettingService settingService;
    @Autowired
    private NotificationService notificationService;

        @Autowired
        private BorrowBookRepository borrowBookrepository;

    public List<BorrowCard> getAll() {
        return repository.findAll();
    }

    public BorrowCardDTO getBorrowCardDetails(Long id) {
        BorrowCard borrowCard = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Phiếu mượn không tồn tại"));

        repository.save(borrowCard);
        User user = UserRepository.findById(borrowCard.getUserId())
                .orElseThrow(() -> new RuntimeException("Người dùng không tồn tại"));

        List<BorrowedBook> borrowedBooks = borrowCard.getBorrowedBooks();
        List<Long> bookIds = borrowedBooks.stream()
                .map(BorrowedBook::getBookId)
                .distinct()
                .toList();

        List<Book> books = BookRepository.findAllById(bookIds);
        List<BorrowCardDTO.BookInfo> bookInfos = books.stream().map(book -> {
            CategoryChild categoryChild = CategoryChildRepository
                    .findChildById(book.getCategoryChild().getId())
                    .orElseThrow(() -> new RuntimeException("Thể loại không tồn tại"));
            return new BorrowCardDTO.BookInfo(
                    book.getHinhAnh().get(0),
                    book.getTenSach(),
                    book.getTenTacGia(),
                    categoryChild.getName(),
                    book.getNxb(),
                    book.getSoLuongMuon());
        }).toList();

        return new BorrowCardDTO(
                borrowCard.getId(),
                user.getId(),
                user.getUsername(),
                bookInfos,
                borrowCard.getBorrowDate(),
                borrowCard.getGetBookDate(),
                borrowCard.getDueDate(),
                bookInfos.size());
    }

    public BorrowCard create(Long userId, List<Long> bookIds) {
        System.out.println("dữ liệu: " + bookIds);

        if (bookIds == null || bookIds.isEmpty()) {
            throw new RuntimeException("Danh sách sách không được để trống");
        }
        int maxBorrowedBooks = settingService.getSetting().getMaxBorrowedBooks();
        int currentBorrowedCount = borrowBookrepository.countBooksBeingBorrowedByUser(userId);
        int totalBooksToBorrow = currentBorrowedCount + bookIds.size();
        if (totalBooksToBorrow > maxBorrowedBooks) {
            throw new MaxBorrowLimitExceededException("Bạn đã mượn quá số lượng sách cho phép. Số lượng tối đa là: "
                    + maxBorrowedBooks);
        }
        
        LocalDateTime borrowDate = LocalDateTime.now();
        int waitingToTake = settingService.getSetting().getWaitingToTake();

        BorrowCard borrowCard = new BorrowCard(userId, borrowDate, waitingToTake, new ArrayList<>());
        // List<BorrowedBook> borrowedBooks = bookIds.stream()
        // .map(id -> new BorrowedBook(id, null))
        // .toList();
        // BorrowCard borrowCard = new BorrowCard(userId, borrowDate, waitingToTake,
        // borrowedBooks);
        List<BorrowedBook> borrowedBooks = bookIds.stream()
                .map(id -> {
                    BorrowedBook borrowedBook = new BorrowedBook(id, null);
                    borrowedBook.setBorrowCard(borrowCard); // Gán borrowCard
                    return borrowedBook;
                })
                .toList();

        // Gán danh sách borrowedBooks vào borrowCard
        borrowCard.setBorrowedBooks(borrowedBooks);
        for (Long bookId : bookIds) {
            Book book = BookRepository.findById(bookId)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy sách với id: " + bookId));

            book.setSoLuongMuon(book.getSoLuongMuon() + 1);
            BookRepository.save(book);
        }
        BorrowCard savedBorrowCard = repository.save(borrowCard);
        String message = "Bạn đã tạo phiếu mượn sách thành công! Vui lòng đến lấy sách trong thời gian sớm nhất nhé!\nID Phiếu mượn: "
                + savedBorrowCard.getId() + "\nSố lượng sách mượn: "
                + savedBorrowCard.getBorrowedBooks().size() + "/"
                + settingService.getSetting().getMaxBorrowedBooks();
        notificationService.sendNotification(savedBorrowCard.getUserId(), message);
        return savedBorrowCard;
        
    }

    public boolean delete(Long id) {
        if (!repository.existsById(id))
            return false;
        repository.deleteById(id);
        return true;
    }

    public List<BorrowCard> getBorrowCardsByUserId(Long userId) {
        return repository.findByUserId(userId);
    }

    public BorrowCard updateBorrowCardToBorrowing(Long id, List<String> childBookIds) {
        BorrowCard borrowCard = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Phiếu mượn không tồn tại"));

        borrowCard.setStatus(BorrowCard.Status.BORROWED.getStatusDescription());
        borrowCard.setGetBookDate(LocalDateTime.now());
        int borrowDay = settingService.getSetting().getBorrowDay();
        borrowCard.setDueDate(LocalDateTime.now().plusDays(borrowDay));

        List<BorrowedBook> borrowedBooks = borrowCard.getBorrowedBooks();

        for (String childId : childBookIds) {
            BookChild child = childBookRepo.findById(childId)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy sách con với id: " + childId));

            Long parentId = child.getBook().getMaSach();
            System.out.println("Sách con id: " + childId + ", Sách cha id: " + parentId);
            BorrowedBook matched = borrowedBooks.stream()
                    .filter(bb -> bb.getBookId().equals(parentId)
                            && (bb.getChildBookId() == null || bb.getChildBookId().isEmpty()))
                    .findFirst()
                    .orElseThrow(
                            () -> new RuntimeException("Không tìm thấy sách cha phù hợp cho sách con id: " + childId));

            matched.setChildBookId(childId);
            child.setStatus(BookChild.Status.BORROWED);
            childBookRepo.save(child);
        }
        EmailService.mailTaken(borrowCard);
        String message = "Bạn đã mượn sách thành công. ID Phiếu mượn: " + borrowCard.getId();
        notificationService.sendNotification(borrowCard.getUserId(), message);

        borrowCard.setBorrowedBooks(borrowedBooks);
        return repository.save(borrowCard);
    }

    public BorrowCard updateBorrowCardOnReturn(Long id) {
        BorrowCard borrowCard = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Phiếu mượn không tồn tại"));

        // Nếu phiếu mượn vẫn còn đang mượn thì cập nhật trạng thái
        if (borrowCard.getStatus().equals("Đang mượn")) {
            borrowCard.setStatus("Hết hạn");
        }
        borrowCard.updateStatus();
        // Nếu trả trễ
        long soNgayTre = ChronoUnit.DAYS.between(borrowCard.getDueDate(), LocalDateTime.now());
        if (soNgayTre < 0) {
            soNgayTre = 0; // chưa trễ hạn
        } else {
            Fine data = new Fine();
            int finePerDay = settingService.getSetting().getFinePerDay();
            data.setNoiDung("Trả sách trễ hạn");
            data.setSoTien(soNgayTre * finePerDay);
            data.setCardId(String.valueOf(borrowCard.getId()));
            data.setUserId(borrowCard.getUserId());
            fineService.addFine(data);
            // Gửi thông báo trả sách trễ
            String message = "Bạn đã trả sách trễ " + soNgayTre
                    + " ngày. Vui lòng thanh toán tiền phạt sớm nhất.\nID Phiếu mượn: " + borrowCard.getId();
            notificationService.sendNotification(borrowCard.getUserId(), message);
        }
        // Nếu không trễ, gửi thông báo trả sách thành công
        if (soNgayTre == 0) {
            String message = "Bạn đã trả sách thành công! ID Phiếu mượn: " + borrowCard.getId();
            notificationService.sendNotification(borrowCard.getUserId(), message);
        }
        borrowCard.setSoNgayTre((int) soNgayTre);
        // Cập nhật ngày trả
        borrowCard.setDueDate(LocalDateTime.now());
        // Cập nhật sách con
        List<String> childBookIds = borrowCard.getBorrowedBooks().stream()
                .map(BorrowedBook::getChildBookId)
                .filter(childId -> childId != null && !childId.isEmpty())
                .collect(Collectors.toList());
        for (String childId : childBookIds) {
            BookChild child = childBookRepo.findById(childId)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy sách con với id: " + childId));
            if (child.getStatus() == BookChild.Status.BORROWED)
                child.setStatus(BookChild.Status.AVAILABLE); // Trả sách con
            childBookRepo.save(child); // lưu lại từng sách con
        }
        // Cập nhật số lượng sách available
        List<Long> bookIds = borrowCard.getBorrowedBooks().stream()
                .map(bb -> bb.getBookId())
                .collect(Collectors.toList());
         for (Long bookId : bookIds) {
            Book book = BookRepository.findById(bookId)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy sách với id: " + bookId));

            book.setSoLuongMuon(book.getSoLuongMuon() - 1);
            BookRepository.save(book);
        }
        EmailService.mailReturned(borrowCard);
        return repository.save(borrowCard);
    }

    // Lấy thống kê số lượng sách mượn trong tuần trước
    public BorrowStatsDTO getBorrowStatsLastWeek() {
        LocalDateTime startOfLastWeek = LocalDateTime.now().minusDays(7);
        System.out.println("Start of last week: " + startOfLastWeek);
        List<BorrowCard> borrowCards = repository.findByGetBookDateAfter(startOfLastWeek);
        System.out.println("Borrow cards: " + borrowCards);
        if (borrowCards == null || borrowCards.isEmpty()) {
            return new BorrowStatsDTO(0, new ArrayList<>());
        }

        long totalBorrows = borrowCards.stream()
                .flatMap(card -> card.getBorrowedBooks().stream())
                .filter(bb -> bb.getChildBookId() != null && !bb.getChildBookId().isEmpty())
                .count();

        Map<Long, Long> borrowCountByBook = borrowCards.stream()
                .flatMap(card -> card.getBorrowedBooks().stream())
                .filter(bb -> bb.getChildBookId() != null && !bb.getChildBookId().isEmpty())
                .collect(Collectors.groupingBy(
                        BorrowedBook::getBookId,
                        Collectors.counting()));

        List<BorrowStatsDTO.BookBorrowDetail> bookDetails = borrowCountByBook.entrySet().stream()
                .map(entry -> {
                    Long bookId = entry.getKey();
                    Long borrowCount = entry.getValue();
                    Book book = BookRepository.findById(bookId)
                            .orElseThrow(() -> new RuntimeException("Không tìm thấy sách với id: " + bookId));
                    return new BorrowStatsDTO.BookBorrowDetail(bookId, book.getTenSach(), book.getTenTacGia(),
                            borrowCount);
                })
                .collect(Collectors.toList());

        return new BorrowStatsDTO(totalBorrows, bookDetails);
    }

    public BorrowCard expiredCard(Long id) {
        BorrowCard borrowCard = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Phiếu mượn không tồn tại"));

        // Nếu phiếu mượn vẫn còn đang yêu cầu thì cập nhật trạng thái
        if (borrowCard.getStatus().equals("Đang yêu cầu")) {
            borrowCard.setStatus("Hết hạn");
        }
        // Cập nhật số lượng sách available
        List<String> bookIds = borrowCard.getBookIds();
        for (String bookId : bookIds) {
            Book book = BookRepository.findById(Long.parseLong(bookId))
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy sách với id: " + bookId));
            book.setSoLuongMuon(book.getSoLuongMuon() - 1);
            BookRepository.save(book); // lưu lại từng sách
        }
        EmailService.mailExpired(borrowCard);
        // Gửi thông báo hết hạn
        String message = "Phiếu mượn ID:" + borrowCard.getId()
                + " của bạn đã bị hủy. Vui lòng check mail để biết thêm chi tiết.";
        notificationService.sendNotification(borrowCard.getUserId(), message);
        return repository.save(borrowCard);
    }
}