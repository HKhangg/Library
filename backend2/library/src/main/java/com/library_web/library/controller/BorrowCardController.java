package com.library_web.library.controller;

import com.library_web.library.dto.BorrowCardDTO;
import com.library_web.library.dto.BorrowStatsDTO;
import com.library_web.library.model.BorrowCard;
import com.library_web.library.service.BorrowCardService;
import com.library_web.library.service.EmailService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/borrow-cards")
public class BorrowCardController {

  @Autowired
  private BorrowCardService service;

  @Autowired
  private EmailService emailService;

  @GetMapping
  public ResponseEntity<List<BorrowCard>> getAll() {
    return ResponseEntity.ok(service.getAll());
  }

  @GetMapping("/{id}")
  public ResponseEntity<BorrowCardDTO> getBorrowCardDetails(@PathVariable Long id) {
    BorrowCardDTO details = service.getBorrowCardDetails(id);
    return ResponseEntity.ok(details);
  }

  // Tạo phiếu mượn
  @PostMapping
  public ResponseEntity<BorrowCard> create(@RequestBody BorrowCard BorrowCardRequest) {
    System.out.println("BorrowCardRequest: " + BorrowCardRequest);
    List<Long> bookIds = BorrowCardRequest.getBorrowedBooks().stream()
        .map(borrowedBook -> borrowedBook.getBookId())
        .collect(Collectors.toList());
    BorrowCard borrowCard = service.create(BorrowCardRequest.getUserId(), bookIds);
    return ResponseEntity.ok(borrowCard);
  }

  // @PutMapping("/{id}")
  // public ResponseEntity<BorrowCardDTO> update(@PathVariable Long id,
  // @RequestBody BorrowCardDTO dto) {
  // BorrowCardDTO updated = service.update(id, dto);
  // return updated != null ? ResponseEntity.ok(updated) :
  // ResponseEntity.notFound().build();
  // }

  @DeleteMapping("/{id}")
  public ResponseEntity<Void> delete(@PathVariable Long id) {
    return service.delete(id) ? ResponseEntity.noContent().build() : ResponseEntity.notFound().build();
  }

  @PostMapping("/user/{userId}")
  public ResponseEntity<List<BorrowCard>> getBorrowCardsByUserId(@PathVariable Long userId) {
    List<BorrowCard> borrowCards = service.getBorrowCardsByUserId(userId);
    if (borrowCards.isEmpty()) {
      return ResponseEntity.status(204).build(); // Trả về trạng thái 204 nếu không có dữ liệu
    }
    return ResponseEntity.ok(borrowCards); // Trả về danh sách phiếu mượn của người dùng
  }

  // Cập nhật phiếu mượn khi người dùng đến lấy sách
  @PutMapping("/borrow/{id}")
  public ResponseEntity<BorrowCard> borrowBooks(@PathVariable Long id, @RequestBody List<String> childBookIds) {
    BorrowCard borrowCard = service.updateBorrowCardToBorrowing(id, childBookIds);
    return ResponseEntity.ok(borrowCard);
  }

  @PutMapping("/return/{id}")
  public ResponseEntity<BorrowCard> returnBooks(@PathVariable Long id) {
    BorrowCard borrowCard = service.updateBorrowCardOnReturn(id);
    return ResponseEntity.ok(borrowCard);
  }

  // Cập nhật phiếu mượn khi người dùng trả sách
  @PutMapping("/expired/{id}")
  public ResponseEntity<BorrowCard> expiredCard(@PathVariable Long id) {
    BorrowCard borrowCard = service.expiredCard(id);
    return ResponseEntity.ok(borrowCard);
  }

  @PostMapping("/askToReturn")
  public ResponseEntity<String> mailHoiTraSach(@RequestBody List<BorrowCard> list) {
    try {
      emailService.mailHoiTraSach(list);
      return ResponseEntity.ok("Gửi mail thành công!");
    } catch (RuntimeException e) {
      System.out.println("Không tìm thấy!");
      return ResponseEntity.status(404).body("Không tìm thấy!");
    } catch (Exception e) {
      System.out.println("Lỗi khi gửi mail!");
      return ResponseEntity.status(500).body("Lỗi khi gửi mail!");
    }
  }

  // Thống kê lượt mượn sách trong tuần vừa qua
  // @GetMapping("/stats/last-week")
  // public ResponseEntity<BorrowStatsDTO> getBorrowStatsLastWeek() {
  // BorrowStatsDTO stats = service.getBorrowStatsLastWeek();
  // return ResponseEntity.ok(stats);
  // }

}
