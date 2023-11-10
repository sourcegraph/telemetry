import { EMPTY, Subject } from "rxjs";
import { bufferTime, catchError, concatMap, takeUntil } from "rxjs/operators";

import { TelemetryExporter } from "./exporters";
import { TelemetryProcessor } from "./processors";
import { TelemetryEventInput, TelemetryEventMetadataInput } from "./api";

/**
 * Make everything available from the top level.
 */
export * from "./exporters";
export * from "./processors";
export * from "./api";

/**
 * KnownString enforces that:
 *
 * - T must be a string
 * - string must NOT be a T
 *
 * This effectively requires T to NOT be an arbitrary string - it must be
 * a string value known ahead of time.
 */
export type KnownString<Value extends string> = string extends Value
  ? "INPUT TYPE ERROR: string type is too broad, should be a known value"
  : Value;

/**
 * KnownKeys enforces that:
 *
 * - Key must be an object with string keys (Key) and number values
 * - an object with arbitary strings as keys must NOT be a T
 *
 * This effectively requires Key to NOT be an arbitrary string - keys must be
 * known ahead of time.
 */
export type KnownKeys<
  Key extends string,
  T extends { [key in Key]: number }
> = {
  [key: string]: number;
} extends T
  ? {
      "INPUT TYPE ERROR: key type is too broad, keys should be known values"?: number;
    }
  : T;

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
  BillingProducts extends string,
  BillingCategories extends string
> {
  /**
   * Record a telemetry event.
   *
   * @param feature must be snakeCase and '.'-delimited, e.g. 'myFeature.subFeature'.
   * Features should NOT include the client platform, e.g. 'vscode' - information
   * about the client is automatically attached to all events.
   * @param action must be snakeCase and simple, e.g. 'submit', 'failed', or
   * 'success', in the context of feature.
   * @param parameters should be as described in {@link TelemetryEventParameters}.
   *
   * Recorded events can be exported from the connected Sourcegraph instance to
   * Sourcegraph's Telemetry Gateway for storage in BigQuery, and are
   * automatically translated into the event_logs table for reference on the
   * instance as well.
   *
   * To learn more, see https://docs.sourcegraph.com/dev/background-information/telemetry
   */
  recordEvent<
    Feature extends string,
    Action extends string,
    MetadataKey extends string
  >(
    feature: KnownString<Feature>,
    action: KnownString<Action>,
    parameters?: TelemetryEventParameters<
      KnownKeys<MetadataKey, { [key in MetadataKey]: number }>,
      BillingProducts,
      BillingCategories
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
  bufferTimeMs: 0, // disabled by default
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
  BillingProducts extends string,
  BillingCategories extends string
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
  ): TelemetryRecorder<BillingProducts, BillingCategories> {
    return new EventRecorder(
      this.source,
      this.submitter,
      additionalProcessors
        ? this.processors.concat(additionalProcessors)
        : this.processors
    );
  }

  /**
   * Clears any ongoing work and releases buffer resources. It must be
   * called when the provider is no longer needed.
   *
   * Implements rxjs Unsubscribable.
   */
  unsubscribe(): void {
    this.submitter.unsubscribe();
  }
}

/**
 * TelemetryEventParameters describes additional, optional parameters for recording events.
 */
export type TelemetryEventParameters<
  Metadata extends { [key: string]: number },
  BillingProducts extends string,
  BillingCategories extends string
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
   * The restriction to only permit numeric data is intentional, as strings
   * can accidentally contain sensitive data we cannot export by default.
   * To learn more, see
   * https://docs.sourcegraph.com/dev/background-information/telemetry#sensitive-attributes.
   *
   * To represent categorization metadata using numeric values, try to distill
   * the value space into a known set, where values can be represented using
   * a numeric identifier.
   */
  metadata?: Metadata;
  /**
   * privateMetadata is an arbitrary value. This is NOT exported by default, as
   * its arbitrary shape allows for sensitive data we should not export by default.
   * To record metadata that can be exported by default, use the metadata field.
   *
   * Certain scenarios may have agreements allowing us to export non-numeric
   * metadata, or have safe metadata that cannot be represented as numeric values.
   * In these scenarios, events may be allowlisted to permit the export of its
   * privateMetadata - to learn more, see
   * https://docs.sourcegraph.com/dev/background-information/telemetry#sensitive-attributes.
   *
   * Even when not exported, privateMetadata will be retained on-instance in the
   * event_logs table.
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
    product: BillingProducts;

    /**
     * Billing category ID the event falls into.
     */
    category: BillingCategories;
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
   *
   * Implements rxjs Unsubscribable.
   */
  unsubscribe(): void;
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

  unsubscribe(): void {}
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

  unsubscribe(): void {
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
  /**
   * BillingProductsT enumerates known billing product names.
   */
  BillingProducts extends string,
  /**
   * BillingCategoriesT enumerates known billing category names.
   */
  BillingCategories extends string
> implements TelemetryRecorder<BillingProducts, BillingCategories>
{
  constructor(
    private source: TelemetrySource,
    private submitter: TelemetrySubmitter,
    private processors: TelemetryProcessor[] = []
  ) {}

  /**
   * Record an event.
   */
  recordEvent<
    Feature extends string,
    Action extends string,
    MetadataKey extends string
  >(
    feature: KnownString<Feature>,
    action: KnownString<Action>,
    parameters?: TelemetryEventParameters<
      KnownKeys<MetadataKey, { [key in MetadataKey]: number }>,
      BillingProducts,
      BillingCategories
    >
  ): void {
    let apiEvent = {
      feature,
      action,
      source: this.source,
      parameters: parameters
        ? {
            version: parameters.version || 0,
            metadata: parameters.metadata
              ? Object.entries<number | undefined>(parameters.metadata).map(
                  ([key, value]): TelemetryEventMetadataInput => ({
                    key,
                    value: value || 0,
                  })
                )
              : undefined,
            privateMetadata: parameters.privateMetadata,
            billingMetadata: parameters.billingMetadata,
          }
        : {
            version: 0,
          },
    };
    for (const processor of this.processors) {
      processor.processEvent(apiEvent);
    }
    this.submitter.submit(apiEvent);
  }
}
