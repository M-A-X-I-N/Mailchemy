import {
  createActionExpression,
  createCapabilitySpecimen,
  decodedNative,
  defineSemanticCodec,
  encodedNative,
  markReadCapability,
  nativeDecodeReason,
  opaqueNative,
  unsupportedNativeDecode,
  unsupportedRealization,
  unsupportedReason,
  type CanonicalExpression,
} from "@mailchemy/core";

export type SieveNative = string;

interface Token {
  readonly kind: "identifier" | "tag" | "string" | "punctuation";
  readonly value: string;
}

interface ParsedScript {
  readonly requiredExtensions: ReadonlySet<string>;
  readonly statement: ParsedStatement;
}

type ParsedStatement =
  | { readonly kind: "addflag"; readonly flags: readonly string[] }
  | {
      readonly kind: "if";
      readonly condition: ParsedCondition;
      readonly statement: ParsedStatement;
    };

type ParsedCondition =
  | {
      readonly kind: "header-contains";
      readonly comparator: string;
      readonly headerName: string;
      readonly key: string;
    }
  | {
      readonly kind: "allof";
      readonly operands: readonly ParsedCondition[];
    };

class SieveParseError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = "SieveParseError";
  }
}

class SieveUnsupportedConstructError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = "SieveUnsupportedConstructError";
  }
}

export const sieveCodec = defineSemanticCodec<SieveNative>({
  id: "sieve.initial@1",
  encode: encodeSieve,
  decode: decodeSieve,
});

function encodeSieve(expression: CanonicalExpression) {
  if (
    expression.kind === "action" &&
    expression.specimen.capabilityId === markReadCapability.id
  ) {
    return encodedNative('require "imap4flags";\n\naddflag "\\\\Seen";\n');
  }

  if (containsSubjectCondition(expression)) {
    return unsupportedRealization(
      unsupportedReason(
        "exactness-unproven",
        "Sieve header :contains does not prove the NFC plus Unicode-lowercase comparison required by core.condition.subject.contains@1.",
      ),
    );
  }

  return unsupportedRealization(
    unsupportedReason(
      "capability-absent",
      "The minimal Sieve codec only encodes the initial mark-read action exactly.",
    ),
  );
}

function decodeSieve(native: SieveNative) {
  let parsed: ParsedScript;

  try {
    parsed = parseScript(native);
  } catch (error) {
    if (error instanceof SieveUnsupportedConstructError) {
      return opaqueNative(
        native,
        "Sieve construct is outside the minimal initial codec: " +
          error.message,
      );
    }

    return unsupportedNativeDecode(
      nativeDecodeReason(
        "invalid-native",
        error instanceof Error
          ? error.message
          : "Sieve input could not be parsed.",
      ),
    );
  }

  if (containsParsedSubjectCondition(parsed.statement)) {
    return unsupportedNativeDecode(
      nativeDecodeReason(
        "exactness-unproven",
        "Sieve Subject :contains semantics are understood, but their comparator/normalization contract is not exactly core.condition.subject.contains@1.",
      ),
    );
  }

  if (parsed.statement.kind === "addflag") {
    if (!parsed.requiredExtensions.has("imap4flags")) {
      return unsupportedNativeDecode(
        nativeDecodeReason(
          "invalid-native",
          'Sieve addflag requires require "imap4flags".',
        ),
      );
    }

    if (isExactSeenAddition(parsed.statement.flags)) {
      return decodedNative(
        createActionExpression(
          createCapabilitySpecimen(markReadCapability, null),
        ),
      );
    }

    return unsupportedNativeDecode(
      nativeDecodeReason(
        "semantic-unsupported",
        "The initial Sieve codec only maps addflag when it adds exactly the \\Seen system flag.",
      ),
    );
  }

  return opaqueNative(
    native,
    "Parsed Sieve syntax is outside the exact initial semantic mapping.",
  );
}

function containsSubjectCondition(expression: CanonicalExpression): boolean {
  if (expression.kind === "condition") {
    return (
      expression.specimen.capabilityId === "core.condition.subject.contains@1"
    );
  }

  if (expression.kind === "and") {
    return expression.operands.some(containsSubjectCondition);
  }

  if (expression.kind === "rule") {
    return containsSubjectCondition(expression.condition);
  }

  return false;
}

function containsParsedSubjectCondition(statement: ParsedStatement): boolean {
  return statement.kind === "if";
}

function isExactSeenAddition(flags: readonly string[]): boolean {
  return flags.length === 1 && flags[0]?.toLowerCase() === "\\seen";
}

function parseScript(source: string): ParsedScript {
  const parser = new Parser(tokenize(source));
  const requiredExtensions = parser.parseRequirePrefix();
  const statement = parser.parseStatement();
  parser.expectEnd();

  return {
    requiredExtensions,
    statement,
  };
}

class Parser {
  private index = 0;

  public constructor(private readonly tokens: readonly Token[]) {}

  public parseRequirePrefix(): ReadonlySet<string> {
    const required = new Set<string>();

    while (this.peekIdentifier("require")) {
      this.consume();
      for (const extension of this.parseStringList()) {
        required.add(extension.toLowerCase());
      }
      this.expectPunctuation(";");
    }

    return required;
  }

  public parseStatement(): ParsedStatement {
    if (this.peekIdentifier("addflag")) {
      this.consume();
      const flags = this.parseStringList();
      this.expectPunctuation(";");
      return { kind: "addflag", flags };
    }

    if (this.peekIdentifier("if")) {
      this.consume();
      const condition = this.parseCondition();
      this.expectPunctuation("{");
      const statement = this.parseStatement();
      this.expectPunctuation("}");
      return { kind: "if", condition, statement };
    }

    const token = this.peek();
    throw new SieveUnsupportedConstructError(
      token === undefined
        ? "expected a supported statement but reached end of input"
        : 'statement "' + token.value + '" is not implemented',
    );
  }

  public expectEnd(): void {
    const token = this.peek();

    if (token !== undefined) {
      throw new SieveUnsupportedConstructError(
        'trailing construct "' + token.value + '" is not implemented',
      );
    }
  }

  private parseCondition(): ParsedCondition {
    if (this.peekIdentifier("header")) {
      return this.parseHeaderContains();
    }

    if (this.peekIdentifier("allof")) {
      this.consume();
      this.expectPunctuation("(");
      const operands: ParsedCondition[] = [this.parseCondition()];

      while (this.peekPunctuation(",")) {
        this.consume();
        operands.push(this.parseCondition());
      }

      this.expectPunctuation(")");

      if (operands.length < 2) {
        throw new SieveParseError("Sieve allof requires at least two tests.");
      }

      return { kind: "allof", operands };
    }

    const token = this.peek();
    throw new SieveUnsupportedConstructError(
      token === undefined
        ? "expected a supported condition but reached end of input"
        : 'condition "' + token.value + '" is not implemented',
    );
  }

  private parseHeaderContains(): ParsedCondition {
    this.expectIdentifier("header");

    let matchType: string | undefined;
    let comparator = "i;ascii-casemap";

    while (this.peek()?.kind === "tag") {
      const tag = this.consume().value.toLowerCase();

      if (tag === ":contains") {
        if (matchType !== undefined) {
          throw new SieveParseError(
            "Multiple Sieve match types are not valid.",
          );
        }
        matchType = tag;
        continue;
      }

      if (tag === ":comparator") {
        comparator = this.expectString();
        continue;
      }

      throw new SieveUnsupportedConstructError(
        'header tagged argument "' + tag + '" is not implemented',
      );
    }

    if (matchType !== ":contains") {
      throw new SieveUnsupportedConstructError(
        "only header :contains is implemented by the initial codec",
      );
    }

    const headerNames = this.parseStringList();
    const keys = this.parseStringList();

    if (
      headerNames.length !== 1 ||
      headerNames[0]?.toLowerCase() !== "subject" ||
      keys.length !== 1
    ) {
      throw new SieveUnsupportedConstructError(
        "only a single Subject header and a single containment key are implemented",
      );
    }

    const headerName = headerNames[0];
    const key = keys[0];

    if (key === undefined) {
      throw new SieveParseError("Expected one Subject containment key.");
    }

    return {
      kind: "header-contains",
      comparator: comparator.toLowerCase(),
      headerName,
      key,
    };
  }

  private parseStringList(): readonly string[] {
    if (!this.peekPunctuation("[")) {
      return [this.expectString()];
    }

    this.consume();
    const values = [this.expectString()];

    while (this.peekPunctuation(",")) {
      this.consume();
      values.push(this.expectString());
    }

    this.expectPunctuation("]");
    return values;
  }

  private expectIdentifier(value: string): void {
    const token = this.consume();

    if (
      token.kind !== "identifier" ||
      token.value.toLowerCase() !== value.toLowerCase()
    ) {
      throw new SieveParseError('Expected identifier "' + value + '".');
    }
  }

  private expectString(): string {
    const token = this.consume();

    if (token.kind !== "string") {
      throw new SieveParseError("Expected a Sieve quoted string.");
    }

    return token.value;
  }

  private expectPunctuation(value: string): void {
    const token = this.consume();

    if (token.kind !== "punctuation" || token.value !== value) {
      throw new SieveParseError('Expected "' + value + '".');
    }
  }

  private peekIdentifier(value: string): boolean {
    const token = this.peek();
    return (
      token?.kind === "identifier" &&
      token.value.toLowerCase() === value.toLowerCase()
    );
  }

  private peekPunctuation(value: string): boolean {
    const token = this.peek();
    return token?.kind === "punctuation" && token.value === value;
  }

  private peek(): Token | undefined {
    return this.tokens[this.index];
  }

  private consume(): Token {
    const token = this.tokens[this.index];

    if (token === undefined) {
      throw new SieveParseError("Unexpected end of Sieve input.");
    }

    this.index += 1;
    return token;
  }
}

function tokenize(source: string): readonly Token[] {
  const tokens: Token[] = [];
  let index = 0;

  while (index < source.length) {
    const character = source[index];

    if (character === undefined) {
      break;
    }

    if (/\s/u.test(character)) {
      index += 1;
      continue;
    }

    if (character === "#") {
      const newline = source.indexOf("\n", index + 1);
      index = newline === -1 ? source.length : newline + 1;
      continue;
    }

    if (source.startsWith("/*", index)) {
      const end = source.indexOf("*/", index + 2);

      if (end === -1) {
        throw new SieveParseError("Unterminated Sieve block comment.");
      }

      index = end + 2;
      continue;
    }

    if ("{}()[],;".includes(character)) {
      tokens.push({ kind: "punctuation", value: character });
      index += 1;
      continue;
    }

    if (character === '"') {
      const parsed = readQuotedString(source, index);
      tokens.push({ kind: "string", value: parsed.value });
      index = parsed.nextIndex;
      continue;
    }

    if (character === ":") {
      const parsed = readBareToken(source, index + 1);
      tokens.push({ kind: "tag", value: ":" + parsed.value });
      index = parsed.nextIndex;
      continue;
    }

    if (/[A-Za-z_]/u.test(character)) {
      const parsed = readBareToken(source, index);
      tokens.push({ kind: "identifier", value: parsed.value });
      index = parsed.nextIndex;
      continue;
    }

    throw new SieveParseError(
      'Unexpected Sieve character "' +
        character +
        '" at offset ' +
        String(index) +
        ".",
    );
  }

  return tokens;
}

function readBareToken(
  source: string,
  startIndex: number,
): { readonly value: string; readonly nextIndex: number } {
  let index = startIndex;

  while (index < source.length && /[A-Za-z0-9_.-]/u.test(source[index] ?? "")) {
    index += 1;
  }

  if (index === startIndex) {
    throw new SieveParseError(
      "Expected token at offset " + String(startIndex) + ".",
    );
  }

  return {
    value: source.slice(startIndex, index),
    nextIndex: index,
  };
}

function readQuotedString(
  source: string,
  startIndex: number,
): { readonly value: string; readonly nextIndex: number } {
  let value = "";
  let index = startIndex + 1;

  while (index < source.length) {
    const character = source[index];

    if (character === undefined) {
      break;
    }

    if (character === '"') {
      return { value, nextIndex: index + 1 };
    }

    if (character === "\\") {
      const escaped = source[index + 1];

      if (escaped === undefined) {
        throw new SieveParseError(
          "Unterminated escape in Sieve quoted string.",
        );
      }

      value += escaped;
      index += 2;
      continue;
    }

    if (character === "\r" || character === "\n") {
      throw new SieveParseError(
        "Sieve quoted strings cannot contain raw newlines.",
      );
    }

    value += character;
    index += 1;
  }

  throw new SieveParseError("Unterminated Sieve quoted string.");
}
