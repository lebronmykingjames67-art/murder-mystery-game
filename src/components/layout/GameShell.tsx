import { useGameStore } from '../../state/gameStore';
import TopBar from './TopBar';
import PopupModal from './PopupModal';
import ToastHost from './ToastHost';
import ChapterBannerOverlay from './ChapterBannerOverlay';
import MainMenu from '../intro/MainMenu';
import IntroScene from '../intro/IntroScene';
import Elevator from '../elevator/Elevator';
import FloorMap from '../floor/FloorMap';
import RoomScene from '../room/RoomScene';
import DialogueBox from '../dialogue/DialogueBox';
import AccusationScene from '../accusation/AccusationScene';
import EndingScene from '../accusation/EndingScene';
import Notebook from '../notebook/Notebook';

export default function GameShell() {
  const view = useGameStore((s) => s.view);
  const showChrome = view !== 'menu' && view !== 'intro' && view !== 'ending';

  return (
    <div className="app-shell">
      {showChrome && <TopBar />}
      <div className="app-main">
        <div className="view-fade" key={view}>
          {view === 'menu' && <MainMenu />}
          {view === 'intro' && <IntroScene />}
          {view === 'elevator' && <Elevator />}
          {view === 'floor' && <FloorMap />}
          {view === 'room' && <RoomScene />}
          {view === 'dialogue' && <DialogueBox />}
          {view === 'accusation' && <AccusationScene />}
          {view === 'ending' && <EndingScene />}
        </div>
      </div>
      <Notebook />
      <PopupModal />
      <ToastHost />
      <ChapterBannerOverlay />
    </div>
  );
}
