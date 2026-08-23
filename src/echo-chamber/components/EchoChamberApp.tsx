import { useEchoStore } from '../state/echoStore';
import type { EchoScreen } from '../types';
import Room1Cell from './Room1Cell';
import Room2Archive from './Room2Archive';
import Room3Kestrel from './Room3Kestrel';
import Room4Control from './Room4Control';
import CreditsRoll from './CreditsRoll';

interface EchoChamberAppProps {
  onExit: () => void;
}

const ACCENT_CLASS: Record<EchoScreen, string> = {
  title: 'echo-accent-1',
  room1: 'echo-accent-1',
  room2: 'echo-accent-2',
  room3: 'echo-accent-3',
  room4: 'echo-accent-4',
  credits: 'echo-accent-4',
};

function TitleScreen({ onExit }: { onExit: () => void }) {
  const goToScreen = useEchoStore((s) => s.goToScreen);
  return (
    <div className="echo-title-screen">
      <div className="echo-title-card">
        <div className="echo-eyebrow">A Short Narrative Puzzle Game</div>
        <h1>ECHO CHAMBER</h1>
        <p className="echo-title-tagline">
          You wake up in a small room with no memory of how you got here. A voice — calm, helpful, slightly too
          eager — introduces itself as your guide. It can answer any question, solve any puzzle, open any door.
        </p>
        <p className="echo-title-tagline echo-title-tagline-sub">All you have to do is ask.</p>
        <div className="echo-rule" />
        <div className="echo-title-actions">
          <button className="echo-btn echo-btn-primary" onClick={() => goToScreen('room1')}>
            Wake Up
          </button>
          <button className="echo-btn echo-btn-ghost" onClick={onExit}>
            ← Back to Games
          </button>
        </div>
      </div>
    </div>
  );
}

export default function EchoChamberApp({ onExit }: EchoChamberAppProps) {
  const screen = useEchoStore((s) => s.screen);

  return (
    <div className={`echo-chamber ${ACCENT_CLASS[screen]}`}>
      {screen === 'title' && <TitleScreen onExit={onExit} />}
      {screen === 'room1' && <Room1Cell />}
      {screen === 'room2' && <Room2Archive />}
      {screen === 'room3' && <Room3Kestrel />}
      {screen === 'room4' && <Room4Control />}
      {screen === 'credits' && <CreditsRoll onExit={onExit} />}
    </div>
  );
}
