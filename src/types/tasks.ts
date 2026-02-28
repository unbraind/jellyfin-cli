export interface ScheduledTaskInfo {
  Name?: string | null;
  State?: TaskState;
  Id?: string | null;
  LastExecutionResult?: TaskResult;
  Triggers?: TaskTriggerInfo[] | null;
  Description?: string | null;
  Category?: string | null;
  IsHidden?: boolean;
  Key?: string | null;
}

export type TaskState = 'Idle' | 'Cancelling' | 'Running';

export interface TaskResult {
  StartTimeUtc?: string | null;
  EndTimeUtc?: string | null;
  Status?: TaskCompletionStatus;
  Name?: string | null;
  Key?: string | null;
  Id?: string | null;
  ErrorMessage?: string | null;
  LongErrorMessage?: string | null;
}

export type TaskCompletionStatus = 'Completed' | 'Failed' | 'Cancelled' | 'Aborted';

export interface TaskTriggerInfo {
  Type?: string | null;
  TimeOfDayTicks?: number | null;
  IntervalTicks?: number | null;
  DayOfWeek?: DayOfWeek | null;
}

export type DayOfWeek = 'Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
