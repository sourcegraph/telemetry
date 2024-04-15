import { TelemetryProcessor } from '.';
import {
  TelemetryEventInput,
  TelemetryEventMarketingTrackingInput,
} from "../api";

/**
 * MarketingTrackingProvider can be implemented to generate platform-specific
 * marketing metadata for telemetry events.
 */
export interface MarketingTrackingProvider {
  getMarketingTrackingMetadata(): TelemetryEventMarketingTrackingInput | null;
}

/**
 * MarketingTrackingTelemetryProcessor injects marketing metdata from a
 * MarketingTrackingProvider to all events.
 */
export class MarketingTrackingTelemetryProcessor implements TelemetryProcessor {
  constructor(private provider: MarketingTrackingProvider) {}

  processEvent(event: TelemetryEventInput): void {
    event.marketingTracking =
      this.provider.getMarketingTrackingMetadata() || undefined;
  }
}
