import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { DriveRecord, Vehicle } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Camera, Check, AlertCircle, Loader2, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ObjectUploader } from "@/components/ObjectUploader";
import type { UploadResult } from "@uppy/core";

const driveEndSchema = z.object({
  endMileage: z.number().min(1, "종료 주행거리를 입력해주세요"),
});

type DriveEndForm = z.infer<typeof driveEndSchema>;

interface DriveEndModalProps {
  driveRecord: DriveRecord | null;
  vehicle: Vehicle | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

// 필수 사진 타입 정의
const REQUIRED_PHOTOS = [
  // 외부 8곳
  { type: "exterior-front", label: "앞면", category: "외부" },
  { type: "exterior-back", label: "뒷면", category: "외부" },
  { type: "exterior-left", label: "좌측면", category: "외부" },
  { type: "exterior-right", label: "우측면", category: "외부" },
  { type: "exterior-front-left", label: "앞좌 모서리", category: "외부" },
  { type: "exterior-front-right", label: "앞우 모서리", category: "외부" },
  { type: "exterior-back-left", label: "뒤좌 모서리", category: "외부" },
  { type: "exterior-back-right", label: "뒤우 모서리", category: "외부" },
  // 실내 2곳  
  { type: "interior-driver", label: "운전석", category: "실내" },
  { type: "interior-passenger", label: "조수석", category: "실내" },
];

export default function DriveEndModal({
  driveRecord,
  vehicle,
  isOpen,
  onClose,
  onSuccess,
}: DriveEndModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [capturedPhotos, setCapturedPhotos] = useState<Record<string, string>>({});
  const [currentStep, setCurrentStep] = useState<"mileage" | "photos">("mileage");

  const form = useForm<DriveEndForm>({
    resolver: zodResolver(driveEndSchema),
    defaultValues: {
      endMileage: driveRecord?.startMileage || 0,
    },
  });

  useEffect(() => {
    if (driveRecord) {
      form.reset({
        endMileage: driveRecord.startMileage,
      });
      setCapturedPhotos({});
      setCurrentStep("mileage");
    }
  }, [driveRecord, form]);

  const endDriveMutation = useMutation({
    mutationFn: async (data: DriveEndForm) => {
      if (!driveRecord) throw new Error("운행 기록이 없습니다");
      
      const response = await fetch(`/api/drive-records/${driveRecord.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          endMileage: data.endMileage,
          endTime: new Date().toISOString(),
          status: "completed",
        }),
      });

      if (!response.ok) {
        throw new Error("운행 종료에 실패했습니다");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/drive-records"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
      
      toast({
        title: "운행 종료 완료",
        description: "운행이 성공적으로 종료되었습니다.",
      });
      
      onSuccess?.();
      onClose();
      form.reset();
      setCapturedPhotos({});
      setCurrentStep("mileage");
    },
    onError: (error) => {
      console.error("Drive end error:", error);
      toast({
        title: "운행 종료 실패",
        description: "운행 종료 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  const createVehiclePhotoMutation = useMutation({
    mutationFn: async (data: { photoType: string; photoPath: string }) => {
      const response = await fetch("/api/vehicle-photos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          driveRecordId: driveRecord?.id,
          photoType: data.photoType,
          photoPath: data.photoPath,
        }),
      });

      if (!response.ok) {
        throw new Error("사진 저장에 실패했습니다");
      }

      return response.json();
    },
  });

  const getUploadURL = async (): Promise<string> => {
    const response = await fetch("/api/objects/upload", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });
    const data = await response.json();
    return data.uploadURL;
  };

  const handlePhotoUpload = async (photoType: string) => {
    return {
      method: "PUT" as const,
      url: await getUploadURL(),
    };
  };

  const handlePhotoComplete = async (photoType: string, result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    if (result.successful && result.successful.length > 0) {
      const uploadedFile = result.successful[0];
      const uploadURL = uploadedFile.uploadURL as string;
      
      try {
        // Normalize the photo path
        const response = await fetch("/api/vehicle-photo-upload", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            photoURL: uploadURL,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          
          // Save photo to database
          await createVehiclePhotoMutation.mutateAsync({
            photoType,
            photoPath: data.objectPath,
          });

          // Update captured photos state
          setCapturedPhotos(prev => ({
            ...prev,
            [photoType]: data.objectPath,
          }));

          toast({
            title: "사진 업로드 완료",
            description: `${REQUIRED_PHOTOS.find(p => p.type === photoType)?.label} 사진이 저장되었습니다.`,
          });
        }
      } catch (error) {
        console.error("Photo processing error:", error);
        toast({
          title: "사진 처리 실패",
          description: "사진 처리 중 오류가 발생했습니다.",
          variant: "destructive",
        });
      }
    }
  };

  const onMileageSubmit = (data: DriveEndForm) => {
    if (!driveRecord || data.endMileage <= driveRecord.startMileage) {
      toast({
        title: "주행거리 오류",
        description: "종료 주행거리는 시작 주행거리보다 커야 합니다.",
        variant: "destructive",
      });
      return;
    }
    setCurrentStep("photos");
  };

  const onCompleteSubmit = () => {
    endDriveMutation.mutate(form.getValues());
  };

  const onForceComplete = () => {
    if (window.confirm(
      "⚠️ 경고: 사진을 모두 촬영하지 않고 운행을 종료하시겠습니까?\n\n" +
      "사진 촬영 없이 운행을 종료할 경우, 향후 발생할 수 있는 차량 손상이나 사고에 대한 " +
      "책임을 운전자가 져야 할 수 있습니다. 차량의 기존 상태를 증명할 수 없어 " +
      "분쟁 시 불리할 수 있습니다.\n\n" +
      "정말로 사진 없이 운행을 종료하시겠습니까?"
    )) {
      endDriveMutation.mutate(form.getValues());
    }
  };

  const completedPhotosCount = Object.keys(capturedPhotos).length;
  const totalPhotosCount = REQUIRED_PHOTOS.length;
  const progressPercentage = (completedPhotosCount / totalPhotosCount) * 100;

  const handleClose = () => {
    if (!endDriveMutation.isPending) {
      onClose();
      form.reset();
      setCapturedPhotos({});
      setCurrentStep("mileage");
    }
  };

  if (!driveRecord || !vehicle) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>운행 종료</DialogTitle>
          <DialogDescription>
            운행을 종료하기 위해 주행거리를 입력하고 차량 컨디션 사진을 촬영해주세요.
          </DialogDescription>
        </DialogHeader>

        {currentStep === "mileage" && (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onMileageSubmit)} className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-2">운행 정보</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-blue-700">차량:</span>
                    <p className="font-medium">{vehicle.model} ({vehicle.plateNumber})</p>
                  </div>
                  <div>
                    <span className="text-blue-700">시작 주행거리:</span>
                    <p className="font-medium">{driveRecord.startMileage.toLocaleString()} km</p>
                  </div>
                </div>
              </div>

              <FormField
                control={form.control}
                name="endMileage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>종료 주행거리 (km)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder={driveRecord.startMileage.toString()}
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        disabled={endDriveMutation.isPending}
                      />
                    </FormControl>
                    <FormMessage />
                    {form.watch("endMileage") > driveRecord.startMileage && (
                      <p className="text-sm text-green-600">
                        운행거리: {(form.watch("endMileage") - driveRecord.startMileage).toLocaleString()} km
                      </p>
                    )}
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={endDriveMutation.isPending}
                >
                  취소
                </Button>
                <Button
                  type="submit"
                  disabled={endDriveMutation.isPending}
                >
                  다음: 사진 촬영
                </Button>
              </div>
            </form>
          </Form>
        )}

        {currentStep === "photos" && (
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">차량 컨디션 사진 촬영</h3>
                <span className="text-sm text-gray-500">
                  {completedPhotosCount} / {totalPhotosCount} 완료
                </span>
              </div>
              <Progress value={progressPercentage} className="mb-4" />
              
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  운행 종료를 위해 외부 8곳과 실내 2곳, 총 10장의 사진을 촬영해야 합니다.
                </AlertDescription>
              </Alert>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {REQUIRED_PHOTOS.map((photo) => {
                const isCompleted = !!capturedPhotos[photo.type];
                return (
                  <div
                    key={photo.type}
                    className={`p-4 border-2 rounded-lg ${
                      isCompleted 
                        ? "border-green-200 bg-green-50" 
                        : "border-gray-200 bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-medium">{photo.label}</h4>
                        <span className="text-xs text-gray-500">{photo.category}</span>
                      </div>
                      {isCompleted ? (
                        <Check className="h-5 w-5 text-green-600" />
                      ) : (
                        <Camera className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                    
                    {!isCompleted && (
                      <ObjectUploader
                        maxNumberOfFiles={1}
                        maxFileSize={10485760}
                        onGetUploadParameters={() => handlePhotoUpload(photo.type)}
                        onComplete={(result) => handlePhotoComplete(photo.type, result)}
                        buttonClassName="w-full"
                      >
                        <Camera className="h-4 w-4 mr-2" />
                        사진 촬영
                      </ObjectUploader>
                    )}
                  </div>
                );
              })}
            </div>

            {/* 사진 없이 종료하기 위한 경고 메시지 */}
            {completedPhotosCount < totalPhotosCount && (
              <Alert className="mt-4 border-amber-200 bg-amber-50">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <AlertDescription className="text-amber-800">
                  <strong>주의:</strong> 사진을 모두 촬영하지 않고 운행을 종료할 경우, 
                  향후 차량 손상이나 사고 발생 시 책임 문제가 발생할 수 있습니다. 
                  차량 상태 증명이 어려워 분쟁 시 불리할 수 있습니다.
                </AlertDescription>
              </Alert>
            )}

            <div className="flex justify-between pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentStep("mileage")}
                disabled={endDriveMutation.isPending}
              >
                이전: 주행거리
              </Button>
              
              <div className="flex space-x-2">
                {completedPhotosCount < totalPhotosCount && (
                  <Button
                    variant="destructive"
                    onClick={onForceComplete}
                    disabled={endDriveMutation.isPending}
                  >
                    <AlertTriangle className="mr-2 h-4 w-4" />
                    사진 없이 종료
                  </Button>
                )}
                
                <Button
                  onClick={onCompleteSubmit}
                  disabled={completedPhotosCount < totalPhotosCount || endDriveMutation.isPending}
                >
                  {endDriveMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  운행 종료
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}