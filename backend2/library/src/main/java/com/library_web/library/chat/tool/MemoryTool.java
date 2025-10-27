package com.library_web.library.chat.tool;

import dev.langchain4j.agent.tool.Tool;
import dev.langchain4j.data.document.Metadata; 
import dev.langchain4j.data.embedding.Embedding;
import dev.langchain4j.data.segment.TextSegment;
import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.model.output.Response;
import dev.langchain4j.store.embedding.EmbeddingStore;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
//@Transactional
public class MemoryTool {

    @Autowired
    @Qualifier("userMemoryEmbeddingStore")
    private EmbeddingStore<TextSegment> userMemoryEmbeddingStore;

    @Autowired
    private EmbeddingModel embeddingModel;

    @Tool("Dùng công cụ này để GHI NHỚ một thông tin MỚI và QUAN TRỌNG về người dùng (ví dụ: sở thích đọc sách, mục tiêu học tập, tên...). Cần userId và thông tin cần nhớ.")
    public String saveMemory(Long userId, String informationToRemember) {
        try {
            if (informationToRemember == null || informationToRemember.isBlank()) {
                return "Bạn chưa nói điều gì để tui nhớ á.";
            }

            TextSegment segment = TextSegment.from(
                informationToRemember,
                Metadata.from("user_id", String.valueOf(userId))
            );

            Response<Embedding> embeddingResponse = embeddingModel.embed(segment);
            Embedding embedding = embeddingResponse.content();
            if (embedding == null) {
                return "Không thể tạo embedding cho thông tin này.";
            }

            userMemoryEmbeddingStore.add(embedding, segment);

            return "Okela, tui đã ghi nhớ thông tin này về bạn rồi đó!";
        } catch (Exception e) {
            System.err.println("Lỗi khi lưu ký ức cho user " + userId + ": " + e.getMessage());
            e.printStackTrace();
            return "Ui, có trục trặc khi tui ghi nhớ. Bạn thử lại sau nghen.";
        }
    }
}