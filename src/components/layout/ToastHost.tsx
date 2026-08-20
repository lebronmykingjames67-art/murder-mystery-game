import { useEffect } from 'react';
import { useGameStore } from '../../state/gameStore';

export default function ToastHost() {
  const toast = useGameStore((s) => s.toast);
  const dismiss = useGameStore((s) => s.dismissToast);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => dismiss(), 4800);
    return () => clearTimeout(t);
  }, [toast, dismiss]);

  if (!toast) return null;

  return (
    <div className="toast-host">
      <div className="toast" onClick={dismiss}>
        {toast.text}
      </div>
    </div>
  );
}
