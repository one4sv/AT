import AddHabit from './AddHabit';
import Settings from './Settings';
import DeleteConfirm from './DeleteConfirm';
import { PickHandler } from './PickHandler';
import AddGroup from './AddGroup';
import { BgHandler } from './bgHandler';

const ModuleMap: Record<string, React.FC> = {
    AddHabit: AddHabit,
    Settings: Settings,
    Delete:DeleteConfirm,
    PickHandler:PickHandler,
    AddGroup:AddGroup,
    BgHandler:BgHandler
};

export default ModuleMap;
