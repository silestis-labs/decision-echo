import type { Answer, Evidence, Rule } from '../shared/contracts';
import './evidence-review.css';

type EvidenceReviewProps = {
  rules: Rule[];
  evidence: Evidence[];
  answers: Answer[];
  onOpenEvidence: (evidence: Evidence) => void;
};

const evidenceLabels: Record<Evidence['kind'], string> = {
  frame: 'Screen moment',
  answer: 'Expert answer',
  activity: 'Captured activity',
};

function evidenceTime(at: string): string {
  const date = new Date(at);
  return Number.isNaN(date.getTime())
    ? 'Timestamp unavailable'
    : date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'medium' });
}

/** Read-only provenance for a rule, using only its explicit evidence references. */
export function EvidenceReview({ rules, evidence, answers, onOpenEvidence }: EvidenceReviewProps) {
  const evidenceById = new Map(evidence.map(item => [item.id, item]));

  return <section className="evidence-review" aria-label="Rule evidence review">
    <h2>Why these rules?</h2>
    <p className="evidence-review-intro">Compare each rule with its recorded expert words and linked capture moments.</p>
    {rules.length === 0 && <p className="evidence-review-empty">No rules are available to review yet.</p>}
    {rules.map((rule,index) => {
      const referenceIds = new Set(rule.evidenceIds);
      const linkedEvidence = [...referenceIds].flatMap(id => {
        const item = evidenceById.get(id);
        return item ? [item] : [];
      });
      const missingIds = [...referenceIds].filter(id => !evidenceById.has(id));
      const linkedAnswers = answers.filter(answer => answer.evidenceIds.some(id => referenceIds.has(id)));

      return <details className="evidence-review-rule" key={rule.id} open={index===0}>
        <summary>{rule.title}<span>{linkedEvidence.length} linked capture {linkedEvidence.length === 1 ? 'item' : 'items'}</span></summary>
        <div className="evidence-review-columns">
          <div className="evidence-review-rationale">
            <h3>Rule explanation</h3>
            <p>{rule.explanation || 'No explanation is saved for this rule.'}</p>
            <h3>Expert quote saved with this rule</h3>
            {rule.expertQuote ? <blockquote>{rule.expertQuote}</blockquote> : <p className="evidence-review-empty">No expert quote is saved.</p>}
            <h3>Related interview answers</h3>
            <p className="evidence-review-meta">These answers share a linked capture moment. Review which words establish this particular rule.</p>
            {linkedAnswers.length === 0 && <p className="evidence-review-empty">No saved interview answer references this rule’s evidence.</p>}
            {linkedAnswers.map(answer => <div className="evidence-review-answer" key={answer.id}>
              <span className="evidence-review-meta">{answer.stage === 'capture' ? 'Capture interview' : 'Debrief'}{answer.guardrail ? ' · Guardrail question' : ''}</span>
              <p><strong>{answer.question}</strong></p>
              <blockquote>{answer.answer}</blockquote>
            </div>)}
          </div>
          <div className="evidence-review-sources">
            <h3>Linked capture evidence</h3>
            <p className="evidence-review-meta">Times are shown in your local time zone. Open an item to inspect its saved context.</p>
            {linkedEvidence.length === 0 && <p className="evidence-review-empty">No referenced capture evidence is available in this session.</p>}
            <ul className="evidence-review-items">
              {linkedEvidence.map(item => <li key={item.id}>
                <button type="button" className="evidence-review-item" onClick={() => onOpenEvidence(item)}>
                  <span className="evidence-review-item-heading"><strong>{evidenceLabels[item.kind]}</strong><span>{evidenceTime(item.at)}</span></span>
                  {item.kind === 'frame' && item.image && <img src={item.image} alt="Captured screen preview" loading="lazy" />}
                  <span className="evidence-review-item-text">{item.text || 'No text description was saved.'}</span>
                  {item.kind === 'frame' && !item.image && <span className="evidence-review-meta">Screen image is not loaded; saved text and metadata are available.</span>}
                  <span className="evidence-review-open">Open evidence →</span>
                </button>
              </li>)}
            </ul>
            {missingIds.length > 0 && <p className="evidence-review-missing">{missingIds.length} referenced {missingIds.length === 1 ? 'item is' : 'items are'} unavailable in this session: {missingIds.join(', ')}.</p>}
          </div>
        </div>
      </details>;
    })}
  </section>;
}
