import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema, type InsertUser, type User } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit2, Users, User as UserIcon } from "lucide-react";
import Navigation from "@/components/Navigation";

export default function UserManagement() {
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: users = [], isLoading } = useQuery<User[]>({ queryKey: ['/api/users'] });

  const createUserMutation = useMutation({
    mutationFn: (userData: InsertUser) => apiRequest('POST', '/api/users', userData),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/users'] }); setIsDialogOpen(false); toast({ title: "운전자 추가 완료" }); },
    onError: () => { toast({ title: "오류", variant: "destructive" }); },
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, userData }: { id: string; userData: Partial<InsertUser> }) => apiRequest('PATCH', `/api/users/${id}`, userData),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/users'] }); setIsDialogOpen(false); setEditingUser(null); toast({ title: "수정 완료" }); },
    onError: () => { toast({ title: "오류", variant: "destructive" }); },
  });

  const form = useForm<InsertUser>({ resolver: zodResolver(insertUserSchema), defaultValues: { username: "", name: "" } });
  const onSubmit = (data: InsertUser) => { editingUser ? updateUserMutation.mutate({ id: editingUser.id, userData: data }) : createUserMutation.mutate(data); };
  const handleEdit = (user: User) => { setEditingUser(user); form.reset({ username: user.username, name: user.name }); setIsDialogOpen(true); };
  const handleAdd = () => { setEditingUser(null); form.reset({ username: "", name: "" }); setIsDialogOpen(true); };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><span className="text-slate-400">로딩 중...</span></div>;

  return (
    <div className="min-h-screen">
      <Navigation />
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 pb-24 md:pb-8 space-y-6">
        <div className="flex items-center justify-between animate-fade-in">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 flex items-center gap-2">
              <Users className="w-6 h-6 text-blue-500" />앰비언스 운전자 관리
            </h1>
            <p className="text-sm text-slate-400 mt-1">운전자 정보를 등록하고 관리하세요</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <button onClick={handleAdd} className="btn-gradient text-sm flex items-center gap-1.5"><Plus className="w-4 h-4" />운전자 추가</button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editingUser ? "운전자 정보 수정" : "새 운전자 추가"}</DialogTitle></DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField control={form.control} name="username" render={({ field }) => (<FormItem><FormLabel>사용자명</FormLabel><FormControl><Input placeholder="사용자명을 입력하세요" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>실명</FormLabel><FormControl><Input placeholder="실명을 입력하세요" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>취소</Button>
                    <button type="submit" className="btn-gradient text-sm" disabled={createUserMutation.isPending || updateUserMutation.isPending}>{editingUser ? "수정" : "추가"}</button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 animate-fade-in-delay-1">
          {users.map(user => (
            <div key={user.id} className="glass-card p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                    <UserIcon className="w-5 h-5 text-white" />
                  </div>
                  <div><h3 className="text-base font-semibold text-slate-800">{user.name}</h3><p className="text-sm text-slate-400">@{user.username}</p></div>
                </div>
                <button onClick={() => handleEdit(user)} className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"><Edit2 className="w-4 h-4" /></button>
              </div>
              <div className="text-xs text-slate-400 bg-slate-50 rounded-lg px-3 py-2">사용자 ID: {user.id.slice(0, 8)}...</div>
            </div>
          ))}
        </div>

        {users.length === 0 && (
          <div className="glass-card-static p-12 text-center">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-700 mb-2">등록된 운전자가 없습니다</h3>
            <p className="text-slate-400 mb-4">새 운전자를 추가하여 차량 운행 관리를 시작하세요.</p>
            <button onClick={handleAdd} className="btn-gradient text-sm inline-flex items-center gap-1.5"><Plus className="w-4 h-4" />첫 번째 운전자 추가</button>
          </div>
        )}
      </div>
    </div>
  );
}