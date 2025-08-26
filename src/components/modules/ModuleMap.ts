import AddHabit from './AddHabit';
import Settings from './Settings';
import DeleteConfirm from './DeleteConfirm';

const ModuleMap: Record<string, React.FC> = {
    AddHabit: AddHabit,
    Settings: Settings,
    Delete:DeleteConfirm,
};

export default ModuleMap;
