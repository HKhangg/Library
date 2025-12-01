package com.library_web.library.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import com.library_web.library.model.BorrowCard;
import com.library_web.library.model.Fine;
import com.library_web.library.model.User;
import com.library_web.library.repository.UserRepository;
import com.library_web.library.config.EmailConfig;

@Service
public class EmailService {
  @Autowired
  private UserRepository userRepo;
  @Autowired
  private SettingService settingService;
  @Autowired
  private EmailConfig emailConfig;

  @Async
  public void mailExpired(BorrowCard borrowCard) {
    User user = userRepo.findById(borrowCard.getUserId()).orElseThrow(null);
    String email = user.getEmail();
    String tenND = user.getFullname();
    Long idPhieu = borrowCard.getId();
    String subject = "Phiếu mượn sách của bạn đã bị hủy";
    String body = String.format(
        """
                <h3><b>Xin chào %s,</b></h3>
                <p>Chúng tôi nhận thấy bạn đã đăng ký mượn sách tại <b>8ooK Library Web</b> nhưng chưa đến nhận sách trong thời gian quy định.</p>
                <p>Vì lý do đó, <b>phiếu mượn sách <i>%s</i> của bạn đã bị hủy</b> để đảm bảo công bằng cho các bạn đọc khác.</p>
                <p>Nếu có sự nhầm lẫn hoặc bạn vẫn có nhu cầu mượn sách, vui lòng đăng ký lại hoặc liên hệ với quản trị viên để được hỗ trợ.</p>
                <p>Trân trọng,<br><b>8ooK Library Web</b></p>
            """,
        tenND, idPhieu);
    emailConfig.sendEmail(List.of(email), subject, body);
  }

  @Async
  public void mailTaken(BorrowCard borrowCard) {
    User user = userRepo.findById(borrowCard.getUserId()).orElseThrow(null);
    String email = user.getEmail();
    String tenND = user.getFullname();
    DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss");
    String ngayLay = borrowCard.getGetBookDate().format(formatter).toString();
    String ngayTra = borrowCard.getDueDate().format(formatter).toString();
    Long idPhieu = borrowCard.getId();
    String subject = "Bạn đã trả sách thành công!";
    String body = String.format(
        """
                <h3><b>Xin chào %s,</b></h3>
                <p>Chúng tôi xác nhận rằng bạn đã <b>nhận sách thành công</b> theo <b>phiếu mượn %s</b> tại <b>8ooK Library Web</b>.</p>
                <p>Hãy ghi nhớ <b>ngày hết hạn trả sách</b> để tránh bị phạt!</p>
                <p>Thông tin phiếu mượn:</p>
                <ul>
                <li><b>Mã phiếu:</b> %s</li>
                <li><b>Ngày lấy sách:</b> %s</li>
                <li><b>Ngày trả dự kiến:</b> %s</li>
                </ul>
                <<p>Chúc bạn có trải nghiệm đọc sách thật tuyệt vời!</p>
                <p>Trân trọng,<br><b>8ooK Library Web</b></p>
            """,
        tenND, idPhieu, idPhieu, ngayLay, ngayTra);
    emailConfig.sendEmail(List.of(email), subject, body);
  }

  @Async
  public void mailHoiTraSach(List<BorrowCard> list) {
    int startToMail = settingService.getSetting().getStartToMail(); // ngày bắt đầu gửi trong setting
    LocalDate today = LocalDate.now(); // ngày hôm nay
    List<String> targetList = new ArrayList<>();
    for (BorrowCard card : list) {
      LocalDate startDate = card.getDueDate().toLocalDate().minusDays(startToMail); // ngày bắt đầu gửi mail tùy phiếu
      if (today.isEqual(startDate) || today.isAfter(startDate)) {
        User user = userRepo.findById(card.getUserId())
            .orElseThrow(() -> new RuntimeException("Người dùng không tồn tại"));
        String email = user.getEmail();
        targetList.add(email);
      }
    }
    String subject = "Sắp đến hạn trả sách";
    String body = """
            <h3><b>Xin chào,</b></h3>
            <p>Đây là thông báo quan trọng từ <b>8ooK Library Web</b> dành cho bạn.</p>
            <p>Vui lòng kiểm tra <i>thông tin mượn sách</i> của bạn càng sớm càng tốt.</p>
            <p>Trân trọng,<br>8ooK Library Web</p>
        """;
    emailConfig.sendEmail(targetList, subject, body);
  }

  @Async
  public void mailReturned(BorrowCard borrowCard) {
    User user = userRepo.findById(borrowCard.getUserId()).orElseThrow(null);
    String email = user.getEmail();
    String tenND = user.getFullname();
    DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss");
    String ngayTra = borrowCard.getDueDate().format(formatter).toString();
    Long idPhieu = borrowCard.getId();
    String subject = "Bạn đã trả sách thành công!";
    String body = String.format(
        """
                <h3><b>Xin chào %s,</b></h3>
                <p>Chúng tôi xác nhận rằng bạn đã <b>trả sách thành công</b> tại <b>8ooK Library Web</b>.</p>
                <p>Thông tin phiếu mượn:</p>
                <ul>
                <li><b>Mã phiếu:</b> %s</li>
                <li><b>Ngày trả:</b> %s</li>
                </ul>
                <p>Cảm ơn bạn đã sử dụng dịch vụ thư viện của chúng tôi. Hy vọng sẽ tiếp tục được phục vụ bạn trong những lần mượn tiếp theo.</p>
                <p>Trân trọng,<br><b>8ooK Library Web</b></p>
            """,
        tenND, idPhieu, ngayTra);
    emailConfig.sendEmail(List.of(email), subject, body);
  }

  @Async
  public void mailFine(Fine fine) {
    User user = userRepo.findById(Long.valueOf(fine.getUserId())).orElseThrow(null);
    String email = user.getEmail();
    String tenND = user.getFullname();
    DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss");
    String today = LocalDateTime.now().format(formatter).toString();
    Long idPhieu = fine.getId();
    String reason = fine.getNoiDung().toString().equals("Khác")
        ? (fine.getNoiDung() + " - " + fine.getCardId()).toString()
        : fine.getNoiDung();
    String money = Double.toString(fine.getSoTien()) + " đồng";
    String subject = "Thông báo lập phiếu phạt – 8ooK Library Web";
    String body = String.format(
        """
                <h3><b>Xin chào %s,</b></h3>
                <p><b>8ooK Library Web</b> xin thông báo rằng một phiếu phạt đã được lập cho tài khoản của bạn.</p>
                <p>Thông tin chi tiết phiếu phạt:</p>
                <ul>
                <li><b>Mã phiếu:</b> %s</li>
                <li><b>Lý do:</b> %s</li>
                <li><b>Số tiền:</b> %s</li>
                <li><b>Thời gian lập phiếu:</b> %s</li>
                </ul>
                <p>Quý bạn vui lòng thanh toán khoản phạt này tại quầy thủ thư hoặc thông qua hệ thống thanh toán trực tuyến trong vòng 7 ngày kể từ khi thông báo. Việc không thanh toán đúng hạn có thể ảnh hưởng đến quyền mượn sách trong tương lai.</p>
                <p>Nếu bạn có bất kỳ thắc mắc nào về phiếu phạt này, xin vui lòng liên hệ với chúng tôi qua email <b>libraryweb8ooK@gmail.com</b> hoặc số điện thoại <b>0779765688</b>.</p>
                <p>Trân trọng,<br><b>8ooK Library Web</b></p>
            """,
        tenND, idPhieu, reason, money, today);
    emailConfig.sendEmail(List.of(email), subject, body);
  }

  @Async
  public void mailPay(Fine fine) {
    User user = userRepo.findById(Long.valueOf(fine.getUserId())).orElseThrow(null);
    String email = user.getEmail();
    String tenND = user.getFullname();
    DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss");
    String today = LocalDateTime.now().format(formatter).toString();
    Long idPhieu = fine.getId();
    String reason = fine.getNoiDung().toString().equals("Khác")
        ? (fine.getNoiDung() + " - " + fine.getCardId()).toString()
        : fine.getNoiDung();
    String money = Double.toString(fine.getSoTien()) + " đồng";
    String subject = "Thanh toán phiếu phạt thành công";
    String body = String.format(
        """
                <h3><b>Xin chào %s,</b></h3>
                <p><b>8ooK Library Web</b> xin thông báo rằng thanh toán thành công cho phiếu phạt của bạn.</p>
                <p>Thông tin chi tiết phiếu phạt:</p>
                <ul>
                <li><b>Mã phiếu:</b> %s</li>
                <li><b>Lý do:</b> %s</li>
                <li><b>Số tiền:</b> %s</li>
                <li><b>Ngày thanh toán:</b> %s</li>
                </ul>
                <p>Chúng tôi xin chân thành cảm ơn Quý bạn vì sự hợp tác và trách nhiệm trong việc sử dụng dịch vụ thư viện.</p>
                <p>Việc thanh toán của Quý bạn đã được ghi nhận thành công trong hệ thống. Nếu bạn có bất kỳ thắc mắc nào về phiếu phạt này, xin vui lòng liên hệ với chúng tôi qua email <b>libraryweb8ooK@gmail.com</b> hoặc số điện thoại <b>0779765688</b>.</p>
                <p>Trân trọng,<br><b>8ooK Library Web</b></p>
            """,
        tenND, idPhieu, reason, money, today);
    emailConfig.sendEmail(List.of(email), subject, body);
  }
}