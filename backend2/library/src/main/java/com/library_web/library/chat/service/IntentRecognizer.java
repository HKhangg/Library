package com.library_web.library.chat.service;

import com.library_web.library.chat.model.IntentType;
import dev.langchain4j.model.chat.ChatLanguageModel;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
// ựa file ni khôm sài nựa nhoo
@Component
public class IntentRecognizer {

    @Autowired
    private ChatLanguageModel llm; 

    public IntentType detectIntent(String message) {
        String prompt = """
        Dựa trên câu sau, hãy xác định ý định của người dùng.
        Trả về đúng một trong các giá trị sau: 
        FIND_BOOK, ADD_TO_CART, REMOVE_FROM_CART, REGISTER_BORROW, CHECK_BORROW_STATUS, SMALL_TALK, UNKNOWN.

        Câu: "%s"
        """.formatted(message);

        String response = llm.generate(prompt).trim().toUpperCase();

        try {
            return IntentType.valueOf(response);
        } catch (Exception e) {
            return IntentType.UNKNOWN;
        }
    }
}