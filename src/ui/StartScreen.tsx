interface Props {
  onStart: () => void
}

const CONTROLS: [string, string][] = [
  ['W A S D', 'Steer / accelerate / brake'],
  ['Space', 'Handbrake / drift'],
  ['Shift', 'Boost'],
  ['E', 'Interact — pickup, deliver, depot'],
  ['Tab', 'Order Board'],
  ['M', 'City Map'],
  ['Esc', 'Pause'],
]

export function StartScreen({ onStart }: Props) {
  return (
    <div className="start-screen">
      <div className="start-card">
        <div className="start-badge">COURIER SIMULATOR</div>
        <h1>DELIVERY RUSH</h1>
        <p className="tagline">Accept jobs. Beat the clock. Build your fleet. Every shift plays different.</p>
        <div className="controls-grid">
          {CONTROLS.map(([key, label]) => (
            <div className="control-row" key={key}>
              <kbd>{key}</kbd>
              <span>{label}</span>
            </div>
          ))}
        </div>
        <button className="btn-primary" onClick={onStart}>
          Start Shift
        </button>
        <p className="start-footnote">Progress autosaves to this browser.</p>
      </div>
    </div>
  )
}
