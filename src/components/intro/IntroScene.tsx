import { useState } from 'react';
import { useGameStore } from '../../state/gameStore';

const BEATS = [
  'The Grand Meridian Hotel, a few minutes past midnight.',
  "Julian Voss — investor, co-owner, the man whose name is on half the paperwork in this building — was found dead in Room 412 at 11:47 PM.",
  'Hotel management sealed every exit the moment the body was discovered. No one has left. No one new has arrived. Whoever did this is still somewhere in this building.',
  "You've been called in to sort it out before the police take over at dawn. That gives you one night.",
  'Five people already stand out — a business partner, an estranged brother, a night manager, a bartender, and a guest who happened to be next door. Any of them might be lying to you. Possibly more than one.',
  'The elevator is waiting. Time to get to work, Detective.',
];

export default function IntroScene() {
  const [index, setIndex] = useState(0);
  const beginFromIntro = useGameStore((s) => s.beginFromIntro);

  const isLast = index === BEATS.length - 1;

  return (
    <div className="intro-screen">
      <div className="intro-card">
        <p className="intro-text" key={index}>
          {BEATS[index]}
        </p>
        <div className="intro-actions">
          <span className="intro-progress">
            {BEATS.map((_, i) => (
              <span key={i} className={`intro-dot${i === index ? ' active' : ''}`} />
            ))}
          </span>
          {isLast ? (
            <button className="btn btn-primary" onClick={beginFromIntro}>
              Enter the Elevator
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
