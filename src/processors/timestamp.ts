import { TelemetryEventInput } from "../api";
import { TelemetryProcessor } from ".";

export interface TimestampProvider {
  /**
   * Provide the current timestamp.
   */
  now(): Date;
}

/**
 * TimestampTelemetryProcessor attaches the current time to events as they are
 * processed. TelemetryProcessors are applied as soon as
 * (EventRecorder).recordEvent is called, so the current time is exactly the
 * time the event was recorded.
 */
export class TimestampTelemetryProcessor implements TelemetryProcessor {
  constructor(
    private provider: TimestampProvider = { now: () => new Date() }
  ) {}

  processEvent(event: TelemetryEventInput): void {
    /**
     * toISOString() gives us an RFC 3339-encoded UTC date string format, which
     * is required for `scalar DateTime` input.
     */
    event.timestamp = this.provider.now().toISOString();
  }
}
