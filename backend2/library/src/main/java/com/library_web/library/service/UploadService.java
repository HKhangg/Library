package com.library_web.library.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.google.zxing.*;
import com.google.zxing.client.j2se.BufferedImageLuminanceSource;
import com.google.zxing.common.HybridBinarizer;
import com.library_web.library.model.BookChild;
import com.library_web.library.model.User;
import org.opencv.core.*;
import org.opencv.imgcodecs.Imgcodecs;
import org.opencv.imgproc.Imgproc;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.*;
import java.util.*;

@Service
public class UploadService {

@Autowired
  private Cloudinary cloudinary;

  public ResponseEntity<?> uploadImages(MultipartFile[] files) {
    try {
      List<String> urls = new ArrayList<>();

      for (MultipartFile file : files) {
        System.out.println("==> Received:");
        System.out.println("Name: " + file.getOriginalFilename());
        System.out.println("Size: " + file.getSize() + " bytes");

        @SuppressWarnings("unchecked")
        Map<String, Object> uploadResult = (Map<String, Object>) cloudinary.uploader()
            .upload(file.getBytes(), ObjectUtils.emptyMap());

        urls.add((String) uploadResult.get("secure_url"));
      }

      return ResponseEntity.ok(urls);
    } catch (IOException e) {
      return ResponseEntity.badRequest().body(Map.of("error", "Lỗi upload ảnh: " + e.getMessage()));
    }
  }

    public ResponseEntity<?> uploadBarcode(MultipartFile file, String type) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Không có tệp được chọn"));
        }

        try {
            BufferedImage bufferedImage = ImageIO.read(file.getInputStream());
            BinaryBitmap bitmap = new BinaryBitmap(new HybridBinarizer(
                    new BufferedImageLuminanceSource(bufferedImage)));
            Map<DecodeHintType, Object> hints = Map.of(
                    DecodeHintType.POSSIBLE_FORMATS,
                    List.of(BarcodeFormat.CODE_128, BarcodeFormat.CODE_39, BarcodeFormat.QR_CODE));

            try {
                Result result = new MultiFormatReader().decode(bitmap, hints);
                return handleDecodedResult(result.getText(), type);
            } catch (NotFoundException e) {
                return tryWithOpenCV(file, type);
            }

        } catch (IOException e) {
            return ResponseEntity.status(500).body(Map.of("error", "Lỗi xử lý ảnh: " + e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Lỗi không xác định: " + e.getMessage()));
        }
    }

    private ResponseEntity<?> tryWithOpenCV(MultipartFile file, String type) {
        try {
            File tempFile = File.createTempFile("upload-", ".tmp");
            file.transferTo(tempFile);
            Mat original = Imgcodecs.imread(tempFile.getAbsolutePath(), Imgcodecs.IMREAD_COLOR);
            tempFile.delete();

            if (original.empty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Không thể đọc ảnh."));
            }

            Mat gray = new Mat();
            Imgproc.cvtColor(original, gray, Imgproc.COLOR_BGR2GRAY);

            int[][] thresholds = {
                    { 10, 50 }, { 30, 70 }, { 50, 100 }, { 100, 200 }, { 200, 400 },
                    { 300, 700 }, { 500, 1000 }, { 700, 1500 }, { 1000, 2000 }
            };

            for (int[] threshold : thresholds) {
                try {
                    Mat grayCopy = gray.clone();
                    Mat edged = new Mat();
                    Imgproc.Canny(grayCopy, edged, threshold[0], threshold[1]);

                    Mat kernel = Imgproc.getStructuringElement(Imgproc.MORPH_RECT, new Size(21, 7));
                    Imgproc.morphologyEx(edged, edged, Imgproc.MORPH_CLOSE, kernel);

                    List<MatOfPoint> contours = new ArrayList<>();
                    Mat hierarchy = new Mat();
                    Imgproc.findContours(edged, contours, hierarchy, Imgproc.RETR_EXTERNAL,
                            Imgproc.CHAIN_APPROX_SIMPLE);

                    Rect bestRect = null;
                    double maxArea = 0;
                    for (MatOfPoint contour : contours) {
                        Rect rect = Imgproc.boundingRect(contour);
                        if (rect.area() > maxArea && rect.area() > 1000) {
                            bestRect = rect;
                            maxArea = rect.area();
                        }
                    }

                    if (bestRect == null)
                        continue;

                    Mat cropped = new Mat(original, bestRect);
                    MatOfByte buffer = new MatOfByte();
                    Imgcodecs.imencode(".png", cropped, buffer);
                    BufferedImage bufferedImage = ImageIO.read(new ByteArrayInputStream(buffer.toArray()));

                    BinaryBitmap bitmap = new BinaryBitmap(new HybridBinarizer(
                            new BufferedImageLuminanceSource(bufferedImage)));
                    Map<DecodeHintType, Object> hints = Map.of(
                            DecodeHintType.POSSIBLE_FORMATS,
                            List.of(BarcodeFormat.CODE_128, BarcodeFormat.CODE_39, BarcodeFormat.QR_CODE));

                    Result result = new MultiFormatReader().decode(bitmap, hints);
                    return handleDecodedResult(result.getText(), type);

                } catch (NotFoundException ignored) {
                }
            }

            return ResponseEntity.badRequest().body(Map.of("error", "Không tìm thấy mã barcode."));

        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Lỗi OpenCV: " + e.getMessage()));
        }
    }

    private ResponseEntity<?> handleDecodedResult(String decodedText, String type) {
        if (!decodedText.matches("^[a-fA-F0-9]{24}$")) {
            return ResponseEntity.badRequest().body(Map.of("error", "Mã không hợp lệ", "raw", decodedText));
        }

        try {
            RestTemplate restTemplate = new RestTemplate();

            if (type.equals("book")) {
                String apiUrl = "http://localhost:8080/api/bookchild/" + decodedText;
                ResponseEntity<BookChild> response = restTemplate.getForEntity(apiUrl, BookChild.class);
                if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
                    return ResponseEntity.status(404).body(Map.of("error", "Không tìm thấy sách con"));
                }

                BookChild child = response.getBody();
                Map<String, Object> parentBook = null;

                if (child != null && child.getBook() != null) {
                    String parentUrl = "http://localhost:8080/api/book/" + child.getBook();
                    ResponseEntity<Map<String, Object>> parentResponse = restTemplate.exchange(
                            parentUrl,
                            HttpMethod.GET,
                            null,
                            new ParameterizedTypeReference<>() {
                            });
                    parentBook = parentResponse.getBody();
                }

                return ResponseEntity.ok(Map.of("childBook", child, "parentBook", parentBook));
            } else {
                String apiUrl = "http://localhost:8080/api/user/" + decodedText;
                ResponseEntity<User> response = restTemplate.getForEntity(apiUrl, User.class);
                return ResponseEntity.ok(response.getBody());
            }

        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Lỗi truy vấn API: " + e.getMessage()));
        }
    }

   
}