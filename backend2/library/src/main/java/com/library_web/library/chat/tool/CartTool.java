package com.library_web.library.chat.tool;

import com.library_web.library.dto.CartItemDTO;
import com.library_web.library.model.User;
import com.library_web.library.repository.UserRepository;
import com.library_web.library.service.CartService;
import com.library_web.library.service.BookService;
import dev.langchain4j.agent.tool.Tool;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.stream.Collectors;

@Component
public class CartTool {

    private static final Logger logger = LoggerFactory.getLogger(CartTool.class);

    @Autowired private CartService cartService;
    @Autowired private UserRepository userRepository;
    @Autowired private BookService bookService;

    
    private User getUser(String userId) {
        try {
            Long uId = Long.parseLong(userId);
            return userRepository.findById(uId)
                    .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy user ID " + userId));
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("ID người dùng không hợp lệ (phải là số): " + userId);
        }
    }

    @Tool("Dùng tool này để thêm MỘT cuốn sách vào giỏ hàng. Cần ID user và ID sách.")
    public String addToCart(String userId, String bookId) {
        logger.info("addToCart request: userId={}, bookId={}", userId, bookId);

        try {
            User user = getUser(userId);
            Long bId;
            try {
                bId = Long.parseLong(bookId);
            } catch (NumberFormatException e) {
                return "ID sách phải là số nha bạn ơi.";
            }
            
            // CHECK 1: Sách có tồn tại trong SQL không? (Fail-fast)
            try {
                bookService.getBookbyID(bId);
            } catch (Exception e) {
                logger.warn("User {} tried to add non-existent book ID {}", userId, bId);
                return "Ui, cuốn sách ID " + bookId + " không tồn tại trong thư viện (hoặc đã bị xóa).";
            }
            cartService.addBooksToCart(user, List.of(bId));
            return "Okela, tui đã thêm sách (ID: " + bookId + ") vào giỏ hàng.";

        } catch (IllegalArgumentException e) {
            return e.getMessage();
        } catch (ResponseStatusException re) {
            logger.info("Cart service rejected add: {}", re.getReason());
            if (re.getStatusCode().value() == 400 || re.getMessage().toLowerCase().contains("exist") || re.getMessage().contains("tồn tại")) {
                return "Cuốn sách ID " + bookId + " đã có trong giỏ hàng rồi nha.";
            }
            return "Lỗi từ hệ thống giỏ hàng: " + re.getReason();
        } catch (Exception e) {
            logger.error("Unexpected error in addToCart", e);
            return "Ui, hệ thống bị lỗi lạ lắm: " + e.getMessage();
        }
    }

    @Tool("Dùng tool này để xóa MỘT cuốn sách khỏi giỏ hàng.")
    public String removeFromCart(String userId, String bookId) {
        logger.info("removeFromCart request: userId={}, bookId={}", userId, bookId);
        try {
            User user = getUser(userId);
            Long bId = Long.parseLong(bookId);
            
            cartService.removeBooksFromCart(user, List.of(bId));
            return "Đã xóa sách ID " + bookId + " khỏi giỏ hàng.";

        } catch (NumberFormatException e) {
            return "ID sách không hợp lệ.";
        } catch (IllegalArgumentException e) {
            return e.getMessage(); // Lỗi user không tồn tại
        } catch (Exception e) {
            logger.error("Error in removeFromCart", e);
            return "Lỗi xóa sách: " + e.getMessage();
        }
    }

    @Tool("Dùng tool này để xem chi tiết giỏ hàng.")
    public String getCartDetails(String userId) {
        try {
            User user = getUser(userId);
            List<CartItemDTO> items = cartService.getCartDetails(user);
            
            if (items == null || items.isEmpty()) {
                return "Giỏ hàng của bạn đang trống trơn à.";
            }
            
            String itemDetails = items.stream()
                .limit(10) 
                .map(item -> "- " + item.getTenSach() + " (ID: " + item.getBookId() + ")")
                .collect(Collectors.joining("\n"));
            
            if (items.size() > 10) {
                itemDetails += "\n... và " + (items.size() - 10) + " cuốn khác nữa.";
            }

            return "Giỏ hàng ("+ items.size() +" cuốn):\n" + itemDetails;

        } catch (IllegalArgumentException e) {
            return e.getMessage();
        } catch (Exception e) {
            logger.error("Error getting cart details", e);
            return "Lỗi xem giỏ hàng: " + e.getMessage();
        }
    }
}