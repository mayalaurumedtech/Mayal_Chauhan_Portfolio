import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, Square, Volume2, Globe, Settings, ChevronRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuSubContent,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { GoogleTranslate } from '../GoogleTranslate';

interface BlogAudioPlayerProps {
    content: string;
    title: string;
    className?: string; // Allow styling/positioning
}

export const BlogAudioPlayer = ({ content, title, className }: BlogAudioPlayerProps) => {
    const { toast } = useToast();
    const [isPlaying, setIsPlaying] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [progress, setProgress] = useState(0);
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
    const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);

    // Chunking and Playback state
    const [utteranceQueue, setUtteranceQueue] = useState<string[]>([]);
    const [currentChunkIndex, setCurrentChunkIndex] = useState(0);
    const isSpeakingRef = useRef(false);
    const isPausedRef = useRef(false);

    // Preferred Voices List (Normalized)
    const preferredVoiceNames = [
        "Google ગુજરાતી", "Google Gujarati", "Microsoft Heera", "Microsoft Hemant", "Microsoft Kalpana",
        "Google हिन्दी", "Google Hindi", "Lekha", "Neerja",
        "Microsoft David", "Microsoft Ravi", "Microsoft Mark", "Microsoft Zira",
        "Google US English", "Google UK English Male", "Google UK English Female"
    ];

    // Load saved voice preference
    useEffect(() => {
        const loadVoices = () => {
            const allVoices = window.speechSynthesis.getVoices();

            // Filter voices based on preferences, or fallback to English/Indian languages
            const filteredVoices = allVoices.filter(v =>
                preferredVoiceNames.some(pref => v.name.includes(pref)) ||
                v.lang === 'gu-IN' || v.lang === 'hi-IN' || v.lang === 'en-IN' || v.lang === 'en-GB' || v.lang === 'en-US'
            ).sort((a, b) => {
                // Sort logic: Preferred specific names first
                const aPref = preferredVoiceNames.findIndex(p => a.name.includes(p));
                const bPref = preferredVoiceNames.findIndex(p => b.name.includes(p));
                if (aPref !== -1 && bPref !== -1) return aPref - bPref;
                if (aPref !== -1) return -1;
                if (bPref !== -1) return 1;
                return 0;
            });

            // Remove duplicates by name
            const uniqueVoices = Array.from(new Map(filteredVoices.map(item => [item.name, item])).values());

            if (uniqueVoices.length > 0) {
                setVoices(uniqueVoices);

                // Try to find saved voice
                const savedVoiceURI = localStorage.getItem('blog_reader_voice');
                const savedVoice = uniqueVoices.find(v => v.voiceURI === savedVoiceURI);

                if (savedVoice) {
                    setSelectedVoice(savedVoice);
                } else {
                    // Default: Gujarati -> Hindi -> English
                    const defaultVoice =
                        uniqueVoices.find(v => v.lang.startsWith('gu')) ||
                        uniqueVoices.find(v => v.lang.startsWith('hi')) ||
                        uniqueVoices.find(v => v.name.includes('Ravi')) ||
                        uniqueVoices[0];
                    setSelectedVoice(defaultVoice);
                }
            }
        };

        loadVoices();
        window.speechSynthesis.onvoiceschanged = loadVoices;

        return () => {
            cancelSpeech();
        };
    }, []);

    const cancelSpeech = () => {
        window.speechSynthesis.cancel();
        isSpeakingRef.current = false;
        isPausedRef.current = false;
        setIsPlaying(false);
        setIsPaused(false);
        setUtteranceQueue([]);
        setCurrentChunkIndex(0);
        setProgress(0);
    };

    const cleanText = (input: string) => {
        // Input is now potentially raw text from innerText, not HTML.
        // But we still want to remove common markdown artifacts if they exist
        let text = input;

        // Remove Markdown symbols commonly left over if raw markdown was somehow passed
        text = text
            .replace(/#{1,6}\s?/g, '')
            .replace(/(\*\*|__)(.*?)\1/g, '$2')
            .replace(/(\*|_)(.*?)\1/g, '$2')
            .replace(/`{1,3}(.*?)`{1,3}/g, '$1')
            .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
            .replace(/!\[([^\]]*)\]\([^\)]+\)/g, '')
            .replace(/[*+-]\s/g, '');

        text = text.replace(/,/g, ' , ');
        text = text.replace(/\s+/g, ' ').trim();

        return text;
    };

    const chunkText = (text: string): string[] => {
        const sentences = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [text];
        const chunks: string[] = [];
        let currentChunk = "";

        sentences.forEach(sentence => {
            if ((currentChunk + sentence).length > 200) {
                chunks.push(currentChunk.trim());
                currentChunk = sentence;
            } else {
                currentChunk += sentence;
            }
        });
        if (currentChunk.trim()) {
            chunks.push(currentChunk.trim());
        }
        return chunks;
    };

    const speakChunk = (index: number, queue: string[], voiceOverride?: SpeechSynthesisVoice | null) => {
        if (index >= queue.length) {
            cancelSpeech();
            return;
        }

        if (!isSpeakingRef.current) return;

        const chunk = queue[index];
        const utterance = new SpeechSynthesisUtterance(chunk);

        // Use override if provided (for first chunk after switch), else state
        const voiceToUse = voiceOverride || selectedVoice;

        if (voiceToUse) {
            utterance.voice = voiceToUse;
            utterance.lang = voiceToUse.lang; // CRITICAL: Force the lang to match the voice
        } else {
            // Fallback: If no voice selected, try to detect from content? 
            // Better to default to 'hi-IN' or 'gu-IN' if we think it's indian content
            utterance.lang = 'gu-IN'; // Default to Gujarati/Hindi context
        }

        // Special handling for Gujarati skipping issue
        // Some browsers need explicit lang set even if voice is set
        if (voiceToUse && (voiceToUse.name.includes('Gujarati') || voiceToUse.lang.includes('gu'))) {
            utterance.lang = 'gu-IN';
        }

        utterance.rate = 1.0;
        utterance.volume = 1.0;

        utterance.onend = () => {
            if (isSpeakingRef.current) {
                setCurrentChunkIndex(prev => prev + 1);
                setTimeout(() => speakChunk(index + 1, queue, voiceToUse), 50); // Pass voice forward
            }
        };

        utterance.onerror = (e) => {
            console.error("TTS Error:", e);
            if (e.error !== 'interrupted') {
                setTimeout(() => speakChunk(index + 1, queue, voiceToUse), 50);
            }
        };

        const totalChunks = queue.length;
        const currentProgress = ((index + 1) / totalChunks) * 100;
        setProgress(currentProgress);

        window.speechSynthesis.speak(utterance);
    };

    const handlePlay = () => {
        if (isPaused) {
            window.speechSynthesis.resume();
            setIsPaused(false);
            isPausedRef.current = false;
            setIsPlaying(true);
            isSpeakingRef.current = true;
            return;
        }

        if (isPlaying) {
            window.speechSynthesis.pause();
            setIsPaused(true);
            isPausedRef.current = true;
            setIsPlaying(false);
            return;
        }

        // New Start - DYNAMICALLY GET CONTENT from DOM to support Google Translate
        const contentElement = document.getElementById('blog-content-main');
        const titleElement = document.querySelector('h1')?.innerText || title; // Grab translated title if possible

        let textToRead = "";

        if (contentElement) {
            // Clone to avoid modifying actual DOM when cleaning
            const clone = contentElement.cloneNode(true) as HTMLElement;
            // Remove code blocks from reading? Maybe.
            textToRead = `${titleElement}. ${clone.innerText}`; // innerText gets rendered text (translated)
        } else {
            // Fallback
            textToRead = `${title}. ${cleanText(content)}`;
        }

        const cleanedText = cleanText(textToRead); // Clean markdown symbols etc.
        const newQueue = chunkText(cleanedText);

        if (newQueue.length === 0) {
            toast({ title: "No content", description: "Could not extract readable text." });
            return;
        }


        // AUTO-DETECT LANGUAGE & SWITCH VOICE
        // 1. Check Google Translate Select value if exists
        const googleSelect = document.querySelector('.goog-te-combo') as HTMLSelectElement;
        const currentLang = googleSelect?.value || document.documentElement.lang; // 'hi', 'gu', 'en'

        let targetVoice = selectedVoice;

        // If language changed (e.g., 'hi' or 'gu'), switch voice if not already matching
        if (currentLang && currentLang !== 'en' && currentLang !== 'auto') {
            // Find best matching voice for this language
            // 'hi' -> 'Google हिन्दी' or 'hi-IN'
            // 'gu' -> 'Google ગુજરાતી' or 'gu-IN'
            const langCode = currentLang.split('-')[0]; // 'hi', 'gu'

            const matchingVoice = voices.find(v =>
                v.lang.startsWith(langCode) ||
                (langCode === 'hi' && v.name.includes('Hindi')) ||
                (langCode === 'gu' && v.name.includes('Gujarati')) ||
                (langCode === 'gu' && v.name.includes('India')) // fallback
            );

            if (matchingVoice && (!selectedVoice || !selectedVoice.lang.startsWith(langCode))) {
                targetVoice = matchingVoice;
                setSelectedVoice(matchingVoice);
                toast({ title: "Language Detected", description: `Switching voice to ${matchingVoice.name}` });
            } else if (!matchingVoice && langCode === 'gu') {
                // No specific Gujarati voice found? 
                // We can try to force a "System Default" wrapper if we haven't already
                // But for now, let's just warn or try Hindi
                const hindiVoice = voices.find(v => v.lang.startsWith('hi'));
                if (hindiVoice) {
                    // targetVoice = hindiVoice; // Optional: Fallback to Hindi? No, let user decide.
                    // toast({ title: "Gujarati Voice Not Found", description: "Using Hindi voice as fallback." });
                }
            }
        }

        setUtteranceQueue(newQueue);
        setCurrentChunkIndex(0);
        isSpeakingRef.current = true;
        setIsPlaying(true);

        window.speechSynthesis.cancel();

        // Slight delay to ensure voice switch applies
        setTimeout(() => {
            speakChunk(0, newQueue, targetVoice);
        }, 100);
    };

    const handleStop = () => {
        cancelSpeech();
    };

    const handleVoiceChange = (voice: SpeechSynthesisVoice) => {
        setSelectedVoice(voice);
        localStorage.setItem('blog_reader_voice', voice.voiceURI);
        if (isPlaying || isPaused) {
            toast({ title: "Voice Changed", description: "Restarting..." });
            cancelSpeech();
        }
    };

    // Ensure Google Translate widget is rendered
    // We place the target element in the DOM 

    // Always render, even if voices list is empty initially (browser might load them async)
    // Only return null if speech synthesis is not supported at all
    if (typeof window === 'undefined' || !window.speechSynthesis) return null;

    return (
        <div className={cn("flex items-center gap-3 animate-in fade-in zoom-in duration-300 print:hidden", className)}>

            {/* Google Translate Widget - Styled cleanly */}
            {/* <div className="bg-background border border-border/50 rounded-full px-3 py-1.5 shadow-sm hover:shadow-md transition-all flex items-center justify-center min-w-[140px] h-10">
                <GoogleTranslate />
            </div> */}

            {/* Audio Player Container */}
            <div className="bg-background/80 backdrop-blur-md border border-border/50 shadow-sm rounded-full p-1.5 flex items-center gap-2 pr-3 pl-1.5 transition-all hover:bg-background hover:shadow-md h-10">

                {/* Play/Pause */}
                <Button
                    onClick={handlePlay}
                    variant="ghost"
                    size="icon"
                    className={cn(
                        "h-8 w-8 rounded-full transition-all duration-300",
                        isPlaying
                            ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/90"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                    )}
                >
                    {isPlaying && !isPaused
                        ? <Pause className="h-4 w-4 fill-current" />
                        : <Play className="h-4 w-4 fill-current ml-0.5" />
                    }
                </Button>

                {/* Info & Progress */}
                <div className="flex flex-col gap-0.5 min-w-[80px] sm:min-w-[100px]">
                    <div className="flex items-center justify-between text-[10px] px-1">
                        <span className="font-semibold truncate max-w-[80px] text-foreground/90">
                            {isPlaying ? "Reading..." : "Listen"}
                        </span>
                        {isPlaying && <span className="text-primary font-mono">{Math.round(progress)}%</span>}
                    </div>

                    <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                        <div
                            className={cn("h-full rounded-full transition-all duration-500 ease-out", isPlaying ? "bg-primary" : "bg-primary/30")}
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>

                {/* Controls Divider */}
                <div className="h-4 w-px bg-border/50 mx-1" />

                {/* Options Menu - Simplified for Mobile */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent" title="Voice Settings">
                            <Settings className="h-3.5 w-3.5" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-[85vw] sm:w-64 p-2">

                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                            Select Voice
                        </div>

                        <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
                            <DropdownMenuRadioGroup value={selectedVoice?.voiceURI} onValueChange={(val) => {
                                const v = voices.find(voice => voice.voiceURI === val);
                                if (v) handleVoiceChange(v);
                            }}>
                                {voices.map((voice) => (
                                    <DropdownMenuRadioItem key={voice.voiceURI} value={voice.voiceURI} className="text-xs py-2.5 cursor-pointer">
                                        <div className="flex flex-col gap-0.5">
                                            <span className="font-medium">{voice.name.replace(/(Microsoft|Google|English|United States)/g, '').trim()}</span>
                                            <span className="text-[10px] text-muted-foreground bg-muted/50 px-1 rounded w-fit">{voice.lang}</span>
                                        </div>
                                        {selectedVoice?.voiceURI === voice.voiceURI && <Check className="ml-auto h-3 w-3 text-primary" />}
                                    </DropdownMenuRadioItem>
                                ))}
                            </DropdownMenuRadioGroup>
                        </div>

                        {(isPlaying || isPaused) && (
                            <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={handleStop} className="text-destructive focus:text-destructive cursor-pointer gap-2 text-xs py-2.5 font-medium">
                                    <Square className="h-3.5 w-3.5 fill-current" />
                                    <span>Stop Reading</span>
                                </DropdownMenuItem>
                            </>
                        )}

                    </DropdownMenuContent>
                </DropdownMenu>

            </div>
        </div>
    );
};
