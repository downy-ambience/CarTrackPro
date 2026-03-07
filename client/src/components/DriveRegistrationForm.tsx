import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Play, Pause, Slack, Save, User as UserIcon, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import DriveEndModal from "@/components/DriveEndModal";
import type { Vehicle, DriveRecord, User } from "@shared/schema";

const driveFormSchema = z.object({
  driverId: z.string().min(1, "운전자를 선택해주세요"),
  startMileage: z.number().min(0, "시작 주행거리를 입력해주세요"),
  purpose: z.string().min(1, "운행 목적을 선택해주세요"),
  destination: z.string().min(1, "목적지를 입력해주세요"),
});

type DriveFormData = z.infer<typeof driveFormSchema>;

interface DriveRegistrationFormProps {
  vehicle: Vehicle;
  driveRecord: DriveRecord | null;
  onDriveRecordUpdate: (record: DriveRecord | null) => void;
}

export default function DriveRegistrationForm({ vehicle, driveRecord, onDriveRecordUpdate }: DriveRegistrationFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [isEndModalOpen, setIsEndModalOpen] = useState(false);

  const { data: users = [] } = useQuery<User[]>({ queryKey: ["/api/users"] });

  const form = useForm<DriveFormData>({
    resolver: zodResolver(driveFormSchema),
    defaultValues: { driverId: "", startMileage: vehicle.currentMileage, purpose: "", destination: "" },
  });

  const createDriveRecordMutation = useMutation({
    mutationFn: async (data: DriveFormData) => {
      const response = await apiRequest("POST", "/api/drive-records", {
        vehicleId: vehicle.id, driverId: data.driverId, startMileage: data.startMileage,
        purpose: data.purpose, destination: data.destination,
      });
      return response.json();
    },
    onSuccess: (record: DriveRecord) => {
      onDriveRecordUpdate(record);
      setStep(2);
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
      toast({ title: "운행이 시작되었습니다", description: "차량 상태 점검 사진을 촬영해주세요." });
    },
    onError: () => {
      toast({ title: "오류 발생", description: "운행 시작에 실패했습니다.", variant: "destructive" });
    },
  });

  const onSubmit = (data: DriveFormData) => { if (!driveRecord) createDriveRecordMutation.mutate(data); };

  const handleDriveComplete = () => {
    onDriveRecordUpdate(null);
    setStep(1);
    form.reset({ driverId: "", startMileage: vehicle.currentMileage, purpose: "", destination: "" });
    setIsEndModalOpen(false);
  };

  const progressValue = driveRecord ? 66 : 33;

  return (
    <div className="glass-card-static p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <ChevronRight className="w-5 h-5 text-blue-500" />
          운행 등록
        </h2>
        <div className="flex items-center space-x-2 text-sm text-slate-400">
          <Slack className="w-4 h-4 text-purple-500" />
          <span>슬랙 연동 활성화</span>
        </div>
      </div>

      <div className="mb-8">
        <div className="flex items-center justify-between text-sm font-medium text-slate-400 mb-3">
          <span>단계 {step}/3</span>
          <span>{Math.round(progressValue)}%</span>
        </div>
        <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
          <div className="gradient-progress" style={{ width: `${progressValue}%` }} />
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField control={form.control} name="driverId"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center"><UserIcon className="w-4 h-4 text-blue-500 mr-1" />운전자 선택</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!!driveRecord}>
                  <FormControl><SelectTrigger><SelectValue placeholder="운전자를 선택하세요" /></SelectTrigger></FormControl>
                  <SelectContent>{users.map((user) => (<SelectItem key={user.id} value={user.id}>{user.name} (@{user.username})</SelectItem>))}</SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField control={form.control} name="startMileage"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center"><Play className="w-4 h-4 text-green-500 mr-1" />운행 시작 주행거리 (km)</FormLabel>
                <FormControl><Input type="number" {...field} onChange={(e) => field.onChange(Number(e.target.value))} disabled={!!driveRecord} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField control={form.control} name="purpose"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>운행 목적</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!!driveRecord}>
                    <FormControl><SelectTrigger><SelectValue placeholder="목적을 선택하세요" /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="업무">업무</SelectItem>
                      <SelectItem value="출장">출장</SelectItem>
                      <SelectItem value="회의">회의</SelectItem>
                      <SelectItem value="기타">기타</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField control={form.control} name="destination"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>목적지</FormLabel>
                  <FormControl><Input {...field} placeholder="서울시 강남구" disabled={!!driveRecord} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-end pt-2">
            <Button type="button" variant="outline" disabled><Save className="w-4 h-4 mr-2" />임시 저장</Button>
            {!driveRecord ? (
              <button type="submit" className="btn-gradient flex items-center justify-center gap-2" disabled={createDriveRecordMutation.isPending}>
                <Play className="w-4 h-4" />운행 시작
              </button>
            ) : (
              <button type="button" className="btn-gradient flex items-center justify-center gap-2" onClick={() => setIsEndModalOpen(true)}>
                <Pause className="w-4 h-4" />운행 종료
              </button>
            )}
          </div>
        </form>
      </Form>

      <DriveEndModal driveRecord={driveRecord} vehicle={vehicle} isOpen={isEndModalOpen} onClose={() => setIsEndModalOpen(false)} onSuccess={handleDriveComplete} />
    </div>
  );
}
