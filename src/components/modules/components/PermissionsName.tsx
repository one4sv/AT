import { CaretDown } from "@phosphor-icons/react";
import type { SetStateAction } from "react";

interface NameType {
    showList: { roles: boolean; members: boolean };
    setShowList: React.Dispatch<SetStateAction<{ roles: boolean; members: boolean }>>;
    roles?: number;
    members?: number;
}

export default function PermissionsName({ showList, setShowList, roles, members }: NameType) {
    const isMembers = members !== undefined;
    const handleClick = () => {
        if (isMembers) {
            setShowList(prev => ({ ...prev, members: !prev.members }));
        } else {
            setShowList(prev => ({ ...prev, roles: !prev.roles }));
        }
    };

    return (
        <div className="permissionsName" onClick={handleClick}>
            <span>{isMembers ? "Участники" : "Роли"}:</span>
            <div className="permissionsLength">
                {isMembers ? members : roles}
                {roles !== undefined ? "/10" : ""}
                <CaretDown
                    style={{
                        transform: `rotate(${isMembers && !showList.members ? 180 : !isMembers && !showList.roles ? 180 : 0}deg)`,
                        transition: "transform 0.2s",
                    }}
                />
            </div>
        </div>
    );
}
