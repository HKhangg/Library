package com.library_web.library.chat.tool;

import com.library_web.library.model.Fine;
import com.library_web.library.repository.FineRepository;
import dev.langchain4j.agent.tool.Tool;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class FineTool {

    @Autowired
    private FineRepository fineRepository;

    @Tool("Dùng tool này để kiểm tra xem user có đang bị PHẠT (chưa thanh toán) hay không. Chỉ cần userId.")
    public String checkActiveFines(String userId) {
        try {
            Long uId = Long.parseLong(userId);

            List<Fine> allFines = fineRepository.findByUserId(uId);

            List<Fine> unpaidFines = allFines.stream()
                .filter(fine -> fine.getTrangThai() == Fine.TrangThai.CHUA_THANH_TOAN)
                .collect(Collectors.toList());

            if (unpaidFines.isEmpty()) {
                return "Tuyệt vời! Bạn không có khoản phạt nào cần thanh toán cả.";
            }

            String fineDetails = unpaidFines.stream()
                .map(fine -> "- " + fine.getNoiDung() + " (" + fine.getSoTien() + " VND)")
                .collect(Collectors.joining("\n"));

            return "Hmm, có vẻ bạn đang có " + unpaidFines.size() + " khoản phạt chưa thanh toán nè:\n" + fineDetails + "\nBạn nhớ thanh toán sớm nha!";

        } catch (Exception e) {
            return "Xin lỗi, tui gặp lỗi khi kiểm tra tiền phạt: " + e.getMessage();
        }
    }
}