import { TelemetryProcessor } from "processors";
import { TelemetryEventInput, TelemetryEventBillingMetadataInput } from "api";

/**
 * BillingMetadataTelemetryProcessor injects billing metadata from to all telemetry
 * events, if custom billing data is not yet provided.
 */
export class BillingMetadataTelemetryProcessor implements TelemetryProcessor {
  constructor(private billingMetadata: TelemetryEventBillingMetadataInput) {}

  processEvent(event: TelemetryEventInput): void {
    if (!event.parameters.billingMetadata) {
      event.parameters.billingMetadata = this.billingMetadata;
    }
  }
}
