// featureActionRegex is used to validate feature and action names. Values must:
// - Start with a lowercase letter
// - Contain only letters, and dashes and dots as delimters
// - Not contain any whitespace
//
// 🚨 KEEP IN SYNC WITH with lib/telemetrygateway.featureActionRegex in the monorepo
const featureActionRegex = /^[a-z][a-zA-Z-\.]+$/;

// featureActionMaxLength is the maximum length of a feature or action name.
const featureActionMaxLength = 64;

// validateEventFeatureAction validates the given feature and action names,
// throwing an error if they are invalid.
export function validateEventFeatureAction(
  feature: string,
  action: string
): void {
  if (feature === "" || action === "") {
    throw new Error("'feature', 'action' must both be provided");
  }
  if (feature.length > featureActionMaxLength) {
    throw new Error("'feature' must be less than 64 characters");
  }
  if (action.length > featureActionMaxLength) {
    throw new Error("'action' must be less than 64 characters");
  }
  if (!featureActionRegex.test(feature)) {
    throw new Error(
      "'feature' must start with a lowercase letter and contain only letters, dashes, and dots"
    );
  }
  if (!featureActionRegex.test(action)) {
    throw new Error(
      "'action' must start with a lowercase letter and contain only letters, dashes, and dots"
    );
  }
}
