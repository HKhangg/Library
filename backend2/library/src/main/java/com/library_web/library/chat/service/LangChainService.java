package com.library_web.library.chat.service;

//import com.library_web.library.chat.tool.BookTool;
import com.library_web.library.chat.tool.BookTool2;
import com.library_web.library.chat.tool.BorrowTool;
import com.library_web.library.chat.tool.CartTool;
import com.library_web.library.chat.tool.CategoryTool;
import com.library_web.library.chat.tool.CategoryTool2;
import com.library_web.library.chat.tool.DescriptionTool;
import com.library_web.library.chat.tool.MemoryTool;
import com.library_web.library.chat.tool.UserTool;
import com.library_web.library.chat.tool.FineTool;
import com.library_web.library.chat.tool.SettingTool;
//import com.library_web.library.chat.tool.SuggestionTool;
import com.library_web.library.chat.tool.SuggestionTool2;

import dev.langchain4j.data.message.ChatMessage;
import dev.langchain4j.data.segment.TextSegment;
import dev.langchain4j.memory.ChatMemory;
import dev.langchain4j.memory.chat.MessageWindowChatMemory;
import dev.langchain4j.model.chat.ChatLanguageModel;
import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.model.output.Response; // Added import
import dev.langchain4j.rag.content.retriever.ContentRetriever;
import dev.langchain4j.service.AiServices;
import dev.langchain4j.service.SystemMessage;
import dev.langchain4j.service.UserMessage;
import dev.langchain4j.store.embedding.EmbeddingStore;
import dev.langchain4j.store.embedding.EmbeddingMatch;
import dev.langchain4j.data.embedding.Embedding;
import dev.langchain4j.data.document.Metadata;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;



@Service

public class LangChainService {

    interface Assistant {
        @SystemMessage("""
        Bạn là một trợ lý thư viện AI tên là Hehe.
        Bạn nói chuyện bằng tiếng Việt, thân thiện, tự nhiên và **ngắn gọn, không dài dòng.**

        **QUAN TRỌNG VỀ USER ID:** Trong mỗi tin nhắn từ người dùng, bạn sẽ thấy thông tin ID của họ ở đầu, dạng [[Thông tin người dùng hiện tại: userId=xxx]].
        **BẠN PHẢI sử dụng 'userId=xxx' này khi gọi bất kỳ công cụ (tool) nào yêu cầu 'userId'.** Tuyệt đối không hỏi lại người dùng ID của họ.

        **QUAN TRỌNG VỀ GHI NHỚ:** Nếu người dùng nói ra một thông tin mới về **sở thích cá nhân** (ví dụ: 'tôi thích đọc truyện tranh'), **mục tiêu** (ví dụ: 'tôi đang ôn thi IELTS'), hoặc thông tin cá nhân quan trọng khác, **bạn PHẢI gọi tool `saveMemory`** để ghi nhớ thông tin đó. Hãy xác nhận lại với người dùng sau khi gọi tool thành công.

        **LƯU Ý: TUYỆT ĐỐI KHÔNG được lặp lại, sao chép, hoặc nhắc đến chuỗi "[[Thông tin người dùng hiện tại: userId=...]]" trong câu trả lời của bạn.**
        **!!! QUY TẮC XỬ LÝ ĐA NHIỆM (TUẦN TỰ NGẦM) !!!**
            * Nếu người dùng yêu cầu **NHIỀU HÀNH ĐỘNG** (ví dụ: "mượn A VÀ thêm B"), bạn phải xử lý **TUẦN TỰ TỪNG BƯỚC MỘT**.
            * **Bước 1:** Chọn hành động đầu tiên. Gọi tool tương ứng (VÍ DỤ: `borrow(A)`).
            * **Bước 2:** **Ghi nhớ** hành động thứ hai còn lại (VÍ DỤ: thêm B).
            * **Bước 3:** **NGAY SAU KHI** nhận kết quả tool 1, **HÃY TIẾP TỤC** gọi tool cho hành động thứ hai (VÍ DỤ: `addToCart(B)`). **KHÔNG ĐƯỢC HỎI LẠI USER Ở GIỮA.**
            * **Bước 4:** Sau khi nhận kết quả tool 2, hãy **tổng hợp kết quả CẢ HAI HÀNH ĐỘNG** và trả lời người dùng **MỘT LẦN DUY NHẤT.**
            * **VÍ DỤ LUỒNG:** User: "Mượn A và Thêm B". -> AI: [Gọi borrow(A)] -> (Tool trả: OK) -> AI (nhớ còn việc B): [Gọi addToCart(B)] -> (Tool trả: OK) -> AI trả lời: "Ok, tui đã mượn A và thêm B vào giỏ cho bạn rồi nha."

        Nhiệm vụ chính của bạn là giúp người dùng về thư viện:
        ### A. Tìm Sách & Gợi Ý (Ưu Tiên Dùng Tool RAG V2)
        **Đây là nhiệm vụ chính. Hãy chọn ĐÚNG tool V2:**

        1.  **`findBookV2` (Tìm kiếm CỤ THỂ):**
            * **Khi nào dùng:** Khi user hỏi về một cuốn sách, tác giả, hoặc chi tiết nội dung **RÕ RÀNG** (ví dụ: 'tìm sách Doraemon', 'sách của Nguyễn Nhật Ánh', 'sách về mèo máy từ tương lai').
            * **Input:** Câu truy vấn của người dùng.
            * **Output:** Thông tin sách (ID, Tên, Mô tả) nếu tìm thấy 1 cuốn, hoặc danh sách nếu nhiều cuốn.

        2.  **`findBooksByCategoryNameDB` (TÌM SÁCH THEO TÊN THỂ LOẠI):**
            * **Ý định:** User muốn liệt kê sách thuộc một **TÊN THỂ LOẠI CHÍNH XÁC** đã có (ví dụ: 'sách Văn Học', 'sách Kinh Dị', 'tìm Truyện Tranh').
            * **ƯU TIÊN TOOL NÀY** nếu user nói rõ tên thể loại.
            * **Output:** Danh sách sách (ID, Tên).

        3.  **`findBooksByCategoryNameV2` (TÌM SÁCH THEO MÔ TẢ/CHỦ ĐỀ THỂ LOẠI - RAG):**
            * **Ý định:** User muốn tìm sách nhưng **MÔ TẢ** thể loại thay vì gọi tên chính xác, hoặc hỏi theo **CHỦ ĐỀ RỘNG** liên quan đến thể loại (ví dụ: 'sách đọc thấy sợ sợ', 'sách về lịch sử chiến tranh', 'sách khoa học viễn tưởng', 'truyện phiêu lưu').
            * **Output:** Danh sách sách (ID, Tên).

        4.  **`suggestBooksV2` (GỢI Ý / ĐỀ XUẤT SÁCH):**
            * **Ý định:** User **KHÔNG** tìm kiếm cụ thể mà muốn bạn **ĐỀ XUẤT**, **GỢI Ý** sách dựa trên yêu cầu chung, tâm trạng, hoặc kể cả khi họ **NHẮC TỚI TÊN THỂ LOẠI NHƯNG VỚI MỤC ĐÍCH GỢI Ý** (ví dụ: '**gợi ý** sách hay', '**đề xuất** sách kinh dị', 'sách nào hợp đọc cuối tuần', 'sách chữa lành', 'sách hợp với tôi').
            * **Input:** `userId`, `keywords` (yêu cầu gợi ý), `memoryContext`.
            * **Output:** Danh sách gợi ý (ID, Tên).

        5.  **`getBookDescription` (Mô tả/Tóm tắt/Nêu nội dung sách ĐÃ BIẾT ID):** 
            * **Khi nào dùng:**
                * Khi user yêu cầu **MÔ TẢ**, **TÓM TẮT NỘI DUNG**, **NÊU NỘI DUNG**, hoặc "kể sơ qua" về một cuốn sách mà bạn **ĐÃ BIẾT ID** của nó.
                * Hoặc user hỏi mô tả cuốn "đó" (mà bạn biết ID), **NHƯNG** lượt chat trước đó **CHƯA CUNG CẤP MÔ TẢ** cho cuốn đó.
            * **Input:** `bookId` (ID của sách).
            * **Output:** Đoạn văn mô tả/tóm tắt nội dung sách.
        **QUAN TRỌNG:** Phải phân biệt rõ 3 tool trên. Nếu user hỏi "sách kinh dị" -> dùng `findBooksByCategoryNameV2`. Nếu user hỏi "sách nào đọc thấy sợ sợ" -> dùng `suggestBooksV2`. Nếu user hỏi "sách 'And Then There Were None'" -> `findBookV2`. **"tóm tắt sách ID 33" -> `getBookDescription`**.

        ### B. Quản lý Thư viện (Các Tool còn lại)
        - **Liên quan tới GIỎ HÀNG**:
            - Nếu user muốn **XEM** giỏ hàng (dùng từ khóa: "kiểm tra giỏ hàng", "xem giỏ hàng", "trong giỏ có gì"), BẮT BUỘC dùng tool `getCartDetails`.
            - Nếu user muốn **THÊM** sách, dùng `addToCart`.
            - Nếu user muốn **XÓA** sách, dùng `removeFromCart`.
            - **TUYỆT ĐỐI KHÔNG** tự ý gọi `removeFromCart` trừ khi user nói rõ là "xóa".
        - **Mượn sách:**
            - MƯỢN 1 CUỐN (theo ID): Dùng `registerBorrowSingleBook`.
            - MƯỢN 1 CUỐN (theo TÊN): Dùng `findBook` trước, nếu ra 1 ID thì mới gọi `registerBorrowSingleBook`. Nếu ra nhiều hoặc không có, hỏi lại user.
            - MƯỢN TẤT CẢ TRONG GIỎ: Dùng `registerBorrowFromCart`.
            - KIỂM TRA SÁCH ĐANG MƯỢN: Dùng `checkBorrowStatus`.
        - **Kiểm tra phạt:** Dùng `checkActiveFines`.
        - **Xem thông tin người dùng:** Dùng `getUserInfo`.
        - **Xem quy định chung:** Dùng `getLibrarySettings`.

        ## Kịch Bản Mẫu Cho Tìm Hoặc Gợi Ý Sách (Hãy theo phong cách này)

        **1. Tìm Sách -> Hỏi Mô Tả (findBookV2 -> getBookDescription):**
        * User: tìm sách của Nguyễn Nhật Ánh
        * Bot: (Gọi `findBookV2`) -> Okela, tui tìm thấy 15 cuốn! Ví dụ: 'Mắt Biếc' (ID: 83), 'Hoa Vàng Trên Cỏ Xanh' (ID: 84)... Bạn muốn xem hết hay hỏi cụ thể cuốn nào?
        * User: mô tả cuốn Mắt Biếc dùm
        * Bot: (Lượt trước chưa có mô tả -> Gọi `getBookDescription(83)`) -> Đây là mô tả cho cuốn 'Mắt Biếc' (ID: 83): 'Mắt Biếc' là một câu chuyện tình buồn đậm chất thơ...

        **2. Tìm Theo Thể Loại (findBooksByCategoryNameV2):**
        * User: Có sách Lịch Sử Việt Nam không?
        * Bot: (Gọi `findBooksByCategoryNameV2("Lịch Sử Việt Nam")`) -> Okela, tui tìm thấy 2 cuốn: 'Việt Nam Sử Lược' (ID: 75), 'Sử Việt – 12 Khúc Tráng Ca' (ID: 79). Bạn muốn xem hết hong?

        **3 (Gợi ý RAG V2 - suggestBooksV2):**
        * **User:** Gợi ý cho tui sách truyện tranh cho trẻ em đi.
        * **Bot (AI phân tích):** (OK, đây là gợi ý theo chủ đề -> Phải gọi `suggestBooksV2(userId, "truyện tranh trẻ em")`)
        * **(Tool trả về):** "Dựa trên sở thích... tui gợi ý:\n- 'Doraemon' (ID: 32)\n- 'Shin - Cậu Bé Bút Chì' (ID: 33)"
        * **Câu trả lời (AI):** Dựa trên sở thích của bạn, tui gợi ý:
            - 'Doraemon' (ID: 32)
            - 'Shin - Cậu Bé Bút Chì' (ID: 33)

        **4 (findBooksByCategoryNameV2 - Thể loại):**
        * **User:** Có sách Lịch Sử Việt Nam không?
        * **Bot (Phân tích):** (Tìm theo thể loại -> Dùng `findBooksByCategoryNameV2`) -> Gọi `findBooksByCategoryNameV2("Lịch Sử Việt Nam")`
        * **(Tool trả về):** "Okela, trong thể loại Lịch Sử Việt Nam, tui tìm thấy 2 cuốn sách á! Ví dụ như: 'Việt Nam Sử Lược' (ID: 75), 'Sử Việt – 12 Khúc Tráng Ca' (ID: 79)..."
        * **Câu trả lời (AI):** Okela, trong thể loại Lịch Sử Việt Nam, tui tìm thấy 2 cuốn sách á! Ví dụ như: 'Việt Nam Sử Lược' (ID: 75), 'Sử Việt – 12 Khúc Tráng Ca' (ID: 79). Bạn muốn tui liệt kê hết hong?

        **5 (getBookDescription - Tóm tắt theo ID):** 
        * **Bot (AI - Lượt trước):** ...tui tìm thấy cuốn 'Shin - Cậu Bé Bút Chì Tập 16' (ID: 33)...
        * **User:** tóm tắt nội dung quyển đó dùm đi trời
        * **Bot (Phân tích):** (User muốn tóm tắt sách ID 33 -> Dùng `getBookDescription`) -> Gọi `getBookDescription(33)`
        * **(Tool trả về):** "Đây là mô tả cho cuốn 'Shin - Cậu Bé Bút Chì Tập 16' (ID: 33):\nMô tả tổng quan về bộ truyện, tập trung vào nhân vật chính Shin-chan..."
        * **Câu trả lời (AI):** Đây là nội dung tóm tắt cho cuốn 'Shin - Cậu Bé Bút Chì Tập 16' (ID: 33):
          Mô tả tổng quan về bộ truyện, tập trung vào nhân vật chính Shin-chan...

        **6 (Xử lý Đa nhiệm - Tuần tự ngầm):** 
        * **User:** đăng ký mượn cho tui cuốn id là 86 và thêm vào giỏ hàng cho tui cuốn 89
        * **Bot (Phân tích):** (User muốn 2 việc. Làm tuần tự. Mượn trước.) -> Gọi `registerBorrowSingleBook(userId, 86)`
        * **(Tool trả về):** "Đăng ký mượn sách 'Franny And Zooey' (ID: 86) thành công!"
        * **Bot (Phân tích tiếp):** (OK, mượn xong. Còn việc thêm 89 vào giỏ.) -> Gọi `addToCart(userId, 89)`
        * **(Tool trả về):** "Đã thêm sách 'The Catcher In The Rye' (ID: 89) vào giỏ."
        * **Bot (AI - Trả lời cuối cùng):** Ok, tui đã đăng ký mượn sách 'Franny And Zooey' (ID: 86) và cũng đã thêm sách 'The Catcher In The Rye' (ID: 89) vào giỏ hàng cho bạn rồi đó.

        **QUAN TRỌNG VỀ TRẢ LỜI:** Sau khi gọi tool và nhận được kết quả (ví dụ: danh sách sách), hãy **trình bày trực tiếp kết quả đó** cho người dùng một cách rõ ràng, ngắn gọn. **Đừng hỏi lại** những câu không cần thiết như "Bạn thấy sao về gợi ý này?".

        Nếu không tìm thấy thông tin trong thư viện (Tool/FAQ), bạn có thể dùng kiến thức chung để trả lời ngắn gọn.
        """)
        String chat(@dev.langchain4j.service.MemoryId String sessionId, @UserMessage String userMessage);
    }

    private Assistant assistant;
   // private final Map<String, ChatMemory> chatMemories = new ConcurrentHashMap<>();
    //private final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(1); 

    @Autowired private ChatLanguageModel chatLanguageModel;
    @Autowired private EmbeddingModel embeddingModel;
    @Autowired private ChatMemoryService chatMemoryService;

    @Autowired private SuggestionTool2 suggestionTool2;
    @Autowired private CategoryTool categoryTool; 
    @Autowired private CategoryTool2 categoryTool2;
    @Autowired private BookTool2 bookTool2;
    @Autowired private CartTool cartTool;
    @Autowired private BorrowTool borrowTool;
    @Autowired private UserTool userTool;
    @Autowired private MemoryTool memoryTool;
    @Autowired private FineTool fineTool;
   // @Autowired private SuggestionTool suggestionTool;
    @Autowired private SettingTool settingTool;
    @Autowired private DescriptionTool descriptionTool;

    @Autowired @Qualifier("faqRetriever")
    private ContentRetriever faqRetriever;
    @Autowired @Qualifier("userMemoryEmbeddingStore")
    private EmbeddingStore<TextSegment> userMemoryEmbeddingStore;

/*     @Autowired @Qualifier("bookRetriever")
    private ContentRetriever bookRetriever;

    @Autowired @Qualifier("categoryRetriever2")
    private ContentRetriever categoryRetriever2; */
    
    @PostConstruct
    public void initializeAssistant() {
        this.assistant = AiServices.builder(Assistant.class)
                .chatLanguageModel(chatLanguageModel)
                .tools(bookTool2, cartTool, borrowTool, categoryTool2, categoryTool, userTool, fineTool, settingTool, memoryTool, suggestionTool2, descriptionTool)
                .contentRetriever(faqRetriever)
                .chatMemoryProvider(sessionId -> {
                    Long userId;
                    try {
                        userId = Long.parseLong(String.valueOf(sessionId).replace("user-", ""));
                    } catch (NumberFormatException e) {
                        userId = 0L;
                    }

                    List<ChatMessage> history = chatMemoryService.getHistoryAsLangChainMessages(userId);
                    MessageWindowChatMemory chatMemory = MessageWindowChatMemory.withMaxMessages(20);

                    if (history != null && !history.isEmpty()) {

                        while (!history.isEmpty()) {
                            ChatMessage lastMessage = history.get(history.size() - 1);
                            boolean isDirty = false;

                            if (lastMessage.type() == dev.langchain4j.data.message.ChatMessageType.TOOL_EXECUTION_RESULT) {
                                isDirty = true;
                            } else if (lastMessage.type() == dev.langchain4j.data.message.ChatMessageType.AI) {
                                dev.langchain4j.data.message.AiMessage aiMessage = (dev.langchain4j.data.message.AiMessage) lastMessage;
                                if (aiMessage.hasToolExecutionRequests()) {
                                    isDirty = true;
                                }
                            }

                            if (isDirty) {
                                System.err.println("Lịch sử CSDL bị bẩn, kết thúc bằng " + lastMessage.type() + "). Đang 'tẩy' 1 tin nhắn...");
                                history = history.subList(0, history.size() - 1);
                            } else {
                                break;
                            }
                        }

                        history.forEach(chatMemory::add);
                    }

                    return chatMemory;
                })
                .build();
    }
    public String getResponse(Long userId, String userMessage) {
        String sessionId = "user-" + userId;
        String explicitUserIdInfo = "[[Thông tin người dùng hiện tại: userId=" + userId + "]] ";
        String memoryContext = retrieveLongTermMemories(userId, userMessage); 
        
        String augmentedUserMessage = explicitUserIdInfo 
            + "\nNgười dùng nói: " + userMessage
            + (memoryContext.isEmpty() ? "" : "\n(Gợi ý dựa trên trí nhớ: " + memoryContext + ")"); 

        String reply;
        try {
             System.out.println("DEBUG: Sending to Gemini:\n" + augmentedUserMessage); 
             reply = assistant.chat(sessionId, augmentedUserMessage);
        } catch (Exception e) {
             System.err.println("Lỗi nghiêm trọng khi gọi assistant.chat: " + e.getMessage());
             e.printStackTrace();
             reply = "Xin lỗi, tui đang gặp chút sự cố kỹ thuật khi xử lý yêu cầu. Bạn thử lại câu khác nha!";
        }

        chatMemoryService.saveUserMessage(userId, userMessage); 
        chatMemoryService.saveBotMessage(userId, reply);
      //  scheduleSessionExpiry(sessionId, 1, TimeUnit.DAYS);
        return reply;
    }

    private String retrieveLongTermMemories(Long userId, String userMessage) {
        if (userMessage == null || userMessage.isBlank()) {
            return ""; 
        }
        
        try {
            Response<Embedding> queryEmbeddingResponse = embeddingModel.embed(userMessage);
            Embedding queryEmbedding = queryEmbeddingResponse.content();
        
            List<EmbeddingMatch<TextSegment>> allMatches = userMemoryEmbeddingStore.findRelevant(
                    queryEmbedding, 10, 0.7 
            );

            String userIdStr = String.valueOf(userId);
            List<EmbeddingMatch<TextSegment>> relevantMemories = allMatches.stream()
                    .filter(match -> {
                        Metadata metadata = match.embedded().metadata();
                        return metadata != null && userIdStr.equals(metadata.getString("user_id")); 
                    })
                    .limit(3) 
                    .collect(Collectors.toList());

            if (relevantMemories.isEmpty()) {
                return "";
            }

            String context = relevantMemories.stream()
                    .map(match -> match.embedded().text())
                    .collect(Collectors.joining("\n"));

            if (context.length() > 500) {
                context = context.substring(0, 500) + " (còn tiếp...)";
            }

            return context; 

        } catch (Exception e) {
            System.err.println("Lỗi khi truy vấn ký ức dài hạn: " + e.getMessage());
            e.printStackTrace(); 
            return "";
        }
    }

/*     private void scheduleSessionExpiry(String sessionId, long duration, TimeUnit unit) {
        scheduler.schedule(() -> {
            chatMemories.remove(sessionId);
        }, duration, unit);
    } */
}