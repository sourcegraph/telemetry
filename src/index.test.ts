import {
  defaultEventRecordingOptions,
  TelemetryRecorderProvider,
  TelemetrySource,
} from ".";

import { TelemetryEventInput } from "./api";
import { TestTelemetryExporter } from "./exporters/testing";
import { CallbackTelemetryProcessor } from "./processors/callback";
import { BillingMetadataTelemetryProcessor } from "./processors/billing";

const telemetrySource: TelemetrySource = { client: "test" };

/**
 * Example enum type to use as ExampleEventName
 */
enum EventName {
  FooBar = "FooBar",
  BarBaz = "BarBaz",
}

/**
 * Example enum type to use as EventMetadataKeyT
 */
enum MetadataKey {
  Foo = "Foo",
}

describe("EventRecorderProvider", () => {
  test("should buffer events", async () => {
    const exporter = new TestTelemetryExporter();
    const provider = new TelemetryRecorderProvider<EventName, MetadataKey>(
      telemetrySource,
      exporter,
      undefined, // no processors
      {
        ...defaultEventRecordingOptions,
        errorHandler: console.debug, // we're expecting an "error" when we test the post-closed case
        bufferTimeMs: 10000000, // very large, so it must be flushed manually
      }
    );
    const recorder = provider.getRecorder();

    recorder.recordEvent(EventName.FooBar);
    recorder.recordEvent(EventName.BarBaz, {
      version: 0,
      metadata: [[MetadataKey.Foo, 12]],
    });

    // Is buffered
    expect(exporter.getExported().length).toBe(0);

    // Buffer is flushed
    provider.complete();
    expect(exporter.getExported().length).toBe(2);

    // After close, we still receive events as a fallback, after a brief time
    recorder.recordEvent(EventName.FooBar);
    await new Promise((resolve) =>
      setTimeout(() => {
        resolve(expect(exporter.getExported().length).toBe(3));
      }, 5)
    );
  });

  test("can disable buffering of events", () => {
    const exporter = new TestTelemetryExporter();
    const provider = new TelemetryRecorderProvider<EventName, MetadataKey>(
      telemetrySource,
      exporter,
      undefined, // no processors
      {
        ...defaultEventRecordingOptions,
        bufferTimeMs: 0, // disable buffering
      }
    );
    const recorder = provider.getRecorder();

    // Records should be immediately available
    recorder.recordEvent(EventName.FooBar);
    expect(exporter.getExported().length).toBe(1);
    recorder.recordEvent(EventName.BarBaz, {
      version: 0,
      metadata: [[MetadataKey.Foo, 12]],
    });
    expect(exporter.getExported().length).toBe(2);
  });

  test("should process events", () => {
    const exporter = new TestTelemetryExporter();
    const billingMetadata = {
      category: 3,
      product: 12,
    };
    const processed: TelemetryEventInput[] = [];
    const provider = new TelemetryRecorderProvider<EventName, MetadataKey>(
      telemetrySource,
      exporter,
      [
        new BillingMetadataTelemetryProcessor(billingMetadata),
        new CallbackTelemetryProcessor((event) => {
          processed.push(event);
        }),
      ],
      {
        ...defaultEventRecordingOptions,
        bufferTimeMs: 0, // disable buffering for ease of testing
      }
    );
    const recorder = provider.getRecorder();

    recorder.recordEvent(EventName.FooBar);
    recorder.recordEvent(EventName.BarBaz, {
      version: 0,
      metadata: [[MetadataKey.Foo, 12]],
    });
    provider.complete();
    let exported = exporter.getExported();
    exporter.getExported().forEach((event) => {
      expect(event.parameters.billingMetadata).toEqual(billingMetadata);
    });
    // Our custom callback processor works too
    expect(exported.length).toBe(processed.length);

    // Record with custom billing metadata
    const customBillingMetadata = {
      category: 12,
      product: 100,
    };
    recorder.recordEvent(EventName.FooBar, {
      version: 0,
      billingMetadata: customBillingMetadata,
    });
    expect(exporter.getExported().pop()?.parameters.billingMetadata).toEqual(customBillingMetadata);
  });
});
