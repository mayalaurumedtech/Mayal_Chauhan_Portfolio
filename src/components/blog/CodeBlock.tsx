import { useState } from 'react';
import { Check, Copy, Terminal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CodeBlockProps {
    language?: string;
    code: string;
    className?: string;
}

export const CodeBlock = ({ language = 'text', code, className }: CodeBlockProps) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className={cn("relative my-6 rounded-lg overflow-hidden border bg-zinc-950 text-zinc-50 font-mono text-sm", className)}>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-zinc-800">
                <div className="flex items-center gap-2 text-zinc-400">
                    <Terminal className="w-4 h-4" />
                    <span className="text-xs uppercase font-semibold">{language}</span>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-800"
                    onClick={handleCopy}
                >
                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </Button>
            </div>

            {/* Code Content */}
            <div className="p-4 overflow-x-auto">
                <pre className="m-0 bg-transparent p-0">
                    <code className="font-mono">{code}</code>
                </pre>
            </div>
        </div>
    );
};
