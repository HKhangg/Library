package com.library_web.library.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.library_web.library.model.Setting;

@Repository
public interface SettingRepository extends JpaRepository<Setting, Long> {
    Setting findFirstByOrderByIdAsc();
}