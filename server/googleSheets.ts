import { google } from 'googleapis';
import type { DriveRecord, Vehicle, User } from '@shared/schema';

export class GoogleSheetsService {
  private sheets: any;

  constructor() {
    if (!process.env.GOOGLE_SHEETS_API_KEY) {
      console.warn('GOOGLE_SHEETS_API_KEY not provided - Google Sheets integration disabled');
      return;
    }

    this.sheets = google.sheets({
      version: 'v4',
      auth: process.env.GOOGLE_SHEETS_API_KEY,
    });
  }

  private isEnabled(): boolean {
    return !!this.sheets && !!process.env.GOOGLE_SPREADSHEET_ID;
  }

  // 스프레드시트 헤더 설정 (첫 번째 실행 시)
  async initializeSpreadsheet(): Promise<void> {
    if (!this.isEnabled()) {
      console.log('Google Sheets integration not configured');
      return;
    }

    try {
      const headers = [
        '날짜',
        '시작시간', 
        '종료시간',
        '운전자',
        '차량번호',
        '차량모델',
        '출발지',
        '목적지', 
        '목적',
        '시작주행거리',
        '종료주행거리',
        '총주행거리',
        '상태'
      ];

      // 헤더 행 추가
      await this.sheets.spreadsheets.values.update({
        spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID,
        range: 'A1:M1',
        valueInputOption: 'RAW',
        requestBody: {
          values: [headers],
        },
      });

      console.log('Google Sheets initialized with headers');
    } catch (error) {
      console.error('Error initializing Google Sheets:', error);
    }
  }

  // 운행 기록을 스프레드시트에 추가
  async addDriveRecord(
    driveRecord: DriveRecord, 
    vehicle: Vehicle, 
    user: User
  ): Promise<void> {
    if (!this.isEnabled()) {
      console.log('Google Sheets integration not configured - skipping upload');
      return;
    }

    try {
      const startDate = new Date(driveRecord.startTime);
      const endDate = driveRecord.endTime ? new Date(driveRecord.endTime) : null;
      
      const row = [
        startDate.toLocaleDateString('ko-KR'), // 날짜
        startDate.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }), // 시작시간
        endDate ? endDate.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }) : '', // 종료시간
        user.name, // 운전자
        vehicle.plateNumber, // 차량번호
        vehicle.model, // 차량모델
        '', // 출발지 (추후 추가 예정)
        driveRecord.destination || '', // 목적지
        driveRecord.purpose, // 목적
        driveRecord.startMileage?.toString() || '', // 시작주행거리
        driveRecord.endMileage?.toString() || '', // 종료주행거리
        driveRecord.totalDistance?.toString() || '', // 총주행거리
        driveRecord.endTime ? '완료' : '진행중' // 상태
      ];

      await this.sheets.spreadsheets.values.append({
        spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID,
        range: 'A:M',
        valueInputOption: 'RAW',
        requestBody: {
          values: [row],
        },
      });

      console.log('Drive record added to Google Sheets');
    } catch (error) {
      console.error('Error adding to Google Sheets:', error);
    }
  }

  // 스프레드시트 설정 안내 메시지
  getSetupInstructions(): string {
    return `
구글 스프레드시트 설정 방법:

1. 새 구글 스프레드시트 생성
2. 스프레드시트 URL에서 ID 복사 (예: /spreadsheets/d/[여기가ID]/edit)
3. 스프레드시트를 공개로 설정 또는 API 키에 읽기/쓰기 권한 부여
4. 환경변수에 GOOGLE_SPREADSHEET_ID 설정

추천 스프레드시트 구조:
- 시트명: "차량운행기록"
- 헤더: 날짜, 시작시간, 종료시간, 운전자, 차량번호, 차량모델, 출발지, 목적지, 목적, 시작주행거리, 종료주행거리, 총주행거리, 상태
    `;
  }
}

export const googleSheetsService = new GoogleSheetsService();