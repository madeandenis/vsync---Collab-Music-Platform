"use client";

import { FaHome } from "react-icons/fa";
import OAuthBtn from "../../../_components/buttons/OAuthBtn";
import { Provider } from "../../../_types/provider.types";
import { useAlertContext } from "../../../contexts/alertContext";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

export default function LoginPage() {
    const searchParams = useSearchParams();
    const { setAlert } = useAlertContext();

    useEffect(() => {
        const errorMessage = searchParams.get("err");
        
        if (errorMessage) {
            setAlert(decodeURIComponent(errorMessage), "error", 1500);

            const url = new URL(window.location.href);
            url.searchParams.delete("err");

            // Update the browser current page url without triggering a re-render
            window.history.replaceState(null, "", url.toString());
        }
    }, [searchParams, setAlert]);

    return (
        <div className="bg-black w-screen h-screen">
            <div className="w-full h-full green-nebula-bg"></div>
            <div className="absolute top-[25%] left-1/2 transform -translate-x-1/2 flex flex-col items-center">
                <h1 className="text-6xl font-poppins text-white">
                    <span className="font-semibold opacity-95">V</span>
                    <span className="text-5xl opacity-90">sync</span>
                </h1>
                <h1 className="mt-12 text-white text-md opacity-85 font-poppins">
                    Sign in using:
                </h1>
                <div className="providers flex gap-x-2 mt-3">
                    <OAuthBtn provider={Provider.Spotify} />
                    <OAuthBtn provider={Provider.YoutubeMusic} />
                </div>
            </div>
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                <a href="/" title="Back home" className="flex gap-x-2 text-white opacity-85 hover:opacity-80">
                    <FaHome size={24} />
                </a>
            </div>
        </div>
    );
}
