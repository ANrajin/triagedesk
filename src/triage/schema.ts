export const TYPES = ["bug", "feature", "refactoring", "discussion", "other", "unclear"] as const;

export const SEVERITIES = ["critical", "high", "medium", "low"] as const;

export const COMPONENTS = [
    "catalog", "cart-checkout", "orders", "payment", "shipping", "customers",
    "promotions", "admin-ui", "plugins", "core-platform", "other",
] as const;

export type IssueType = (typeof TYPES)[number];
export type Severity = (typeof SEVERITIES)[number];
export type Component = (typeof COMPONENTS)[number];

export const triageSchema = {
    type: "object",
    properties: {
        type: { enum: [...TYPES] },
        severity: { enum: [...SEVERITIES, null] },
        component: { enum: [...COMPONENTS, null] },
        missing_info: { type: "array", items: { type: "string" } },
    },
    required: ["type", "severity", "component", "missing_info"],
    additionalProperties: false,
} as const;
