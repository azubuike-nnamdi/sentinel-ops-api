import { Types } from 'mongoose';

export const USABILITY_EVENT_NAMES = [
  'task_started',
  'task_completed',
  'task_failed',
  'task_abandoned',
  'validation_error',
  'result_viewed',
  'alert_opened',
  'web_vital_recorded',
  'feedback_submitted',
] as const;

export type UsabilityEventName = (typeof USABILITY_EVENT_NAMES)[number];

export const USABILITY_TASK_IDS = [
  'T1_detect_diagnose',
  'T2_run_prediction',
  'T3_create_track_incident',
] as const;

export type UsabilityTaskId = (typeof USABILITY_TASK_IDS)[number];

export interface UsabilityEventProperties {
  [key: string]: string | number | boolean | undefined;
  metric?: string;
  value?: number;
  errorCode?: string;
  action?: string;
  severity?: string;
}

export interface CreateUsabilityEventData {
  eventName: UsabilityEventName;
  taskId?: UsabilityTaskId;
  sessionId: string;
  routeKey: string;
  occurredAt?: Date;
  durationMs?: number;
  success?: boolean;
  errorCategory?: string;
  properties?: UsabilityEventProperties;
}

export interface IUsabilityEvent extends CreateUsabilityEventData {
  id: string;
  actorId: string;
  occurredAt: Date;
  createdAt: Date;
}

export interface IUsabilitySurvey {
  id: string;
  actorId: string;
  studySessionId: string;
  answers: number[];
  score: number;
  feedback?: string;
  submittedAt: Date;
}

export interface UsabilityTaskSummary {
  taskId: UsabilityTaskId;
  started: number;
  completed: number;
  failed: number;
  abandoned: number;
  validationErrors: number;
  resultsViewed: number;
  completionRate: number;
  abandonmentRate: number;
  errorRate: number;
  medianDurationMs: number | null;
  p95DurationMs: number | null;
}

export interface UsabilitySummary {
  period: {
    from: string;
    to: string;
  };
  sampleSize: number;
  tasks: UsabilityTaskSummary[];
  webVitals: Array<{
    metric: string;
    count: number;
    average: number;
  }>;
  sus: {
    responses: number;
    averageScore: number | null;
  };
}

export function actorObjectId(actorId: string): Types.ObjectId {
  return new Types.ObjectId(actorId);
}
