package com.library_web.library.controller;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;


import com.library_web.library.model.Fine;
import com.library_web.library.service.FineService;

@RestController
@RequestMapping("/api")
@CrossOrigin
public class FineController {

    @Autowired
    private FineService fineService;

    @PostMapping("/addFine")
    public Fine addFine(@RequestBody Fine fine) {
        return fineService.addFine(fine);
    }

    @GetMapping("/fines")
    public List<Fine> getAllFines() {
        return fineService.getAllFines();
    }

    @GetMapping("/fine/{id}")
    public Map<String, Object> getById(@PathVariable Long id) {
        return fineService.getById(id);
    }

    @PutMapping("/fine/pay/{id}")
    public ResponseEntity<?> thanhToan(@PathVariable Long id) {
        String result = fineService.thanhToan(id);
        return result != "ok" ? ResponseEntity.ok(result) : ResponseEntity.badRequest().body(result);
    }

    // Lấy phiếu phạt của người dùng dựa trên userId
    @GetMapping("/fines/{userId}")
    public List<Fine> getFinesByUserId(@PathVariable long userId) {
        // Giả sử bạn có một phương thức trong FineService để lấy phiếu phạt theo userId
        return fineService.getFinesByUserId(userId);
    }

}