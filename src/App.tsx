import { useState } from 'react';
import GameShell from './components/layout/GameShell';
import GameSelect from './components/select/GameSelect';
import EchoChamberApp from './echo-chamber/components/EchoChamberApp';

type ActiveGame = 'select' | 'meridian' | 'echo';

function App() {
  const [active, setActive] = useState<ActiveGame>('select');

  if (active === 'meridian') return <GameShell />;
  if (active === 'echo') return <EchoChamberApp onExit={() => setActive('select')} />;
  return <GameSelect onSelect={setActive} />;
}

export default App;
