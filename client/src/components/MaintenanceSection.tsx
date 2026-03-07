import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Wrench, Droplet, AlertTriangle, Plus, Clock } from "lucide-react";
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
interface MaintenanceSectionProps { vehicle: Vehicle; }

export default function MaintenanceSection({ vehicle }: MaintenanceSectionProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: maintenanceRecords } = useQuery<MaintenanceRecord[]>({
    queryKey: ["/api/vehicles", vehicle.id, "maintenance"],
  });

  const form = useForm<MaintenanceFormData>({
    resolver: zodResolver(maintenanceFormSchema),
    defaultValues: { type: "", description: "", cost: 0, mileageAtService: vehicle.currentMileage, serviceDate: new Date().toISOString().split('T')[0], nextServiceDate: "" },
  });

  const createMutation = useMutation({
    mutationFn: async (data: MaintenanceFormData) => {
      const payload = { ...data, vehicleId: vehicle.id, serviceDate: new Date(data.serviceDate).toISOString(), nextServiceDate: data.nextServiceDate ? new Date(data.nextServiceDate).toISOString() : undefined };
      return (await apiRequest("POST", "/api/maintenance-records", payload)).json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/vehicles", vehicle.id, "maintenance"] }); form.reset(); setDialogOpen(false); toast({ title: "정비 기록이 등록되었습니다" }); },
    onError: () => { toast({ title: "오류 발생", variant: "destructive" }); },
  });

  const latestOilChange = maintenanceRecords?.find(r => r.type === "oil_change");
  const oilDays = latestOilChange?.nextServiceDate ? Math.ceil((new Date(latestOilChange.nextServiceDate).getTime() - Date.now()) / 86400000) : null;

  const typeLabel = (t: string) => ({ oil_change: "오일 교체", inspection: "정기 점검", repair: "수리", parts_replacement: "부품 교체", wash: "세차", other: "기타" }[t] || t);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <div className="glass-card-static p-6">
        <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
          <div className="icon-glow orange" style={{ width: '2rem', height: '2rem' }}><Droplet className="w-4 h-4 text-amber-500" /></div>
          엔진오일 교체 기록
        </h3>
        <div className="space-y-3">
          {latestOilChange ? (
            <>
              <div className="flex justify-between items-center py-2 border-b border-slate-100"><span className="text-sm text-slate-400">마지막 교체일</span><span className="text-sm font-medium text-slate-700">{new Date(latestOilChange.serviceDate).toLocaleDateString('ko-KR')}</span></div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100"><span className="text-sm text-slate-400">교체 시 주행거리</span><span className="text-sm font-medium text-slate-700">{latestOilChange.mileageAtService?.toLocaleString()} km</span></div>
              <div className="flex justify-between items-center py-2"><span className="text-sm text-slate-400">다음 교체 예정일</span><span className="text-sm font-medium text-slate-700">{latestOilChange.nextServiceDate ? new Date(latestOilChange.nextServiceDate).toLocaleDateString('ko-KR') : "미정"}</span></div>
            </>
          ) : (
            <div className="text-slate-400 text-center py-6"><Droplet className="w-8 h-8 mx-auto mb-2 text-slate-300" /><p className="text-sm">엔진오일 교체 기록이 없습니다</p></div>
          )}
        </div>
        {oilDays !== null && (
          <div className={`mt-4 p-3 rounded-lg flex items-center gap-2 ${oilDays <= 7 ? "bg-red-50 border border-red-200" : "bg-amber-50 border border-amber-200"}`}>
            <AlertTriangle className={`w-4 h-4 ${oilDays <= 7 ? "text-red-500" : "text-amber-500"}`} />
            <span className={`text-sm font-medium ${oilDays <= 7 ? "text-red-700" : "text-amber-700"}`}>{oilDays <= 0 ? "교체 시기가 지났습니다" : `교체 예정: ${oilDays}일 후`}</span>
          </div>
        )}
      </div>

      <div className="glass-card-static p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <div className="icon-glow" style={{ width: '2rem', height: '2rem' }}><Wrench className="w-4 h-4 text-blue-500" /></div>
            차량 정비 기록
          </h3>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild><button className="btn-gradient text-xs px-3 py-1.5 flex items-center gap-1"><Plus className="w-3.5 h-3.5" />기록 추가</button></DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader><DialogTitle>정비 기록 추가</DialogTitle></DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(d => createMutation.mutate(d))} className="space-y-4">
                  <FormField control={form.control} name="type" render={({ field }) => (<FormItem><FormLabel>정비 유형</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="정비 유형 선택" /></SelectTrigger></FormControl><SelectContent><SelectItem value="oil_change">오일 교체</SelectItem><SelectItem value="inspection">정기 점검</SelectItem><SelectItem value="repair">수리</SelectItem><SelectItem value="parts_replacement">부품 교체</SelectItem><SelectItem value="wash">세차</SelectItem><SelectItem value="other">기타</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="description" render={({ field }) => (<FormItem><FormLabel>상세 내용</FormLabel><FormControl><Textarea {...field} placeholder="정비 내용을 입력하세요..." /></FormControl><FormMessage /></FormItem>)} />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="cost" render={({ field }) => (<FormItem><FormLabel>비용 (원)</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="mileageAtService" render={({ field }) => (<FormItem><FormLabel>서비스 시 주행거리</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} /></FormControl><FormMessage /></FormItem>)} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="serviceDate" render={({ field }) => (<FormItem><FormLabel>서비스 날짜</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="nextServiceDate" render={({ field }) => (<FormItem><FormLabel>다음 서비스 예정일</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  </div>
                  <div className="flex justify-end space-x-2 pt-2">
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>취소</Button>
                    <button type="submit" className="btn-gradient text-sm" disabled={createMutation.isPending}>등록</button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
        <div className="space-y-3">
          {maintenanceRecords?.slice(0, 3).map(r => (
            <div key={r.id} className="border-l-2 border-blue-400 pl-4 py-2">
              <div className="flex items-center justify-between"><h4 className="text-sm font-medium text-slate-800">{typeLabel(r.type)}</h4><span className="text-xs text-slate-400 flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(r.serviceDate).toLocaleDateString('ko-KR')}</span></div>
              <p className="text-xs text-slate-500 mt-1">{r.description}</p>
              <p className="text-xs text-slate-400 mt-1">비용: {r.cost?.toLocaleString()}원 · {r.mileageAtService?.toLocaleString()}km</p>
            </div>
          )) || (<div className="text-slate-400 text-center py-6"><Wrench className="w-8 h-8 mx-auto mb-2 text-slate-300" /><p className="text-sm">정비 기록이 없습니다</p></div>)}
        </div>
      </div>
    </div>
  );
}
