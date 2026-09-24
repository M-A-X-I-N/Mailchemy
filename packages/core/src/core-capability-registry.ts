import { CapabilityRegistry } from "./capability-registry.js";
import { subjectContainsCapability } from "./capabilities/subject-contains.js";

export function registerCoreSemanticCapabilities(
  registry: CapabilityRegistry,
): void {
  registry.register(subjectContainsCapability);
}

export function createCoreCapabilityRegistry(): CapabilityRegistry {
  const registry = new CapabilityRegistry();
  registerCoreSemanticCapabilities(registry);
  return registry;
}
