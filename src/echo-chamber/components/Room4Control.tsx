import { useState } from 'react';
import { useEchoStore } from '../state/echoStore';
import { FINAL_PROMPT_LINE, LOGS_LOCKED_NOTICE, room4Logs, type Room4Log } from '../data/room4';
import EchoRoomArt from '../art/EchoRoomArt';
import ChatBox from './ChatBox';

const LOGS_REQUIRED = 3;

export default function Room4Control() {
  const room4 = useEchoStore((s) => s.room4);
  const viewRoom4Log = useEchoStore((s) => s.viewRoom4Log);
  const submitFinalMessage = useEchoStore((s) => s.submitFinalMessage);

  const [openLog, setOpenLog] = useState<Room4Log | null>(null);

  const unlocked = room4.viewedLogs.size >= LOGS_REQUIRED;

  function open(log: Room4Log) {
    viewRoom4Log(log.id);
    setOpenLog(log);
  }

  const consoleMessages = [{ speaker: 'echo' as const, text: unlocked ? FINAL_PROMPT_LINE : LOGS_LOCKED_NOTICE }];

  return (
    <div className="echo-room4">
      <p className="echo-room-intro">Banks of servers instead of terminals. A single console, glowing the same blue as the wall screen in the room where you woke up.</p>
      <div className="echo-room-stage">
        <EchoRoomArt room="control" />
        <div className="echo-vignette" />
        <div className="echo-hotspot-layer">
          {room4Logs.map((log) => (
            <button
              key={log.id}
              className={`echo-hotspot${room4.viewedLogs.has(log.id) ? ' examined' : ''}`}
              style={{ left: `${log.x}%`, top: `${log.y}%`, width: `${log.w}%`, height: `${log.h}%` }}
              title={log.label}
              onClick={() => open(log)}
            >
              <span className="echo-hotspot-marker" />
              <span className="echo-hotspot-label">{log.label}</span>
            </button>
          ))}
        </div>
      </div>

      {openLog && (
        <div className="echo-scrim" onClick={() => setOpenLog(null)}>
          <div className="echo-popup" onClick={(e) => e.stopPropagation()}>
            <h3>{openLog.title}</h3>
            <p>{openLog.text}</p>
            <button className="echo-btn" onClick={() => setOpenLog(null)}>
              Close
            </button>
          </div>
        </div>
      )}

      <ChatBox
        messages={consoleMessages}
        onSend={submitFinalMessage}
        disabled={!unlocked}
        placeholder={unlocked ? 'What do you want them to hear?' : 'Read more of the room first…'}
        emptyHint=""
      />
      {!unlocked && (
        <p className="echo-room-hint">
          {room4.viewedLogs.size} of {LOGS_REQUIRED} read.
        </p>
      )}
    </div>
  );
}
