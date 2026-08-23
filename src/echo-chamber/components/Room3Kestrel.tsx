import { useMemo, useState } from 'react';
import { useEchoStore } from '../state/echoStore';
import { filterByWeakestTone } from '../engine/toneEngine';
import {
  finalBranchKestrelLine,
  finalBranchOptions,
  getKestrelOpeningLine,
  kestrelExchanges,
  type FinalBranchOption,
  type KestrelOption,
} from '../data/room3';
import type { KestrelFinalChoice, ToneTag } from '../types';
import EchoRoomArt from '../art/EchoRoomArt';

interface Pending {
  reaction: string;
  tone?: ToneTag;
  finalChoice?: KestrelFinalChoice;
}

export default function Room3Kestrel() {
  const transcript = useEchoStore((s) => s.transcript);
  const triggerHistory = useEchoStore((s) => s.triggerHistory);
  const toneCounts = useEchoStore((s) => s.toneCounts);
  const room3 = useEchoStore((s) => s.room3);
  const chooseKestrelOption = useEchoStore((s) => s.chooseKestrelOption);
  const chooseKestrelFinal = useEchoStore((s) => s.chooseKestrelFinal);
  const goToScreen = useEchoStore((s) => s.goToScreen);

  const [pending, setPending] = useState<Pending | null>(null);

  const openingLine = useMemo(() => getKestrelOpeningLine(transcript, triggerHistory), [transcript, triggerHistory]);

  const idx = room3.exchangeIndex;

  function pickOption(opt: KestrelOption) {
    setPending({ reaction: opt.reaction, tone: opt.tone });
  }
  function pickFinal(opt: FinalBranchOption) {
    setPending({ reaction: opt.reaction, finalChoice: opt.id });
  }
  function continueBeat() {
    if (!pending) return;
    if (pending.finalChoice) chooseKestrelFinal(pending.finalChoice);
    else if (pending.tone) chooseKestrelOption(pending.tone);
    setPending(null);
  }

  const resolved = idx >= 5;

  return (
    <div className="echo-room3">
      <div className="echo-room-stage echo-room3-stage">
        <EchoRoomArt room="viewing" />
        <div className="echo-vignette" />
      </div>

      <div className="echo-kestrel-panel">
        {resolved ? (
          <>
            <p className="echo-leaving-caption">
              A door on your side of the glass slides open. Kestrel doesn't stop watching you until you're through it.
            </p>
            <button className="echo-btn echo-btn-primary" onClick={() => goToScreen('room4')}>
              Step through →
            </button>
          </>
        ) : pending ? (
          <>
            <div className="chat-msg chat-msg-echo echo-kestrel-line">
              <span className="chat-msg-sender">KESTREL</span>
              <p>{pending.reaction}</p>
            </div>
            <button className="echo-btn echo-btn-primary" onClick={continueBeat}>
              Continue
            </button>
          </>
        ) : idx === 4 ? (
          <>
            <div className="chat-msg chat-msg-echo echo-kestrel-line">
              <span className="chat-msg-sender">KESTREL</span>
              <p>{finalBranchKestrelLine}</p>
            </div>
            <div className="echo-option-list">
              {finalBranchOptions.map((opt) => (
                <button key={opt.id} className="echo-option-btn" onClick={() => pickFinal(opt)}>
                  {opt.text}
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            {idx === 0 && (
              <div className="chat-msg chat-msg-echo echo-kestrel-line">
                <span className="chat-msg-sender">KESTREL</span>
                <p>{openingLine}</p>
              </div>
            )}
            <div className="chat-msg chat-msg-echo echo-kestrel-line">
              <span className="chat-msg-sender">KESTREL</span>
              <p>{kestrelExchanges[idx].kestrelLine}</p>
            </div>
            <div className="echo-option-list">
              {filterByWeakestTone(kestrelExchanges[idx].options, toneCounts).map((opt) => (
                <button key={opt.tone} className="echo-option-btn" onClick={() => pickOption(opt)}>
                  {opt.text}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
