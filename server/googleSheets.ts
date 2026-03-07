import { google } from 'googleapis';
import type { DriveRecord, Vehicle, User } from '@shared/schema';
import fs from 'fs';
import path from 'path';

export class GoogleSheetsService {
  private sheets: any;
  private drive: any;
  private auth: any;
  private spreadsheetId: string | null = null;

  constructor() {
    this.initAuth();
  }

  private initAuth() {
    // 서비스 계정 JSON 키 파일 경로 또는 JSON 문자열
    const keyPath = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE;
    const keyJson = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;

    let credentials: any = null;

    if (keyPath && fs.existsSync(keyPath)) {
      credentials = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
    } else if (keyJson) {
      try {
        credentials = JSON.parse(keyJson);
      } catch {
        console.warn('GOOGLE_SERVICE_ACCOUNT_KEY JSON 파싱 실패');
      }
    }

    if (!credentials) {
      console.warn('⚠️  Google 서비스 계정이 설정되지 않았습니다 - Sheets 연동 비활성화');
      console.warn('   설정 방법: GOOGLE_SERVICE_ACCOUNT_KEY_FILE=./credentials.json');
      return;
    }

    try {
      this.auth = new google.auth.JWT({
        email: credentials.client_email,
        key: credentials.private_key,
        scopes: [
          'https://www.googleapis.com/auth/spreadsheets',
          'https://www.googleapis.com/auth/drive',
        ],
      });

      this.sheets = google.sheets({ version: 'v4', auth: this.auth });
      this.drive = google.drive({ version: 'v3', auth: this.auth });
      this.spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID || null;

      console.log('✅ Google Sheets 서비스 계정 인증 성공:', credentials.client_email);
    } catch (error) {
      console.error('❌ Google 서비스 계정 인증 실패:', error);
    }
  }

  isEnabled(): boolean {
    return !!this.sheets;
  }

  hasSpreadsheet(): boolean {
    return !!this.spreadsheetId;
  }

  getServiceAccountEmail(): string | null {
    if (!this.auth) return null;
    return this.auth.email || null;
  }

  // ========== 스프레드시트 자동 생성 ==========
  async createSpreadsheet(ownerEmail?: string): Promise<{ spreadsheetId: string; url: string }> {
    if (!this.isEnabled()) {
      throw new Error('Google Sheets 서비스 계정이 설정되지 않았습니다');
    }

    // 스프레드시트 생성
    const response = await this.sheets.spreadsheets.create({
      requestBody: {
        properties: {
          title: '앰비언스 차량운행기록',
          locale: 'ko',
        },
        sheets: [
          {
            properties: {
              title: '운행기록',
              gridProperties: { frozenRowCount: 1 },
            },
          },
          {
            properties: {
              title: '정비기록',
              gridProperties: { frozenRowCount: 1 },
            },
          },
        ],
      },
    });

    const newSpreadsheetId = response.data.spreadsheetId!;
    const url = `https://docs.google.com/spreadsheets/d/${newSpreadsheetId}/edit`;

    // 헤더 설정
    await this.sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: newSpreadsheetId,
      requestBody: {
        valueInputOption: 'RAW',
        data: [
          {
            range: '운행기록!A1:M1',
            values: [[
              '날짜', '시작시간', '종료시간', '운전자', '차량번호',
              '차량모델', '출발지', '목적지', '목적', '시작주행거리',
              '종료주행거리', '총주행거리', '상태'
            ]],
          },
          {
            range: '정비기록!A1:H1',
            values: [[
              '날짜', '차량번호', '차량모델', '정비유형', '상세내용',
              '비용(원)', '주행거리(km)', '다음예정일'
            ]],
          },
        ],
      },
    });

    // 헤더 행 스타일 (볼드 + 배경색)
    const sheetsInfo = response.data.sheets || [];
    for (const sheet of sheetsInfo) {
      const sheetId = sheet.properties?.sheetId;
      await this.sheets.spreadsheets.batchUpdate({
        spreadsheetId: newSpreadsheetId,
        requestBody: {
          requests: [
            {
              repeatCell: {
                range: { sheetId, startRowIndex: 0, endRowIndex: 1 },
                cell: {
                  userEnteredFormat: {
                    backgroundColor: { red: 0.239, green: 0.522, blue: 0.961 },
                    textFormat: { bold: true, foregroundColor: { red: 1, green: 1, blue: 1 } },
                  },
                },
                fields: 'userEnteredFormat(backgroundColor,textFormat)',
              },
            },
            {
              autoResizeDimensions: {
                dimensions: { sheetId, dimension: 'COLUMNS', startIndex: 0, endIndex: 13 },
              },
            },
          ],
        },
      });
    }

    // 소유자에게 편집 권한 공유
    if (ownerEmail) {
      try {
        await this.drive.permissions.create({
          fileId: newSpreadsheetId,
          requestBody: {
            type: 'user',
            role: 'writer',
            emailAddress: ownerEmail,
          },
          sendNotificationEmail: true,
        });
        console.log(`📧 스프레드시트가 ${ownerEmail}에게 공유되었습니다`);
      } catch (error) {
        console.warn('스프레드시트 공유 실패:', error);
      }
    }

    // 누구나 링크로 볼 수 있게 설정
    try {
      await this.drive.permissions.create({
        fileId: newSpreadsheetId,
        requestBody: {
          type: 'anyone',
          role: 'reader',
        },
      });
    } catch (error) {
      console.warn('공개 링크 설정 실패:', error);
    }

    // 환경변수에 ID 저장 (메모리)
    this.spreadsheetId = newSpreadsheetId;
    process.env.GOOGLE_SPREADSHEET_ID = newSpreadsheetId;

    // .env 파일에도 저장 시도
    this.saveSpreadsheetIdToEnv(newSpreadsheetId);

    console.log(`✅ 스프레드시트 생성 완료: ${url}`);
    return { spreadsheetId: newSpreadsheetId, url };
  }

  private saveSpreadsheetIdToEnv(spreadsheetId: string) {
    try {
      const envPath = path.resolve('.env');
      let envContent = '';
      if (fs.existsSync(envPath)) {
        envContent = fs.readFileSync(envPath, 'utf8');
      }
      if (envContent.includes('GOOGLE_SPREADSHEET_ID=')) {
        envContent = envContent.replace(
          /GOOGLE_SPREADSHEET_ID=.*/,
          `GOOGLE_SPREADSHEET_ID=${spreadsheetId}`
        );
      } else {
        envContent += `\nGOOGLE_SPREADSHEET_ID=${spreadsheetId}\n`;
      }
      fs.writeFileSync(envPath, envContent);
    } catch (error) {
      console.warn('.env 파일 저장 실패 (수동으로 GOOGLE_SPREADSHEET_ID를 설정하세요)');
    }
  }

  // ========== 스프레드시트 헤더 초기화 (기존 시트 대상) ==========
  async initializeSpreadsheet(): Promise<void> {
    if (!this.isEnabled() || !this.spreadsheetId) {
      console.log('Google Sheets 설정되지 않음 - 초기화 건너뜀');
      return;
    }

    const headers = [
      '날짜', '시작시간', '종료시간', '운전자', '차량번호',
      '차량모델', '출발지', '목적지', '목적', '시작주행거리',
      '종료주행거리', '총주행거리', '상태'
    ];

    await this.sheets.spreadsheets.values.update({
      spreadsheetId: this.spreadsheetId,
      range: 'A1:M1',
      valueInputOption: 'RAW',
      requestBody: { values: [headers] },
    });

    console.log('✅ 스프레드시트 헤더 초기화 완료');
  }

  // ========== 운행 기록 추가 ==========
  async addDriveRecord(driveRecord: DriveRecord, vehicle: Vehicle, user: User): Promise<void> {
    if (!this.isEnabled() || !this.spreadsheetId) {
      return;
    }

    try {
      const startDate = new Date(driveRecord.startTime);
      const endDate = driveRecord.endTime ? new Date(driveRecord.endTime) : null;

      const row = [
        startDate.toLocaleDateString('ko-KR'),
        startDate.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
        endDate ? endDate.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }) : '',
        user.name,
        vehicle.plateNumber,
        vehicle.model,
        '',
        driveRecord.destination || '',
        driveRecord.purpose,
        driveRecord.startMileage?.toString() || '',
        driveRecord.endMileage?.toString() || '',
        driveRecord.totalDistance?.toString() || '',
        driveRecord.endTime ? '완료' : '진행중'
      ];

      // '운행기록' 시트에 쓰기 시도, 없으면 기본 시트에 쓰기
      try {
        await this.sheets.spreadsheets.values.append({
          spreadsheetId: this.spreadsheetId,
          range: '운행기록!A:M',
          valueInputOption: 'RAW',
          requestBody: { values: [row] },
        });
      } catch {
        await this.sheets.spreadsheets.values.append({
          spreadsheetId: this.spreadsheetId,
          range: 'A:M',
          valueInputOption: 'RAW',
          requestBody: { values: [row] },
        });
      }

      console.log('📝 운행 기록이 스프레드시트에 추가되었습니다');
    } catch (error) {
      console.error('스프레드시트 기록 추가 실패:', error);
    }
  }

  // ========== 상태 정보 ==========
  getStatus() {
    return {
      enabled: this.isEnabled(),
      hasSpreadsheet: this.hasSpreadsheet(),
      spreadsheetId: this.spreadsheetId,
      spreadsheetUrl: this.spreadsheetId
        ? `https://docs.google.com/spreadsheets/d/${this.spreadsheetId}/edit`
        : null,
      serviceAccountEmail: this.getServiceAccountEmail(),
    };
  }
}

export const googleSheetsService = new GoogleSheetsService();