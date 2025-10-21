import AddHabit from './AddHabit';
import Settings from './Settings';
import DeleteConfirm from './DeleteConfirm';
import { PickHandler } from './PickHandler';
import { BgHandler } from './BgHandler';
import ImgPrev from './ImgPrev';

const ModuleMap: Record<string, React.FC> = {
    AddHabit: AddHabit,
    Settings: Settings,
    Delete:DeleteConfirm,
    PickHandler:PickHandler,
    BgHandler:BgHandler,
    ImgPrev:ImgPrev
};

export default ModuleMap;
