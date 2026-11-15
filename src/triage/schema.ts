export const COMPONENTS = [
    "catalog", "cart-checkout", "orders", "payment", "shipping", "customers",
    "promotions", "admin-ui", "plugins", "core-platform", "other",
] as const;

export const triageSchema = {
    type: "object",
    properties: {
        type: { enum: ["bug", "feature", "refactoring", "discussion", "other", "unclear"] },
        severity: { enum: ["critical", "high", "medium", "low", null] },
        component: { enum: [...COMPONENTS, null] },
        missing_info: { type: "array", items: { type: "string" } },
    },
    required: ["type", "severity", "component", "missing_info"],
    additionalProperties: false,
} as const;