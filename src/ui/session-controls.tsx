import { useEffect, useId, useState, type ReactNode } from 'react';
import './session-controls.css';
import {VoicePresence, type VoicePresenceProps} from './voice-presence';

export interface SessionControlsProps {
  title: string;
  recording: boolean;
  voiceStatus: string;
  voiceAvailable: boolean;
  voiceActivity?: Pick<VoicePresenceProps, 'canSample' | 'speaking' | 'muted' | 'getInputVolume' | 'getOutputVolume'>;
  busy: boolean;
  startLabel?: string;
  onStart: () => void;
  onPause: () => void;
  onAsk?: () => void;
  question?: string;
  progress?: string;
  nextStep?: string;
  error?: string;
  notice?: string;
  children?: ReactNode;
  compact?: boolean;
  askLabel?: string;
  reviewLabel?: string;
}

/** Shared session actions for the workspace and the full-view planner. */
export function SessionControls({
  title, recording, voiceStatus, voiceAvailable, voiceActivity, busy,
  startLabel = 'Start session', onStart, onPause, onAsk,
  question, progress, nextStep, error, notice, children, compact = false, askLabel = "Ask apprentice", reviewLabel = "Review answer",
}: SessionControlsProps) {
  const titleId = useId();
  const [reviewOpen, setReviewOpen] = useState(Boolean(question));
  useEffect(() => { if (question) setReviewOpen(true); }, [question]);

  const connecting = voiceStatus === 'connecting';
  const connected = voiceStatus === 'connected';
  const voiceLabel = connected ? 'Voice ready' : connecting ? 'Voice connecting'
    : !voiceAvailable ? 'Voice unavailable' : 'Voice off';
  const canAsk = recording && connected && Boolean(onAsk);
  const primaryLabel = connecting ? 'Connecting voice…' : !recording ? startLabel
    : canAsk ? askLabel : connected ? 'Voice ready' : !voiceAvailable ? 'Screen sharing active' : 'Connect voice';
  const primaryDisabled = busy || connecting || (recording && (!voiceAvailable || (connected && !onAsk)));

  return <section className={`session-controls${compact ? ' session-controls--compact' : ''}`} aria-labelledby={titleId}>
    <div className="session-controls__bar">
      <div className="session-controls__identity">
        <h2 id={titleId}>{title}</h2>
        <div className="session-controls__status" aria-live="polite">
          <span className={recording ? 'session-controls__screen session-controls__screen--live' : 'session-controls__screen'}>
            <span className="session-controls__dot" aria-hidden="true"/>
            {recording ? 'Screen shared' : 'Screen off'}
          </span>
          <span>{voiceLabel}</span>
        </div>
      </div>
      <VoicePresence recording={recording} status={voiceStatus} {...voiceActivity}/>
      <div className="session-controls__actions">
        <button type="button" className="session-controls__primary" disabled={primaryDisabled} onClick={canAsk ? onAsk : onStart}>
          {primaryLabel}
        </button>
        <button type="button" className="session-controls__pause" onClick={onPause} aria-label="◼ Off the record">
          <span aria-hidden="true">Ⅱ</span> Off the record
        </button>
      </div>
    </div>
    {(question || progress || nextStep || error || notice || children) && <div className="session-controls__body">
      {question && <p className="session-controls__question">{question}</p>}
      {nextStep && <p className="session-controls__next-step">{nextStep}</p>}
      {progress && <p className="session-controls__progress">{progress}</p>}
      {notice && <p className="session-controls__notice">{notice}</p>}
      {error && <p className="session-controls__error" role="alert">{error}</p>}
      {children && <details className="session-controls__review" open={reviewOpen} onToggle={event => setReviewOpen(event.currentTarget.open)}>
        <summary>{reviewLabel}</summary>
        <div className="session-controls__review-content">{children}</div>
      </details>}
    </div>}
  </section>;
}
