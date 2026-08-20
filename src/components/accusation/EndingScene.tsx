import { useState } from 'react';
import { useGameStore } from '../../state/gameStore';
import { clues } from '../../data/clues';

const EPILOGUE_BEATS = [
  "Renata Cole's composure finally cracks when hotel security walks her down to the lobby. She doesn't confess, exactly — but she stops pretending, too, which by the end of a night like this amounts to nearly the same thing.",
  "The \"Housekeeping Master 3\" card is found days later at the bottom of her handbag, wiped clean. Not clean enough.",
  "Marcus Voss stays one more night at The Grand Meridian — under his own name, this time. He isn't sure yet whether he'll fight for what's left of the family trust. He mostly just wanted someone to believe him.",
  "Priya Anand keeps her job, though not without a long conversation with ownership about \"appropriate boundaries.\" She keeps the wine cork from that night in her desk drawer, and doesn't explain why.",
  "Wes Okafor pours one last round before his shift ends, hands steadier now than an hour ago. \"Guess I'm not as good a judge of character as I thought,\" he mutters, mostly to himself.",
  "Diane Faraday tells the story to anyone who'll listen for the rest of her stay. By the third telling, there are two women in green dresses, and one of them can fly.",
];

export default function EndingScene() {
  const [index, setIndex] = useState(0);
  const [showSummary, setShowSummary] = useState(false);
  const collectedClues = useGameStore((s) => s.collectedClues);
  const wrongAccusationCount = useGameStore((s) => s.wrongAccusationCount);
  const goToMenu = useGameStore((s) => s.goToMenu);
  const newGame = useGameStore((s) => s.newGame);

  const isLast = index === EPILOGUE_BEATS.length - 1;
  const foundAll = collectedClues.length === clues.length;

  if (!showSummary) {
    return (
      <div className="ending-screen">
        <div className="ending-card">
          <div className="eyebrow">Case Closed</div>
          <p className="ending-text" key={index}>
            {EPILOGUE_BEATS[index]}
          </p>
          <div className="intro-actions">
            <span className="intro-progress">
              {EPILOGUE_BEATS.map((_, i) => (
                <span key={i} className={`intro-dot${i === index ? ' active' : ''}`} />
              ))}
            </span>
            {isLast ? (
              <button className="btn btn-primary" onClick={() => setShowSummary(true)}>
                Read the Morning Paper
              </button>
            ) : (
              <button className="btn btn-primary" onClick={() => setIndex((i) => i + 1)}>
                Continue
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ending-screen">
      <div className="newspaper-card">
        <div className="newspaper-masthead">
          <span>The Meridian Herald</span>
        </div>
        <div className="gold-rule" />
        <h1 className="newspaper-headline">HOTEL INVESTOR'S DEATH RULED HOMICIDE</h1>
        <h3 className="newspaper-subhead">Business Partner Renata Cole Charged in Voss Slaying</h3>
        <p className="newspaper-body">
          Julian Voss, 52, co-founder of the Meridian Group hospitality chain, was found dead in his suite at The
          Grand Meridian Hotel late Tuesday night. Following an overnight investigation, authorities have charged
          Renata Cole, Voss's longtime business partner, in connection with his death. Sources close to the
          investigation cite a financial dispute — and a private detective who, remarkably, solved the whole thing
          before breakfast.
        </p>
        <div className="ending-stamp">CASE CLOSED</div>
      </div>

      <div className="ending-footer">
        <div className="ending-stats">
          <div className="ending-stat">
            <span className="ending-stat-num">{collectedClues.length}/{clues.length}</span>
            <span className="ending-stat-label">Clues Found</span>
            {foundAll && <span className="ending-stat-badge">Every Clue Found</span>}
          </div>
          <div className="ending-stat">
            <span className="ending-stat-num">{wrongAccusationCount}</span>
            <span className="ending-stat-label">Wrong Accusations</span>
            {wrongAccusationCount === 0 && <span className="ending-stat-badge">First-Try Detective</span>}
          </div>
        </div>

        <div className="ending-actions">
          <button className="btn btn-primary" onClick={newGame}>
            Start a New Case
          </button>
          <button className="btn btn-ghost" onClick={goToMenu}>
            Main Menu
          </button>
        </div>
      </div>
    </div>
  );
}
