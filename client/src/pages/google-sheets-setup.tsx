import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FileSpreadsheet, CheckCircle, AlertCircle, ExternalLink, Plus, RefreshCw, Mail } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import Navigation from "@/components/Navigation";

interface SheetsStatus {
  enabled: boolean;
  hasSpreadsheet: boolean;
  spreadsheetId: string | null;
  spreadsheetUrl: string | null;
  serviceAccountEmail: string | null;
}

export default function GoogleSheetsSetup() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [ownerEmail, setOwnerEmail] = useState("");

  const { data: status, isLoading } = useQuery<SheetsStatus>({
    queryKey: ["/api/google-sheets/status"],
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/google-sheets/create", {
        ownerEmail: ownerEmail || undefined,
      });
      return res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/google-sheets/status"] });
      toast({
        title: "✅ 스프레드시트 생성 완료!",
        description: data.message,
      });
    },
    onError: (error: any) => {
      toast({
        title: "오류",
        description: error.message || "스프레드시트 생성에 실패했습니다",
        variant: "destructive",
      });
    },
  });

  const initMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/google-sheets/init");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "✅ 헤더 초기화 완료" });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 pb-24 md:pb-8">
          <div className="animate-pulse text-slate-400">로딩 중...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navigation />

      <div className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 pb-24 md:pb-8">
        <div className="mb-6 sm:mb-8 animate-fade-in">
          <div className="flex items-center space-x-3 mb-2">
            <FileSpreadsheet className="w-7 h-7 text-blue-500" />
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">구글 스프레드시트 연동</h1>
          </div>
          <p className="text-sm sm:text-base text-slate-400">
            운행 기록을 구글 스프레드시트로 자동 백업하고 관리하세요.
          </p>
        </div>

        <div className="space-y-6">
          {/* 연동 상태 */}
          <Card className="glass-card-static animate-fade-in">
            <CardHeader>
              <CardTitle className="text-lg text-slate-800 flex items-center gap-2">
                {status?.enabled ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-amber-500" />
                )}
                연동 상태
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={`p-4 rounded-lg ${status?.enabled ? 'stat-card-green' : 'stat-card-amber'}`}>
                  <p className="text-xs font-medium text-slate-500 mb-1">서비스 계정</p>
                  <p className={`text-sm font-semibold ${status?.enabled ? 'text-green-700' : 'text-amber-700'}`}>
                    {status?.enabled ? '✅ 연결됨' : '❌ 미설정'}
                  </p>
                  {status?.serviceAccountEmail && (
                    <p className="text-xs text-slate-400 mt-1 truncate">{status.serviceAccountEmail}</p>
                  )}
                </div>
                <div className={`p-4 rounded-lg ${status?.hasSpreadsheet ? 'stat-card-blue' : 'stat-card-purple'}`}>
                  <p className="text-xs font-medium text-slate-500 mb-1">스프레드시트</p>
                  <p className={`text-sm font-semibold ${status?.hasSpreadsheet ? 'text-blue-700' : 'text-purple-700'}`}>
                    {status?.hasSpreadsheet ? '✅ 연결됨' : '📄 미생성'}
                  </p>
                  {status?.spreadsheetUrl && (
                    <a
                      href={status.spreadsheetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-500 hover:text-blue-600 flex items-center gap-1 mt-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      스프레드시트 열기
                    </a>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 스프레드시트 생성 */}
          {status?.enabled && !status?.hasSpreadsheet && (
            <Card className="glass-card-static animate-fade-in-delay-1">
              <CardHeader>
                <CardTitle className="text-lg text-slate-800 flex items-center gap-2">
                  <Plus className="w-5 h-5 text-blue-500" />
                  스프레드시트 자동 생성
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-slate-500">
                  서비스 계정이 연결되어 있습니다. 아래 버튼을 클릭하면 운행기록 스프레드시트가 자동으로 생성됩니다.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 items-end">
                  <div className="flex-1 w-full">
                    <label className="text-sm text-slate-500 mb-1 block">
                      <Mail className="w-3.5 h-3.5 inline mr-1" />
                      공유할 이메일 (선택사항)
                    </label>
                    <Input
                      type="email"
                      placeholder="your@email.com"
                      value={ownerEmail}
                      onChange={(e) => setOwnerEmail(e.target.value)}
                    />
                  </div>
                  <button
                    className="btn-gradient flex items-center gap-2 whitespace-nowrap"
                    onClick={() => createMutation.mutate()}
                    disabled={createMutation.isPending}
                  >
                    {createMutation.isPending ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                    {createMutation.isPending ? '생성 중...' : '스프레드시트 생성'}
                  </button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 이미 연결된 경우 */}
          {status?.enabled && status?.hasSpreadsheet && (
            <Card className="glass-card-static animate-fade-in-delay-1">
              <CardHeader>
                <CardTitle className="text-lg text-slate-800 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  연동 완료
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-slate-500">
                  스프레드시트가 성공적으로 연결되었습니다. 운행 기록이 완료될 때마다 자동으로 스프레드시트에 기록됩니다.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <a
                    href={status.spreadsheetUrl!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-gradient flex items-center gap-2 text-center justify-center"
                  >
                    <ExternalLink className="w-4 h-4" />
                    스프레드시트 열기
                  </a>
                  <Button
                    variant="outline"
                    onClick={() => initMutation.mutate()}
                    disabled={initMutation.isPending}
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${initMutation.isPending ? 'animate-spin' : ''}`} />
                    헤더 재초기화
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 설정 가이드 */}
          {!status?.enabled && (
            <Card className="glass-card-static animate-fade-in-delay-1">
              <CardHeader>
                <CardTitle className="text-lg text-slate-800">🔧 설정 가이드</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 rounded-lg stat-card-blue">
                    <h3 className="font-semibold text-blue-700 mb-2">1. Google Cloud Console 설정</h3>
                    <ul className="text-sm text-blue-600 space-y-1">
                      <li>• <a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer" className="underline">Google Cloud Console</a>에서 프로젝트 생성</li>
                      <li>• Google Sheets API + Google Drive API 활성화</li>
                      <li>• 서비스 계정 생성 → JSON 키 다운로드</li>
                    </ul>
                  </div>

                  <div className="p-4 rounded-lg stat-card-green">
                    <h3 className="font-semibold text-green-700 mb-2">2. JSON 키 파일 배치</h3>
                    <ul className="text-sm text-green-600 space-y-1">
                      <li>• 다운로드한 JSON 파일을 프로젝트 폴더에 저장</li>
                      <li>• 예: <code className="bg-green-100 px-1 rounded">./credentials.json</code></li>
                    </ul>
                  </div>

                  <div className="p-4 rounded-lg stat-card-purple">
                    <h3 className="font-semibold text-purple-700 mb-2">3. 환경 변수 설정</h3>
                    <ul className="text-sm text-purple-600 space-y-1">
                      <li>• <code className="bg-purple-100 px-1 rounded">.env</code> 파일에 아래 내용 추가:</li>
                      <li className="font-mono text-xs bg-purple-50 rounded p-2 mt-1">
                        GOOGLE_SERVICE_ACCOUNT_KEY_FILE=./credentials.json
                      </li>
                      <li>• 서버 재시작 후 이 페이지에서 스프레드시트 자동 생성</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}