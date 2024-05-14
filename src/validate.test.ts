import { validateEventFeatureAction } from "./validate";

describe("validateEventFeatureAction", () => {
  const tests = [
    {
      name: "feature is empty",
      feature: "",
      action: "valid",
      wantErr: "'feature', 'action' must both be provided",
    },
    {
      name: "action is empty",
      feature: "valid",
      action: "",
      wantErr: "'feature', 'action' must both be provided",
    },
    {
      name: "feature too long",
      feature: "a".repeat(67),
      action: "valid",
      wantErr: "'feature' must be less than 64 characters",
    },
    {
      name: "action too long",
      feature: "valid",
      action: "a".repeat(67),
      wantErr: "'action' must be less than 64 characters",
    },
    {
      name: "feature starts with uppercase",
      feature: "Invalid",
      action: "valid",
      wantErr:
        "'feature' must start with a lowercase letter and contain only letters, dashes, and dots",
    },
    {
      name: "action starts with uppercase",
      feature: "valid",
      action: "Invalid",
      wantErr:
        "'action' must start with a lowercase letter and contain only letters, dashes, and dots",
    },
    {
      name: "feature contains invalid characters",
      feature: "invalid_feature!",
      action: "valid",
      wantErr:
        "'feature' must start with a lowercase letter and contain only letters, dashes, and dots",
    },
    {
      name: "action contains invalid characters",
      feature: "valid",
      action: "invalid_action!",
      wantErr:
        "'action' must start with a lowercase letter and contain only letters, dashes, and dots",
    },
    {
      name: "valid feature and action 1",
      feature: "valid.feature",
      action: "valid-action",
    },
    {
      name: "valid feature and action 2",
      feature: "validFeature.foobar",
      action: "valid.action",
    },
  ];

  tests.forEach(({ name, feature, action, wantErr }) => {
    it(name, () => {
      if (wantErr) {
        expect(() => validateEventFeatureAction(feature, action)).toThrowError(
          wantErr
        );
      } else {
        expect(() => validateEventFeatureAction(feature, action)).not.toThrow();
      }
    });
  });
});
