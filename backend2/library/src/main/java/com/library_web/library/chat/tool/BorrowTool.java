package com.library_web.library.chat.tool;

import com.library_web.library.dto.BorrowCardDTO;
import com.library_web.library.dto.CartItemDTO;
import com.library_web.library.exception.MaxBorrowLimitExceededException;
import com.library_web.library.model.Book;
import com.library_web.library.model.BorrowCard;
import com.library_web.library.model.User;
import com.library_web.library.repository.UserRepository;
import com.library_web.library.service.BookService;
import com.library_web.library.service.BorrowCardService;
import com.library_web.library.service.CartService;
import dev.langchain4j.agent.tool.Tool;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class BorrowTool {

    @Autowired
    private BorrowCardService borrowCardService;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private CartService cartService;

    @Autowired 
    private BookService bookService;

    private User getUser(String userId) {
        Long uId = Long.parseLong(userId);
        return userRepository.findById(uId)
                .orElseThrow(() -> new RuntimeException("Xin lỗi, tui không tìm thấy thông tin người dùng ID " + userId));
    }

    @Tool("Dùng tool này để đăng ký mượn TẤT CẢ sách trong giỏ hàng (mỗi sách 1 phiếu mượn). Chỉ cần userId.")
    public String registerBorrowFromCart(String userId) {
        
        User user = getUser(userId);
        List<CartItemDTO> cartItems = cartService.getCartDetails(user);

        if (cartItems == null || cartItems.isEmpty()) {
            return "Hmm, giỏ hàng của bạn đang trống trơn. Bạn cần thêm sách vào giỏ trước khi mượn nha.";
        }

        StringBuilder response = new StringBuilder();
        int successCount = 0;
        List<Long> borrowedBookIds = new ArrayList<>();

        for (CartItemDTO item : cartItems) {
            try {
                Long bookId = item.getBookId();
                String bookName = item.getTenSach();
                
                BorrowCardDTO dto = new BorrowCardDTO();
                dto.setUserId(user.getId());
                dto.setMaSach(bookId);
                dto.setTenSach(bookName);

                borrowCardService.createBorrowCard(dto);

                successCount++;
                borrowedBookIds.add(bookId);
                response.append(" Đã đăng ký mượn sách '").append(bookName).append("'.\n");

            } catch (MaxBorrowLimitExceededException e) {
                response.append(" Không thể mượn sách '").append(item.getTenSach()).append("': ").append(e.getMessage()).append("\n");
                response.append("... Đã dừng việc mượn các sách còn lại do đạt giới hạn.\n");
                break;
            } catch (RuntimeException e) {
                 response.append("Không thể mượn sách '").append(item.getTenSach()).append("': ").append(e.getMessage()).append("\n");
            } catch (Exception e) {
                response.append("Không thể mượn sách '").append(item.getTenSach()).append("': Đã xảy ra lỗi không mong muốn. Bạn thử lại sau nhé.\n");
            }
        }

        if (successCount > 0) {
            cartService.removeBooksFromCart(user, borrowedBookIds);
            response.append("\n Tui đã đăng ký mượn thành công rùi á.").append(successCount).append(" cuốn sách cho bạn và xóa chúng khỏi giỏ hàng. Bạn nhớ ghé thư viện lấy sách sớm nha!");
        } else {
            response.append("\nRất tiếc, không có cuốn sách nào được đăng ký mượn thành công.");
        }

        return response.toString();
    }

    @Tool("Dùng tool này để kiểm tra tình trạng/danh sách sách đang mượn (chưa trả) của user. Chỉ cần userId.")
    public String checkBorrowStatus(String userId) {
        try {
            List<BorrowCard> allCards = borrowCardService.getBorrowCardsByUserId(Long.parseLong(userId));

            List<BorrowCard> activeCards = allCards.stream()
                .filter(card -> card.getStatus().equals(BorrowCard.Status.BORROWED.getStatusDescription())) 
                .collect(Collectors.toList());
            
            List<BorrowCard> requestedCards = allCards.stream()
                .filter(card -> card.getStatus().equals(BorrowCard.Status.REQUESTED.getStatusDescription())) 
                .collect(Collectors.toList());

            if (activeCards.isEmpty() && requestedCards.isEmpty()) {
                return "Hiện tại bạn không có sách nào đang mượn hoặc đang chờ lấy cả.";
            }

            StringBuilder response = new StringBuilder("Oce, để tui xem...\n");
            if (!requestedCards.isEmpty()) {
                response.append("- Bạn có ").append(requestedCards.size()).append(" cuốn đang chờ lấy tại thư viện.\n");
            }
            if (!activeCards.isEmpty()) {
                response.append("- Bạn có ").append(activeCards.size()).append(" cuốn đang mượn.\n");
            }
            
            return response.toString().trim(); 
        } catch (Exception e) {
            return "Xin lỗi, tui gặp lỗi khi kiểm tra tình trạng mượn sách: " + e.getMessage();
        }
    }

    @Tool("Dùng tool này để đăng ký mượn MỘT cuốn sách cụ thể theo ID sách (MaSach). Cần userId và bookId.")
    public String registerBorrowSingleBook(String userId, String bookId) {
    try {
        User user = getUser(userId);
        Long bId = Long.parseLong(bookId);
        Book book = bookService.getBookbyID(bId); 
        String bookName = book.getTenSach();
        BorrowCardDTO dto = new BorrowCardDTO();
        dto.setUserId(user.getId());
        dto.setMaSach(bId);
        dto.setTenSach(bookName); 
        borrowCardService.createBorrowCard(dto); 
        try {
             cartService.removeBooksFromCart(user, List.of(bId));
        } catch (Exception e) {
             System.err.println("Lưu ý: Không xóa được sách ID " + bId + " khỏi giỏ hàng sau khi mượn: " + e.getMessage());
        }


        return "Okela, tui đã đăng ký mượn sách '" + bookName + "' (ID: " + bookId + ") cho bạn rồi. Nhớ ghé thư viện lấy nha!";

    } catch (Exception e) {
    System.err.println("--- LỖI THẬT SỰ TRONG BORROWTOOL ĐÂY ---");
    e.printStackTrace(); 
    System.err.println("--- HẾT LỖI ---");

    return "Ui, lỗi khi đăng ký mượn sách ID " + bookId + ". Bạn thử lại sau nha. (Debug: " + e.getMessage() + ")";
    }
}


}