import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Vehicle } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
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
import { Loader2 } from "lucide-react";

const vehicleEditSchema = z.object({
  model: z.string().min(1, "차량 기종을 입력해주세요"),
  plateNumber: z.string().min(1, "차량 번호를 입력해주세요"),
  currentMileage: z.number().min(0, "주행거리는 0 이상이어야 합니다"),
});

type VehicleEditForm = z.infer<typeof vehicleEditSchema>;

interface VehicleEditModalProps {
  vehicle: Vehicle | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (updatedVehicle: Vehicle) => void;
}

export default function VehicleEditModal({
  vehicle,
  isOpen,
  onClose,
  onSuccess,
}: VehicleEditModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<VehicleEditForm>({
    resolver: zodResolver(vehicleEditSchema),
    defaultValues: {
      model: vehicle?.model || "",
      plateNumber: vehicle?.plateNumber || "",
      currentMileage: vehicle?.currentMileage || 0,
    },
  });

  // Reset form when vehicle changes
  if (vehicle && form.getValues().model !== vehicle.model) {
    form.reset({
      model: vehicle.model,
      plateNumber: vehicle.plateNumber,
      currentMileage: vehicle.currentMileage,
    });
  }

  const updateVehicleMutation = useMutation({
    mutationFn: async (data: VehicleEditForm): Promise<Vehicle> => {
      if (!vehicle) throw new Error("차량 정보가 없습니다");
      
      const response = await fetch(`/api/vehicles/${vehicle.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("차량 정보 수정에 실패했습니다");
      }

      return response.json();
    },
    onSuccess: (updatedVehicle) => {
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles", vehicle?.id] });
      
      toast({
        title: "차량 정보 수정 완료",
        description: "차량 정보가 성공적으로 수정되었습니다.",
      });
      
      onSuccess?.(updatedVehicle);
      onClose();
      form.reset();
    },
    onError: (error) => {
      console.error("Vehicle update error:", error);
      toast({
        title: "차량 정보 수정 실패",
        description: "차량 정보 수정 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: VehicleEditForm) => {
    updateVehicleMutation.mutate(data);
  };

  const handleClose = () => {
    if (!updateVehicleMutation.isPending) {
      onClose();
      form.reset();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>차량 정보 수정</DialogTitle>
          <DialogDescription>
            차량 기종, 번호, 주행거리를 수정할 수 있습니다.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="model"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>차량 기종</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="예: 그랜저 IG, 아반떼 CN7"
                      {...field}
                      disabled={updateVehicleMutation.isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="plateNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>차량 번호</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="예: 12가 3456"
                      {...field}
                      disabled={updateVehicleMutation.isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="currentMileage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>현재 주행거리 (km)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="0"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      disabled={updateVehicleMutation.isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={updateVehicleMutation.isPending}
              >
                취소
              </Button>
              <Button
                type="submit"
                disabled={updateVehicleMutation.isPending}
              >
                {updateVehicleMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                수정 완료
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}