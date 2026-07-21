/**
 * Defines the scheduled task info contract used across typed Jellyfin boundaries.
 */
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
  Progress?: number | null;
  CurrentProgressPercentage?: number | null;
}

/**
 * Represents the task state values accepted by the typed Jellyfin interface.
 */
export type TaskState = 'Idle' | 'Cancelling' | 'Running';

/**
 * Defines the task result contract used across typed Jellyfin boundaries.
 */
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

/**
 * Represents the task completion status values accepted by the typed Jellyfin interface.
 */
export type TaskCompletionStatus = 'Completed' | 'Failed' | 'Cancelled' | 'Aborted';

/**
 * Defines the task trigger info contract used across typed Jellyfin boundaries.
 */
export interface TaskTriggerInfo {
  Type?: string | null;
  TimeOfDayTicks?: number | null;
  IntervalTicks?: number | null;
  DayOfWeek?: DayOfWeek | null;
}

/**
 * Represents the day of week values accepted by the typed Jellyfin interface.
 */
export type DayOfWeek = 'Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
