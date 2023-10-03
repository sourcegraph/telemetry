import { TelemetryExporter } from ".";
import { TelemetryEventInput } from "../api";

/**
 * ConsoleTelemetryExporter does nothing with exported events but record them
 * to console.
 */
export class ConsoleTelemetryExporter implements TelemetryExporter {
  exportEvents(events: TelemetryEventInput[]): Promise<void> {
    events.forEach((e) => {
      console.log("export event", { e });
    });
    return Promise.resolve();
  }
}
