/**
 * Exposes the public cross-IO aggregation, rendering, and canonical-routed
 * cross-codec conformance APIs.
 *
 * @remarks
 * This package composes evidence produced by core/conformance and the adapter
 * packages; it does not redefine their semantic contracts or realization
 * classifications.
 *
 * @packageDocumentation
 */

export {
    buildInitialCrossIoConformanceMatrix,
    renderInitialCrossIoConformanceMatrixMarkdown,
} from "./initial-conformance-matrix.js";

export {
    runInitialCrossCodecRoundTrips,
    type CrossCodecRoundTripResult,
    type CrossCodecRoundTripRun,
} from "./cross-codec-round-trip.js";
