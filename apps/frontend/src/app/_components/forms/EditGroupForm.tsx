import { Dispatch, SetStateAction, useState } from "react";
import useGroupForm from "../../_hooks/useGroupForm";
import { GroupForm } from "./GroupForm";
import { Group } from "@frontend/shared";

interface EditGroupFormProps {
    group: Group;
    setOpen: Dispatch<SetStateAction<boolean>>;
}

export const EditGroupForm = ({ group, setOpen }: EditGroupFormProps) => {
    const context = useGroupForm(group);
    return <GroupForm setOpen={setOpen} context={context}/>
}