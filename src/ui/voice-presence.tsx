import {useEffect, useRef, useState, type CSSProperties} from 'react';
import './voice-presence.css';

export interface VoicePresenceProps {
  recording: boolean;
  status: string;
  speaking?: boolean;
  canSample?: () => boolean;
  muted?: boolean;
  getInputVolume?: () => number;
  getOutputVolume?: () => number;
}

/** Original, lightweight UI inspired by ElevenLabs UI. Reads the existing SDK;
 * never opens a microphone, creates a conversation, or uploads audio. */
export function VoicePresence(props: VoicePresenceProps) {
  const source = useRef(props);
  source.current = props;
  const active = props.recording && props.status === 'connected';
  const [level, setLevel] = useState(0);
  useEffect(() => {
    if (!active) return;
    let frame = 0, last = -Infinity;
    const sample = (time: number) => {
      if (time - last >= 100) {
        last = time;
        const p = source.current;
        let value = 0;
        try {
          if (!p.recording || p.status !== 'connected' || p.canSample?.() === false) {
            setLevel(0);
            frame = requestAnimationFrame(sample);
            return;
          }
          value = p.speaking ? p.getOutputVolume?.() ?? 0
            : p.muted ? 0 : p.getInputVolume?.() ?? 0;
        } catch { /* Disconnects can race the meter; show silence. */ }
        setLevel(Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0);
      }
      frame = requestAnimationFrame(sample);
    };
    frame = requestAnimationFrame(sample);
    return () => cancelAnimationFrame(frame);
  }, [active]);
  const state = !props.recording ? 'idle' : props.status === 'connecting' ? 'connecting'
    : !active ? 'idle' : props.speaking ? 'speaking' : props.muted ? 'muted' : 'listening';
  const label = state === 'speaking' ? 'Agent speaking' : state === 'listening' ? 'Listening to you'
    : state === 'muted' ? 'Test replies · microphone muted' : state === 'connecting' ? 'Connecting voice' : 'Voice paused';
  const energy = active && (props.speaking || !props.muted) ? level : 0;
  return <div className="voice-presence" data-state={state}>
    <div className="voice-presence__orb" aria-hidden="true" style={{'--voice-energy': energy} as CSSProperties}>
      <span className="voice-presence__core"/>
    </div>
    <div className="voice-presence__copy">
      <span className="voice-presence__label" role="status" aria-label="Voice activity">{label}</span>
      <div className="voice-presence__meter" aria-hidden="true">
        <span style={{width: `${energy * 100}%`}}/>
      </div>
    </div>
  </div>;
}
