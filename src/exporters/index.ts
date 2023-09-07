import { TelemetryEventInput } from "api";

/**
 * TelemetryExporter implementations should export events in batches to the
 * connected Sourcegraph instance.
 */
export interface TelemetryExporter {
  exportEvents(events: TelemetryEventInput[]): Promise<void>;
}

/**
 * NoOpTelemetryExporter does nothing with exported events.
 */
export class NoOpTelemetryExporter implements TelemetryExporter {
  exportEvents(_events: TelemetryEventInput[]): Promise<void> {
    return Promise.resolve();
  }
}
