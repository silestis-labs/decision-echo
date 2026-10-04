// Pattern-based redaction of personal data in short text fields (answers, questions, activity labels).
// It runs in the browser before upload and again on the server for other clients. It follows Presidio's
// recognizer idea (pattern + checksum validation) but is not Presidio, and it does not touch image pixels.

export type Redaction = { text: string; redacted: number };

const digits = (value: string) => value.replace(/\D/g, '');

function luhn(value: string) {
  const d = digits(value);
  let sum = 0;
  for (let i = 0; i < d.length; i++) {
    let n = Number(d[d.length - 1 - i]);
    if (i % 2) { n *= 2; if (n > 9) n -= 9; }
    sum += n;
  }
  return d.length >= 13 && d.length <= 19 && sum % 10 === 0;
}

function iban(value: string) {
  const compact = value.replace(/\s/g, '').toUpperCase();
  if (compact.length < 15 || compact.length > 34) return false;
  const moved = compact.slice(4) + compact.slice(0, 4);
  let remainder = 0;
  for (const ch of moved) {
    const code = /[A-Z]/.test(ch) ? String(ch.charCodeAt(0) - 55) : ch;
    for (const c of code) remainder = (remainder * 10 + Number(c)) % 97;
  }
  return remainder === 1;
}

// Dates and times that a planner shows everywhere must never be mistaken for phone numbers.
const dateLike = /^(\d{1,2}[./-]\d{1,2}[./-]\d{2,4}|\d{4}[./-]\d{1,2}[./-]\d{1,2})$/;

const recognizers: { label: string; pattern: RegExp; valid?: (match: string) => boolean }[] = [
  { label: 'EMAIL', pattern: /[A-Z0-9._%+-]+@[A-Z0-9-]+(?:\.[A-Z0-9-]+)*\.[A-Z]{2,}/gi },
  { label: 'IBAN', pattern: /\b[A-Z]{2}\d{2}(?: ?[A-Z0-9]{4}){2,7}(?: ?[A-Z0-9]{1,4})?\b/g, valid: iban },
  { label: 'CREDIT_CARD', pattern: /\b\d(?:[ -]?\d){12,18}\b/g, valid: luhn },
  { label: 'PHONE', pattern: /(?<![\w.:/-])(?:\+\d{1,3}[ ./-]?|0)(?:\(?\d{1,5}\)?[ ./-]?){1,5}\d{2,}(?![\w:/])/g,
    valid: match => { const n = digits(match).length; return n >= 8 && n <= 15 && !dateLike.test(match.trim()); } },
];

/** Replaces e-mail addresses, IBANs, card numbers and phone numbers with typed placeholders such as <EMAIL>. */
export function redactText(input: string): Redaction {
  // Fast path: every recognizer needs a digit or an @, so ordinary labels return immediately.
  if (!/[\d@]/.test(input)) return { text: input, redacted: 0 };
  let text = input, redacted = 0;
  for (const { label, pattern, valid } of recognizers) {
    text = text.replace(pattern, match => {
      if (valid && !valid(match)) {
        // A variable-length IBAN candidate can greedily include a following uppercase
        // word. Check complete whitespace-delimited prefixes before retaining it.
        // Preserve the suffix rather than redacting unrelated narration with the IBAN.
        if (label === 'IBAN') {
          for (let end = match.length - 1; end >= 15; end--) {
            if (match[end] !== ' ') continue;
            const prefix = match.slice(0, end);
            if (iban(prefix)) { redacted++; return `<IBAN>${match.slice(end)}`; }
          }
        }
        return match;
      }
      redacted++;
      return `<${label}>`;
    });
  }
  return { text, redacted };
}

const textFields = ['text', 'answer', 'question'] as const;

/** Redacts the known free-text fields of an upload body; other fields such as image data are left untouched. */
export function redactFields<T>(body: T): T {
  if (!body || typeof body !== 'object') return body;
  const record = body as Record<string, unknown>;
  let copy: Record<string, unknown> | null = null;
  for (const field of textFields) {
    const value = record[field];
    if (typeof value !== 'string') continue;
    const result = redactText(value);
    if (result.redacted) { copy ??= { ...record }; copy[field] = result.text; }
  }
  return (copy ?? body) as T;
}
