export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  /**
   * An RFC 3339-encoded UTC date string, such as 1973-11-29T21:33:09Z. This value can be parsed into a
   * JavaScript Date using Date.parse. To produce this value from a JavaScript Date instance, use
   * Date#toISOString.
   */
  DateTime: { input: any; output: any; }
  /** A valid JSON value. */
  JSONValue: { input: any; output: any; }
};

/** Represents a null return value. */
export type EmptyResponse = {
  __typename?: 'EmptyResponse';
  /** A dummy null value. */
  alwaysNil?: Maybe<Scalars['String']['output']>;
};

/** Billing-related metadata for a telemetry event. */
export type TelemetryEventBillingMetadataInput = {
  /**
   * Billing category ID the event falls into.
   *
   * IDs must come from a static set of values in libraries - it is left as a
   * string in the API to allow some flexibility.
   */
  category: Scalars['String']['input'];
  /**
   * Billing product ID associated with the event.
   *
   * IDs must come from a static set of values in libraries - it is left as a
   * string in the API to allow some flexibility.
   */
  product: Scalars['String']['input'];
};

/** Properties comprising a telemetry V2 event that can be reported by a client. */
export type TelemetryEventInput = {
  /**
   * Action associated with the event in camelCase, e.g. 'pageView'.
   *
   * Action names must come from a static set of values in libraries - it is
   * left as a string in the API to allow some flexibility.
   */
  action: Scalars['String']['input'];
  /**
   * Feature associated with the event in camelCase, e.g. 'myFeature'.
   *
   * Feature names must come from a static set of values in libraries - it is
   * left as a string in the API to allow some flexibility.
   */
  feature: Scalars['String']['input'];
  /**
   * Optional marketing campaign tracking parameters.
   *
   * 🚨 SECURITY: This metadata is NEVER exported from private Sourcegraph instances,
   * and is only exported for events tracked in the public Sourcegraph.com instance.
   */
  marketingTracking?: InputMaybe<TelemetryEventMarketingTrackingInput>;
  /** Parameters of the event. */
  parameters: TelemetryEventParametersInput;
  /** Information about where this event came from. */
  source: TelemetryEventSourceInput;
  /**
   * Timestamp at which the time was recorded. If not provided, a timestamp is
   * generated when the server receives the event, but this does not guarantee
   * consistent ordering or accuracy.
   *
   * This parameter is only available in Sourcegraph 5.2.5 and later.
   */
  timestamp?: InputMaybe<Scalars['DateTime']['input']>;
};

/**
 * Marketing campaign tracking parameters for a telemetry V2 event.
 *
 * 🚨 SECURITY: This metadata is NEVER exported from private Sourcegraph instances,
 * and is only exported for events tracked in the public Sourcegraph.com instance.
 */
export type TelemetryEventMarketingTrackingInput = {
  /** Cohort ID to identify the user as part of a specific A/B test. */
  cohortID?: InputMaybe<Scalars['String']['input']>;
  /** Device session ID to identify the user's session. */
  deviceSessionID?: InputMaybe<Scalars['String']['input']>;
  /** First URL the user visited in their current session. */
  firstPageSeenURL?: InputMaybe<Scalars['String']['input']>;
  /** Initial URL the user landed on. */
  firstSourceURL?: InputMaybe<Scalars['String']['input']>;
  /** URL the user last visited, in their current session. */
  lastPageSeenURL?: InputMaybe<Scalars['String']['input']>;
  /** Last source URL visited by the user. */
  lastSourceURL?: InputMaybe<Scalars['String']['input']>;
  /** Most recent referrer URL, in their current session. */
  mostRecentReferrerURL?: InputMaybe<Scalars['String']['input']>;
  /** Referrer URL that refers the user to Sourcegraph. */
  referrer?: InputMaybe<Scalars['String']['input']>;
  /** First URL the user visited in their current session. */
  sessionFirstURL?: InputMaybe<Scalars['String']['input']>;
  /** Session referrer URL for the user. */
  sessionReferrer?: InputMaybe<Scalars['String']['input']>;
  /** URL the event occurred on. */
  url?: InputMaybe<Scalars['String']['input']>;
  /** UTM campaign tracking parameters, in their current session. */
  utmCampaign?: InputMaybe<Scalars['String']['input']>;
  /** UTM content tracking parameters, in their current session. */
  utmContent?: InputMaybe<Scalars['String']['input']>;
  /** UTM medium tracking parameters, in their current session. */
  utmMedium?: InputMaybe<Scalars['String']['input']>;
  /** UTM source tracking parameters, in their current session. */
  utmSource?: InputMaybe<Scalars['String']['input']>;
  /** UTM term tracking parameters, in their current session. */
  utmTerm?: InputMaybe<Scalars['String']['input']>;
};

/** A single, PII-free metadata item for telemetry V2 events. */
export type TelemetryEventMetadataInput = {
  /** The key identifying this metadata entry. */
  key: Scalars['String']['input'];
  /**
   * Numeric value associated with the key. Enforcing numeric values eliminates
   * risks of accidentally shipping sensitive or private data.
   *
   * The value type in the schema is JSONValue for flexibility, but we ONLY
   * accept numeric values (integers and floats) - any other value will be
   * rejected.
   */
  value: Scalars['JSONValue']['input'];
};

/** Properties of a telemetry V2 event. */
export type TelemetryEventParametersInput = {
  /** Billing-related metadata. */
  billingMetadata?: InputMaybe<TelemetryEventBillingMetadataInput>;
  /**
   * Optional interaction ID that can be provided to indicate the interaction
   * this event belongs to. It overrides the X-Sourcegraph-Interaction-ID header
   * if one is set on the request recording the event.
   *
   * This parameter is only available in Sourcegraph 5.2.4 and later.
   */
  interactionID?: InputMaybe<Scalars['String']['input']>;
  /** Strictly typed metadata that must not contain any sensitive data or PII. */
  metadata?: InputMaybe<Array<TelemetryEventMetadataInput>>;
  /**
   * Private metadata in JSON format. Unlike metadata, values can be of any type,
   * not just numeric.
   *
   * 🚨 SECURITY: This metadata is NOT exported from instances by default, as it
   * can contain arbitrarily-shaped data that may accidentally contain sensitive
   * or private contents.
   */
  privateMetadata?: InputMaybe<Scalars['JSONValue']['input']>;
  /**
   * Version of the event parameters, used for indicating the "shape" of this
   * event's metadata.
   */
  version: Scalars['Int']['input'];
};

/** Properties comprising the source of a telemetry V2 event reported by a client. */
export type TelemetryEventSourceInput = {
  /** Source client of the event. */
  client: Scalars['String']['input'];
  /** Version of the source client of the event. */
  clientVersion?: InputMaybe<Scalars['String']['input']>;
};

/** Mutations for recording events from clients. */
export type TelemetryMutation = {
  __typename?: 'TelemetryMutation';
  /**
   * Record a batch of telemetry events.
   *
   * ❗ Do not use this directly when recording events in-product - use the
   * @sourcegraph/telemetry package, or equivalent, instead.
   */
  recordEvents?: Maybe<EmptyResponse>;
};


/** Mutations for recording events from clients. */
export type TelemetryMutationRecordEventsArgs = {
  events: Array<TelemetryEventInput>;
};
