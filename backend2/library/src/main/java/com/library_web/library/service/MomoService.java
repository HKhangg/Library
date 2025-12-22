package com.library_web.library.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.library_web.library.model.Fine;
import com.library_web.library.repository.FineRepository;
import org.apache.commons.codec.digest.HmacAlgorithms;
import org.apache.commons.codec.digest.HmacUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class MomoService {

  @Autowired
  private FineRepository fineRepo;

  @Value("${momo.partnerCode}")
  private String partnerCode;

  @Value("${momo.accessKey}")
  private String accessKey;

  @Value("${momo.secretKey}")
  private String secretKey;

  @Value("${momo.redirectUrl}")
  private String redirectUrl;

  @Value("${momo.ipnUrl}")
  private String ipnUrl;

  public ResponseEntity<?> createPaymentRequest(Long fineId) {
    try {
      Optional<Fine> optionalFine = fineRepo.findById(fineId);
      if (optionalFine.isEmpty()) {
        return ResponseEntity.status(404).body("Không tìm thấy phiếu phạt");
      }

      Fine fine = optionalFine.get();
      String requestId = UUID.randomUUID().toString();
      String orderId = UUID.randomUUID().toString();
      String requestType = "captureWallet";

      double amountDouble = fine.getSoTien();
      int amountInt = (int) Math.round(amountDouble);

      Map<String, String> rawData = new LinkedHashMap<>();
      rawData.put("accessKey", accessKey);
      rawData.put("partnerCode", partnerCode);
      rawData.put("requestId", requestId);
      rawData.put("amount", String.valueOf(amountInt));
      rawData.put("orderId", orderId);
      rawData.put("orderInfo", "Thanh toán phiếu phạt với ID: " + fineId);
      rawData.put("redirectUrl", redirectUrl);
      rawData.put("ipnUrl", ipnUrl);
      rawData.put("extraData", "");
      rawData.put("requestType", requestType);

      String rawSignature = String.format(
          "accessKey=%s&amount=%d&extraData=%s&ipnUrl=%s&orderId=%s&orderInfo=%s&partnerCode=%s&redirectUrl=%s&requestId=%s&requestType=%s",
          accessKey,
          amountInt,
          "",
          ipnUrl,
          orderId,
          "Thanh toán phiếu phạt với ID: " + fineId,
          partnerCode,
          redirectUrl,
          requestId,
          requestType);

      String signature = new HmacUtils(HmacAlgorithms.HMAC_SHA_256, secretKey)
          .hmacHex(rawSignature);

      Map<String, Object> body = new HashMap<>(rawData);
      body.put("signature", signature);
      body.put("lang", "vi");

      HttpRequest request = HttpRequest.newBuilder()
          .uri(URI.create("https://test-payment.momo.vn/v2/gateway/api/create"))
          .header("Content-Type", "application/json")
          .POST(HttpRequest.BodyPublishers.ofString(new ObjectMapper().writeValueAsString(body)))
          .build();

      HttpClient client = HttpClient.newHttpClient();
      HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

      JsonNode jsonResponse = new ObjectMapper().readTree(response.body());
      System.out.println("Response body from MoMo: " + response.body());
      if (jsonResponse.has("payUrl")) {
        fine.setOrderId(orderId);
        fineRepo.save(fine);
        return ResponseEntity.ok(jsonResponse.get("payUrl").asText());
      } else {
        return ResponseEntity.status(500).body("Không lấy được payUrl từ Momo");
      }

    } catch (Exception e) {
      return ResponseEntity.status(500).body("Lỗi khi tạo thanh toán Momo: " + e.getMessage());
    }
  }

  public ResponseEntity<?> handleIpn(Map<String, Object> payload) {
    try {
      String orderId = String.valueOf(payload.get("orderId"));
      String resultCode = String.valueOf(payload.get("resultCode"));

      if ("0".equals(resultCode)) {
        Optional<Fine> optionalFine = fineRepo.findByOrderId(orderId);
        if (optionalFine.isPresent()) {
          Fine fine = optionalFine.get();
          if (fine.getTrangThai() != Fine.TrangThai.DA_THANH_TOAN) {
            fine.setTrangThai(Fine.TrangThai.DA_THANH_TOAN);
            fine.setNgayThanhToan(LocalDateTime.now());
            fineRepo.save(fine);
          }
        }
      }
      // Trả về acknowledged để MoMo biết đã nhận IPN
      return ResponseEntity.ok("acknowledged");

    } catch (Exception e) {
      // Log lỗi để debug
      e.printStackTrace();
      return ResponseEntity.status(500).body("Lỗi khi xử lý IPN: " + e.getMessage());
    }
  }

  public ResponseEntity<?> confirmPayment(String orderId, String amountStr) {
    try {
      Optional<Fine> optionalFine = fineRepo.findByOrderId(orderId);
      if (optionalFine.isEmpty()) {
        return ResponseEntity.status(404).body("Không tìm thấy phiếu phạt với orderId: " + orderId);
      }

      Fine fine = optionalFine.get();

      int amountInt = (int) Math.round(fine.getSoTien());
      if (!String.valueOf(amountInt).equals(amountStr)) {
        return ResponseEntity.status(400).body("Số tiền không hợp lệ");
      }

      if (fine.getTrangThai() != Fine.TrangThai.DA_THANH_TOAN) {
        fine.setTrangThai(Fine.TrangThai.DA_THANH_TOAN);
        fine.setNgayThanhToan(LocalDateTime.now());
        fineRepo.save(fine);
      }

      return ResponseEntity.ok("Xác nhận thanh toán thành công");

    } catch (Exception e) {
      e.printStackTrace();
      return ResponseEntity.status(500).body("Lỗi khi xác nhận thanh toán: " + e.getMessage());
    }
  }

}