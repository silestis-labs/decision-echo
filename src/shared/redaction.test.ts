import { describe, expect, it } from 'vitest';
import { redactFields, redactText } from './redaction';

describe('personal data redaction', () => {
  it('redacts e-mail addresses, phone numbers, IBANs and card numbers', () => {
    const input = 'Mail lea.example@northstar.example or call +49 30 1234567, or 0151 23456789. IBAN DE89 3704 0044 0532 0130 00, card 4111 1111 1111 1111.';
    const result = redactText(input);
    expect(result.text).toBe('Mail <EMAIL> or call <PHONE>, or <PHONE>. IBAN <IBAN>, card <CREDIT_CARD>.');
    expect(result.redacted).toBe(5);
  });

  it('keeps planner dates, times, durations and invalid numbers', () => {
    const planner = 'Moved Analyze Cohort Data to 08.10.2026, 09:00–13:00 (4h), deadline 2026-10-09T17:00:00+02:00; review 09:00-10:00; P0; 1234 5678 9012 3456; DE00 1234 5678 9012 3456 78';
    expect(redactText(planner)).toEqual({ text: planner, redacted: 0 });
  });

  it('redacts a valid IBAN without swallowing adjacent uppercase narration', () => {
    for (const [input, suffix] of [
      ['BE68 5390 0754 7034 NOTE', ' NOTE'],
      ['BE68539007547034 VAT', ' VAT'],
      ['BE68 5390 0754 7034 NOTE VAT', ' NOTE VAT'],
    ]) {
      expect(redactText(input)).toEqual({ text: `<IBAN>${suffix}`, redacted: 1 });
    }
    expect(redactFields({ answer: 'Use BE68 5390 0754 7034 NOTE for the test.' })).toEqual({ answer: 'Use <IBAN> NOTE for the test.' });
  });

  it('does not redact checksum-invalid IBAN prefixes followed by uppercase text', () => {
    const input = 'BE00539007547034 NOTE';
    expect(redactText(input)).toEqual({ text: input, redacted: 0 });
  });

  it('returns ordinary text unchanged on the fast path', () => {
    expect(redactText('Jonas only, because the client asked for him.')).toEqual({ text: 'Jonas only, because the client asked for him.', redacted: 0 });
  });

  it('redacts only free-text fields and never image data', () => {
    const image = 'data:image/png;base64,QUJD0151234567890';
    const body = { epoch: 2, kind: 'frame', text: 'Call 0151 23456789', image };
    expect(redactFields(body)).toEqual({ epoch: 2, kind: 'frame', text: 'Call <PHONE>', image });
    const unchanged = { answer: 'Jonas only.', question: 'Why Jonas?' };
    expect(redactFields(unchanged)).toBe(unchanged);
  });

  it('is fast enough for every upload', () => {
    const text = 'Edited Finalize Client Presentation: person Jonas → Lea, start Wed 7 Oct, 14:00 → Thu 8 Oct, 13:00. '.repeat(20);
    const started = performance.now();
    for (let i = 0; i < 1000; i++) redactText(text);
    expect((performance.now() - started) / 1000).toBeLessThan(1);
  });
});
