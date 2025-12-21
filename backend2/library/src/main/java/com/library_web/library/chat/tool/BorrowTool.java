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
// Bỏ import Transactional đi nha

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

    // --- SỬA 1: ĐÃ XÓA @Transactional ĐỂ KHÔNG BỊ LỖI toolExecutor is null ---
    @Tool("Dùng tool này để đăng ký mượn TẤT CẢ sách trong giỏ hàng (mỗi sách 1 phiếu mượn). Chỉ cần userId.")
    public String registerBorrowFromCart(String userId) {
        
        User user = getUser(userId);
        List<CartItemDTO> cartItems = cartService.getCartDetails(user);

        if (cartItems == null || cartItems.isEmpty()) {
            return "Giỏ hàng trống trơn à.";
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
                // response.append(" Đã đăng ký mượn sách '").append(bookName).append("'.\n"); // Bỏ dòng này cho đỡ dài

            } catch (MaxBorrowLimitExceededException e) {
                response.append("Lỗi: Quá hạn mức mượn sách.\n");
                break;
            } catch (Exception e) {
                response.append("Lỗi sách '").append(item.getTenSach()).append("': ").append(e.getMessage()).append("\n");
            }
        }

        if (successCount > 0) {
            try {
                cartService.removeBooksFromCart(user, borrowedBookIds);
                // Trả về câu ngắn gọn để tránh lỗi Lag context
                response.append("Đã đăng ký mượn thành công ").append(successCount).append(" cuốn và xóa khỏi giỏ hàng.");
            } catch (Exception e) {
                response.append("Đã mượn được ").append(successCount).append(" cuốn, nhưng lỗi khi xóa khỏi giỏ (bạn xóa tay nha).");
            }
        } else {
            response.append("Không mượn được cuốn nào cả.");
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
                return "Bạn không có sách nào đang mượn.";
            }

            StringBuilder response = new StringBuilder();
            if (!requestedCards.isEmpty()) {
                response.append("Đang chờ lấy: ").append(requestedCards.size()).append(" cuốn. ");
            }
            if (!activeCards.isEmpty()) {
                response.append("Đang mượn: ").append(activeCards.size()).append(" cuốn.");
            }
            
            return response.toString(); 
        } catch (Exception e) {
            return "Lỗi kiểm tra: " + e.getMessage();
        }
    }

    // --- SỬA 2: TRẢ VỀ CÂU NGẮN GỌN ĐỂ AI KHÔNG BỊ LAG KHI GỌI 2 LẦN ---
    @Tool("Dùng tool này để đăng ký mượn MỘT cuốn sách cụ thể theo ID sách (MaSach). Cần userId và bookId.")
    public String registerBorrowSingleBook(String userId, String bookId) {
        try {
            User user = getUser(userId);
            Long bId = Long.parseLong(bookId);
            
            // Logic mượn
            Book book = bookService.getBookbyID(bId); 
            BorrowCardDTO dto = new BorrowCardDTO();
            dto.setUserId(user.getId());
            dto.setMaSach(bId);
            dto.setTenSach(book.getTenSach()); 
            borrowCardService.createBorrowCard(dto); 
            
            // Logic xóa giỏ (không quan trọng lắm nếu lỗi)
            try {
                 cartService.removeBooksFromCart(user, List.of(bId));
            } catch (Exception e) {}

            return "Đã đăng ký mượn sách ID " + bookId + " thành công.";

        } catch (Exception e) {
            return "Lỗi mượn sách ID " + bookId + ": " + e.getMessage();
        }
    }
}