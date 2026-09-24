const CAPABILITY_SEGMENT_PATTERN = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;

declare const capabilityIdBrand: unique symbol;

export type CapabilityId = string & {
  readonly [capabilityIdBrand]: "CapabilityId";
};

export interface CapabilityIdParts {
  readonly segments: readonly [string, string, ...string[]];
  readonly version: number;
}

export class InvalidCapabilityIdError extends Error {
  public constructor(value: string, reason: string) {
    super(`Invalid capability ID "${value}": ${reason}`);
    this.name = "InvalidCapabilityIdError";
  }
}

function validateSegments(
  segments: readonly string[],
  source: string,
): asserts segments is readonly [string, string, ...string[]] {
  if (segments.length < 2) {
    throw new InvalidCapabilityIdError(
      source,
      "expected at least a namespace and capability name",
    );
  }

  for (const segment of segments) {
    if (!CAPABILITY_SEGMENT_PATTERN.test(segment)) {
      throw new InvalidCapabilityIdError(
        source,
        `segment "${segment}" must be lowercase kebab-case starting with a letter`,
      );
    }
  }
}

function validateVersion(version: number, source: string): void {
  if (!Number.isSafeInteger(version) || version < 1) {
    throw new InvalidCapabilityIdError(
      source,
      "version must be a positive safe integer",
    );
  }
}

export function createCapabilityId(
  segments: readonly [string, string, ...string[]],
  version: number,
): CapabilityId {
  const source = `${segments.join(".")}@${version}`;

  validateSegments(segments, source);
  validateVersion(version, source);

  return source as CapabilityId;
}

export function parseCapabilityId(value: string): CapabilityId {
  const separatorIndex = value.lastIndexOf("@");

  if (
    separatorIndex <= 0 ||
    separatorIndex !== value.indexOf("@") ||
    separatorIndex === value.length - 1
  ) {
    throw new InvalidCapabilityIdError(
      value,
      "expected exactly one @version suffix",
    );
  }

  const segments = value.slice(0, separatorIndex).split(".");
  const versionText = value.slice(separatorIndex + 1);

  validateSegments(segments, value);

  if (!/^[1-9][0-9]*$/.test(versionText)) {
    throw new InvalidCapabilityIdError(
      value,
      "version must be a canonical positive integer",
    );
  }

  const version = Number(versionText);
  validateVersion(version, value);

  return createCapabilityId(segments, version);
}

export function capabilityIdParts(id: CapabilityId): CapabilityIdParts {
  const separatorIndex = id.lastIndexOf("@");
  const segments = id.slice(0, separatorIndex).split(".");
  const version = Number(id.slice(separatorIndex + 1));

  validateSegments(segments, id);
  validateVersion(version, id);

  return Object.freeze({
    segments: Object.freeze([...segments]) as readonly [
      string,
      string,
      ...string[],
    ],
    version,
  });
}

export function capabilityIdKey(id: CapabilityId): string {
  return id;
}
