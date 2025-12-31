import { useRef, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
    Bold, Italic, List, ListOrdered, Table, Image, Link as LinkIcon,
    Heading1, Heading2, Heading3, Loader2, Eye, Edit2
} from "lucide-react";
import { uploadImage } from '@/lib/cloudinary';
import { useToast } from '@/hooks/use-toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    rows?: number;
}

export const MarkdownEditor = ({ value, onChange, placeholder, rows = 12 }: MarkdownEditorProps) => {
    const { toast } = useToast();
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);

    const insertText = (before: string, after: string = '') => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const currentText = textarea.value;
        const selectedText = currentText.substring(start, end);

        const newText =
            currentText.substring(0, start) +
            before + selectedText + after +
            currentText.substring(end);

        onChange(newText);

        setTimeout(() => {
            textarea.focus();
            const newCursorPos = start + before.length + selectedText.length + after.length;
            textarea.setSelectionRange(newCursorPos, newCursorPos);
        }, 0);
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const url = await uploadImage(file, 'blog-content');
            insertText(`\n![Image Description](${url})\n`, '');
            toast({ title: "Success", description: "Image uploaded and inserted" });
        } catch (error) {
            toast({ title: "Error", description: "Failed to upload image", variant: "destructive" });
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const insertTable = () => {
        const tableTemplate = `\n| Header 1 | Header 2 | Header 3 |\n| -------- | -------- | -------- |\n| Cell 1   | Cell 2   | Cell 3   |\n| Cell 4   | Cell 5   | Cell 6   |\n`;
        insertText(tableTemplate);
    };

    return (
        <div className="space-y-2 border rounded-md p-1 bg-muted/20">
            <Tabs defaultValue="write" className="w-full">
                <div className="flex items-center justify-between px-2 py-1 border-b bg-muted/10">
                    <TabsList className="grid w-[200px] grid-cols-2">
                        <TabsTrigger value="write" className="gap-2"><Edit2 className="w-3 h-3" /> Write</TabsTrigger>
                        <TabsTrigger value="preview" className="gap-2"><Eye className="w-3 h-3" /> Preview</TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="write" className="mt-0">
                    <div className="flex flex-wrap gap-1 p-2 border-b bg-card rounded-t-sm sticky top-0 z-10">
                        <Button
                            type="button" variant="ghost" size="sm" className="h-8 px-2"
                            onClick={() => insertText('# ', '')} title="Heading 1"
                        >
                            <Heading1 className="w-4 h-4" />
                        </Button>
                        <Button
                            type="button" variant="ghost" size="sm" className="h-8 px-2"
                            onClick={() => insertText('## ', '')} title="Heading 2"
                        >
                            <Heading2 className="w-4 h-4" />
                        </Button>
                        <Button
                            type="button" variant="ghost" size="sm" className="h-8 px-2"
                            onClick={() => insertText('### ', '')} title="Heading 3"
                        >
                            <Heading3 className="w-4 h-4" />
                        </Button>
                        <div className="w-[1px] h-6 bg-border mx-1 my-auto" />
                        <Button
                            type="button" variant="ghost" size="sm" className="h-8 px-2"
                            onClick={() => insertText('**', '**')} title="Bold"
                        >
                            <Bold className="w-4 h-4" />
                        </Button>
                        <Button
                            type="button" variant="ghost" size="sm" className="h-8 px-2"
                            onClick={() => insertText('_', '_')} title="Italic"
                        >
                            <Italic className="w-4 h-4" />
                        </Button>
                        <div className="w-[1px] h-6 bg-border mx-1 my-auto" />
                        <Button
                            type="button" variant="ghost" size="sm" className="h-8 px-2"
                            onClick={() => insertText('- ', '')} title="Bullet List"
                        >
                            <List className="w-4 h-4" />
                        </Button>
                        <Button
                            type="button" variant="ghost" size="sm" className="h-8 px-2"
                            onClick={() => insertText('1. ', '')} title="Numbered List"
                        >
                            <ListOrdered className="w-4 h-4" />
                        </Button>
                        <div className="w-[1px] h-6 bg-border mx-1 my-auto" />
                        <Button
                            type="button" variant="ghost" size="sm" className="h-8 px-2"
                            onClick={insertTable} title="Table"
                        >
                            <Table className="w-4 h-4" />
                        </Button>
                        <Button
                            type="button" variant="ghost" size="sm" className="h-8 px-2"
                            onClick={() => fileInputRef.current?.click()} title="Insert Image"
                            disabled={uploading}
                        >
                            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Image className="w-4 h-4" />}
                        </Button>
                        <input
                            type="file" ref={fileInputRef} className="hidden"
                            accept="image/*" onChange={handleImageUpload}
                        />
                        <Button
                            type="button" variant="ghost" size="sm" className="h-8 px-2"
                            onClick={() => insertText('[', '](url)')} title="Link"
                        >
                            <LinkIcon className="w-4 h-4" />
                        </Button>
                    </div>
                    <Textarea
                        ref={textareaRef}
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder={placeholder}
                        rows={rows}
                        className="border-0 focus-visible:ring-0 resize-y bg-background p-4 min-h-[400px] font-mono text-sm leading-relaxed"
                    />
                </TabsContent>

                <TabsContent value="preview" className="mt-0 min-h-[400px] bg-white dark:bg-zinc-950 p-6 rounded-b-md border-t">
                    {value ? (
                        <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none 
                            prose-headings:text-foreground prose-headings:scroll-mt-24
                            prose-p:text-foreground/90 prose-p:leading-relaxed
                            prose-strong:text-foreground prose-strong:font-black
                            prose-em:text-foreground/80 prose-em:italic
                            prose-a:text-primary prose-a:font-bold hover:prose-a:underline
                            prose-img:rounded-2xl prose-img:shadow-lg
                            prose-table:border prose-table:border-border/50
                            prose-th:bg-muted/50 prose-th:px-4 prose-th:py-3 prose-th:text-foreground
                            prose-td:border-t prose-td:border-border/30 prose-td:px-4 prose-td:py-3 prose-td:text-muted-foreground">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {value}
                            </ReactMarkdown>
                        </div>
                    ) : (
                        <div className="h-full flex items-center justify-center text-muted-foreground italic min-h-[300px]">
                            Nothing to preview. Write some content first!
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
};
