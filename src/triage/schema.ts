export const TYPES = ["bug", "feature", "refactoring", "discussion", "other", "unclear"] as const;

export const SEVERITIES = ["critical", "high", "medium", "low"] as const;

export const COMPONENTS = [
    "catalog", "cart-checkout", "orders", "payment", "shipping", "customers",
    "promotions", "admin-ui", "plugins", "core-platform", "other",
] as const;

export type IssueType = (typeof TYPES)[number];
export type Severity = (typeof SEVERITIES)[number];
export type Component = (typeof COMPONENTS)[number];

export const MISSING_INFO = [
    "description", "problem_statement", "expected_behavior",
    "steps_to_reproduce", "version_or_environment", "logs_or_screenshots",
] as const;

export type MissingInfo = (typeof MISSING_INFO)[number];

export const triageSchema = {
    type: "object",
    properties: {
        type: { enum: [...TYPES] },
        severity: { enum: [...SEVERITIES, null] },
        component: { enum: [...COMPONENTS, null] },
        missing_info: { type: "array", items: { enum: [...MISSING_INFO] }, uniqueItems: true },
    },
    required: ["type", "severity", "component", "missing_info"],
    additionalProperties: false,
} as const;

export type TriageResult = {
    type: IssueType,
    severity: Severity | null,
    component: Component | null,
    missing_info: Array<MissingInfo>
}
