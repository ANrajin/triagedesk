import type { Component, IssueType, MissingInfo, Severity } from "../triage/schema.ts";

export type GoldEntry = {
    number: number,
    type: IssueType,
    severity: Severity | null,
    component: Component | null,
    missing_info: Array<MissingInfo>,
    notes: string,
    blind: boolean
}
