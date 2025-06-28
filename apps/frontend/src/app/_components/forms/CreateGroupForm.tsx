import { Dispatch, SetStateAction, useState } from "react";
import { GroupForm } from "./GroupForm";
import useGroupForm from "../../_hooks/group/useGroupForm";

interface CreateGroupFormProps {
    setOpen: Dispatch<SetStateAction<boolean>>;
    refetchAll?: () => void;
}

export const CreateGroupForm = ({ setOpen, refetchAll }: CreateGroupFormProps) => {
    const context = useGroupForm(undefined,refetchAll);
    return <GroupForm setOpen={setOpen} context={context}/>
}