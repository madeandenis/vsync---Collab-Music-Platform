import { Dispatch, SetStateAction, useState } from "react";
import { GroupForm } from "./GroupForm";
import { Group } from "@frontend/shared";
import useGroupForm from "../../_hooks/group/useGroupForm";

interface EditGroupFormProps {
    group: Group;
    setOpen: Dispatch<SetStateAction<boolean>>;
    refetchAll?: () => void;
}

export const EditGroupForm = ({ group, setOpen, refetchAll }: EditGroupFormProps) => {
    const context = useGroupForm(group, refetchAll);
    return <GroupForm setOpen={setOpen} context={context}/>
}