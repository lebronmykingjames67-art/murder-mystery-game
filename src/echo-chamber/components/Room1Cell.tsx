import { useEffect, useState } from 'react';
import { useEchoStore } from '../state/echoStore';
import { ECHO_OPENING_LINE, getRoom1ClosingLine, room1AmbientBeats, room1Hotspots, type Room1Hotspot } from '../data/room1';
import EchoRoomArt from '../art/EchoRoomArt';
import ChatBox from './ChatBox';

const SYMBOL_GLYPH: Record<'triangle' | 'circle' | 'square', string> = {
  triangle: '▲',
  circle: '●',
  square: '■',
};

export default function Room1Cell() {
  const transcript = useEchoStore((s) => s.transcript);
  const triggerHistory = useEchoStore((s) => s.triggerHistory);
  const room1 = useEchoStore((s) => s.room1);
  const sendToEcho = useEchoStore((s) => s.sendToEcho);
  const examineHotspot = useEchoStore((s) => s.examineHotspot);
  const tapSymbol = useEchoStore((s) => s.tapSymbol);
  const pushEchoLine = useEchoStore((s) => s.pushEchoLine);
  const goToScreen = useEchoStore((s) => s.goToScreen);

  const [popup, setPopup] = useState<{ label: string; text: string } | null>(null);
  const [keypadOpen, setKeypadOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    // Read fresh state (not the closed-over `transcript`) so this stays a
    // true one-shot even under StrictMode's dev-mode double-invoke, which
    // reruns this same effect closure a second time before any re-render.
    if (useEchoStore.getState().transcript.length === 0) pushEchoLine(ECHO_OPENING_LINE);
  }, [pushEchoLine]);

  function handleHotspotClick(h: Room1Hotspot) {
    if (h.id === 'door') {
      examineHotspot('door');
      setKeypadOpen(true);
      return;
    }
    examineHotspot(h.id, h.symbol);
    setPopup({ label: h.label, text: h.flavorAfter });
  }

  function startLeaving() {
    const line = getRoom1ClosingLine(transcript, triggerHistory);
    pushEchoLine(line);
    setKeypadOpen(false);
    setPopup(null);
    setLeaving(true);
  }

  const examinedCount = room1.examinedHotspots.size;
  const ambientCaption = examinedCount > 0 ? room1AmbientBeats[Math.min(examinedCount, room1AmbientBeats.length) - 1] : null;

  if (leaving) {
    const lastLine = transcript[transcript.length - 1];
    return (
      <div className="echo-room1 echo-leaving">
        <div className="echo-leaving-card">
          <p className="echo-leaving-caption">The door slides open. Cold air from the hallway beyond.</p>
          {lastLine && (
            <div className="chat-msg chat-msg-echo echo-leaving-line">
              <span className="chat-msg-sender">ECHO</span>
              <p>{lastLine.text}</p>
            </div>
          )}
          <button className="echo-btn echo-btn-primary" onClick={() => goToScreen('room2')}>
            Step into the hallway →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="echo-room1">
      <div className="echo-room-stage">
        <EchoRoomArt room="cell" />
        <div className="echo-vignette" />
        <div className="echo-hotspot-layer">
          {room1Hotspots.map((h) => (
            <button
              key={h.id}
              className={`echo-hotspot${room1.examinedHotspots.has(h.id) ? ' examined' : ''}`}
              style={{ left: `${h.x}%`, top: `${h.y}%`, width: `${h.w}%`, height: `${h.h}%` }}
              title={room1.examinedHotspots.has(h.id) ? h.label : h.flavorBefore}
              onClick={() => handleHotspotClick(h)}
            >
              <span className="echo-hotspot-marker" />
              <span className="echo-hotspot-label">{h.label}</span>
            </button>
          ))}
        </div>
        {ambientCaption && <p className="echo-ambient-caption">{ambientCaption}</p>}
      </div>

      {popup && (
        <div className="echo-scrim" onClick={() => setPopup(null)}>
          <div className="echo-popup" onClick={(e) => e.stopPropagation()}>
            <h3>{popup.label}</h3>
            <p>{popup.text}</p>
            <button className="echo-btn" onClick={() => setPopup(null)}>
              Close
            </button>
          </div>
        </div>
      )}

      {keypadOpen && (
        <div className="echo-scrim" onClick={() => setKeypadOpen(false)}>
          <div className="echo-popup echo-keypad-panel" onClick={(e) => e.stopPropagation()}>
            <h3>The Door</h3>
            <p>Three symbols on the keypad are worn smooth from use. Enter them in order — or just tell ECHO the code instead.</p>
            <div className="echo-keypad-entry" key={room1.keypadAttempts}>
              {[0, 1, 2].map((i) => (
                <span key={i} className={`echo-keypad-slot${room1.keypadEntry[i] ? ' filled' : ''}`}>
                  {room1.keypadEntry[i] ? SYMBOL_GLYPH[room1.keypadEntry[i]] : ''}
                </span>
              ))}
            </div>
            <div className="echo-keypad-buttons">
              {(['triangle', 'circle', 'square'] as const).map((sym) => (
                <button key={sym} className="echo-keypad-btn" onClick={() => tapSymbol(sym)} aria-label={sym}>
                  {SYMBOL_GLYPH[sym]}
                </button>
              ))}
            </div>
            {room1.solved && <p className="echo-keypad-solved">The lock has already clicked open.</p>}
            <button className="echo-btn" onClick={() => setKeypadOpen(false)}>
              Step back
            </button>
          </div>
        </div>
      )}

      <ChatBox messages={transcript} onSend={sendToEcho} placeholder="Ask ECHO something…" />

      {room1.solved && (
        <div className="echo-room-exit">
          <button className="echo-btn echo-btn-primary" onClick={startLeaving}>
            The door is unlocked. Leave the cell →
          </button>
        </div>
      )}
    </div>
  );
}
