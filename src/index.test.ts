import {
  defaultEventRecordingOptions,
  TelemetryRecorderProvider,
  TelemetrySource,
  TelemetryEventInput,
  TestTelemetryExporter,
  CallbackTelemetryProcessor,
  BillingMetadataTelemetryProcessor,
} from ".";

const telemetrySource: TelemetrySource = { client: "test" };

/**
 * Example enum type to use as ExampleEventName
 */
enum Feature {
  FooBar = "FooBar",
  BarBaz = "BarBaz",
}

enum Action {
  View = "View",
  Error = "Error",
}

/**
 * Example enum type to use as EventMetadataKeyT
 */
enum MetadataKey {
  Foo = "Foo",
  Baz = "Baz",
}

enum BillingProducts {
  A = "A",
}

enum BillingCategories {
  B = "B",
}

class ExampleTelemetryProvider extends TelemetryRecorderProvider<
  Feature,
  Action,
  MetadataKey,
  BillingProducts,
  BillingCategories
> {}

describe("EventRecorderProvider", () => {
  test("should buffer events", async () => {
    const exporter = new TestTelemetryExporter();
    const provider = new ExampleTelemetryProvider(
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

    recorder.recordEvent(Feature.FooBar, Action.View);
    recorder.recordEvent(Feature.BarBaz, Action.Error, {
      metadata: [
        [MetadataKey.Foo, 12],
        [MetadataKey.Baz, 13],
      ],
    });

    // Is buffered
    expect(exporter.getExported().length).toBe(0);

    // Buffer is flushed
    provider.complete();
    expect(exporter.getExported().length).toBe(2);

    // After close, we still receive events as a fallback, after a brief time
    recorder.recordEvent(Feature.FooBar, Action.View);
    await new Promise((resolve) =>
      setTimeout(() => {
        resolve(expect(exporter.getExported().length).toBe(3));
      }, 5)
    );
  });

  test("can disable buffering of events", () => {
    const exporter = new TestTelemetryExporter();
    const provider = new TelemetryRecorderProvider<
      Feature,
      Action,
      MetadataKey,
      BillingProducts,
      BillingCategories
    >(
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
    recorder.recordEvent(Feature.FooBar, Action.View);
    expect(exporter.getExported().length).toBe(1);
    recorder.recordEvent(Feature.BarBaz, Action.Error, {
      version: 0,
      metadata: [[MetadataKey.Foo, 12]],
    });
    expect(exporter.getExported().length).toBe(2);
  });

  test("should process events", () => {
    const exporter = new TestTelemetryExporter();
    const billingMetadata = {
      category: "3",
      product: "12",
    };
    const processed: TelemetryEventInput[] = [];
    const provider = new TelemetryRecorderProvider<
      Feature,
      Action,
      MetadataKey,
      BillingProducts,
      BillingCategories
    >(
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

    recorder.recordEvent(Feature.FooBar, Action.View);
    recorder.recordEvent(Feature.BarBaz, Action.Error, {
      version: 0,
      metadata: [[MetadataKey.Foo, 12]],
      privateMetadata: {},
    });
    provider.complete();
    let exported = exporter.getExported();
    exporter.getExported().forEach((event) => {
      expect(event.parameters.billingMetadata).toEqual(billingMetadata);
      expect(
        event.parameters.privateMetadata === "{}" ||
          event.parameters.privateMetadata === undefined
      ).toBeTruthy();
    });
    // Our custom callback processor works too
    expect(exported.length).toBe(processed.length);

    // Record with custom billing metadata
    const customBillingMetadata = {
      category: BillingCategories.B,
      product: BillingProducts.A,
    };
    recorder.recordEvent(Feature.FooBar, Action.Error, {
      version: 0,
      billingMetadata: customBillingMetadata,
    });
    expect(exporter.getExported().pop()?.parameters.billingMetadata).toEqual(
      customBillingMetadata
    );
  });
});
