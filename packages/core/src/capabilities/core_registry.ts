/**
 * Defines the authoritative registration set for Mailchemy's currently
 * implemented core semantic capabilities.
 *
 * @packageDocumentation
 */

import { CapabilityRegistry } from "./registry.js";
import { logicalAndCapability } from "./builtins/logical_and.js";
import { markReadCapability } from "./builtins/mark_read.js";
import { hasAttachmentCapability } from "./builtins/has_attachment.js";
import { subjectContainsCapability } from "./builtins/subject_contains.js";

/**
 * Registers every currently implemented core semantic capability into an
 * existing registry.
 *
 * @remarks
 * This function establishes the implementation's core catalog; it does not
 * imply that every target can directly realize every registered capability.
 *
 * @param registry Registry to populate with core contracts.
 * @throws DuplicateCapabilityIdError If the target registry already contains
 * any core identity.
 */
export function registerCoreSemanticCapabilities(
    registry: CapabilityRegistry,
): void {
    registry.register(subjectContainsCapability);
    registry.register(hasAttachmentCapability);
    registry.register(markReadCapability);
    registry.register(logicalAndCapability);
}

/**
 * Creates a fresh registry containing the full current core capability catalog.
 *
 * @returns A new registry populated by {@link registerCoreSemanticCapabilities}.
 */
export function createCoreCapabilityRegistry(): CapabilityRegistry {
    const registry = new CapabilityRegistry();
    registerCoreSemanticCapabilities(registry);
    return registry;
}
