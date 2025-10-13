import AddHabit from './AddHabit';
import Settings from './Settings';
import DeleteConfirm from './DeleteConfirm';
import { PickHandler } from './PickHandler';
import { BgHandler } from './BgHandler';

const ModuleMap: Record<string, React.FC> = {
    AddHabit: AddHabit,
    Settings: Settings,
    Delete:DeleteConfirm,
    PickHandler:PickHandler,
    BgHandler:BgHandler
};

export default ModuleMap;
