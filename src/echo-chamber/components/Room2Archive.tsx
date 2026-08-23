import { useState } from 'react';
import { useEchoStore } from '../state/echoStore';
import {
  CROSS_REFERENCE_TITLE,
  HIDDEN_TERMINAL_ID,
  buildHiddenTerminal,
  crossReferenceEntries,
  fixedTerminals,
  getCrossReferenceIntro,
  type FixedTerminal,
} from '../data/room2';
import EchoRoomArt from '../art/EchoRoomArt';

const TERMINAL_SLOTS = [8, 20, 32, 44, 56, 68, 80]; // last real slot (80) hosts the hidden terminal
const JUNCTION_SLOT = 92;

function terminalPos(slot: number) {
  return { left: `${slot - 4.5}%`, top: `${(20 / 60) * 100}%`, width: '9%', height: `${(16 / 60) * 100}%` };
}

export default function Room2Archive() {
  const transcript = useEchoStore((s) => s.transcript);
  const triggerHistory = useEchoStore((s) => s.triggerHistory);
  const room2 = useEchoStore((s) => s.room2);
  const viewTerminal = useEchoStore((s) => s.viewTerminal);
  const selectThread = useEchoStore((s) => s.selectThread);
  const goToScreen = useEchoStore((s) => s.goToScreen);

  const [openTerminal, setOpenTerminal] = useState<FixedTerminal | null>(null);
  const [hiddenPowered, setHiddenPowered] = useState(false);
  const [fileOpen, setFileOpen] = useState(false);
  const [darkNotice, setDarkNotice] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const hiddenTerminal = buildHiddenTerminal(transcript);
  const readyForFile = room2.viewedTerminals.size >= 3 && room2.viewedTerminals.has(HIDDEN_TERMINAL_ID);

  function openFixed(t: FixedTerminal) {
    viewTerminal(t.id);
    setOpenTerminal(t);
  }

  function openHidden() {
    if (!hiddenPowered) {
      setDarkNotice(true);
      return;
    }
    viewTerminal(HIDDEN_TERMINAL_ID);
    setOpenTerminal(hiddenTerminal);
  }

  function proceed() {
    selectThread();
    setFileOpen(false);
    setLeaving(true);
  }

  if (leaving) {
    return (
      <div className="echo-room2 echo-leaving">
        <div className="echo-leaving-card">
          <p className="echo-leaving-caption">The terminals dim, one by one, until only the hum is left.</p>
          <button className="echo-btn echo-btn-primary" onClick={() => goToScreen('room3')}>
            Follow the thread →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="echo-room2">
      <p className="echo-room-intro">
        The room is quiet except for eight terminals, humming faintly out of sync with each other. No voice greets you here.
      </p>
      <div className="echo-room-stage">
        <EchoRoomArt room="archive" />
        <div className="echo-vignette" />
        <div className="echo-hotspot-layer">
          {fixedTerminals.map((t, i) => (
            <button
              key={t.id}
              className={`echo-hotspot echo-terminal-hotspot${room2.viewedTerminals.has(t.id) ? ' examined' : ''}`}
              style={terminalPos(TERMINAL_SLOTS[i])}
              title={t.occupant}
              onClick={() => openFixed(t)}
            >
              <span className="echo-hotspot-marker" />
              <span className="echo-hotspot-label">{t.occupant}</span>
            </button>
          ))}
          <button
            className={`echo-hotspot echo-terminal-hotspot${hiddenPowered ? '' : ' dark'}${room2.viewedTerminals.has(HIDDEN_TERMINAL_ID) ? ' examined' : ''}`}
            style={terminalPos(TERMINAL_SLOTS[6])}
            title={hiddenPowered ? 'Unlabeled terminal' : 'Dark. No power.'}
            onClick={openHidden}
          >
            <span className="echo-hotspot-marker" />
            <span className="echo-hotspot-label">{hiddenPowered ? '— UNLOGGED —' : '(dark)'}</span>
          </button>
          <button
            className={`echo-hotspot echo-junction-hotspot${hiddenPowered ? ' examined' : ''}`}
            style={{ left: `${JUNCTION_SLOT - 3}%`, top: '38%', width: '6%', height: '14%' }}
            title="A junction box, cover hanging loose."
            onClick={() => setHiddenPowered(true)}
          >
            <span className="echo-hotspot-marker" />
            <span className="echo-hotspot-label">Junction Box</span>
          </button>
          <button
            className="echo-hotspot echo-file-hotspot"
            style={{ left: '44%', top: '84%', width: '12%', height: '10%' }}
            title="A cross-reference file"
            onClick={() => setFileOpen(true)}
          >
            <span className="echo-hotspot-marker" />
            <span className="echo-hotspot-label">Cross-Reference File</span>
          </button>
        </div>
      </div>

      {openTerminal && (
        <div className="echo-scrim" onClick={() => setOpenTerminal(null)}>
          <div className="echo-popup echo-terminal-panel" onClick={(e) => e.stopPropagation()}>
            <div className="echo-terminal-header">
              <h3>{openTerminal.occupant}</h3>
              <span className="echo-terminal-timestamp">{openTerminal.timestamp}</span>
            </div>
            <div className="echo-terminal-lines">
              {openTerminal.lines.length === 0 && <p className="echo-terminal-empty">No transcript logged.</p>}
              {openTerminal.lines.map((l, i) => (
                <div key={i} className={`chat-msg chat-msg-${l.speaker === 'occupant' ? 'player' : 'echo'}`}>
                  <span className="chat-msg-sender">{l.speaker === 'occupant' ? openTerminal.occupant : 'ECHO'}</span>
                  <p>{l.text}</p>
                </div>
              ))}
            </div>
            <button className="echo-btn" onClick={() => setOpenTerminal(null)}>
              Close
            </button>
          </div>
        </div>
      )}

      {darkNotice && (
        <div className="echo-scrim" onClick={() => setDarkNotice(false)}>
          <div className="echo-popup" onClick={(e) => e.stopPropagation()}>
            <h3>Dark Terminal</h3>
            <p>This one's dark. No power reaching it — not from here, anyway.</p>
            <button className="echo-btn" onClick={() => setDarkNotice(false)}>
              Close
            </button>
          </div>
        </div>
      )}

      {fileOpen && (
        <div className="echo-scrim" onClick={() => setFileOpen(false)}>
          <div className="echo-popup echo-file-panel" onClick={(e) => e.stopPropagation()}>
            {readyForFile ? (
              <>
                <h3>{CROSS_REFERENCE_TITLE}</h3>
                <p className="echo-file-intro">{getCrossReferenceIntro(triggerHistory)}</p>
                <ul className="echo-file-list">
                  {crossReferenceEntries().map((entry, i) => (
                    <li key={i}>{entry}</li>
                  ))}
                </ul>
                <p className="echo-file-note">The last line updates itself. It has your terminal's timestamp.</p>
                <button className="echo-btn echo-btn-primary" onClick={proceed}>
                  Follow the thread →
                </button>
              </>
            ) : (
              <>
                <h3>Cross-Reference File</h3>
                <p>This doesn't make sense yet. Read more of the room first.</p>
                <button className="echo-btn" onClick={() => setFileOpen(false)}>
                  Close
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
