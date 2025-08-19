import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Camera, Check, Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ObjectUploader } from "@/components/ObjectUploader";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { DriveRecord } from "@shared/schema";
import type { UploadResult } from "@uppy/core";

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

  const createVehiclePhotoMutation = useMutation({
    mutationFn: async (data: { photoType: string; photoPath: string }) => {
      const response = await apiRequest("POST", "/api/vehicle-photos", {
        driveRecordId: driveRecord.id,
        photoType: data.photoType,
        photoPath: data.photoPath,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/drive-records", driveRecord.id, "photos"] });
    },
  });

  const handlePhotoCapture = async (photoType: string) => {
    return {
      method: "PUT" as const,
      url: await getUploadURL(),
    };
  };

  const getUploadURL = async (): Promise<string> => {
    const response = await apiRequest("POST", "/api/objects/upload", {});
    const data = await response.json();
    return data.uploadURL;
  };

  const handleUploadComplete = async (photoType: string, result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    if (result.successful && result.successful.length > 0) {
      const uploadedFile = result.successful[0];
      const uploadURL = uploadedFile.uploadURL as string;
      
      try {
        // Normalize the photo path
        const response = await apiRequest("PUT", "/api/vehicle-photo-upload", {
          photoURL: uploadURL,
        });
        const data = await response.json();
        
        // Save to database
        await createVehiclePhotoMutation.mutateAsync({
          photoType,
          photoPath: data.objectPath,
        });

        // Update local state
        const newPhotos = { ...capturedPhotos, [photoType]: data.objectPath };
        onPhotoCaptured(newPhotos);
        
        toast({
          title: "사진 촬영 완료",
          description: `${PHOTO_TYPES.EXTERIOR.find(p => p.type === photoType)?.label || PHOTO_TYPES.INTERIOR.find(p => p.type === photoType)?.label} 사진이 저장되었습니다.`,
        });
      } catch (error) {
        console.error("Error processing photo upload:", error);
        toast({
          title: "사진 저장 실패",
          description: "사진 저장 중 오류가 발생했습니다.",
          variant: "destructive",
        });
      }
    }
  };

  const totalPhotos = PHOTO_TYPES.EXTERIOR.length + PHOTO_TYPES.INTERIOR.length;
  const capturedCount = Object.keys(capturedPhotos).length;
  const progressPercentage = (capturedCount / totalPhotos) * 100;

  const PhotoSlot = ({ photoType, label, size = "normal" }: { photoType: string; label: string; size?: "normal" | "large" }) => {
    const isCaptured = capturedPhotos[photoType];
    const baseClasses = `photo-slot ${isCaptured ? "captured" : ""}`;
    const sizeClasses = size === "large" ? "p-8" : "p-4";

    if (isCaptured) {
      return (
        <div className={`${baseClasses} ${sizeClasses}`}>
          <Check className={`text-green-500 mb-2 ${size === "large" ? "text-3xl" : "text-2xl"} mx-auto`} />
          <p className={`font-medium text-green-600 ${size === "large" ? "text-base" : "text-sm"}`}>
            {label}
          </p>
          <p className={`text-green-500 mt-${size === "large" ? "2" : "1"} ${size === "large" ? "text-sm" : "text-xs"}`}>
            촬영 완료
          </p>
        </div>
      );
    }

    return (
      <ObjectUploader
        maxNumberOfFiles={1}
        maxFileSize={10 * 1024 * 1024} // 10MB
        onGetUploadParameters={() => handlePhotoCapture(photoType)}
        onComplete={(result) => handleUploadComplete(photoType, result)}
        buttonClassName={`${baseClasses} ${sizeClasses} w-full h-full border-none p-0 bg-transparent hover:bg-transparent`}
      >
        <div className="flex flex-col items-center">
          <Camera className={`text-gray-400 mb-2 ${size === "large" ? "text-3xl" : "text-2xl"}`} />
          <p className={`font-medium text-gray-600 ${size === "large" ? "text-base" : "text-sm"}`}>
            {label}
          </p>
          <p className={`text-gray-400 mt-${size === "large" ? "2" : "1"} ${size === "large" ? "text-sm" : "text-xs"}`}>
            터치하여 촬영
          </p>
        </div>
      </ObjectUploader>
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
