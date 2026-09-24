export type UnsupportedReasonCode =
    | "capability-absent"
    | "refinement-rejected"
    | "structure-unsupported"
    | "endpoint-profile-missing"
    | "exactness-unproven"
    | "known-non-equivalent";

export interface UnsupportedReason {
    readonly code: UnsupportedReasonCode;
    readonly message: string;
}

export interface DirectRealization {
    readonly kind: "direct";
}

export interface DerivedRealization {
    readonly kind: "derived";
    readonly explanation: string;
}

export interface UnsupportedRealization {
    readonly kind: "unsupported";
    readonly reason: UnsupportedReason;
}

export type RealizationResult =
    DirectRealization | DerivedRealization | UnsupportedRealization;

export function directRealization(): DirectRealization {
    return DIRECT_REALIZATION;
}

export function derivedRealization(explanation: string): DerivedRealization {
    const normalized = explanation.trim();

    if (normalized.length === 0) {
        throw new Error("Derived realization explanation must not be empty.");
    }

    return Object.freeze({
        kind: "derived",
        explanation: normalized,
    });
}

export function unsupportedReason(
    code: UnsupportedReasonCode,
    message: string,
): UnsupportedReason {
    const normalized = message.trim();

    if (normalized.length === 0) {
        throw new Error("Unsupported realization message must not be empty.");
    }

    return Object.freeze({
        code,
        message: normalized,
    });
}

export function unsupportedRealization(
    reason: UnsupportedReason,
): UnsupportedRealization {
    return Object.freeze({
        kind: "unsupported",
        reason,
    });
}

const DIRECT_REALIZATION: DirectRealization = Object.freeze({
    kind: "direct",
});
