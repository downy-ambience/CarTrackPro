import { WebClient } from "@slack/web-api";
import type { DriveRecord, Vehicle, User } from "@shared/schema";

if (!process.env.SLACK_BOT_TOKEN) {
  console.warn("SLACK_BOT_TOKEN environment variable not set - Slack integration disabled");
}

if (!process.env.SLACK_CHANNEL_ID) {
  console.warn("SLACK_CHANNEL_ID environment variable not set - Slack integration disabled");
}

const slack = process.env.SLACK_BOT_TOKEN ? new WebClient(process.env.SLACK_BOT_TOKEN) : null;

export async function sendDriveRecordNotification(
  driveRecord: DriveRecord,
  vehicle: Vehicle,
  driver: User
): Promise<void> {
  if (!slack || !process.env.SLACK_CHANNEL_ID) {
    console.log("Slack integration not configured, skipping notification");
    return;
  }

  try {
    const message = {
      channel: process.env.SLACK_CHANNEL_ID,
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: "🚗 차량 운행 기록"
          }
        },
        {
          type: "section",
          fields: [
            {
              type: "mrkdwn",
              text: `*운전자:* ${driver.name}`
            },
            {
              type: "mrkdwn",
              text: `*차량번호:* ${vehicle.plateNumber}`
            },
            {
              type: "mrkdwn",
              text: `*차량모델:* ${vehicle.model}`
            },
            {
              type: "mrkdwn",
              text: `*운행 상태:* ${driveRecord.status === 'completed' ? '완료' : '진행중'}`
            }
          ]
        },
        {
          type: "section",
          fields: [
            {
              type: "mrkdwn",
              text: `*시작 주행거리:* ${driveRecord.startMileage?.toLocaleString()} km`
            },
            {
              type: "mrkdwn",
              text: `*종료 주행거리:* ${driveRecord.endMileage?.toLocaleString() || '진행중'} km`
            },
            {
              type: "mrkdwn",
              text: `*총 운행거리:* ${driveRecord.totalDistance?.toLocaleString() || '-'} km`
            },
            {
              type: "mrkdwn",
              text: `*운행 목적:* ${driveRecord.purpose}`
            }
          ]
        },
        {
          type: "section",
          fields: [
            {
              type: "mrkdwn",
              text: `*목적지:* ${driveRecord.destination}`
            },
            {
              type: "mrkdwn",
              text: `*시작 시간:* ${new Date(driveRecord.startTime).toLocaleString('ko-KR')}`
            }
          ]
        }
      ]
    };

    if (driveRecord.endTime) {
      const fieldsBlock = message.blocks[2] as any;
      if (fieldsBlock && fieldsBlock.fields) {
        fieldsBlock.fields.push({
          type: "mrkdwn",
          text: `*종료 시간:* ${new Date(driveRecord.endTime).toLocaleString('ko-KR')}`
        });
      }
    }

    await slack.chat.postMessage(message);
    console.log("Slack notification sent successfully");
  } catch (error) {
    console.error("Error sending Slack notification:", error);
  }
}

export async function sendMaintenanceNotification(
  vehicle: Vehicle,
  maintenanceType: string,
  description: string
): Promise<void> {
  if (!slack || !process.env.SLACK_CHANNEL_ID) {
    console.log("Slack integration not configured, skipping notification");
    return;
  }

  try {
    const message = {
      channel: process.env.SLACK_CHANNEL_ID,
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: "🔧 차량 정비 기록"
          }
        },
        {
          type: "section",
          fields: [
            {
              type: "mrkdwn",
              text: `*차량번호:* ${vehicle.plateNumber}`
            },
            {
              type: "mrkdwn",
              text: `*차량모델:* ${vehicle.model}`
            },
            {
              type: "mrkdwn",
              text: `*정비 유형:* ${maintenanceType}`
            },
            {
              type: "mrkdwn",
              text: `*상세 내용:* ${description}`
            }
          ]
        }
      ]
    };

    await slack.chat.postMessage(message);
    console.log("Maintenance Slack notification sent successfully");
  } catch (error) {
    console.error("Error sending maintenance Slack notification:", error);
  }
}
