import type { COMPONENTS } from "../triage/schema.ts";

export type GoldEntry = {
    number: number,
    type: "bug" | "feature" | "refactoring" | "discussion" | "other" | "unclear",
    severity: "critical" | "high" | "medium" | "low" | null,
    component: (typeof COMPONENTS)[number] | null,
    missing_info: Array<string>,
    notes: string,
    blind: boolean
}
