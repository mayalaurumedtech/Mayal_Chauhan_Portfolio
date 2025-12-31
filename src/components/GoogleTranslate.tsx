import { useEffect, useState } from 'react';

declare global {
    interface Window {
        google: any;
        googleTranslateElementInit: () => void;
    }
}

export const GoogleTranslate = () => {
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        // Check if script is already present
        const existingScript = document.getElementById('google-translate-script');

        // Define the init function globally
        window.googleTranslateElementInit = () => {
            // @ts-ignore
            if (window.google && window.google.translate) {
                new window.google.translate.TranslateElement({
                    pageLanguage: 'en',
                    includedLanguages: 'en,hi,gu',
                    layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
                    autoDisplay: false,
                }, 'google_translate_element');
                setLoaded(true);
            }
        };

        // If script already loaded, try to init immediately if google is available
        if (existingScript && window.google && window.google.translate) {
            window.googleTranslateElementInit();
        } else if (!existingScript) {
            // Inject script
            const script = document.createElement('script');
            script.id = 'google-translate-script';
            script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
            script.async = true;
            document.body.appendChild(script);
        }
    }, []);

    return (
        <div className="google-translate-container notranslate">
            {/* Helper styles to customize the un-customizable widget if needed */}
            <style>{`
            .goog-te-gadget-simple {
                background-color: transparent !important;
                border: none !important;
                font-size: 10pt !important;
                display: flex !important;
                align-items: center !important;
                padding: 0 !important;
            }
            .goog-te-gadget-simple img {
                display: none !important;
            }
            .goog-te-gadget-simple span {
                color: currentColor !important;
            }
            .goog-text-highlight {
                background-color: transparent !important;
                box-shadow: none !important;
            }
            
            /* HIDE TOP BAR */
            .goog-te-banner-frame.skiptranslate {
                display: none !important;
            }
            body {
                top: 0px !important; 
            }
            
            /* Hide the Google attribution tooltips */
            #goog-gt-tt {
                display: none !important;
                visibility: hidden !important;
            }
        `}</style>
            <div id="google_translate_element" className="min-w-[120px]" />
        </div>
    );
};
