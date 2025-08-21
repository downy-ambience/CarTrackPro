import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FileSpreadsheet, CheckCircle, XCircle, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface GoogleSheetsStatus {
  configured: boolean;
  hasApiKey: boolean;
  hasSpreadsheetId: boolean;
  instructions: string;
}

export default function GoogleSheetsSetup() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: status, isLoading } = useQuery<GoogleSheetsStatus>({
    queryKey: ["/api/google-sheets/status"],
  });

  const initMutation = useMutation({
    mutationFn: () => fetch("/api/google-sheets/init", {
      method: "POST",
    }).then(res => res.json()),
    onSuccess: () => {
      toast({
        title: "스프레드시트 초기화 완료",
        description: "구글 스프레드시트에 헤더가 설정되었습니다.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/google-sheets/status"] });
    },
    onError: (error: any) => {
      toast({
        title: "초기화 실패",
        description: error.message || "스프레드시트 초기화에 실패했습니다.",
        variant: "destructive",
      });
    },
  });

  const StatusIndicator = ({ condition, label }: { condition: boolean; label: string }) => (
    <div className="flex items-center space-x-2">
      {condition ? (
        <CheckCircle className="w-5 h-5 text-green-500" />
      ) : (
        <XCircle className="w-5 h-5 text-red-500" />
      )}
      <span className={condition ? "text-green-700" : "text-red-700"}>{label}</span>
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 pb-20 md:pb-6">
          <div className="animate-pulse">로딩 중...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 pb-20 md:pb-6">
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <FileSpreadsheet className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">구글 스프레드시트 연동</h1>
          </div>
          <p className="text-sm sm:text-base text-gray-600">
            운행 기록을 구글 스프레드시트로 자동 백업하고 관리하세요.
          </p>
        </div>

        <div className="space-y-6">
          {/* 상태 카드 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="w-5 h-5" />
                <span>연동 상태</span>
              </CardTitle>
              <CardDescription>
                구글 스프레드시트 연동을 위한 설정 상태입니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">전체 연동 상태</span>
                <Badge variant={status?.configured ? "default" : "secondary"}>
                  {status?.configured ? "설정 완료" : "설정 필요"}
                </Badge>
              </div>
              
              <div className="space-y-3 pl-4 border-l-2 border-gray-100">
                <StatusIndicator 
                  condition={status?.hasApiKey || false} 
                  label="Google Sheets API 키" 
                />
                <StatusIndicator 
                  condition={status?.hasSpreadsheetId || false} 
                  label="스프레드시트 ID" 
                />
              </div>

              {status?.configured && (
                <div className="pt-4">
                  <Button
                    onClick={() => initMutation.mutate()}
                    disabled={initMutation.isPending}
                    className="w-full"
                  >
                    {initMutation.isPending ? "초기화 중..." : "스프레드시트 헤더 초기화"}
                  </Button>
                  <p className="text-sm text-gray-500 mt-2">
                    스프레드시트에 운행 기록 헤더를 설정합니다.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 설정 안내 카드 */}
          <Card>
            <CardHeader>
              <CardTitle>설정 방법</CardTitle>
              <CardDescription>
                구글 스프레드시트 연동을 위한 단계별 설정 가이드입니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-semibold text-blue-900 mb-2">1. Google Cloud Console 설정</h3>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Google Cloud Console에서 프로젝트 생성</li>
                    <li>• Google Sheets API 활성화</li>
                    <li>• API 키 발급 (제한사항에서 Google Sheets API만 허용)</li>
                  </ul>
                </div>

                <div className="p-4 bg-green-50 rounded-lg">
                  <h3 className="font-semibold text-green-900 mb-2">2. 스프레드시트 준비</h3>
                  <ul className="text-sm text-green-800 space-y-1">
                    <li>• 새 구글 스프레드시트 생성</li>
                    <li>• 스프레드시트 URL에서 ID 복사</li>
                    <li>• 스프레드시트를 공개로 설정 또는 API 권한 부여</li>
                  </ul>
                </div>

                <div className="p-4 bg-purple-50 rounded-lg">
                  <h3 className="font-semibold text-purple-900 mb-2">3. 환경 변수 설정</h3>
                  <ul className="text-sm text-purple-800 space-y-1">
                    <li>• GOOGLE_SHEETS_API_KEY: 발급받은 API 키</li>
                    <li>• GOOGLE_SPREADSHEET_ID: 스프레드시트 URL의 ID 부분</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 스프레드시트 구조 안내 */}
          <Card>
            <CardHeader>
              <CardTitle>스프레드시트 구조</CardTitle>
              <CardDescription>
                자동으로 생성될 운행 기록 스프레드시트의 구조입니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-300 px-3 py-2 text-left">날짜</th>
                      <th className="border border-gray-300 px-3 py-2 text-left">시작시간</th>
                      <th className="border border-gray-300 px-3 py-2 text-left">종료시간</th>
                      <th className="border border-gray-300 px-3 py-2 text-left">운전자</th>
                      <th className="border border-gray-300 px-3 py-2 text-left">차량번호</th>
                      <th className="border border-gray-300 px-3 py-2 text-left">차량모델</th>
                      <th className="border border-gray-300 px-3 py-2 text-left">목적지</th>
                      <th className="border border-gray-300 px-3 py-2 text-left">목적</th>
                      <th className="border border-gray-300 px-3 py-2 text-left">시작주행거리</th>
                      <th className="border border-gray-300 px-3 py-2 text-left">종료주행거리</th>
                      <th className="border border-gray-300 px-3 py-2 text-left">총주행거리</th>
                      <th className="border border-gray-300 px-3 py-2 text-left">상태</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-gray-300 px-3 py-2 text-gray-500">2024.01.15</td>
                      <td className="border border-gray-300 px-3 py-2 text-gray-500">09:30</td>
                      <td className="border border-gray-300 px-3 py-2 text-gray-500">12:45</td>
                      <td className="border border-gray-300 px-3 py-2 text-gray-500">김운전</td>
                      <td className="border border-gray-300 px-3 py-2 text-gray-500">42너7839</td>
                      <td className="border border-gray-300 px-3 py-2 text-gray-500">현대 투싼</td>
                      <td className="border border-gray-300 px-3 py-2 text-gray-500">강남구청</td>
                      <td className="border border-gray-300 px-3 py-2 text-gray-500">업무미팅</td>
                      <td className="border border-gray-300 px-3 py-2 text-gray-500">45,200</td>
                      <td className="border border-gray-300 px-3 py-2 text-gray-500">45,235</td>
                      <td className="border border-gray-300 px-3 py-2 text-gray-500">35</td>
                      <td className="border border-gray-300 px-3 py-2 text-gray-500">완료</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}