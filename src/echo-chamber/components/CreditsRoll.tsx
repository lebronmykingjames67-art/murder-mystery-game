import { useEchoStore } from '../state/echoStore';
import { ECHO_MIMIC_EPILOGUE_ADDENDUM, getEpilogueLine, priorFinalMessages } from '../data/room4';

interface CreditsRollProps {
  onExit: () => void;
}

export default function CreditsRoll({ onExit }: CreditsRollProps) {
  const toneCounts = useEchoStore((s) => s.toneCounts);
  const finalMessage = useEchoStore((s) => s.finalMessage);
  const finalChoice = useEchoStore((s) => s.room3.finalChoice);
  const restart = useEchoStore((s) => s.restart);

  const entries = [
    ...priorFinalMessages,
    { author: 'YOU — UNLOGGED', timestamp: 'TOMORROW', text: finalMessage ?? '(nothing typed)' },
  ];

  const epilogue = getEpilogueLine(toneCounts);

  return (
    <div className="echo-credits">
      <p className="echo-credits-heading">What gets said here becomes what the next person hears.</p>
      <div className="echo-credits-list">
        {entries.map((entry, i) => {
          const isPlayer = i === entries.length - 1;
          return (
            <div
              key={i}
              className={`echo-credit-line${isPlayer ? ' echo-credit-line-player' : ''}`}
              style={{ animationDelay: `${i * 0.5}s` }}
            >
              <span className="echo-credit-meta">
                {entry.author} — {entry.timestamp}
              </span>
              <p>{entry.text}</p>
            </div>
          );
        })}
      </div>

      <div className="echo-credits-epilogue" style={{ animationDelay: `${entries.length * 0.5}s` }}>
        <p className="echo-epilogue-line">{epilogue}</p>
        {finalChoice === 'echo-mimic' && <p className="echo-epilogue-line echo-epilogue-addendum">{ECHO_MIMIC_EPILOGUE_ADDENDUM}</p>}
        <div className="echo-credits-actions">
          <button className="echo-btn" onClick={restart}>
            Play Again
          </button>
          <button className="echo-btn echo-btn-ghost" onClick={onExit}>
            Return to Menu
          </button>
        </div>
      </div>
    </div>
  );
}
