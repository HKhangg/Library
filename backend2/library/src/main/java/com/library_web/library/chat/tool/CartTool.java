package com.library_web.library.chat.tool;

import com.library_web.library.dto.CartItemDTO;
import com.library_web.library.model.User;
import com.library_web.library.repository.UserRepository;
import com.library_web.library.service.CartService;
import dev.langchain4j.agent.tool.Tool;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class CartTool {

    @Autowired
    private CartService cartService;
    
    @Autowired
    private UserRepository userRepository;

    private User getUser(String userId) {
        Long uId = Long.parseLong(userId);
        return userRepository.findById(uId)
                .orElseThrow(() -> new RuntimeException("Xin lỗi, tui không tìm thấy thông tin người dùng ID " + userId + " trong hệ thống."));
    }

    @Tool("Dùng tool này để thêm MỘT cuốn sách vào giỏ hàng. Cần biết ID của user và ID của sách (MaSach).")
    public String addToCart(String userId, String bookId) {
        try {
            User user = getUser(userId);
            Long bId = Long.parseLong(bookId);
            
            cartService.addBooksToCart(user, List.of(bId));
            
            return "Okela, tui đã bỏ sách (ID: " + bookId + ") vào giỏ hàng cho bạn rồi đó! ";
        } 
        catch (ResponseStatusException e) {
             return "Ủa, hình như sách ID '" + bookId + "' không có trong thư viện mình á. Bạn check lại ID xem sao?";
        } 

        catch (Exception e) {
            return "Ối, có lỗi khi thêm sách vào giỏ: " + e.getMessage() + ". Bạn thử lại sau giúp tui nha.";
        }
    }

    @Tool("Dùng tool này để xóa MỘT cuốn sách khỏi giỏ hàng. Cần biết ID của user và ID của sách (MaSach).")
    public String removeFromCart(String userId, String bookId) {
        try {
            User user = getUser(userId);
            Long bId = Long.parseLong(bookId);
            cartService.removeBooksFromCart(user, List.of(bId));
            
            return "Xong! Tui đã lấy sách (ID: " + bookId + ") ra khỏi giỏ hàng của bạn.";
        } 
        catch (ResponseStatusException e) {
             return "Hmm, tui không tìm thấy sách ID '" + bookId + "' để xóa. Bạn kiểm tra lại ID nhé.";
        } 

        catch (Exception e) {
            return "Ui, tui gặp lỗi khi xóa sách khỏi giỏ: " + e.getMessage() + ". Bạn thử lại sau nghen.";
        }
    }
    
    @Tool("Dùng tool này để xem chi tiết giỏ hàng của user. Chỉ cần userId.")
    public String getCartDetails(String userId) {
        try {
            User user = getUser(userId);

            List<CartItemDTO> items = cartService.getCartDetails(user);

            if (items == null || items.isEmpty()) {
                return "Giỏ hàng của bạn hiện đang trống trơn á. Thêm vài cuốn sách hay vào đi nè! ";
            }
            
            String itemDetails = items.stream()
                .map(item -> "- " + item.getTenSach() + " (ID: " + item.getBookId() + ")") 
                .collect(Collectors.joining("\n"));

            return "Đây là các món trong giỏ hàng của bạn nè:\n" + itemDetails;
        } catch (Exception e) {
            return "Xin lỗi, tui không xem được giỏ hàng lúc này: " + e.getMessage();
        }
    }
}