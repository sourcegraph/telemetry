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

enum BillingProducts {
  A = "A",
}

enum BillingCategories {
  B = "B",
}

class ExampleTelemetryProvider extends TelemetryRecorderProvider<
  BillingProducts,
  BillingCategories
> {}

type EnumObject = {
  key: "foo" | "bar";
};

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

    // ✅ const string
    const constString = "asdfasdf";
    recorder.recordEvent(constString, "view");

    // ❌ variable string
    // const varString: string = "asdf";
    // recorder.recordEvent(varString, "error");

    // ✅ string literals
    recorder.recordEvent("foobar", "asdfafsd", {
      metadata: {
        foo: 12,
        bar: 13,
        // Disallowed
        // ["asdf" as string]: 12,
      },
    });

    // ❌ string var
    // recorder.recordEvent("fooBar" as string, "view");

    // ❌ type StringObject = { key: string };
    // const stringObject: StringObject = { key: "foo" };
    // recorder.recordEvent(stringObject.key, "asdf");

    // ✅ type EnumObject = { key: "foo" | "bar" };
    const enumObject: EnumObject = { key: "foo" };
    recorder.recordEvent(enumObject.key, "asdf");

    // Is buffered
    expect(exporter.getExported().length).toBe(0);

    // Buffer is flushed
    provider.unsubscribe();
    expect(exporter.getExported().length).toBe(3);

    // After close, we still receive events as a fallback, after a brief time
    recorder.recordEvent("fooBar", "view");
    await new Promise((resolve) =>
      setTimeout(() => {
        resolve(expect(exporter.getExported().length).toBe(4));
      }, 5)
    );
  });

  test("can disable buffering of events", () => {
    const exporter = new TestTelemetryExporter();
    const provider = new TelemetryRecorderProvider<
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
    recorder.recordEvent("fooBar", "view");
    expect(exporter.getExported().length).toBe(1);
    recorder.recordEvent("barBaz", "error", {
      version: 0,
      metadata: { foo: 12 },
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

    recorder.recordEvent("fooBar", "view");
    recorder.recordEvent("barBaz", "error", {
      version: 0,
      metadata: { foo: 12 },
      privateMetadata: {},
    });
    provider.unsubscribe();

    let exported = exporter.getExported();
    expect(
      exported.find((e) => e.feature == "barBaz")?.parameters.metadata
    ).toEqual([{ key: "foo", value: 12 }]);
    exported.forEach((event) => {
      expect(event.parameters.billingMetadata).toEqual(billingMetadata);
    });
    // Our custom callback processor works too
    expect(exported.length).toBe(processed.length);

    // Record with custom billing metadata
    const customBillingMetadata = {
      category: BillingCategories.B,
      product: BillingProducts.A,
    };
    recorder.recordEvent("fooBar", "error", {
      version: 0,
      billingMetadata: customBillingMetadata,
    });
    expect(exporter.getExported().pop()?.parameters.billingMetadata).toEqual(
      customBillingMetadata
    );
  });
});
