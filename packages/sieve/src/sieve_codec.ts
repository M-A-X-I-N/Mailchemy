/**
 * Implements the deliberately narrow initial Sieve text codec, including its
 * tokenizer/parser and exact mapping for canonical mark-read.
 *
 * @remarks
 * Parsing a Sieve construct only establishes that this codec understands the
 * native syntax. Canonical exactness is decided separately: Subject
 * `:contains` is parsed but refused as `exactness-unproven`, while unrelated
 * unimplemented Sieve constructs are preserved opaquely when their syntax is
 * outside this initial mapping.
 *
 * This module describes Sieve dialect representation. It does not describe
 * ManageSieve transport or Purelymail endpoint capability availability.
 *
 * @packageDocumentation
 */

import {
    createActionExpression,
    createCapabilityInstance,
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

/**
 * Native textual Sieve representation accepted and produced by the initial
 * codec.
 */
export type SieveScriptNative = string;

/**
 * Lexical token emitted by the minimal Sieve tokenizer.
 */
interface Token {
    /** Syntactic token category needed by the narrow parser. */
    readonly kind: "identifier" | "tag" | "string" | "punctuation";

    /** Decoded token value; quoted-string escapes are already unescaped. */
    readonly value: string;
}

/**
 * Parsed representation of the one-statement script subset understood by the
 * initial codec.
 */
interface ParsedScript {
    /** Lowercased extensions collected from leading `require` commands. */
    readonly requiredExtensions: ReadonlySet<string>;

    /** Single supported top-level statement following the require prefix. */
    readonly statement: ParsedStatement;
}

/**
 * Statement subset recognized by the initial parser.
 *
 * @remarks
 * Recognition here does not itself establish canonical semantic equivalence.
 */
type ParsedStatement =
    | {
          /** Discriminator for an IMAP-flag mutation statement. */
          readonly kind: "addflag";

          /** Decoded flag strings supplied by the native statement. */
          readonly flags: readonly string[];
      }
    | {
          /** Discriminator for one supported conditional statement. */
          readonly kind: "if";

          /** Parsed native condition controlling the nested statement. */
          readonly condition: ParsedCondition;

          /** Single supported statement contained by the conditional block. */
          readonly statement: ParsedStatement;
      };

/**
 * Condition subset recognized by the initial parser.
 */
type ParsedCondition =
    | {
          /** Discriminator for the supported `header :contains` syntax. */
          readonly kind: "header-contains";

          /** Lowercased comparator name selected by the native test. */
          readonly comparator: string;

          /** Original decoded header-name string, constrained to Subject. */
          readonly headerName: string;

          /** Single decoded native containment key. */
          readonly key: string;
      }
    | {
          /** Discriminator for a parsed Sieve conjunction. */
          readonly kind: "allof";

          /** Ordered parsed native test operands. */
          readonly operands: readonly ParsedCondition[];
      };

/**
 * Reports malformed syntax inside the subset the initial parser attempts to
 * recognize.
 */
class SieveParseError extends Error {
    /**
     * Creates a malformed-native-syntax diagnostic.
     *
     * @param message Human-readable parser failure.
     */
    public constructor(message: string) {
        super(message);
        this.name = "SieveParseError";
    }
}

/**
 * Reports valid-looking Sieve syntax that is outside the deliberately narrow
 * initial codec subset and should therefore be preserved opaquely.
 */
class SieveUnsupportedConstructError extends Error {
    /**
     * Creates an unsupported-native-construct diagnostic.
     *
     * @param message Human-readable description of the unsupported construct.
     */
    public constructor(message: string) {
        super(message);
        this.name = "SieveUnsupportedConstructError";
    }
}

/**
 * Initial offline Sieve codec.
 *
 * @remarks
 * Version 1 encodes canonical mark-read exactly as `imap4flags addflag \Seen`.
 * It recognizes Subject containment syntax but refuses to claim equivalence
 * with Mailchemy's Unicode/NFC Subject contract.
 */
export const sieveCodec = defineSemanticCodec<SieveScriptNative>({
    id: "sieve.initial@1",
    encode: encodeSieve,
    decode: decodeSieve,
});

/**
 * Encodes the exact semantic subset currently proven for Sieve text.
 *
 * @param expression Canonical expression to encode.
 * @returns Encoded Sieve for exact mark-read, otherwise structured Unsupported
 * evidence describing the current mapping boundary.
 */
function encodeSieve(expression: CanonicalExpression) {
    if (
        expression.kind === "action" &&
        expression.instance.capabilityId === markReadCapability.id
    )
        return encodedNative('require "imap4flags";\n\naddflag "\\\\Seen";\n');

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

/**
 * Parses and semantically classifies native Sieve text.
 *
 * @param native Sieve source text.
 * @returns Decoded canonical mark-read, opaque preservation for syntax outside
 * the initial subset, or structured native-decode refusal.
 */
function decodeSieve(native: SieveScriptNative) {
    /** Parsed native script used only after syntax/subset recognition succeeds. */
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
                    createCapabilityInstance(markReadCapability, null),
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

/**
 * Detects whether a canonical expression contains Subject-containment semantics
 * whose exact Sieve comparator/normalization mapping remains unproven.
 *
 * @param expression Canonical expression to inspect recursively.
 * @returns Whether any reachable condition capability instance is
 * `core.condition.subject.contains@1`.
 */
function containsSubjectCondition(expression: CanonicalExpression): boolean {
    if (expression.kind === "condition") {
        return (
            expression.instance.capabilityId ===
            "core.condition.subject.contains@1"
        );
    }

    if (expression.kind === "and")
        return expression.operands.some(containsSubjectCondition);

    if (expression.kind === "rule")
        return containsSubjectCondition(expression.condition);

    return false;
}

/**
 * Detects whether a parsed statement belongs to the conditional syntax path
 * used by the current Subject parser.
 *
 * @remarks
 * The initial statement grammar only parses `if` when it contains one of the
 * supported condition forms, so this is a narrow codec implementation fact.
 *
 * @param statement Parsed native statement.
 * @returns Whether the parsed statement is conditional.
 */
function containsParsedSubjectCondition(statement: ParsedStatement): boolean {
    return statement.kind === "if";
}

/**
 * Tests whether an `addflag` statement performs exactly the canonical
 * mark-read mutation and no additional flag changes.
 *
 * @param flags Decoded flag arguments from the native statement.
 * @returns Whether the list contains only the IMAP `\Seen` system flag,
 * compared case-insensitively.
 */
function isExactSeenAddition(flags: readonly string[]): boolean {
    return flags.length === 1 && flags[0]?.toLowerCase() === "\\seen";
}

/**
 * Parses the initial one-statement Sieve subset after tokenization.
 *
 * @param source Native Sieve source text.
 * @returns Parsed require-prefix metadata and one supported statement.
 * @throws SieveParseError When recognized syntax is malformed.
 * @throws SieveUnsupportedConstructError When syntax is outside the initial
 * parser subset.
 */
function parseScript(source: string): ParsedScript {
    /** Stateful parser over the tokenized source. */
    const parser = new Parser(tokenize(source));

    /** Lowercased extension declarations collected before the statement. */
    const requiredExtensions = parser.parseRequirePrefix();

    /** Single supported top-level statement. */
    const statement = parser.parseStatement();
    parser.expectEnd();

    return {
        requiredExtensions,
        statement,
    };
}

/**
 * Recursive-descent parser for the deliberately narrow initial Sieve grammar.
 *
 * @remarks
 * This parser is not a general Sieve AST implementation. Unsupported constructs
 * are distinguished from malformed syntax so callers can preserve the former
 * opaquely rather than falsely treating them as invalid Sieve.
 */
class Parser {
    /** Index of the next token to inspect or consume. */
    private index = 0;

    /**
     * Creates a parser over an immutable token sequence.
     *
     * @param tokens Tokenized Sieve source.
     */
    public constructor(private readonly tokens: readonly Token[]) {}

    /**
     * Parses zero or more leading `require` declarations.
     *
     * @returns Lowercased deduplicated extension names.
     * @throws SieveParseError When a require declaration is malformed.
     */
    public parseRequirePrefix(): ReadonlySet<string> {
        const required = new Set<string>();

        while (this.peekIdentifier("require")) {
            this.consume();
            for (const extension of this.parseStringList())
                required.add(extension.toLowerCase());

            this.expectPunctuation(";");
        }

        return required;
    }

    /**
     * Parses one supported statement: `addflag` or one nested `if` block.
     *
     * @returns Parsed native statement.
     * @throws SieveParseError When recognized syntax is malformed.
     * @throws SieveUnsupportedConstructError When the next statement is outside
     * the initial codec subset.
     */
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

    /**
     * Requires the token stream to end after the supported top-level statement.
     *
     * @throws SieveUnsupportedConstructError When trailing constructs remain.
     */
    public expectEnd(): void {
        const token = this.peek();

        if (token !== undefined) {
            throw new SieveUnsupportedConstructError(
                'trailing construct "' + token.value + '" is not implemented',
            );
        }
    }

    /**
     * Parses one supported condition: Subject `header :contains` or `allof`.
     *
     * @returns Parsed native condition.
     * @throws SieveParseError When recognized syntax is malformed.
     * @throws SieveUnsupportedConstructError When the condition is outside the
     * initial subset.
     */
    private parseCondition(): ParsedCondition {
        if (this.peekIdentifier("header"))
            return this.parseHeaderContains();

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
                throw new SieveParseError(
                    "Sieve allof requires at least two tests.",
                );
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

    /**
     * Parses the initial codec's supported Sieve `header :contains` condition.
     *
     * @remarks
     * Only one Subject header name and one search key are accepted. The default
     * comparator is recorded as `i;ascii-casemap`. Successfully parsing this
     * syntax does not prove equivalence with
     * `core.condition.subject.contains@1`; exactness is classified separately.
     *
     * @returns Parsed native Subject-containment condition.
     * @throws SieveParseError When recognized syntax is malformed.
     * @throws SieveUnsupportedConstructError When tagged arguments or list
     * shapes exceed the deliberately narrow initial subset.
     */
    private parseHeaderContains(): ParsedCondition {
        this.expectIdentifier("header");

        /** Match-type tag observed while parsing the header test. */
        let matchType: string | undefined;

        /** Native comparator, defaulting to Sieve's baseline comparator here. */
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

        if (key === undefined)
            throw new SieveParseError("Expected one Subject containment key.");

        return {
            kind: "header-contains",
            comparator: comparator.toLowerCase(),
            headerName,
            key,
        };
    }

    /**
     * Parses either one quoted string or a bracketed non-empty string list.
     *
     * @returns Decoded string values in source order.
     * @throws SieveParseError When list punctuation or quoted strings are malformed.
     */
    private parseStringList(): readonly string[] {
        if (!this.peekPunctuation("["))
            return [this.expectString()];

        this.consume();
        const values = [this.expectString()];

        while (this.peekPunctuation(",")) {
            this.consume();
            values.push(this.expectString());
        }

        this.expectPunctuation("]");
        return values;
    }

    /**
     * Consumes one identifier and verifies it case-insensitively.
     *
     * @param value Expected identifier spelling.
     * @throws SieveParseError When the next token is not the expected identifier.
     */
    private expectIdentifier(value: string): void {
        const token = this.consume();

        if (
            token.kind !== "identifier" ||
            token.value.toLowerCase() !== value.toLowerCase()
        )
            throw new SieveParseError('Expected identifier "' + value + '".');

    }

    /**
     * Consumes one decoded quoted-string token.
     *
     * @returns Decoded string value.
     * @throws SieveParseError When the next token is not a quoted string.
     */
    private expectString(): string {
        const token = this.consume();

        if (token.kind !== "string")
            throw new SieveParseError("Expected a Sieve quoted string.");

        return token.value;
    }

    /**
     * Consumes one exact punctuation token.
     *
     * @param value Expected punctuation character.
     * @throws SieveParseError When the next token differs.
     */
    private expectPunctuation(value: string): void {
        const token = this.consume();

        if (token.kind !== "punctuation" || token.value !== value)
            throw new SieveParseError('Expected "' + value + '".');

    }

    /**
     * Tests the next token for a case-insensitive identifier without consuming it.
     *
     * @param value Identifier spelling to test.
     * @returns Whether the next token is that identifier.
     */
    private peekIdentifier(value: string): boolean {
        const token = this.peek();
        return (
            token?.kind === "identifier" &&
            token.value.toLowerCase() === value.toLowerCase()
        );
    }

    /**
     * Tests the next token for exact punctuation without consuming it.
     *
     * @param value Punctuation character to test.
     * @returns Whether the next token matches.
     */
    private peekPunctuation(value: string): boolean {
        const token = this.peek();
        return token?.kind === "punctuation" && token.value === value;
    }

    /**
     * Reads the next token without advancing parser state.
     *
     * @returns Next token, or undefined at end of input.
     */
    private peek(): Token | undefined {
        return this.tokens[this.index];
    }

    /**
     * Returns and advances past the next token.
     *
     * @returns Consumed token.
     * @throws SieveParseError At unexpected end of input.
     */
    private consume(): Token {
        const token = this.tokens[this.index];

        if (token === undefined)
            throw new SieveParseError("Unexpected end of Sieve input.");

        this.index += 1;
        return token;
    }
}

/**
 * Tokenizes the syntax needed by the initial parser while skipping whitespace
 * and Sieve line/block comments.
 *
 * @param source Native Sieve source text.
 * @returns Ordered lexical tokens with quoted strings decoded.
 * @throws SieveParseError For malformed comments, strings, tokens, or
 * unexpected characters.
 */
function tokenize(source: string): readonly Token[] {
    /** Tokens emitted in native source order. */
    const tokens: Token[] = [];

    /** Current UTF-16 source offset consumed by this narrow tokenizer. */
    let index = 0;

    while (index < source.length) {
        const character = source[index];

        if (character === undefined)
            break;

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

            if (end === -1)
                throw new SieveParseError("Unterminated Sieve block comment.");

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

/**
 * Reads one identifier/tag body token made of the tokenizer's accepted bare
 * token characters.
 *
 * @param source Native Sieve source text.
 * @param startIndex Offset at which the token body begins.
 * @returns Token text plus the first source offset after it.
 * @throws SieveParseError When no bare-token character occurs at the start.
 */
function readBareToken(
    source: string,
    startIndex: number,
): {
    /** Decoded token/string value. */
    readonly value: string;

    /** First source offset after the consumed token/string. */
    readonly nextIndex: number;
} {
    let index = startIndex;

    while (
        index < source.length &&
        /[A-Za-z0-9_.-]/u.test(source[index] ?? "")
    )
        index += 1;

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

/**
 * Reads and decodes one Sieve quoted string for the initial parser.
 *
 * @remarks
 * Backslash escapes retain the escaped character and remove the escape
 * backslash. Raw CR/LF characters are rejected inside the quoted string.
 *
 * @param source Native Sieve source text.
 * @param startIndex Offset of the opening quote.
 * @returns Decoded string value plus the first offset after the closing quote.
 * @throws SieveParseError For unterminated escapes/strings or raw newlines.
 */
function readQuotedString(
    source: string,
    startIndex: number,
): {
    /** Decoded token/string value. */
    readonly value: string;

    /** First source offset after the consumed token/string. */
    readonly nextIndex: number;
} {
    let value = "";
    let index = startIndex + 1;

    while (index < source.length) {
        const character = source[index];

        if (character === undefined)
            break;

        if (character === '"')
            return { value, nextIndex: index + 1 };

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
