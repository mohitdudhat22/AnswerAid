import { type ClassValue, clsx } from "clsx";;
import { twMerge } from "tailwind-merge";

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));
export   const handleCopyText = (output, setToastMessage) => {
    navigator.clipboard.writeText(output).then(() => {
      setToastMessage('Text copied to clipboard!');
    });
};