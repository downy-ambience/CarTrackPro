import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Wrench, Droplet, AlertTriangle, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Vehicle, MaintenanceRecord } from "@shared/schema";

const maintenanceFormSchema = z.object({
  type: z.string().min(1, "정비 유형을 선택해주세요"),
  description: z.string().min(1, "상세 내용을 입력해주세요"),
  cost: z.number().min(0, "비용을 입력해주세요"),
  mileageAtService: z.number().min(0, "서비스 시 주행거리를 입력해주세요"),
  serviceDate: z.string().min(1, "서비스 날짜를 입력해주세요"),
  nextServiceDate: z.string().optional(),
});

type MaintenanceFormData = z.infer<typeof maintenanceFormSchema>;

interface MaintenanceSectionProps {
  vehicle: Vehicle;
}

export default function MaintenanceSection({ vehicle }: MaintenanceSectionProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: maintenanceRecords } = useQuery<MaintenanceRecord[]>({
    queryKey: ["/api/vehicles", vehicle.id, "maintenance"],
  });

  const form = useForm<MaintenanceFormData>({
    resolver: zodResolver(maintenanceFormSchema),
    defaultValues: {
      type: "",
      description: "",
      cost: 0,
      mileageAtService: vehicle.currentMileage,
      serviceDate: new Date().toISOString().split('T')[0],
      nextServiceDate: "",
    },
  });

  const createMaintenanceRecordMutation = useMutation({
    mutationFn: async (data: MaintenanceFormData) => {
      const payload = {
        ...data,
        vehicleId: vehicle.id,
        serviceDate: new Date(data.serviceDate).toISOString(),
        nextServiceDate: data.nextServiceDate ? new Date(data.nextServiceDate).toISOString() : undefined,
      };
      
      const response = await apiRequest("POST", "/api/maintenance-records", payload);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles", vehicle.id, "maintenance"] });
      form.reset();
      setDialogOpen(false);
      toast({
        title: "정비 기록이 등록되었습니다",
        description: "슬랙 채널에 알림이 전송되었습니다.",
      });
    },
    onError: () => {
      toast({
        title: "오류 발생",
        description: "정비 기록 등록에 실패했습니다.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: MaintenanceFormData) => {
    createMaintenanceRecordMutation.mutate(data);
  };

  // Get the latest oil change record
  const latestOilChange = maintenanceRecords?.find(record => record.type === "oil_change");
  const oilChangeDaysRemaining = latestOilChange?.nextServiceDate 
    ? Math.ceil((new Date(latestOilChange.nextServiceDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Oil Change Record */}
      <Card className="p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
          <Droplet className="text-amber-500 mr-2" />
          엔진오일 교체 기록
        </h3>
        
        <div className="space-y-4">
          {latestOilChange ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">마지막 교체일</label>
                <div className="text-gray-900">{new Date(latestOilChange.serviceDate).toLocaleDateString('ko-KR')}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">교체 시 주행거리 (km)</label>
                <div className="text-gray-900">{latestOilChange.mileageAtService?.toLocaleString()}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">다음 교체 예정일</label>
                <div className="text-gray-900">
                  {latestOilChange.nextServiceDate 
                    ? new Date(latestOilChange.nextServiceDate).toLocaleDateString('ko-KR')
                    : "미정"}
                </div>
              </div>
            </>
          ) : (
            <div className="text-gray-500 text-center py-4">
              엔진오일 교체 기록이 없습니다.
            </div>
          )}
        </div>
        
        {/* Oil Change Alert */}
        {oilChangeDaysRemaining !== null && (
          <div className={`mt-4 p-3 rounded-lg ${oilChangeDaysRemaining <= 7 ? "bg-red-50 border border-red-200" : "bg-amber-50 border border-amber-200"}`}>
            <div className="flex items-center space-x-2">
              <AlertTriangle className={oilChangeDaysRemaining <= 7 ? "text-red-500" : "text-amber-500"} />
              <span className={`text-sm font-medium ${oilChangeDaysRemaining <= 7 ? "text-red-800" : "text-amber-800"}`}>
                {oilChangeDaysRemaining <= 0 
                  ? "교체 시기가 지났습니다" 
                  : `교체 예정: ${oilChangeDaysRemaining}일 후`}
              </span>
            </div>
          </div>
        )}
      </Card>

      {/* Vehicle Updates */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900 flex items-center">
            <Wrench className="text-blue-500 mr-2" />
            차량 정비 기록
          </h3>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-1" />
                기록 추가
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>정비 기록 추가</DialogTitle>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>정비 유형</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="정비 유형 선택" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="oil_change">오일 교체</SelectItem>
                            <SelectItem value="inspection">정기 점검</SelectItem>
                            <SelectItem value="repair">수리</SelectItem>
                            <SelectItem value="parts_replacement">부품 교체</SelectItem>
                            <SelectItem value="wash">세차</SelectItem>
                            <SelectItem value="other">기타</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>상세 내용</FormLabel>
                        <FormControl>
                          <Textarea {...field} placeholder="정비 내용을 상세히 입력하세요..." />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="cost"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>비용 (원)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              {...field} 
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="mileageAtService"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>서비스 시 주행거리</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              {...field} 
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="serviceDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>서비스 날짜</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="nextServiceDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>다음 서비스 예정일</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                      취소
                    </Button>
                    <Button type="submit" disabled={createMaintenanceRecordMutation.isPending}>
                      등록
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Recent Maintenance Records */}
        <div className="space-y-3">
          {maintenanceRecords?.slice(0, 3).map((record) => (
            <div key={record.id} className="border-l-4 border-blue-500 pl-4 py-2">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-900">
                  {record.type === "oil_change" ? "오일 교체" :
                   record.type === "inspection" ? "정기 점검" :
                   record.type === "repair" ? "수리" :
                   record.type === "parts_replacement" ? "부품 교체" :
                   record.type === "wash" ? "세차" : "기타"}
                </h4>
                <span className="text-sm text-gray-500">
                  {new Date(record.serviceDate).toLocaleDateString('ko-KR')}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-1">{record.description}</p>
              <p className="text-xs text-gray-500 mt-1">
                비용: {record.cost?.toLocaleString()}원 | 주행거리: {record.mileageAtService?.toLocaleString()}km
              </p>
            </div>
          )) || (
            <div className="text-gray-500 text-center py-4">
              정비 기록이 없습니다.
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
