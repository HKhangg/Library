package com.library_web.library.chat.tool;

import dev.langchain4j.agent.tool.Tool;
import dev.langchain4j.data.document.Metadata;
import dev.langchain4j.data.embedding.Embedding;
import dev.langchain4j.data.segment.TextSegment;
import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.model.output.Response;
import dev.langchain4j.store.embedding.EmbeddingMatch;
import dev.langchain4j.store.embedding.EmbeddingStore;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class MemoryTool {

    private static final Logger logger = LoggerFactory.getLogger(MemoryTool.class);

    @Autowired
    @Qualifier("userMemoryEmbeddingStore")
    private EmbeddingStore<TextSegment> userMemoryEmbeddingStore;

    @Autowired
    private EmbeddingModel embeddingModel;

    @Tool("Dùng công cụ này để GHI NHỚ thông tin MỚI và QUAN TRỌNG về người dùng. Cần userId và nội dung.")
    public String saveMemory(Long userId, String informationToRemember) {
        try {
            if (informationToRemember == null || informationToRemember.isBlank()) {
                return "Bạn chưa nói điều gì để tui nhớ á.";
            }
            
            String textToSave = informationToRemember.trim();

            Response<Embedding> embeddingResponse = embeddingModel.embed(textToSave);
            Embedding newEmbedding = embeddingResponse.content();

            List<EmbeddingMatch<TextSegment>> duplicates = userMemoryEmbeddingStore.findRelevant(
                newEmbedding, 
                1, 
                0.85 
            );

            boolean exists = duplicates.stream().anyMatch(match -> {
                String storedUid = match.embedded().metadata().getString("user_id");
                return storedUid != null && storedUid.equals(String.valueOf(userId));
            });

            if (exists) {
                logger.info("Memory already exists for user {}: {}", userId, textToSave);
                return "Thông tin này tui đã nhớ từ trước rồi nha, yên tâm!";
            }

            TextSegment segment = TextSegment.from(
                textToSave,
                Metadata.from("user_id", String.valueOf(userId))
            );
            userMemoryEmbeddingStore.add(newEmbedding, segment);
            
            return "Okela, tui đã ghi chú thông tin này vào bộ nhớ rồi!";

        } catch (Exception e) {
            logger.error("Error saving memory for user {}", userId, e);
            return "Ui, có trục trặc khi tui ghi nhớ. Bạn thử lại sau nghen.";
        }
    }
}