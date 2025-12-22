package com.library_web.library.chat.repository;

import com.library_web.library.chat.model.ChatMessage;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    List<ChatMessage> findByUser_IdOrderByTimestampAsc(Long userId);
    List<ChatMessage> findByUser_IdOrderByTimestampDesc(Long userId, Pageable pageable);

    Optional<ChatMessage> findTopByUser_IdOrderByTimestampDesc(Long userId);
    @Transactional
    @Modifying
    @Query("DELETE FROM ChatMessage c WHERE c.user.id = :userId")
    void deleteByUser_Id(Long userId);
    @Transactional
    @Modifying
    void deleteAllByTimestampBefore(LocalDateTime cutoff);
}