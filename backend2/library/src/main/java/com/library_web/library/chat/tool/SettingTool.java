package com.library_web.library.chat.tool;

import com.library_web.library.model.Setting;
import com.library_web.library.service.SettingService;
import dev.langchain4j.agent.tool.Tool;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class SettingTool {

    @Autowired
    private SettingService settingService;

    @Tool("Dùng tool này để lấy các CÀI ĐẶT hoặc CHÍNH SÁCH CHUNG của thư viện, ví dụ: tiền phạt, số sách tối đa được mượn.")
    public String getLibrarySettings() {
        try {
            Setting settings = settingService.getSetting();

            return "Ok bạn, đây là các quy định chung của thư viện nè:\n" +
                   "- Tiền phạt trả sách trễ mỗi ngày là: " + settings.getFinePerDay() + " VND.\n" +
                   "- Thời gian chờ lấy sách sau khi đăng ký là: " + settings.getWaitingToTake() + " ngày.\n" +
                   "- Thời gian mượn tối đa cho mỗi cuốn là: " + settings.getBorrowDay() + " ngày.\n" +
                   "- Số lượng sách tối đa bạn được mượn cùng lúc là: " + settings.getMaxBorrowedBooks() + " cuốn.";

        } catch (Exception e) {
            return "Ui, tui gặp lỗi khi xem quy định thư viện: " + e.getMessage();
        }
    }
}