import type { TelemetryProcessor } from '.';
import type { TelemetryEventInput } from "../api";

/**
 * CallbackTelemetryProcessor runs callback on all telemetry events. The
 * callback is provided with a copy of the original event.
 */
export class CallbackTelemetryProcessor implements TelemetryProcessor {
  constructor(private callback: (event: TelemetryEventInput) => void) {}

  processEvent(event: TelemetryEventInput): void {
    this.callback({ ...event });
  }
}
