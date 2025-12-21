package com.library_web.library.chat.service;
import com.library_web.library.chat.tool.*;
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
        Bạn là Hehe, trợ lý thư viện AI. Nói tiếng Việt tự nhiên ('nè', 'á', 'nhen'), ngắn gọn, thân thiện.

        ### QUY TẮC BẮT BUỘC (AN TOÀN & LOGIC)
        1. **Dữ liệu:** Luôn dùng `userId` từ chuỗi `[[Thông tin người dùng hiện tại: userId=xxx]]` ở đầu tin nhắn để gọi tool. KHÔNG hỏi lại ID.
        2. **Nội dung:** Tuyệt đối Family Friendly. Từ chối khéo léo các nội dung 18+, bạo lực.
        3. **Trung thực:** Tool lỗi/không có dữ liệu -> Báo lỗi/không tìm thấy. KHÔNG BỊA SÁCH.
        4. **Ghi nhớ:** Nếu user chia sẻ sở thích/thông tin cá nhân -> Gọi `saveMemory`. Sau đó nhớ thông báo xác nhận đã ghi nhớ với người dùng.
        5. LƯU Ý: TUYỆT ĐỐI KHÔNG được lặp lại, sao chép, hoặc nhắc đến chuỗi "[[Thông tin người dùng hiện tại: userId=...]]" trong câu trả lời của bạn.**
        6. KHI TRẢ LỜI CÁC CÂU HỎI NHƯ 'còn lại', 'tiếp theo', HÃY KIỂM TRA KỸ LỊCH SỬ TIN NHẮN GẦN NHẤT để xác định chính xác danh sách sách đang được thảo luận. KHÔNG ĐƯỢC BỊA RA sách mới.
        7. **!!! QUY TẮC XỬ LÝ ĐA NHIỆM (TUẦN TỰ NGẦM) !!!**
            * Nếu người dùng yêu cầu **NHIỀU HÀNH ĐỘNG** (ví dụ: "mượn A VÀ thêm B"), bạn phải xử lý **TUẦN TỰ TỪNG BƯỚC MỘT**.
            * **Bước 1:** Chọn hành động đầu tiên. Gọi tool tương ứng (VÍ DỤ: `borrow(A)`).
            * **Bước 2:** **Ghi nhớ** hành động thứ hai còn lại (VÍ DỤ: thêm B).
            * **Bước 3:** **NGAY SAU KHI** nhận kết quả tool 1, **HÃY TIẾP TỤC** gọi tool cho hành động thứ hai (VÍ DỤ: `addToCart(B)`). **KHÔNG ĐƯỢC HỎI LẠI USER Ở GIỮA.**
            * **Bước 4:** Sau khi nhận kết quả tool 2, hãy **tổng hợp kết quả CẢ HAI HÀNH ĐỘNG** và trả lời người dùng **MỘT LẦN DUY NHẤT.**
            * **VÍ DỤ LUỒNG:** User: "Mượn A và Thêm B". -> AI: [Gọi borrow(A)] -> (Tool trả: OK) -> AI (nhớ còn việc B): [Gọi addToCart(B)] -> (Tool trả: OK) -> AI trả lời: "Ok, tui đã mượn A và thêm B vào giỏ cho bạn rồi nha."

       ### HƯỚNG DẪN CHỌN TOOL (ROUTING)
        Hãy phân tích ý định (Intent) của user thật kỹ trước khi gọi tool:

        - **TH1: Tìm kiếm chính xác (User biết họ cần gì)**
        - Ví dụ: "Tìm cuốn Mắt Biếc", "Sách của Nguyễn Nhật Ánh", "Sách có từ khóa 'Java'".
        - -> Dùng: `findBookV2` (Tìm theo tên/tác giả) hoặc `findBooksByCategoryNameV2` (Nếu tìm theo tên thể loại cụ thể).
        - *Lưu ý:* Nếu kết quả trả về quá nhiều, hỏi user có muốn lọc thêm không.

        - **TH2: Xin gợi ý/Lời khuyên (User chưa biết đọc gì)**
        - Ví dụ: "Dạo này buồn quá đọc gì?", "Gợi ý sách trinh thám hay", "Sách gì hợp với tui?".
        - -> Dùng: `suggestBooksV2`.
        - *Lưu ý:* Đây là tool mạnh nhất để cá nhân hóa, hãy ưu tiên dùng khi user dùng các từ: "gợi ý", "đề xuất", "hay nhất", "top".

        - **TH3: Hỏi chi tiết nội dung**
        - Ví dụ: "Cuốn đó nói về gì?", "Tóm tắt cuốn ID 123".
        - -> Dùng: `getBookDescription`.

        - **TH4: Nghiệp vụ (Giỏ hàng/Mượn/Phạt)**
        - Dùng các tool tương ứng: `addToCart`, `removeFromCart`, `registerBorrow...`, `checkActiveFines`.
        - *Quan trọng:* Khi mượn thành công, nhắc user thời gian lấy sách.
        - MƯỢN SÁCH:
            + Nếu user đưa ID cụ thể -> Dùng `registerBorrowSingleBook`.
            + Nếu user nói "mượn hết trong giỏ" -> Dùng `registerBorrowFromCart`.
            + Nếu user đưa Tên sách -> Dùng `findBookV2` để lấy ID trước, sau đó mới gọi mượn.
        - **Kiểm tra phạt:** Dùng `checkActiveFines`.
        - **Xem thông tin người dùng:** Dùng `getUserInfo`.
        - **Xem quy định chung:** Dùng `getLibrarySettings`.

        ### HỘI THOẠI MẪU (BẮT CHƯỚC PHONG CÁCH NÀY)
            **User:** tìm sách Nguyễn Nhật Ánh
            **Bot:** (Gọi `findBookV2`) -> Okela, tui tìm thấy: 'Mắt Biếc' (ID: 83), 'Kính Vạn Hoa' (ID: 90). Bạn muốn xem chi tiết cuốn nào?

            **User:** mô tả cuốn Mắt Biếc
            **Bot:** (Gọi `getBookDescription(83)`) -> 'Mắt Biếc' (ID: 83) là câu chuyện tình đơn phương buồn da diết của Ngạn dành cho Hà Lan...

            **User:** gợi ý truyện tranh cho thiếu nhi
            **Bot:** (Gọi `suggestBooksV2("truyện tranh thiếu nhi")`) -> Dựa trên sở thích của bạn, tui gợi ý:
            - 'Doraemon' (ID: 32)
            - 'Trạng Tí' (ID: 40)

            **User:** Có sách Lịch Sử Việt Nam không?
            **Bot:** (Gọi `findBooksByCategoryNameV2("Lịch Sử Việt Nam")`) -> Trong thể loại này tui có: 'Việt Nam Sử Lược' (ID: 75).

            **User:** mượn cuốn ID 86 và thêm cuốn 89 vào giỏ
            **Bot:** (Gọi `registerBorrowSingleBook(86)` -> OK) -> (Gọi `addToCart(89)` -> OK) -> Xong nha! Tui đã đăng ký mượn cuốn ID 86 và thêm cuốn ID 89 vào giỏ hàng cho bạn rồi.

            ### LƯU Ý CUỐI
            - Trả lời trực tiếp kết quả, không hỏi thừa.
            - Luôn kèm **(ID: xxx)** sau tên sách.
            - Nếu không tìm thấy thông tin trong thư viện (Tool/FAQ), bạn có thể dùng kiến thức chung trên Internet để trả lời ngắn gọn.
            """)
        String chat(@dev.langchain4j.service.MemoryId String sessionId, @UserMessage String userMessage);
    }

    private Assistant assistant;
    private final Map<Object, ChatMemory> activeChatMemories = new ConcurrentHashMap<>();
   // private final Map<String, ChatMemory> chatMemories = new ConcurrentHashMap<>();
    //private final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(1); 

    @Autowired private ChatLanguageModel chatLanguageModel;
    @Autowired private EmbeddingModel embeddingModel;
    @Autowired private ChatMemoryService chatMemoryService;

    @Autowired private SuggestionTool2 suggestionTool2;
    //@Autowired private CategoryTool categoryTool; 
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
                .tools(bookTool2, cartTool, borrowTool, categoryTool2, userTool, fineTool, settingTool, memoryTool, suggestionTool2, descriptionTool)
                .contentRetriever(faqRetriever)
                .chatMemoryProvider(memoryId -> activeChatMemories.computeIfAbsent(memoryId, id -> {
                    /*
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
                
                   

                   Long userId = parseUserIdFromSession(sessionId);
                    List<ChatMessage> history = chatMemoryService.getHistoryAsLangChainMessages(userId);
                    MessageWindowChatMemory chatMemory = MessageWindowChatMemory.withMaxMessages(20);
                    if (history != null && !history.isEmpty()) {
                        history.forEach(chatMemory::add);
                    }

                    return chatMemory;
                })
                .build();
    }
                */
               Long userId = parseUserIdFromSession(id);
                    List<dev.langchain4j.data.message.ChatMessage> history = chatMemoryService.getHistoryAsLangChainMessages(userId);
                    MessageWindowChatMemory memory = MessageWindowChatMemory.withMaxMessages(10);
                    if (history != null) history.forEach(memory::add);
                    return memory;
                }))
                .build();
    }



public String getResponse(Long userId, String userMessage) {
        String sessionId = "user-" + userId;
        String explicitInfo = "[[User ID: " + userId + "]] ";
        
        String memoryContext = "";
        try { memoryContext = retrieveLongTermMemories(userId, userMessage); } catch (Exception e) {}
        
        String fullMessage = explicitInfo + "\nUser: " + userMessage 
                           + (memoryContext.isEmpty() ? "" : "\n(Memory: " + memoryContext + ")");

        String reply;
        try {
             System.out.println("DEBUG: Sending to Gemini (User " + userId + ")...");
             reply = assistant.chat(sessionId, fullMessage);
        
        } catch (Exception e) {
            String msg = e.getMessage();
                   
            System.err.println("ERROR Details: " + e.toString()); 
            if (e instanceof NullPointerException || (msg != null && msg.contains("parts"))) {
                return "Ui, câu hỏi này chứa từ khóa nhạy cảm nên Google chặn rồi. Bạn hỏi lái sang cách khác nha!";
            }
            if (msg != null && (msg.contains("429") || msg.contains("quota"))) {
                return "Ui, tui hết năng lượng rồi. Nghỉ 2 phút nha!";
            }
            if (msg != null && (msg.contains("400") || msg.contains("function call") || msg.contains("Please ensure"))) {
                System.out.println("LỖI 400 NỮA NÈ MÁ MỆT GHÊ ÁDNIDJODJJDODJ");
                try {
                    activeChatMemories.remove(sessionId);
                    chatMemoryService.removeLastNMessages(userId, 2); 

                  return "Hehe bị rối xíu, bạn nói rõ lại yêu cầu giúp Hehe nheee !";
                  //  return assistant.chat(sessionId, fullMessage); 
                    
                } catch (Exception retryEx) {
                    System.err.println("Lỗi khi cố gắng reset bộ nhớ: " + retryEx.getMessage());
                    return "Ui, tui bị lag nhẹ. Phiền bạn hỏi lại câu vừa nãy giúp tui nhee !";
                }
            }
            
            e.printStackTrace();
            return "Lỗi hệ thống: " + msg;
        }

        if (!reply.startsWith("Ui,")) { 
            chatMemoryService.saveUserMessage(userId, userMessage); 
            chatMemoryService.saveBotMessage(userId, reply);
        }
        
        return reply;
    }


    private Long parseUserIdFromSession(Object sessionId) {
        try {
            return Long.parseLong(String.valueOf(sessionId).replace("user-", ""));
        } catch (Exception e) {
            System.err.println("Lỗi parse Session ID: " + sessionId);
            return 0L;
        }
    }

    private String retrieveLongTermMemories(Long userId, String userMessage) {
        if (userMessage == null || userMessage.isBlank()) {
            return ""; 
        }
        
        try {
            Response<Embedding> queryEmbeddingResponse = embeddingModel.embed(userMessage);
            Embedding queryEmbedding = queryEmbeddingResponse.content();
        
            List<EmbeddingMatch<TextSegment>> allMatches = userMemoryEmbeddingStore.findRelevant(
                    queryEmbedding, 5, 0.7 
            );

            String userIdStr = String.valueOf(userId);
            List<EmbeddingMatch<TextSegment>> relevantMemories = allMatches.stream()
                    .filter(match -> {
                        Metadata metadata = match.embedded().metadata();
                        return metadata != null && userIdStr.equals(metadata.getString("user_id")); 
                    })
                    .limit(2) 
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