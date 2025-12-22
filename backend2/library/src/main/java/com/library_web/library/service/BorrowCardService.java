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
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

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

    @Transactional(readOnly = true)
    public List<BorrowCard> getAll() {
        List<BorrowCard> cards = repository.findAll();
        // Eager load borrowedBooks to avoid LazyInitializationException
        cards.forEach(card -> card.getBorrowedBooks().size());
        return cards;
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
                    book.getSoLuongMuon(),
                    book.getMaSach());
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

    @Transactional
    public BorrowCard create(Long userId, List<Long> bookIds) {
        try {
            System.out.println("=== BẮT ĐẦU TẠO PHIẾU MƯỢN ===");
            System.out.println("userId: " + userId);
            System.out.println("bookIds: " + bookIds);

            if (bookIds == null || bookIds.isEmpty()) {
                throw new RuntimeException("Danh sách sách không được để trống");
            }

            System.out.println("1. Lấy setting...");
            int maxBorrowedBooks = settingService.getSetting().getMaxBorrowedBooks();
            System.out.println("maxBorrowedBooks: " + maxBorrowedBooks);

            System.out.println("2. Đếm sách đang mượn...");
            int currentBorrowedCount = borrowBookrepository.countBooksBeingBorrowedByUser(userId);
            int totalBooksToBorrow = currentBorrowedCount + bookIds.size();
            System.out.println(
                    "currentBorrowedCount: " + currentBorrowedCount + ", totalBooksToBorrow: " + totalBooksToBorrow);

            if (totalBooksToBorrow > maxBorrowedBooks) {
                throw new MaxBorrowLimitExceededException("Bạn đã mượn quá số lượng sách cho phép. Số lượng tối đa là: "
                        + maxBorrowedBooks);
            }

            System.out.println("3. Tạo BorrowCard...");
            LocalDateTime borrowDate = LocalDateTime.now();
            int waitingToTake = settingService.getSetting().getWaitingToTake();
            BorrowCard borrowCard = new BorrowCard(userId, borrowDate, waitingToTake, new ArrayList<>());
            System.out.println("BorrowCard đã tạo, status: " + borrowCard.getStatus());

            System.out.println("4. Thêm BorrowedBook...");
            for (Long bookId : bookIds) {
                System.out.println("   Thêm bookId: " + bookId);
                BorrowedBook borrowedBook = new BorrowedBook(bookId, null);
                borrowCard.addBorrowedBook(borrowedBook);
            }
            System.out.println("Đã thêm " + borrowCard.getBorrowedBooks().size() + " BorrowedBook");

            System.out.println("5. Cập nhật soLuongMuon...");
            for (Long bookId : bookIds) {
                Book book = BookRepository.findById(bookId)
                        .orElseThrow(() -> new RuntimeException("Không tìm thấy sách với id: " + bookId));
                System.out.println("   Book " + bookId + " soLuongMuon: " + book.getSoLuongMuon() + " -> "
                        + (book.getSoLuongMuon() + 1));
                book.setSoLuongMuon(book.getSoLuongMuon() + 1);
                BookRepository.save(book);
            }

            System.out.println("6. Lưu BorrowCard vào database...");
            BorrowCard savedBorrowCard = repository.save(borrowCard);
            System.out.println("Đã lưu BorrowCard, id: " + savedBorrowCard.getId());

            System.out.println("7. Gửi notification...");
            String message = "Bạn đã tạo phiếu mượn sách thành công! Vui lòng đến lấy sách trong thời gian sớm nhất nhé!\nID Phiếu mượn: "
                    + savedBorrowCard.getId() + "\nSố lượng sách mượn: "
                    + savedBorrowCard.getBorrowedBooks().size() + "/"
                    + settingService.getSetting().getMaxBorrowedBooks();
            notificationService.sendNotification(savedBorrowCard.getUserId(), message);

            System.out.println("=== HOÀN THÀNH TẠO PHIẾU MƯỢN ===");
            return savedBorrowCard;
        } catch (Exception e) {
            System.err.println("❌ LỖI TRONG create(): " + e.getClass().getName() + " - " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    @Transactional
    public BorrowCard createBorrowCard(BorrowCardDTO borrowCardDto) {
        Long userId = borrowCardDto.getUserId();
        Long bookId = borrowCardDto.getMaSach();

        return this.create(userId, List.of(bookId));
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

    public BorrowCard updateBorrowCardToBorrowing(Long id, List<String> barcodes) {
        BorrowCard borrowCard = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Phiếu mượn không tồn tại"));

        borrowCard.setStatus(BorrowCard.Status.BORROWED.getStatusDescription());
        borrowCard.setGetBookDate(LocalDateTime.now());
        int borrowDay = settingService.getSetting().getBorrowDay();
        borrowCard.setDueDate(LocalDateTime.now().plusDays(borrowDay));

        List<BorrowedBook> borrowedBooks = borrowCard.getBorrowedBooks();

        for (String barcode : barcodes) {
            // 1. Tìm sách con theo barcode
            BookChild child = childBookRepo.findByBarcode(barcode)
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.BAD_REQUEST,
                            "Không tìm thấy sách con với barcode: " + barcode));

            // 2. ❗ Kiểm tra sách có AVAILABLE không
            if (!child.isAvailable()) {
                // Phân loại message cho rõ (tùy bạn, có thể gộp chung cũng được)
                if (child.getStatus() == BookChild.Status.BORROWED) {
                    throw new ResponseStatusException(
                            HttpStatus.BAD_REQUEST,
                            "Sách có barcode " + barcode
                                    + " đang được mượn trong một phiếu khác (không còn AVAILABLE).");
                } else if (child.getStatus() == BookChild.Status.NOT_AVAILABLE) {
                    throw new ResponseStatusException(
                            HttpStatus.BAD_REQUEST,
                            "Sách có barcode " + barcode
                                    + " đã bị đánh dấu không còn sử dụng (NOT_AVAILABLE).");
                } else {
                    throw new ResponseStatusException(
                            HttpStatus.BAD_REQUEST,
                            "Sách có barcode " + barcode + " hiện không còn AVAILABLE.");
                }
            }

            String childId = child.getId();
            Long parentId = child.getBook().getMaSach();

            BorrowedBook matched = borrowedBooks.stream()
                    .filter(bb -> bb.getBookId().equals(parentId)
                            && (bb.getChildBookId() == null
                                    || bb.getChildBookId().isEmpty()))
                    .findFirst()
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.BAD_REQUEST,
                            "Sách có barcode " + barcode + " không thuộc phiếu mượn #"
                                    + borrowCard.getId()));

            matched.setChildBookId(childId);
            matched.setStatus(BorrowedBook.Status.BORROWING);

            child.setStatus(BookChild.Status.BORROWED);
            childBookRepo.save(child);
        }

        EmailService.mailTaken(borrowCard);
        String message = "Bạn đã mượn sách thành công. ID Phiếu mượn: " + borrowCard.getId();
        notificationService.sendNotification(borrowCard.getUserId(), message);

        // ✅ KHÔNG cần setBorrowedBooks vì borrowedBooks đã là managed entity
        // borrowCard.setBorrowedBooks(borrowedBooks);
        return repository.save(borrowCard);
    }

    // trả sách
    public BorrowCard updateBorrowCardOnReturn(Long id) {
        BorrowCard borrowCard = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Phiếu mượn không tồn tại"));

        // 1. TÍNH SỐ NGÀY TRỄ
        long soNgayTre = 0;
        if (borrowCard.getDueDate() != null) {
            soNgayTre = ChronoUnit.DAYS.between(borrowCard.getDueDate(), LocalDateTime.now());
            if (soNgayTre < 0) {
                soNgayTre = 0;
            }
        }

        // 2. XỬ LÝ TỪNG BORROWED_BOOK CÒN ĐANG MƯỢN
        for (BorrowedBook bb : borrowCard.getBorrowedBooks()) {

            // Nếu cuốn này đã RETURNED (do quét barcode trước rồi) thì bỏ qua
            if (bb.getStatus() == BorrowedBook.Status.RETURNED) {
                continue;
            }

            // 2.1. Đổi trạng thái sách con BORROWED -> AVAILABLE
            String childId = bb.getChildBookId();
            if (childId != null && !childId.isEmpty()) {
                BookChild child = childBookRepo.findById(childId)
                        .orElseThrow(() -> new RuntimeException(
                                "Không tìm thấy sách con với id: " + childId));

                if (child.getStatus() == BookChild.Status.BORROWED) {
                    child.setStatus(BookChild.Status.AVAILABLE);
                    childBookRepo.save(child);
                }
            }

            // 2.2. Giảm soLuongMuon của sách cha
            Long bookId = bb.getBookId();
            Book book = BookRepository.findById(bookId)
                    .orElseThrow(() -> new RuntimeException(
                            "Không tìm thấy sách với id: " + bookId));
            book.setSoLuongMuon(book.getSoLuongMuon() - 1);
            BookRepository.save(book);

            // 2.3. Đánh dấu dòng này đã RETURNED
            bb.setStatus(BorrowedBook.Status.RETURNED);
        }

        // 3. XỬ LÝ PHẠT NẾU TRỄ
        if (soNgayTre > 0) {
            int finePerDay = settingService.getSetting().getFinePerDay();
            Fine data = new Fine();
            data.setNoiDung("Trả sách trễ hạn");
            data.setSoTien(soNgayTre * finePerDay);
            data.setCardId(String.valueOf(borrowCard.getId()));
            data.setUserId(borrowCard.getUserId());
            fineService.addFine(data);

            String message = "Bạn đã trả sách trễ " + soNgayTre
                    + " ngày. Vui lòng thanh toán tiền phạt sớm nhất.\nID Phiếu mượn: "
                    + borrowCard.getId();
            notificationService.sendNotification(borrowCard.getUserId(), message);
        } else {
            String message = "Bạn đã trả sách thành công! ID Phiếu mượn: " + borrowCard.getId();
            notificationService.sendNotification(borrowCard.getUserId(), message);
        }

        // 4. CẬP NHẬT THÔNG TIN PHIẾU
        borrowCard.setSoNgayTre((int) soNgayTre);
        borrowCard.setStatus(BorrowCard.Status.RETURNED.getStatusDescription());
        borrowCard.setDueDate(LocalDateTime.now()); // dùng như "ngày trả thực tế"

        EmailService.mailReturned(borrowCard);
        return repository.save(borrowCard);
    }

    @Transactional
    public BorrowCard returnOneBook(Long borrowCardId, String barcodeOrId) {

        // 1. Tìm phiếu mượn
        BorrowCard borrowCard = repository.findById(borrowCardId)
                .orElseThrow(() -> new RuntimeException("Phiếu mượn không tồn tại"));

        // 2. Tìm sách con - thử tìm theo barcode trước, nếu không có thì tìm theo ID
        BookChild child = childBookRepo.findByBarcode(barcodeOrId)
                .or(() -> childBookRepo.findById(barcodeOrId))
                .orElseThrow(() -> new RuntimeException(
                        "Không tìm thấy sách con với barcode/ID: " + barcodeOrId));

        String childId = child.getId();
        Long parentId = child.getBook().getMaSach();

        // 3. Tìm BorrowedBook tương ứng CUỐN NÀY trong phiếu mượn
        BorrowedBook matched = borrowCard.getBorrowedBooks().stream()
                .filter(bb -> parentId.equals(bb.getBookId())
                        && childId.equals(bb.getChildBookId()))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Sách này không nằm trong phiếu mượn"));

        // 4. Nếu đã trả rồi thì không cho trả lại
        if (matched.getStatus() == BorrowedBook.Status.RETURNED) {
            throw new RuntimeException("Cuốn sách này đã được trả trước đó");
        }

        // 5. Cập nhật trạng thái sách con: BORROWED -> AVAILABLE
        if (child.getStatus() == BookChild.Status.BORROWED) {
            child.setStatus(BookChild.Status.AVAILABLE);
            childBookRepo.save(child);
        }

        // 6. Cập nhật BorrowedBook: BORROWING -> RETURNED
        matched.setStatus(BorrowedBook.Status.RETURNED);

        // 7. Giảm số lượng đang mượn của sách cha
        Book book = child.getBook();
        book.setSoLuongMuon(book.getSoLuongMuon() - 1);
        BookRepository.save(book);

        // 8. Nếu tất cả sách trong phiếu đã RETURNED -> set phiếu = ĐÃ TRẢ
        boolean allReturned = borrowCard.getBorrowedBooks().stream()
                .allMatch(bb -> bb.getStatus() == BorrowedBook.Status.RETURNED);

        if (allReturned) {
            borrowCard.setStatus(BorrowCard.Status.RETURNED.getStatusDescription());
            // nếu muốn có thể gửi noti/email ở đây
            // notificationService.sendNotification(...);
            // EmailService.mailReturned(borrowCard);
        }

        return repository.save(borrowCard);
    }

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

        // Chỉ cho phép hết hạn từ trạng thái ĐÃ YÊU CẦU
        if (borrowCard.getStatus().equals(BorrowCard.Status.REQUESTED.getStatusDescription())) {
            borrowCard.setStatus(BorrowCard.Status.EXPIRED.getStatusDescription());
        }

        // GIẢM SỐ LƯỢNG ĐANG MƯỢN CỦA MỖI BOOK (vì ban đầu đã ++ khi tạo phiếu)
        List<Long> bookIds = borrowCard.getParentBookIds();
        for (Long bookId : bookIds) {
            Book book = BookRepository.findById(bookId)
                    .orElseThrow(() -> new RuntimeException(
                            "Không tìm thấy sách với id: " + bookId));
            book.setSoLuongMuon(book.getSoLuongMuon() - 1);
            BookRepository.save(book);
        }

        EmailService.mailExpired(borrowCard);

        String message = "Phiếu mượn ID:" + borrowCard.getId()
                + " của bạn đã bị hủy. Vui lòng check mail để biết thêm chi tiết.";
        notificationService.sendNotification(borrowCard.getUserId(), message);

        return repository.save(borrowCard);
    }
}