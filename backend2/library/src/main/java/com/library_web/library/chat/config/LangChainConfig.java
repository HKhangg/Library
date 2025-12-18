package com.library_web.library.chat.config;

import dev.langchain4j.data.document.Document;
import dev.langchain4j.data.document.DocumentSplitter;
import dev.langchain4j.data.document.parser.TextDocumentParser;
import dev.langchain4j.data.document.splitter.DocumentSplitters;
import dev.langchain4j.data.embedding.Embedding;
import dev.langchain4j.data.segment.TextSegment;
import dev.langchain4j.model.chat.ChatLanguageModel;
import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.model.googleai.GoogleAiGeminiChatModel;
import dev.langchain4j.model.googleai.GoogleAiEmbeddingModel;
import dev.langchain4j.rag.content.retriever.ContentRetriever;
import dev.langchain4j.rag.content.retriever.EmbeddingStoreContentRetriever;
import dev.langchain4j.store.embedding.EmbeddingStore;
import dev.langchain4j.store.embedding.EmbeddingStoreIngestor;
import dev.langchain4j.store.embedding.pgvector.PgVectorEmbeddingStore;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.jdbc.core.JdbcTemplate;
import com.library_web.library.model.Category;
import com.library_web.library.repository.CategoryRepository;
import com.library_web.library.model.CategoryChild;
import com.library_web.library.repository.CategoryChildRepository; 
import dev.langchain4j.data.document.Metadata;
import java.util.List;
import java.util.ArrayList;
import dev.langchain4j.memory.chat.MessageWindowChatMemory;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.nio.file.Paths;

import com.opencsv.CSVReader;
import com.opencsv.exceptions.CsvValidationException;

@Configuration
public class LangChainConfig {

    @Value("${gemini.api.key}")
    private String geminiApiKey;

    @Value("${langchain4j.embedding-store.pgvector.host}")
    private String host;
    @Value("${langchain4j.embedding-store.pgvector.port}")
    private Integer port;
    @Value("${langchain4j.embedding-store.pgvector.database}")
    private String database;
    @Value("${langchain4j.embedding-store.pgvector.username}")
    private String username;
    @Value("${langchain4j.embedding-store.pgvector.password}")
    private String password;
    @Value("${langchain4j.embedding-store.pgvector.dimension}")
    private Integer dimension;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    
    @Bean
    @Qualifier("faqEmbeddingStore")
    public EmbeddingStore<TextSegment> faqEmbeddingStore() {
        return PgVectorEmbeddingStore.builder()
                .host(host)
                .port(port)
                .database(database)
                .user(username)
                .password(password)
                .table("faq_embeddings")
                .dimension(dimension)
                .build();
    }

    @Bean
    @Qualifier("faqRetriever")
    public ContentRetriever faqRetriever(@Qualifier("faqEmbeddingStore") EmbeddingStore<TextSegment> embeddingStore,
                                         EmbeddingModel embeddingModel) {
        return EmbeddingStoreContentRetriever.builder()
                .embeddingStore(embeddingStore)
                .embeddingModel(embeddingModel)
                .maxResults(2)
                .minScore(0.6)
                .build();
    }

    @Bean
    public ApplicationRunner faqIngestor(@Qualifier("faqEmbeddingStore") EmbeddingStore<TextSegment> embeddingStore,
                                         EmbeddingModel embeddingModel, ResourceLoader resourceLoader) {
        return args -> {
            try {
                Long count = 0L;
                try {
                    count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM faq_embeddings", Long.class);
                } catch (Exception e) {
                    System.err.println("Thông báo: Bảng faq_embeddings có thể chưa tồn tại, đang tiến hành 'nhồi' dữ liệu... (Lỗi: " + e.getMessage() + ")");
                }

                if (count == null || count == 0) {
                    System.out.println("Bảng faq_embeddings đang rỗng. Bắt đầu 'nhồi' file faq.txt...");

                    Resource resource = resourceLoader.getResource("classpath:faq.txt");
                    if (!resource.exists()) {
                        System.err.println("LỖI: Không tìm thấy file faq.txt trong /resources.");
                        return;
                    }

                    TextDocumentParser parser = new TextDocumentParser();
                    Document document = parser.parse(resource.getInputStream());

                    DocumentSplitter splitter = DocumentSplitters.recursive(1000, 0);

                    EmbeddingStoreIngestor.builder()
                            .documentSplitter(splitter)
                            .embeddingStore(embeddingStore)
                            .embeddingModel(embeddingModel)
                            .build()
                            .ingest(document);

                    System.out.println("Đã 'nhồi' xong file faq.txt vào Supabase.");
                } else {
                    System.out.println("Bảng faq_embeddings đã có dữ liệu (" + count + " vector). Bỏ qua bước nhồi.");
                }
            } catch (Exception e) {
                System.err.println("LỖI khi 'nhồi' FAQ: " + e.getMessage());
                e.printStackTrace();
            }
        };
    }

    @Bean
    @Qualifier("userMemoryEmbeddingStore")
    public EmbeddingStore<TextSegment> userMemoryEmbeddingStore() {
        return PgVectorEmbeddingStore.builder()
                .host(host)
                .port(port)
                .database(database)
                .user(username)
                .password(password)
                .table("user_memories")
                .dimension(dimension)
                .build();
    }

    @Bean
    @Qualifier("userMemoryRetriever")
    public ContentRetriever userMemoryRetriever(@Qualifier("userMemoryEmbeddingStore") EmbeddingStore<TextSegment> embeddingStore,
                                                 EmbeddingModel embeddingModel) {
        return EmbeddingStoreContentRetriever.builder()
                .embeddingStore(embeddingStore)
                .embeddingModel(embeddingModel)
                .maxResults(3)
                .minScore(0.7)
                .build();
    }
    
    @Bean
    public ChatLanguageModel chatLanguageModel() { 
        return GoogleAiGeminiChatModel.builder()
                .apiKey(geminiApiKey)
                .modelName("gemini-2.5-flash")
                .maxOutputTokens(1000)
                .temperature(0.7)
                .build();
    }

    @Bean
    public EmbeddingModel embeddingModel() {
        return GoogleAiEmbeddingModel.builder()
                .apiKey(geminiApiKey)
                .modelName("text-embedding-004")
                .build();
    }

    /* @Bean
        @Qualifier("categoryEmbeddingStore") 
        public EmbeddingStore<TextSegment> categoryEmbeddingStore() {
            return PgVectorEmbeddingStore.builder()
                    .host(host)
                    .port(port)
                    .database(database)
                    .user(username)
                    .password(password)
                    .table("category_embeddings") 
                    .dimension(dimension)
                    .build();
    }
    

    @Bean
    @Qualifier("categoryRetriever") 
    public ContentRetriever categoryRetriever(
            @Qualifier("categoryEmbeddingStore") EmbeddingStore<TextSegment> categoryEmbeddingStore, 
            EmbeddingModel embeddingModel) {
        return EmbeddingStoreContentRetriever.builder()
                .embeddingStore(categoryEmbeddingStore)
                .embeddingModel(embeddingModel)
                .maxResults(5) 
                .minScore(0.65) 
                .build();
    }


    @Bean
    public ApplicationRunner categoryIngestor(
            @Qualifier("categoryEmbeddingStore") EmbeddingStore<TextSegment> categoryEmbeddingStore,
            EmbeddingModel embeddingModel,
            CategoryRepository categoryRepository, 
            CategoryChildRepository categoryChildRepository, 
            JdbcTemplate jdbcTemplate) {

        return args -> {
            try {
                Long count = 0L;
                try {
                    count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM category_embeddings", Long.class);
                } catch (Exception e) {
                    System.err.println("Thông báo: Bảng category_embeddings có thể chưa tồn tại hoặc bị lỗi, đang kiểm tra/nhồi dữ liệu... (Lỗi: " + e.getMessage() + ")");
                }

                if (count == null || count == 0) {
                    System.out.println("Bảng category_embeddings đang rỗng. Bắt đầu tạo embedding cho các thể loại sách (cha và con)...");

                    List<TextSegment> allCategorySegments = new ArrayList<>();
                    List<Category> allParents = categoryRepository.findAll();
                    if (!allParents.isEmpty()) {
                        List<TextSegment> parentSegments = allParents.stream()
                            .filter(cat -> cat.getName() != null && !cat.getName().trim().isEmpty())
                            .map(cat -> {
                                TextSegment segment = TextSegment.from(cat.getName());

                                segment.metadata().add("category_id", String.valueOf(cat.getId())); 
                                segment.metadata().add("category_name", cat.getName());
                                segment.metadata().add("type", "parent"); 
                                return segment;
                            })
                            .toList();
                        allCategorySegments.addAll(parentSegments);
                        System.out.println("Đã chuẩn bị " + parentSegments.size() + " thể loại cha.");
                    } else {
                        System.err.println("LƯU Ý: Không tìm thấy thể loại cha nào.");
                    }

                    List<CategoryChild> allChildren = categoryChildRepository.findAll();
                    if (!allChildren.isEmpty()) {
                         List<TextSegment> childSegments = allChildren.stream()
                            .filter(cat -> cat.getName() != null && !cat.getName().trim().isEmpty())
                            .map(cat -> {
                                TextSegment segment = TextSegment.from(cat.getName());
                                segment.metadata().add("category_child_id", cat.getId());
                                segment.metadata().add("category_name", cat.getName());
                                if (cat.getParent() != null) {
                                     segment.metadata().add("parent_category_id", String.valueOf(cat.getParent().getId()));
                                }
                                segment.metadata().add("type", "child"); 
                                return segment;
                            })
                            .toList();
                        allCategorySegments.addAll(childSegments);
                        System.out.println("Đã chuẩn bị " + childSegments.size() + " thể loại con.");
                    } else {
                         System.err.println("LƯU Ý: Không tìm thấy thể loại con nào.");
                    }

                    if (allCategorySegments.isEmpty()) {
                        System.err.println("KHÔNG CÓ THỂ LOẠI NÀO để tạo embedding.");
                        return;
                    }

                    List<Embedding> embeddings = embeddingModel.embedAll(allCategorySegments).content();
                    categoryEmbeddingStore.addAll(embeddings, allCategorySegments);

                    System.out.println("Đã tạo và lưu embedding cho " + allCategorySegments.size() + " thể loại (cha và con) vào Supabase.");
                } else {
                    System.out.println("Bảng category_embeddings đã có dữ liệu (" + count + " vector). Bỏ qua bước nhồi.");
                }
            } catch (Exception e) {
                System.err.println("LỖI nghiêm trọng khi nhồi embedding cho thể loại: " + e.getMessage());
                e.printStackTrace();
            }
        };
    } */

// PHẦN NI LÀ CỦA THỂ LOẠI!!!
    @Bean
    @Qualifier("categoryEmbeddingStore2")
    public EmbeddingStore<TextSegment> categoryEmbeddingStore2() {
        return PgVectorEmbeddingStore.builder()
                .host(host)
                .port(port)
                .database(database)
                .user(username)
                .password(password)
                .table("category_embeddings_v2")
                .dimension(dimension)
                .build();
    }
    @Bean
    @Qualifier("categoryRetriever2")
    public ContentRetriever categoryRetriever2(@Qualifier("categoryEmbeddingStore2") EmbeddingStore<TextSegment> embeddingStore,
                                              EmbeddingModel embeddingModel) {
        return EmbeddingStoreContentRetriever.builder()
                .embeddingStore(embeddingStore).embeddingModel(embeddingModel)
                .maxResults(3).minScore(0.6)
                .build();
    }

    
    @Bean
    public ApplicationRunner categoryIngestor2(@Qualifier("categoryEmbeddingStore2") EmbeddingStore<TextSegment> embeddingStore,
                                              EmbeddingModel embeddingModel, ResourceLoader resourceLoader) {
        return args -> {
            try {
                Long count = 0L;
                try {
                    count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM category_embeddings_v2", Long.class);
                } catch (Exception e) {
                    System.err.println("Thông báo: Bảng category_embeddings_v2 có thể chưa tồn tại, đang kiểm tra/nhồi dữ liệu... (Lỗi: " + e.getMessage() + ")");
                }

                if (count == null || count == 0) {
                    System.out.println("Bảng category_embeddings_v2 đang rỗng. Bắt đầu 'nhồi' file categories_rag_data.csv...");
                    Resource resource = resourceLoader.getResource("classpath:categories_rag_data.csv");
                    if (!resource.exists()) { System.err.println("LỖI: Không tìm thấy file 'categories_rag_data.csv' trong /resources."); return; }
                    List<TextSegment> allSegments = new ArrayList<>();
                    try (InputStream is = resource.getInputStream();
                         BufferedReader reader = new BufferedReader(new InputStreamReader(is, StandardCharsets.UTF_8));
                         CSVReader csvReader = new CSVReader(reader)) {
                        String[] headers = csvReader.readNext();
                        if (headers == null) { System.err.println("LỖI: File categories_rag_data.csv bị rỗng."); return; }
                        int idIdx = findColumn(headers, "id");
                        int nameIdx = findColumn(headers, "name");
                        int typeIdx = findColumn(headers, "type");
                        int descIdx = findColumn(headers, "description");
                        int keysIdx = findColumn(headers, "keywords");
                        String[] line;
                        while ((line = csvReader.readNext()) != null) {
                            try {
                                String id = line[idIdx]; String name = line[nameIdx]; String type = line[typeIdx];
                                String description = line[descIdx]; String keywords = line[keysIdx];
                                String textForEmbedding = description + ". Từ khóa liên quan: " + keywords;
                                TextSegment segment = TextSegment.from(textForEmbedding);
                                segment.metadata().add("id", id); segment.metadata().add("name", name); segment.metadata().add("type", type);
                                allSegments.add(segment);
                            } catch (Exception e) { System.err.println("Lỗi khi xử lý dòng CSV thể loại: " + String.join(",", line) + " - " + e.getMessage()); }
                        }
                    } catch (IOException | CsvValidationException e) { System.err.println("Lỗi nghiêm trọng khi đọc file categories_rag_data.csv: " + e.getMessage()); e.printStackTrace(); return; }
                    if (allSegments.isEmpty()) { System.err.println("KHÔNG CÓ THỂ LOẠI NÀO (V2) để tạo embedding."); return; }
                    List<Embedding> embeddings = embeddingModel.embedAll(allSegments).content();
                    embeddingStore.addAll(embeddings, allSegments);
                    System.out.println("Đã tạo và lưu embedding cho " + allSegments.size() + " thể loại (V2 từ CSV) vào Supabase.");
                } else { System.out.println("Bảng category_embeddings_v2 đã có dữ liệu (" + count + " vector). Bỏ qua bước nhồi."); }
            } catch (Exception e) { System.err.println("LỖI nghiêm trọng khi nhồi embedding cho thể loại (V2): " + e.getMessage()); e.printStackTrace(); }
        };
    }

    // NI LÀ CỦA BOOK:
    @Bean
    @Qualifier("bookEmbeddingStore")
    public EmbeddingStore<TextSegment> bookEmbeddingStore() {
       return PgVectorEmbeddingStore.builder()
                .host(host)
                .port(port)
                .database(database)
                .user(username)
                .password(password)
                .table("book_embeddings")
                .dimension(dimension)
                .build();
    }
    @Bean
     @Qualifier("bookRetriever")
     public ContentRetriever bookRetriever(@Qualifier("bookEmbeddingStore") EmbeddingStore<TextSegment> embeddingStore,
                                           EmbeddingModel embeddingModel) {
         return EmbeddingStoreContentRetriever.builder()
                 .embeddingStore(embeddingStore).embeddingModel(embeddingModel)
                 .maxResults(5).minScore(0.65)
                 .build();
     }

     @Bean
     public ApplicationRunner bookIngestor(@Qualifier("bookEmbeddingStore") EmbeddingStore<TextSegment> embeddingStore,
                                           EmbeddingModel embeddingModel, ResourceLoader resourceLoader) {
         return args -> {
             try {
                 Long count = 0L;
                 try {
                     count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM book_embeddings", Long.class);
                 } catch (Exception e) {
                     System.err.println("Thông báo: Bảng book_embeddings có thể chưa tồn tại, đang kiểm tra/nhồi dữ liệu... (Lỗi: " + e.getMessage() + ")");
                 }

                 if (count == null || count == 0) {
                     System.out.println("Bảng book_embeddings đang rỗng. Bắt đầu 'nhồi' file books_rag_data.csv...");
                     Resource resource = resourceLoader.getResource("classpath:books_rag_data.csv");
                     if (!resource.exists()) { System.err.println("LỖI: Không tìm thấy file 'books_rag_data.csv' trong /resources."); return; }
                     List<TextSegment> allSegments = new ArrayList<>();
                     try (InputStream is = resource.getInputStream();
                          BufferedReader reader = new BufferedReader(new InputStreamReader(is, StandardCharsets.UTF_8));
                          CSVReader csvReader = new CSVReader(reader)) {
                         String[] headers = csvReader.readNext();
                         if (headers == null) { System.err.println("LỖI: File books_rag_data.csv bị rỗng."); return; }
                         int idIdx = findColumn(headers, "ma_sach");
                         int nameIdx = findColumn(headers, "ten_sach");
                         int embedTextIdx = findColumn(headers, "text_for_embedding");
                         String[] line;
                         while ((line = csvReader.readNext()) != null) {
                             try {
                                 String maSach = line[idIdx]; String tenSach = line[nameIdx]; String textForEmbedding = line[embedTextIdx];
                                 TextSegment segment = TextSegment.from(textForEmbedding);
                                 segment.metadata().add("ma_sach", maSach); segment.metadata().add("ten_sach", tenSach);
                                 allSegments.add(segment);
                             } catch (ArrayIndexOutOfBoundsException e) { System.err.println("Lỗi dòng CSV sách không đủ cột: " + String.join(",", line)); }
                               catch (Exception e) { System.err.println("Lỗi khi xử lý dòng CSV sách: " + String.join(",", line) + " - " + e.getMessage()); }
                         }
                     } catch (IOException | CsvValidationException e) { System.err.println("Lỗi nghiêm trọng khi đọc file books_rag_data.csv: " + e.getMessage()); e.printStackTrace(); return; }
                     if (allSegments.isEmpty()) { System.err.println("KHÔNG CÓ SÁCH NÀO để tạo embedding."); return; }
                     int batchSize = 50;
                     for (int i = 0; i < allSegments.size(); i += batchSize) {
                         List<TextSegment> batch = allSegments.subList(i, Math.min(i + batchSize, allSegments.size()));
                         if (!batch.isEmpty()) {
                             System.out.println("Đang nhồi lô sách từ " + i + " đến " + (i + batch.size() - 1));
                             List<Embedding> embeddings = embeddingModel.embedAll(batch).content();
                             embeddingStore.addAll(embeddings, batch);
                         }
                     }
                     System.out.println("Đã tạo và lưu embedding cho " + allSegments.size() + " sách (từ file CSV) vào Supabase.");
                 } else { System.out.println("Bảng book_embeddings đã có dữ liệu (" + count + " vector). Bỏ qua bước nhồi sách."); }
             } catch (Exception e) { System.err.println("LỖI nghiêm trọng khi nhồi embedding cho sách: " + e.getMessage()); e.printStackTrace(); }
         };
     }

private int findColumn(String[] headers, String columnName) {
        if (headers == null) {
             throw new RuntimeException("Headers của file CSV bị null.");
        }
        for (int i = 0; i < headers.length; i++) {
             String header = headers[i].trim();
             if (i == 0 && header.startsWith("\uFEFF")) {
                header = header.substring(1);
             }
            if (header.equalsIgnoreCase(columnName)) {
                return i;
            }
        }
        throw new RuntimeException("Không tìm thấy cột bắt buộc '" + columnName + "' trong file CSV. Các cột tìm thấy là: " + String.join(", ", headers));
    }

}
