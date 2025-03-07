import { FaChevronDown } from "react-icons/fa";
import { HTTP_STATUS_CODES } from "../../_constants/httpStatusCodes";
import { FetchError } from "../../errors/fetch.error";
import Alert, { AlertProps } from "./Alert";

export interface FetchAlertProps {
    error: FetchError,
    errorPayloadOn?: boolean;
    headerOn?: boolean;
    duration?: number;
    dismissible?: boolean;
    index?: number;
    onClose: () => void;
}

const alertTypeMap: { [key: number]: AlertProps['type'] } = {
    1: 'info',
    2: 'success',
    3: 'warning',
    4: 'error',
    5: 'error',
};

export const FetchAlert = (props: FetchAlertProps) => {
    const { error } = props;
    const type: AlertProps['type'] = alertTypeMap[Math.floor(error.status / 100)] || 'error';
    const status_code_message = HTTP_STATUS_CODES[Number(error.status)];
    const content: AlertProps['content'] = {
        title: error.message,
    }

    const errorPayload = props.errorPayloadOn && (
        <details className="mt-4 text-xs bg-black/65 p-2 rounded-md cursor-pointer">
            <summary className="flex items-center font-semibold">
                <FaChevronDown className="mr-1"/> View Details
            </summary>
            <pre className="whitespace-pre-wrap text-md mt-2 p-2 text-green-500">{error.url}</pre>
            <pre className="whitespace-pre-wrap text-xs p-2 text-white">{error.stack}</pre>
        </details>
    )

    return ( 
        <Alert type={type} content={content} {...props}>
            {errorPayload}
        </Alert>
    )
}