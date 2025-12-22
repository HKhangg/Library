package com.library_web.library.controller;

import com.library_web.library.service.MomoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/fine")
public class MomoPaymentController {

    @Autowired
    private MomoService momoService;

    // API tạo thanh toán: client gọi POST để lấy payUrl từ Momo
    @PostMapping("/pay-momo/{fineId}")
    public ResponseEntity<?> createMomoPayment(@PathVariable Long fineId) {
        return momoService.createPaymentRequest(fineId);
    }

    // IPN callback: Momo gửi JSON về khi người dùng thanh toán xong
    @PostMapping("/momo-ipn")
    public ResponseEntity<?> handleMomoIpn(@RequestBody Map<String, Object> payload) {
        return momoService.handleIpn(payload);
    }

    @PostMapping("/payment/confirm")
    public ResponseEntity<?> confirmPayment(@RequestBody Map<String, Object> payload) {
        String orderId = (String) payload.get("orderId");
        String amount = (String) payload.get("amount");
        return momoService.confirmPayment(orderId, amount);
    }
}