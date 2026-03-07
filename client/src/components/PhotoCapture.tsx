import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Camera, Check, Info, Upload, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { DriveRecord } from "@shared/schema";

interface PhotoCaptureProps {
  driveRecord: DriveRecord;
  capturedPhotos: Record<string, string>;
  onPhotoCaptured: (photos: Record<string, string>) => void;
}

const PHOTO_TYPES = {
  EXTERIOR: [
    { type: "exterior-front", label: "앞면" },
    { type: "exterior-back", label: "뒷면" },
    { type: "exterior-left", label: "좌측면" },
    { type: "exterior-right", label: "우측면" },
    { type: "exterior-front-left", label: "앞좌 모서리" },
    { type: "exterior-front-right", label: "앞우 모서리" },
    { type: "exterior-back-left", label: "뒤좌 모서리" },
    { type: "exterior-back-right", label: "뒤우 모서리" },
  ],
  INTERIOR: [
    { type: "interior-driver", label: "운전석" },
    { type: "interior-passenger", label: "조수석" },
  ],
};

export default function PhotoCapture({ driveRecord, capturedPhotos, onPhotoCaptured }: PhotoCaptureProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [uploadingPhoto, setUploadingPhoto] = useState<string | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const handlePhotoUpload = async (photoType: string, file: File) => {
    setUploadingPhoto(photoType);

    try {
      // Upload file
      const formData = new FormData();
      formData.append("photo", file);

      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) throw new Error("업로드 실패");
      const { photoPath } = await uploadResponse.json();

      // Save photo record
      await apiRequest("POST", "/api/vehicle-photos", {
        driveRecordId: driveRecord.id,
        photoType,
        photoPath,
      });

      queryClient.invalidateQueries({ queryKey: ["/api/drive-records", driveRecord.id, "photos"] });

      // Update local state
      const newPhotos = { ...capturedPhotos, [photoType]: photoPath };
      onPhotoCaptured(newPhotos);

      const allTypes = [...PHOTO_TYPES.EXTERIOR, ...PHOTO_TYPES.INTERIOR];
      toast({
        title: "사진 촬영 완료",
        description: `${allTypes.find(p => p.type === photoType)?.label} 사진이 저장되었습니다.`,
      });
    } catch (error) {
      console.error("Error processing photo upload:", error);
      toast({
        title: "사진 저장 실패",
        description: "사진 저장 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setUploadingPhoto(null);
    }
  };

  const totalPhotos = PHOTO_TYPES.EXTERIOR.length + PHOTO_TYPES.INTERIOR.length;
  const capturedCount = Object.keys(capturedPhotos).length;
  const progressPercentage = (capturedCount / totalPhotos) * 100;

  const PhotoSlot = ({ photoType, label, size = "normal" }: { photoType: string; label: string; size?: "normal" | "large" }) => {
    const isCaptured = capturedPhotos[photoType];
    const isUploading = uploadingPhoto === photoType;
    const baseClasses = `photo-slot ${isCaptured ? "captured" : ""}`;
    const sizeClasses = size === "large" ? "p-8" : "p-4";

    if (isCaptured) {
      return (
        <div className={`${baseClasses} ${sizeClasses}`}>
          <img
            src={capturedPhotos[photoType]}
            alt={label}
            className="w-full h-24 object-cover rounded-lg mb-2"
          />
          <div className="flex items-center justify-center gap-1">
            <Check className="w-4 h-4 text-green-500" />
            <p className={`font-medium text-green-600 ${size === "large" ? "text-base" : "text-sm"}`}>
              {label}
            </p>
          </div>
          <p className={`text-green-500 mt-1 ${size === "large" ? "text-sm" : "text-xs"} text-center`}>
            촬영 완료
          </p>
        </div>
      );
    }

    return (
      <div className={`${baseClasses} ${sizeClasses}`}>
        <input
          ref={(el) => { fileInputRefs.current[photoType] = el; }}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handlePhotoUpload(photoType, file);
          }}
        />
        <button
          className="w-full h-full flex flex-col items-center"
          onClick={() => fileInputRefs.current[photoType]?.click()}
          disabled={isUploading}
        >
          {isUploading ? (
            <Loader2 className={`text-blue-500 mb-2 animate-spin ${size === "large" ? "w-8 h-8" : "w-6 h-6"}`} />
          ) : (
            <Camera className={`text-gray-400 mb-2 ${size === "large" ? "w-8 h-8" : "w-6 h-6"}`} />
          )}
          <p className={`font-medium text-gray-600 ${size === "large" ? "text-base" : "text-sm"}`}>
            {label}
          </p>
          <p className={`text-gray-400 mt-1 ${size === "large" ? "text-sm" : "text-xs"}`}>
            {isUploading ? "업로드 중..." : "터치하여 촬영"}
          </p>
        </button>
      </div>
    );
  };

  return (
    <Card className="p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
        <Camera className="text-primary mr-2" />
        차량 상태 점검 사진
      </h2>

      {/* Photo Guidelines */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
        <div className="flex items-start space-x-3">
          <Info className="text-amber-500 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="text-sm font-medium text-amber-800 mb-1">촬영 가이드라인</h4>
            <p className="text-sm text-amber-700">
              외관 8컷 (앞, 뒤, 좌, 우, 각 모서리) + 내부 2컷 (운전석, 조수석)을 촬영해주세요.
            </p>
          </div>
        </div>
      </div>

      {/* Exterior Photos */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">외관 촬영 (8컷)</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {PHOTO_TYPES.EXTERIOR.map((photo) => (
            <PhotoSlot key={photo.type} photoType={photo.type} label={photo.label} />
          ))}
        </div>
      </div>

      {/* Interior Photos */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">내부 촬영 (2컷)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PHOTO_TYPES.INTERIOR.map((photo) => (
            <PhotoSlot key={photo.type} photoType={photo.type} label={photo.label} size="large" />
          ))}
        </div>
      </div>

      {/* Photo Progress */}
      <div className="p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="font-medium text-gray-700">촬영 진행률</span>
          <span className="text-gray-600">{capturedCount}/{totalPhotos}</span>
        </div>
        <Progress value={progressPercentage} className="w-full" />
      </div>
    </Card>
  );
}
