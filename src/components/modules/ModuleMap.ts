import ConfirmAction from './ConfirmAction';
import HabitParticipantPicker from './HabitParticipantPicker';
import HabitCreateChat from './HabitCreateChat';
import AddHabit from './AddHabit';
import DeleteConfirm from './DeleteConfirm';
import { PickHandler } from './PickHandler';
import { BgHandler } from './BgHandler';
import ImgPrev from './ImgPrev';
import Redirecting from './Redirecting';
import RedirectMesses from './RedirectMesses';
import CreateChat from './CreateChat';
import PermissionsSettings from './PermissionsSettings';
import ShareAcc from './ShareAcc';
import LinkConfirm from './LinkConfirm';
import ChatWithInfo from './ChatWithInfo';
import Table from './Table';
import PostSettings from './PostSettings';
import HabitCollaborationSettings from './HabitCollaborationSettings';
import HabitDayActivityHistory from './HabitDayActivityHistory';
import HabitTaskEditor from './HabitTaskEditor';
import WelcomeMessageInfo from './WelcomeMessageInfo';
import QuickActionPicker from './QuickActionPicker';
import BackgroundLibrary from './BackgroundLibrary';
import BackgroundFullscreen from './BackgroundFullscreen';
import CustomThemeColor from './CustomThemeColor';

const ModuleMap: Record<string, React.FC> = {
    ConfirmAction:ConfirmAction,
    HabitParticipantPicker:HabitParticipantPicker,
    HabitCreateChat:HabitCreateChat,
    AddHabit: AddHabit,
    Delete:DeleteConfirm,
    PickHandler:PickHandler,
    BgHandler:BgHandler,
    ImgPrev:ImgPrev,
    Redirecting:Redirecting,
    RedirectMesses:RedirectMesses,
    CreateChat:CreateChat,
    PermissionsSettings:PermissionsSettings,
    ShareAcc:ShareAcc,
    LinkConfirm:LinkConfirm,
    ChatWithInfo:ChatWithInfo,
    PostSettings:PostSettings,
    HabitCollaborationSettings:HabitCollaborationSettings,
    HabitDayActivityHistory:HabitDayActivityHistory,
    HabitTaskEditor:HabitTaskEditor,
    WelcomeMessageInfo:WelcomeMessageInfo,
    QuickActionPicker:QuickActionPicker,
    BackgroundLibrary:BackgroundLibrary,
    BackgroundFullscreen:BackgroundFullscreen,
    CustomThemeColor:CustomThemeColor,
    Table:Table
};

export default ModuleMap;
