import { TelemetryEventInput } from "api";
import { TelemetryExporter } from "exporters";

/**
 * TestTelemetryExporter does nothing with exported events but record them
 * for retrieval with (TestTelemetryExporter).getExported().
 */
export class TestTelemetryExporter implements TelemetryExporter {
  private events: TelemetryEventInput[] = [];

  exportEvents(events: TelemetryEventInput[]): Promise<void> {
    this.events.push(...events);
    return Promise.resolve();
  }

  /**
   * Retrieve all events that have been "exported" so far.
   */
  getExported(): TelemetryEventInput[] {
    return this.events;
  }
}
