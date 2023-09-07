/**
 * This package reflects the internal shape of events as they are expected
 * by Sourcegraph's `mutation { telemetry { logEvent(...) } }`. It should only
 * be used by implementors of telemetry processors and exporters.
 *
 * These types should not be reported directly - events should only be created
 * by EventRecorders, processed by TelemetryProcessors, and exported by
 * TelemetryExporters.
 */

// TODO: Can we automatically generate these types from GraphQL schema?

/**
 * Properties comprising a telemetry V2 event that can be reported by a client.
 */
export type TelemetryEventInput = {
  /**
   * Name of the event.
   */
  name: string;

  /**
   * Information about where this event came from.
   */
  source: TelemetryEventSourceInput;

  /**
   * Parameters of the event.
   */
  parameters: TelemetryEventParametersInput;

  /**
   * Optional user associated with the event.
   */
  user?: TelemetryEventUserInput;

  /**
   * Optional marketing campaign tracking parameters.
   */
  marketingTracking?: TelemetryEventMarketingTrackingInput;
};

/**
 * Properties comprising the source of a telemetry V2 event reported by a client.
 */
export type TelemetryEventSourceInput = {
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
 * Properties of a telemetry V2 event.
 */
export type TelemetryEventParametersInput = {
  /**
   * Version of the event parameters, used for indicating the "shape" of this
   * event's metadata.
   */
  version: number;

  /**
   * Strictly typed metadata.
   */
  metadata?: TelemetryEventMetadataInput[];

  /**
   * Private metadata in JSON format. All keys and values must be strings.
   * By default, this metadata is assumed to be unsafe for export from an instance.
   */
  privateMetadata?: { [key: string]: string };

  /**
   * Billing-related metadata.
   */
  billingMetadata?: TelemetryEventBillingMetadataInput;
};

/**
 * A single, PII-free metadata item for telemetry V2 events.
 */
export type TelemetryEventMetadataInput = {
  key: string;
  value: number;
};

/**
 * User associated with a telemetry V2 event.
 */
export type TelemetryEventUserInput = {
  /**
   * Database user ID of signed in user.
   */
  userID: number;
  /**
   * Randomized unique identifier for client (i.e. stored in localstorage in web client).
   */
  anonymousUserID: string;
};

/**
 * Billing-related metadata for a telemetry event.
 */
export type TelemetryEventBillingMetadataInput = {
  /**
   Billing product ID associated with the event.
   */
  product: number;

  /**
   Billing category ID the event falls into.
   */
  category: number;
};

/**
 * Marketing campaign tracking parameters for a telemetry V2 event.
 */
export type TelemetryEventMarketingTrackingInput = {
  /**
   * URL the event occurred on.
   */
  url: string;

  /**
   * Initial URL the user landed on.
   */

  firstSourceURL: string;

  /**
   * Cohort ID to identify the user as part of a specific A/B test.
   */
  cohortID: string;

  /**
   * Referrer URL that refers the user to Sourcegraph.
   */
  referrer: string;

  /**
   * Last source URL visited by the user.
   */
  lastSourceURL: string;

  /**
   * Device session ID to identify the user's session.
   */
  deviceSessionID: string;

  /**
   * Session referrer URL for the user.
   */
  sessionReferrer: string;

  /**
   * First URL the user visited in their current session.
   */
  sessionFirstURL: string;
};
