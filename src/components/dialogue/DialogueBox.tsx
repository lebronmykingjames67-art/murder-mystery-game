import { useGameStore } from '../../state/gameStore';
import { getSuspectDialogue } from '../../data/dialogue';
import { suspects } from '../../data/suspects';
import { clues } from '../../data/clues';
import { availableTopics } from '../../engine/dialogueEngine';
import Portrait from '../art/Portrait';
import ClueIcon from '../art/ClueIcon';

export default function DialogueBox() {
  const dialogue = useGameStore((s) => s.dialogue);
  const flags = useGameStore((s) => s.flags);
  const collectedClues = useGameStore((s) => s.collectedClues);
  const advanceDialogueLine = useGameStore((s) => s.advanceDialogueLine);
  const chooseTopic = useGameStore((s) => s.chooseTopic);
  const presentEvidence = useGameStore((s) => s.presentEvidence);
  const endDialogue = useGameStore((s) => s.endDialogue);

  if (!dialogue) return null;
  const suspect = suspects.find((s) => s.id === dialogue.suspectId);
  const suspectDialogue = getSuspectDialogue(dialogue.suspectId);
  if (!suspect || !suspectDialogue) return null;

  const isPlaying = dialogue.lines.length > 0;
  const currentLine = isPlaying ? dialogue.lines[dialogue.lineIndex] : null;
  const isLastLine = isPlaying && dialogue.lineIndex === dialogue.lines.length - 1;
  const topics = !isPlaying ? availableTopics(suspectDialogue, flags, collectedClues) : [];

  return (
    <div className="dialogue-screen">
      <div className="dialogue-header">
        <Portrait initials={suspect.initials} color={suspect.colorTag} size={52} />
        <div>
          <h2>{suspect.name}</h2>
          <p className="dialogue-role">{suspect.role}</p>
        </div>
      </div>

      {isPlaying && currentLine && (
        <button className="dialogue-textbox" onClick={advanceDialogueLine}>
          {currentLine.speaker !== 'narration' && (
            <span className={`dialogue-speaker speaker-${currentLine.speaker}`}>
              {currentLine.speaker === 'suspect' ? suspect.name : 'You'}
            </span>
          )}
          <p className={currentLine.speaker === 'narration' ? 'dialogue-narration' : ''}>{currentLine.text}</p>
          <span className="dialogue-advance">{isLastLine ? 'Continue ▸' : '▸'}</span>
        </button>
      )}

      {!isPlaying && (
        <div className="dialogue-hub">
          <div className="dialogue-topics">
            <div className="eyebrow">Ask About</div>
            <div className="dialogue-topic-list">
              {topics.map((t) => (
                <button key={t.id} className="btn dialogue-topic-btn" onClick={() => chooseTopic(t.id)}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {collectedClues.length > 0 && (
            <div className="dialogue-evidence">
              <div className="eyebrow">Present Evidence</div>
              <div className="dialogue-evidence-grid">
                {collectedClues.map((clueId) => {
                  const clue = clues.find((c) => c.id === clueId);
                  if (!clue) return null;
                  return (
                    <button
                      key={clueId}
                      className="evidence-chip"
                      onClick={() => presentEvidence(clueId)}
                      title={clue.shortDescription}
                    >
                      <ClueIcon icon={clue.icon} size={16} />
                      <span>{clue.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="dialogue-footer">
            <button className="btn btn-ghost" onClick={endDialogue}>
              End Conversation
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
