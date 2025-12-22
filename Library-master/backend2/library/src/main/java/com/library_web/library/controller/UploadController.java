  package com.library_web.library.controller;
  import org.springframework.http.MediaType;
  import com.library_web.library.service.UploadService;
  import org.springframework.beans.factory.annotation.Autowired;
  import org.springframework.http.ResponseEntity;
  import org.springframework.web.bind.annotation.*;
  import org.springframework.web.multipart.MultipartFile;

  @RestController
  @RequestMapping("/api/upload")
  public class UploadController {

    @Autowired
    private UploadService uploadService;

    @PostMapping("/barcodeImage")
    public ResponseEntity<?> uploadBarcodeImage(@RequestParam("file") MultipartFile file,
        @RequestParam("type") String type) {
      return uploadService.uploadBarcode(file, type);
    }

    @PostMapping("/image")
    public ResponseEntity<?> uploadImages(@RequestParam("files") MultipartFile[] files) {
      return uploadService.uploadImages(files);
    }


  }