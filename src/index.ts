import { EMPTY, Subject } from "rxjs";
import { bufferTime, catchError, concatMap, takeUntil } from "rxjs/operators";

import { TelemetryExporter } from "./exporters";
import { TelemetryProcessor } from "./processors";
import { TelemetryEventInput } from "./api";

/**
 * Make everything available from the top level.
 */
export * from "./exporters";
export * from "./processors";
export * from "./api";

/**
 * EventRecorder is the contract Sourcegraph clients to record events for
 * forwarding to Sourcegraph via Telemetry V2. It exposes parameters that are
 * expected to be provided at call sites.
 *
 * To create an EventRecorder, create a shared EventRecorderProvider to create
 * individual EventRecorder instances. Only implementations provided by this
 * package should be used.
 *
 * Generic arguments must be enum strings that defines allowed values for each
 * type.
 */
export interface TelemetryRecorder<
  FeatureT extends string,
  ActionT extends string,
  MetadataKeyT extends string,
  BillingProductsT extends string,
  BillingCategoriesT extends string
> {
  /**
   * Record an event.
   */
  recordEvent(
    feature: FeatureT,
    action: ActionT,
    parameters?: TelemetryEventParameters<
      MetadataKeyT,
      BillingProductsT,
      BillingCategoriesT
    >
  ): void;
}

type TelemetryRecordingOptions = {
  /**
   * Time to buffer events for, in ms. Set to 0 to disable buffering (default).
   */
  bufferTimeMs: number;
  /**
   * Maximum number of events to buffer at once.
   */
  bufferMaxSize: number;
  /**
   * Handle processing/export errors.
   */
  errorHandler: (error: any) => void;
};

export const defaultEventRecordingOptions: TelemetryRecordingOptions = {
  bufferTimeMs: 0,
  bufferMaxSize: 10,
  errorHandler: (error) => {
    console.error("@sourcegraph/telemetry:", error);
  },
};

/**
 * Describe where telemetry is coming from.
 */
export type TelemetrySource = {
  /**
   * Source client of the event. Clients must come from a static set of predefined
   * metadata keys in libraries - it is left as a string in the API to allow some
   * backwards/forwards flexibility.
   */
  client: string;
  /**
   * Version of the source client of the event.
   */
  clientVersion?: string;
};

/**
 * EventRecorderProvider is a factory for EventRecorder instances with a default
 * exporter and set of processors.
 *
 * getRecorder can be used to retrive recorder instances backed by the same
 * exporter. Additional processors can be stacked on top as well.
 */
export class TelemetryRecorderProvider<
  FeatureT extends string,
  ActionT extends string,
  MetadataKeyT extends string,
  BillingProductsT extends string,
  BillingCategoriesT extends string
> {
  private submitter: TelemetrySubmitter;

  constructor(
    private source: TelemetrySource,
    exporter: TelemetryExporter,
    private processors: TelemetryProcessor[] = [],
    options: TelemetryRecordingOptions = defaultEventRecordingOptions
  ) {
    this.submitter =
      options.bufferTimeMs == 0 || options.bufferMaxSize == 0
        ? new SimpleSubmitter(exporter, options)
        : new BatchSubmitter(exporter, options);
  }

  /**
   * Create a EventRecorder with the configured default processors and exporter.
   *
   * Additional processors can be passed to extend the defaults.
   */
  getRecorder(
    additionalProcessors?: TelemetryProcessor[]
  ): TelemetryRecorder<
    FeatureT,
    ActionT,
    MetadataKeyT,
    BillingProductsT,
    BillingCategoriesT
  > {
    return new EventRecorder(
      this.source,
      this.submitter,
      additionalProcessors
        ? this.processors.concat(additionalProcessors)
        : this.processors
    );
  }

  /**
   * Complete clears any ongoing work and releases buffer resources. It must be
   * called when the provider is no longer needed.
   */
  complete(): void {
    this.submitter.complete();
  }
}

/**
 * TelemetryEventParameters describes additional, optional parameters for recording events.
 *
 * MetadataKeyT should be an enum string that defines keys for event metadata.
 */
export type TelemetryEventParameters<
  MetadataKeyT extends string,
  BillingProductsT extends string,
  BillingCategoriesT extends string
> = {
  /**
   * version should indicate the version of the shape of this particular
   * event.
   */
  version?: number;
  /**
   * metadata is array of tuples with predefined keys and arbitrary
   * numeric value. This data is always exported alongside events to
   * Sourcegraph.
   *
   * Typescript has poor support for excess property checking on objects,
   * so this is the easiest way to enforce that keys belong to statically
   * defined enums.
   */
  metadata?: [[MetadataKeyT, number]];
  /**
   * privateMetadata is an arbitrary value. This is NOT exported by default, as
   * it may contain private instance data.
   */
  privateMetadata?: { [key: string]: any };
  /**
   * billingMetadata carries additional metadata how this event relates to
   * product billing.
   */
  billingMetadata?: {
    /**
     * Billing product ID associated with the event.
     */
    product: BillingProductsT;

    /**
     * Billing category ID the event falls into.
     */
    category: BillingCategoriesT;
  };
};

interface TelemetrySubmitter {
  /**
   * Submits the event for export.
   */
  submit(event: TelemetryEventInput): void;
  /**
   * Finish any ongoing work and release any resources held, including flushing
   * buffers if one is configured.
   */
  complete(): void;
}

class SimpleSubmitter implements TelemetrySubmitter {
  constructor(
    private exporter: TelemetryExporter,
    private options: TelemetryRecordingOptions
  ) {}

  submit(event: TelemetryEventInput) {
    this.exporter
      .exportEvents([event])
      .catch((err) => this.options.errorHandler(err))
      .then(() => {});
  }

  complete() {}
}

/**
 * BatchSubmitter buffer events into batches for export.
 */
class BatchSubmitter implements TelemetrySubmitter {
  private events = new Subject<TelemetryEventInput>();
  private completeEvents = new Subject<void>();

  constructor(
    private exporter: TelemetryExporter,
    private options: TelemetryRecordingOptions
  ) {
    this.events
      .pipe(
        takeUntil(this.completeEvents),
        bufferTime(options.bufferTimeMs, null, options.bufferMaxSize),
        concatMap((events) =>
          events.length > 0 ? exporter.exportEvents(events) : EMPTY
        ),
        catchError((error) => {
          options.errorHandler(error);
          return [];
        })
      )
      .subscribe();
  }

  submit(event: TelemetryEventInput) {
    if (!this.events.closed) {
      this.events.next(event);
    } else {
      // Best-effort attempt to export after events are closed. We log an error
      // after succeeding to indicate something probably isn't implemented right.
      this.exporter
        .exportEvents([event])
        .catch((err) => this.options.errorHandler(err))
        .then(() =>
          this.options.errorHandler("submitted event after complete")
        );
    }
  }

  complete() {
    // Flush any buffered events
    this.completeEvents.next();
    // Finish work and unsubscribe
    this.events.complete();
    this.events.unsubscribe();
  }
}

/**
 * EventRecorder is the standard implementation of TelemetryEventRecorder. It
 * applies processors and then submits events to the underlying EventSubmitter
 * for export.
 */
class EventRecorder<
  FeatureT extends string,
  ActionT extends string,
  MetadataKeyT extends string,
  BillingProductsT extends string,
  BillingCategoriesT extends string
> implements
    TelemetryRecorder<
      FeatureT,
      ActionT,
      MetadataKeyT,
      BillingProductsT,
      BillingCategoriesT
    >
{
  constructor(
    private source: TelemetrySource,
    private submitter: TelemetrySubmitter,
    private processors: TelemetryProcessor[] = []
  ) {}

  /**
   * Record an event.
   */
  recordEvent(
    feature: FeatureT,
    action: ActionT,
    parameters?: TelemetryEventParameters<
      MetadataKeyT,
      BillingProductsT,
      BillingCategoriesT
    >
  ): void {
    let apiEvent = this.makeAPIEvent(feature, action, parameters);
    for (const processor of this.processors) {
      processor.processEvent(apiEvent);
    }
    this.submitter.submit(apiEvent);
  }

  /**
   * Converts an event record into an Telemetry API event.
   */
  private makeAPIEvent(
    feature: string,
    action: string,
    parameters?: TelemetryEventParameters<
      MetadataKeyT,
      BillingProductsT,
      BillingCategoriesT
    >
  ): TelemetryEventInput {
    return {
      feature,
      action,
      source: this.source,
      parameters: parameters
        ? {
            version: parameters.version || 0,
            metadata: parameters.metadata
              ? parameters.metadata.map((pair) => {
                  return { key: pair[0], value: pair[1] };
                })
              : undefined,
            privateMetadata: parameters.privateMetadata
              ? JSON.stringify(parameters.privateMetadata)
              : undefined,
            billingMetadata: parameters.billingMetadata,
          }
        : {
            version: 0,
          },
    };
  }
}
