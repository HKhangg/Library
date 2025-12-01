package com.library_web.library.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.library_web.library.model.Setting;
import com.library_web.library.repository.SettingRepository;

import java.util.List;

@Service
public class SettingService {

    @Autowired
    private SettingRepository SettingRepo;

    public Setting getSetting() {
        List<Setting> all = SettingRepo.findAll();
        if (all.isEmpty()) {
            Setting defaultSetting = new Setting(5000,3,21,3,5); // default nếu chưa có
            return SettingRepo.save(defaultSetting);
        }
        return all.get(0);
    }

    public Setting updateSetting(Setting newSetting) {
        List<Setting> all = SettingRepo.findAll();
        if (all.isEmpty()) {
            return SettingRepo.save(newSetting);
        }
        Setting existing = all.get(0);
        existing.setFinePerDay(newSetting.getFinePerDay());
        existing.setWaitingToTake(newSetting.getWaitingToTake());
        existing.setBorrowDay(newSetting.getBorrowDay());
        existing.setStartToMail(newSetting.getStartToMail());
        existing.setMaxBorrowedBooks(newSetting.getMaxBorrowedBooks());
        return SettingRepo.save(existing);
    }
  
}