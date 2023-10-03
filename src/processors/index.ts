import { TelemetryEventInput } from "../api";

/**
 * Export everything from folder index.
 */
export * from "./billing";
export * from "./callback";
export * from "./marketingTracking";

/**
 * The telemetry service processes events that are recorded, annotating them
 * with additional metadata. Implementations should NOT export events - telemetry
 * export should be provided by TelemetryExporter implementations.
 */
export interface TelemetryProcessor {
  /**
   * Process and manipulate an event if desired.
   */
  processEvent(event: TelemetryEventInput): void;
}
