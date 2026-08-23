interface GameSelectProps {
  onSelect: (game: 'meridian' | 'echo') => void;
}

export default function GameSelect({ onSelect }: GameSelectProps) {
  return (
    <div className="game-select-screen">
      <div className="game-select-intro">
        <div className="game-select-eyebrow">Two Games, One Build</div>
        <h1>Choose a Game</h1>
      </div>
      <div className="game-select-grid">
        <button className="game-select-card game-select-card-meridian" onClick={() => onSelect('meridian')}>
          <span className="game-select-card-eyebrow">Murder Mystery</span>
          <h2>The Grand Meridian</h2>
          <p>A noir hotel investigation. One night, one body, five suspects who all have a reason to lie to you.</p>
        </button>
        <button className="game-select-card game-select-card-echo" onClick={() => onSelect('echo')}>
          <span className="game-select-card-eyebrow">Narrative Puzzle</span>
          <h2>Echo Chamber</h2>
          <p>A voice in a small room offers to help with anything. Everything you ask it comes back to you later.</p>
        </button>
      </div>
    </div>
  );
}
