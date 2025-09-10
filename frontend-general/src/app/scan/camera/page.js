"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import { getCroppedImg } from "../../../lib/utils";
import { Button } from "../../components/ui/button";
import { Camera, Check } from "lucide-react";

export default function CameraPage() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [imageSrc, setImageSrc] = useState(null);
  const [hasPhoto, setHasPhoto] = useState(false);
  const [aspect, setAspect] = useState(4 / 3); // mặc định 4:3
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const aspectOptions = [
    { label: "4:3", value: 4 / 3 },
    { label: "16:9", value: 16 / 9 },
    { label: "1:1", value: 1 },
  ];

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "user" } })
      .then((stream) => {
        if (videoRef.current) videoRef.current.srcObject = stream;
      });
  }, []);

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      ctx.drawImage(videoRef.current, 0, 0);
      const dataUrl = canvasRef.current.toDataURL("image/png");
      setImageSrc(dataUrl);
      setHasPhoto(true);
    }
  };

  const onCropComplete = useCallback((_, croppedArea) => {
    setCroppedAreaPixels(croppedArea);
  }, []);

  const completeCrop = async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
    window.opener?.postMessage({ type: "captured-image", image: croppedImage }, window.origin);
    window.close();
  };

  return (
    <div className="p-4 min-h-screen bg-[#EFF3FB]">
      {!hasPhoto ? (
        <div className="relative">
          <video ref={videoRef} autoPlay className="w-full h-[90%] rounded" />
          <Button onClick={takePhoto} className="absolute bottom-4 left-1/2 -translate-x-1/2 w-16 h-16 bg-red-500 rounded-full shadow-lg border-4 border-white">
          <Camera color="white" />
          </Button>
        </div>
      ) : (
        <>
        {/*Tỉ lệ*/}
        <div className="flex items-center h-5 space-x-5">
        <label className="block text-sm mb-1 text-gray-700 font-semibold">Tỉ lệ:</label>
        <select
          className="mt-2 border rounded px-2 py-1"
          onChange={(e) => {
          const val = e.target.value;
          setAspect(val === "null" ? null : Number(val));
          }}>
          {aspectOptions.map((opt) => (
          <option key={opt.label} value={opt.value}>
            {opt.label}
          </option>
          ))}
        </select>
        </div>
        {/*Thanh zoom*/}
        <div className="mt-4">
        <label className="block text-sm mb-1 font-semibold text-gray-700">Thu phóng:</label>
        <input
        type="range"
        min={1}
        max={3}
        step={0.1}
        value={zoom}
        onChange={(e) => setZoom(e.target.value)}
        className="w-full"
        />
        </div>
          <p className="text-sm text-gray-500 mb-2 text-[#062D76]">👉 Gợi ý: Cắt ảnh theo vùng chứa mã vạch</p>
          <div className="relative w-full h-[400px]">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={aspect}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          </div>
          <Button onClick={completeCrop} className="mt-4 bg-blue-600 text-white px-4 py-2 rounded absolute right-5 bg-[#062D76]">
            <Check className="w-12 h-12"/>
            Hoàn tất
          </Button>
        </>
      )}
      <canvas ref={canvasRef} hidden />
    </div>
  );
}
