/**
 * Defines the authoritative registration set for Mailchemy's currently
 * implemented core semantic capabilities.
 *
 * @packageDocumentation
 */

import { CapabilityRegistry } from "./capability-registry.js";
import { logicalAndCapability } from "./capabilities/logical-and.js";
import { markReadCapability } from "./capabilities/mark-read.js";
import { hasAttachmentCapability } from "./capabilities/has-attachment.js";
import { subjectContainsCapability } from "./capabilities/subject-contains.js";

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
