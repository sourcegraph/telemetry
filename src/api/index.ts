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
  /** Optional marketing campaign tracking parameters. */
  marketingTracking?: InputMaybe<TelemetryEventMarketingTrackingInput>;
  /** Parameters of the event. */
  parameters: TelemetryEventParametersInput;
  /** Information about where this event came from. */
  source: TelemetryEventSourceInput;
};

/**
 * Marketing campaign tracking parameters for a telemetry V2 event.
 *
 * By default, this metadata is assumed to be unsafe for export from an instance.
 */
export type TelemetryEventMarketingTrackingInput = {
  /** Cohort ID to identify the user as part of a specific A/B test. */
  cohortID?: InputMaybe<Scalars['String']['input']>;
  /** Device session ID to identify the user's session. */
  deviceSessionID?: InputMaybe<Scalars['String']['input']>;
  /** Initial URL the user landed on. */
  firstSourceURL?: InputMaybe<Scalars['String']['input']>;
  /** Last source URL visited by the user. */
  lastSourceURL?: InputMaybe<Scalars['String']['input']>;
  /** Referrer URL that refers the user to Sourcegraph. */
  referrer?: InputMaybe<Scalars['String']['input']>;
  /** First URL the user visited in their current session. */
  sessionFirstURL?: InputMaybe<Scalars['String']['input']>;
  /** Session referrer URL for the user. */
  sessionReferrer?: InputMaybe<Scalars['String']['input']>;
  /** URL the event occurred on. */
  url?: InputMaybe<Scalars['String']['input']>;
};

/** Properties of a telemetry V2 event. */
export type TelemetryEventParametersInput = {
  /** Billing-related metadata. */
  billingMetadata?: InputMaybe<TelemetryEventBillingMetadataInput>;
  /** Strictly typed metadata that must not contain any sensitive data or PII. */
  metadata?: InputMaybe<Array<TelemetryEventMetadataInput>>;
  /**
   * Private metadata in JSON format. Unlike metadata, values can be of any type,
   * not just numeric.
   *
   * By default, this metadata is assumed to be unsafe for export from an instance.
   */
  privateMetadata?: InputMaybe<Scalars['JSONValue']['input']>;
  /**
   * Version of the event parameters, used for indicating the "shape" of this
   * event's metadata.
   */
  version: Scalars['Int']['input'];
};

/** A single, PII-free metadata item for telemetry V2 events. */
export type TelemetryEventMetadataInput = {
  /**
   * Metadata keys must come from a static set of predefined metadata keys in
   * libraries - it is left as a string in the API to allow some flexibility.
   */
  key: Scalars['String']['input'];
  /** Numeric value associated with the key. */
  value: Scalars['Int']['input'];
};

/** Properties comprising the source of a telemetry V2 event reported by a client. */
export type TelemetryEventSourceInput = {
  /**
   * Source client of the event. Clients must come from a static set of predefined
   * metadata keys in libraries - it is left as a string in the API to allow some
   * backwards/forwards flexibility.
   */
  client: Scalars['String']['input'];
  /** Version of the source client of the event. */
  clientVersion?: InputMaybe<Scalars['String']['input']>;
};
