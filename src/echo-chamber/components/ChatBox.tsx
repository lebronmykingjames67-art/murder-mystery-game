import { useEffect, useRef, useState, type FormEvent } from 'react';
import type { ChatMessage } from '../types';

interface ChatBoxProps {
  messages: ChatMessage[];
  onSend: (text: string) => void;
  placeholder?: string;
  echoLabel?: string;
  disabled?: boolean;
  emptyHint?: string;
  className?: string;
}

// Deliberately plain: a chat interface that could pass for any ordinary
// customer-support widget. No terminal font, no beeps. The unease is supposed
// to come from what gets said in it, not from how it looks.
export default function ChatBox({
  messages,
  onSend,
  placeholder = 'Type a message…',
  echoLabel = 'ECHO',
  disabled,
  emptyHint = 'Say something, if you want.',
  className,
}: ChatBoxProps) {
  const [draft, setDraft] = useState('');
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages.length]);

  function submit(e?: FormEvent) {
    e?.preventDefault();
    const text = draft.trim();
    if (!text || disabled) return;
    onSend(text);
    setDraft('');
  }

  return (
    <div className={`chatbox${className ? ` ${className}` : ''}`}>
      <div className="chatbox-header">
        <span className="chatbox-dot" aria-hidden="true" />
        <span>{echoLabel}</span>
      </div>
      <div className="chatbox-messages" ref={listRef}>
        {messages.length === 0 && <p className="chatbox-empty">{emptyHint}</p>}
        {messages.map((m, i) => (
          <div key={i} className={`chat-msg chat-msg-${m.speaker}`}>
            <span className="chat-msg-sender">{m.speaker === 'echo' ? echoLabel : 'You'}</span>
            <p>{m.text}</p>
          </div>
        ))}
      </div>
      <form className="chatbox-input-row" onSubmit={submit}>
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          maxLength={240}
          aria-label={`Message to ${echoLabel}`}
        />
        <button type="submit" className="chatbox-send" disabled={disabled || !draft.trim()}>
          Send
        </button>
      </form>
    </div>
  );
}
