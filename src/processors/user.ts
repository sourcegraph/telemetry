import { TelemetryProcessor } from "processors";
import { TelemetryEventInput, TelemetryEventUserInput } from "api";

/**
 * UserProvider can be implemented to generate platform-specific user metadata
 * for telemetry events.
 */
export interface UserProvider {
  getUserMetadata(): TelemetryEventUserInput | null;
}

/**
 * UserTelemetryProcessor injects user metadata from a UserProvider to all
 * telemetry events.
 */
export class UserTelemetryProcessor implements TelemetryProcessor {
  constructor(private provider: UserProvider) {}

  processEvent(event: TelemetryEventInput): void {
    event.user = this.provider.getUserMetadata() || undefined;
  }
}
