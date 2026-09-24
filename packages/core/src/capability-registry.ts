import {
  capabilityIdKey,
  type CapabilityId,
} from "./capability-id.js";
import {
  eraseCapabilityContract,
  type RegisteredCapabilityContract,
  type SemanticCapabilityContract,
} from "./capability-contract.js";

export class DuplicateCapabilityIdError extends Error {
  public constructor(id: CapabilityId) {
    super(`Capability "${id}" is already registered.`);
    this.name = "DuplicateCapabilityIdError";
  }
}

export class CapabilityRegistry {
  readonly #contracts = new Map<string, RegisteredCapabilityContract>();

  public get size(): number {
    return this.#contracts.size;
  }

  public register<TParameters>(
    contract: SemanticCapabilityContract<TParameters>,
  ): RegisteredCapabilityContract {
    const key = capabilityIdKey(contract.id);

    if (this.#contracts.has(key)) {
      throw new DuplicateCapabilityIdError(contract.id);
    }

    const registered = eraseCapabilityContract(contract);
    this.#contracts.set(key, registered);

    return registered;
  }

  public has(id: CapabilityId): boolean {
    return this.#contracts.has(capabilityIdKey(id));
  }

  public get(id: CapabilityId): RegisteredCapabilityContract | undefined {
    return this.#contracts.get(capabilityIdKey(id));
  }

  public list(): readonly RegisteredCapabilityContract[] {
    return Object.freeze(
      [...this.#contracts.values()].sort((left, right) =>
        left.id.localeCompare(right.id),
      ),
    );
  }
}
