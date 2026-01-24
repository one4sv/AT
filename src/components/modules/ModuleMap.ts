import AddHabit from './AddHabit';
import Settings from './Settings';
import DeleteConfirm from './DeleteConfirm';
import { PickHandler } from './PickHandler';
import { BgHandler } from './BgHandler';
import ImgPrev from './ImgPrev';
import Redirecting from './Redirecting';
import RedirectMesses from './RedirectMesses';
import CreateChat from './CreateChat';
import PermissionsSettings from './PermissionsSettings';

const ModuleMap: Record<string, React.FC> = {
    AddHabit: AddHabit,
    Settings: Settings,
    Delete:DeleteConfirm,
    PickHandler:PickHandler,
    BgHandler:BgHandler,
    ImgPrev:ImgPrev,
    Redirecting:Redirecting,
    RedirectMesses:RedirectMesses,
    CreateChat:CreateChat,
    PermissionsSettings:PermissionsSettings
};

export default ModuleMap;
