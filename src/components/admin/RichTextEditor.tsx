import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { Color } from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import Highlight from '@tiptap/extension-highlight';
import Youtube from '@tiptap/extension-youtube';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { Node, mergeAttributes, Extension } from '@tiptap/core';

import { Button } from "@/components/ui/button";
import {
    Bold, Italic, Underline as UnderlineIcon, Strikethrough, Code,
    AlignLeft, AlignCenter, AlignRight, AlignJustify,
    List, ListOrdered, Quote,
    Image as ImageIcon, Link as LinkIcon, Youtube as YoutubeIcon,
    Heading1, Heading2, Heading3,
    Redo, Undo, Loader2, Highlighter,
    Terminal, BarChart3, Table as TableIcon, CodeXml,
    Eye
} from "lucide-react";
import { uploadImage } from '@/lib/cloudinary';
import { useToast } from '@/hooks/use-toast';
import { useState, useRef, useEffect } from 'react';

interface RichTextEditorProps {
    content: string;
    onChange: (html: string) => void;
    placeholder?: string;
    className?: string;
}

import { ChartBuilderDialog } from './ChartBuilderDialog';
import { BlogPreviewDialog } from './BlogPreviewDialog';

// Custom Extension to allow <div> tags with classes (for Tailwind)
const Div = Node.create({
    name: 'div',
    priority: 1000, // Higher priority than paragraph
    group: 'block',
    content: 'block+', // Allow blocks inside

    addAttributes() {
        return {
            class: {
                default: null,
                parseHTML: element => element.getAttribute('class'),
                renderHTML: attributes => {
                    if (!attributes.class) {
                        return {}
                    }
                    return {
                        class: attributes.class,
                    }
                },
            },
            style: {
                default: null,
                parseHTML: element => element.getAttribute('style'),
                renderHTML: attributes => {
                    if (!attributes.style) return {};
                    return { style: attributes.style };
                }
            }
        }
    },

    parseHTML() {
        return [
            { tag: 'div' },
        ]
    },

    renderHTML({ HTMLAttributes }) {
        return ['div', mergeAttributes(HTMLAttributes), 0]
    },
});

const ButtonNode = Node.create({
    name: 'button',
    group: 'block',
    content: 'inline*',
    addAttributes() {
        return {
            class: { default: null },
            style: { default: null }
        }
    },
    parseHTML() { return [{ tag: 'button' }] },
    renderHTML({ HTMLAttributes }) { return ['button', mergeAttributes(HTMLAttributes), 0] },
});

const Span = Node.create({
    name: 'span',
    group: 'inline',
    inline: true,
    content: 'inline*',
    addAttributes() {
        return {
            class: { default: null },
            style: { default: null }
        }
    },
    parseHTML() { return [{ tag: 'span' }] },
    renderHTML({ HTMLAttributes }) { return ['span', mergeAttributes(HTMLAttributes), 0] },
});

// Extension to allow class and style on ALL major text nodes
const ClassStyleExtension = Extension.create({
    name: 'classStyle',
    addGlobalAttributes() {
        return [
            {
                types: ['heading', 'paragraph', 'bulletList', 'orderedList', 'listItem', 'textStyle'],
                attributes: {
                    class: {
                        default: null,
                        parseHTML: element => element.getAttribute('class'),
                        renderHTML: attributes => {
                            if (!attributes.class) return {};
                            return { class: attributes.class };
                        },
                    },
                    style: {
                        default: null,
                        parseHTML: element => element.getAttribute('style'),
                        renderHTML: attributes => {
                            if (!attributes.style) return {};
                            return { style: attributes.style };
                        },
                    },
                },
            },
        ];
    },
});

const MenuBar = ({ editor, onImageUpload, uploadState, onInsertChart, showSource, setShowSource, onPreview }: {
    editor: any,
    onImageUpload: () => void,
    uploadState: boolean,
    onInsertChart: (config: any) => void,
    showSource: boolean,
    setShowSource: (show: boolean) => void,
    onPreview: () => void
}) => {
    const [chartBuilderOpen, setChartBuilderOpen] = useState(false);

    if (!editor) {
        return null;
    }

    const addYoutubeVideo = () => {
        const url = prompt('Enter YouTube URL');
        if (url) {
            editor.commands.setYoutubeVideo({ src: url });
        }
    };

    const setLink = () => {
        const previousUrl = editor.getAttributes('link').href;
        const url = window.prompt('URL', previousUrl);
        if (url === null) return;
        if (url === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
            return;
        }
        editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    };

    const handleChartInsert = (config: any) => {
        onInsertChart(config);
    };

    return (
        <>
            <div className="border-b p-2 flex flex-wrap gap-1 bg-muted/20 rounded-t-lg sticky top-0 z-10 backdrop-blur-sm items-center">
                {/* View Source Toggle */}
                <div className="flex gap-1 mr-2 border-r pr-2 border-border/50">
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowSource(!showSource)}
                        className={`h-8 w-8 p-0 ${showSource ? 'bg-primary text-primary-foreground' : ''}`}
                        title={showSource ? "Back to Visual Editor" : "Edit Source Code (HTML)"}
                    >
                        <CodeXml className="w-4 h-4" />
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={onPreview}
                        className="h-8 w-8 p-0"
                        title="Preview Blog Post"
                    >
                        <Eye className="w-4 h-4" />
                    </Button>
                </div>

                {/* Disable other controls when in Source Mode */}
                {showSource ? (
                    <div className="text-sm text-muted-foreground ml-2 font-medium flex-1">
                        HTML Source Editor Mode &mdash; Use this to paste Tailwind/Custom HTML
                    </div>
                ) : (
                    <>
                        {/* History */}
                        <div className="flex gap-1 mr-2 border-r pr-2 border-border/50">
                            <Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo" className="h-8 w-8 p-0">
                                <Undo className="w-4 h-4" />
                            </Button>
                            <Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo" className="h-8 w-8 p-0">
                                <Redo className="w-4 h-4" />
                            </Button>
                        </div>

                        {/* Headings */}
                        <div className="flex gap-1 mr-2 border-r pr-2 border-border/50">
                            <Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={`h-8 w-8 p-0 ${editor.isActive('heading', { level: 1 }) ? 'bg-muted text-primary' : ''}`} title="Heading 1"><Heading1 className="w-4 h-4" /></Button>
                            <Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={`h-8 w-8 p-0 ${editor.isActive('heading', { level: 2 }) ? 'bg-muted text-primary' : ''}`} title="Heading 2"><Heading2 className="w-4 h-4" /></Button>
                            <Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={`h-8 w-8 p-0 ${editor.isActive('heading', { level: 3 }) ? 'bg-muted text-primary' : ''}`} title="Heading 3"><Heading3 className="w-4 h-4" /></Button>
                        </div>

                        {/* Formatting */}
                        <div className="flex gap-1 mr-2 border-r pr-2 border-border/50">
                            <Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleBold().run()} className={`h-8 w-8 p-0 ${editor.isActive('bold') ? 'bg-muted text-primary' : ''}`} title="Bold"><Bold className="w-4 h-4" /></Button>
                            <Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleItalic().run()} className={`h-8 w-8 p-0 ${editor.isActive('italic') ? 'bg-muted text-primary' : ''}`} title="Italic"><Italic className="w-4 h-4" /></Button>
                            <Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleUnderline().run()} className={`h-8 w-8 p-0 ${editor.isActive('underline') ? 'bg-muted text-primary' : ''}`} title="Underline"><UnderlineIcon className="w-4 h-4" /></Button>
                            <Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleStrike().run()} className={`h-8 w-8 p-0 ${editor.isActive('strike') ? 'bg-muted text-primary' : ''}`} title="Strikethrough"><Strikethrough className="w-4 h-4" /></Button>
                            <Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleCode().run()} className={`h-8 w-8 p-0 ${editor.isActive('code') ? 'bg-muted text-primary' : ''}`} title="Inline Code"><Code className="w-4 h-4" /></Button>
                            <Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleHighlight().run()} className={`h-8 w-8 p-0 ${editor.isActive('highlight') ? 'bg-yellow-200 text-yellow-800' : ''}`} title="Highlight"><Highlighter className="w-4 h-4" /></Button>
                        </div>

                        {/* Insert */}
                        <div className="flex gap-1 mr-2 border-r pr-2 border-border/50">
                            <Button type="button" variant="ghost" size="sm" onClick={onImageUpload} disabled={uploadState} title="Insert Image" className="h-8 w-8 p-0">{uploadState ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}</Button>

                            {/* Chart Builder Trigger */}
                            <Button type="button" variant="ghost" size="sm" onClick={() => setChartBuilderOpen(true)} title="Insert Chart" className="h-8 w-8 p-0"><BarChart3 className="w-4 h-4" /></Button>

                            <Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} title="Insert Table" className="h-8 w-8 p-0"><TableIcon className="w-4 h-4" /></Button>
                            <Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleCodeBlock().run()} className={`h-8 w-8 p-0 ${editor.isActive('codeBlock') ? 'bg-muted text-primary' : ''}`} title="Code Block"><Terminal className="w-4 h-4" /></Button>
                            <Button type="button" variant="ghost" size="sm" onClick={setLink} className={`h-8 w-8 p-0 ${editor.isActive('link') ? 'bg-muted text-primary' : ''}`} title="Link"><LinkIcon className="w-4 h-4" /></Button>
                            <Button type="button" variant="ghost" size="sm" onClick={addYoutubeVideo} className="h-8 w-8 p-0" title="Insert YouTube"><YoutubeIcon className="w-4 h-4" /></Button>
                        </div>

                        {/* Table Controls */}
                        {editor.isActive('table') && (
                            <div className="flex gap-1 mr-2 border-r pr-2 border-border/50 animate-in fade-in slide-in-from-top-1">
                                <Button type="button" variant="ghost" size="icon" onClick={() => editor.chain().focus().addColumnBefore().run()} title="Add Column Before" className="h-6 w-6"><span className="text-xs font-bold">+C&lt;</span></Button>
                                <Button type="button" variant="ghost" size="icon" onClick={() => editor.chain().focus().addColumnAfter().run()} title="Add Column After" className="h-6 w-6"><span className="text-xs font-bold">+C&gt;</span></Button>
                                <Button type="button" variant="ghost" size="icon" onClick={() => editor.chain().focus().deleteColumn().run()} title="Delete Column" className="h-6 w-6 text-destructive"><span className="text-xs font-bold">-C</span></Button>
                                <div className="w-px bg-border/50 h-4 my-auto" />
                                <Button type="button" variant="ghost" size="icon" onClick={() => editor.chain().focus().addRowBefore().run()} title="Add Row Before" className="h-6 w-6"><span className="text-xs font-bold">+R^</span></Button>
                                <Button type="button" variant="ghost" size="icon" onClick={() => editor.chain().focus().addRowAfter().run()} title="Add Row After" className="h-6 w-6"><span className="text-xs font-bold">+Rv</span></Button>
                                <Button type="button" variant="ghost" size="icon" onClick={() => editor.chain().focus().deleteRow().run()} title="Delete Row" className="h-6 w-6 text-destructive"><span className="text-xs font-bold">-R</span></Button>
                                <div className="w-px bg-border/50 h-4 my-auto" />
                                <Button type="button" variant="ghost" size="icon" onClick={() => editor.chain().focus().mergeCells().run()} title="Merge Cells" className="h-6 w-6"><span className="text-xs font-bold">M</span></Button>
                                <Button type="button" variant="ghost" size="icon" onClick={() => editor.chain().focus().deleteTable().run()} title="Delete Table" className="h-6 w-6 text-destructive bg-destructive/10"><span className="text-xs font-bold">DEL</span></Button>
                            </div>
                        )}

                        {/* Color */}
                        <div className="flex gap-1 items-center">
                            <input
                                type="color"
                                onInput={event => editor.chain().focus().setColor((event.target as HTMLInputElement).value).run()}
                                value={editor.getAttributes('textStyle').color || '#000000'}
                                className="w-8 h-8 p-0 border-0 rounded cursor-pointer bg-transparent"
                                title="Text Color"
                            />
                        </div>

                        {/* Alignment */}
                        <div className="flex gap-1 mr-2 border-l pl-2 border-border/50">
                            <Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().setTextAlign('left').run()} className={`h-8 w-8 p-0 ${editor.isActive({ textAlign: 'left' }) ? 'bg-muted text-primary' : ''}`} title="Align Left"><AlignLeft className="w-4 h-4" /></Button>
                            <Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().setTextAlign('center').run()} className={`h-8 w-8 p-0 ${editor.isActive({ textAlign: 'center' }) ? 'bg-muted text-primary' : ''}`} title="Align Center"><AlignCenter className="w-4 h-4" /></Button>
                            <Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().setTextAlign('right').run()} className={`h-8 w-8 p-0 ${editor.isActive({ textAlign: 'right' }) ? 'bg-muted text-primary' : ''}`} title="Align Right"><AlignRight className="w-4 h-4" /></Button>
                            <Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().setTextAlign('justify').run()} className={`h-8 w-8 p-0 ${editor.isActive({ textAlign: 'justify' }) ? 'bg-muted text-primary' : ''}`} title="Justify"><AlignJustify className="w-4 h-4" /></Button>
                        </div>

                        {/* Structure */}
                        <div className="flex gap-1 mr-2 border-r pr-2 border-border/50">
                            <Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleBulletList().run()} className={`h-8 w-8 p-0 ${editor.isActive('bulletList') ? 'bg-muted text-primary' : ''}`} title="Bullet List"><List className="w-4 h-4" /></Button>
                            <Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={`h-8 w-8 p-0 ${editor.isActive('orderedList') ? 'bg-muted text-primary' : ''}`} title="Ordered List"><ListOrdered className="w-4 h-4" /></Button>
                            <Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleBlockquote().run()} className={`h-8 w-8 p-0 ${editor.isActive('blockquote') ? 'bg-muted text-primary' : ''}`} title="Quote"><Quote className="w-4 h-4" /></Button>
                        </div>
                    </>
                )}

                {/* Chart Builder Dialog */}
                <ChartBuilderDialog open={chartBuilderOpen} onOpenChange={setChartBuilderOpen} onInsert={handleChartInsert} />
            </div>
        </>
    );
};

export const RichTextEditor = ({ content, onChange, placeholder, className }: RichTextEditorProps) => {
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [showSource, setShowSource] = useState(false);
    const [sourceContent, setSourceContent] = useState(content);
    const [previewOpen, setPreviewOpen] = useState(false);

    const editor = useEditor({
        extensions: [
            StarterKit,
            TextStyle,
            Color,
            Underline,
            Highlight,
            Div, // <-- ADD Custom Div Extension
            ButtonNode,
            Span,
            ClassStyleExtension,
            Image.configure({
                HTMLAttributes: { class: 'rounded-lg shadow-md max-w-full my-4' },
            }),
            Link.configure({
                openOnClick: false,
                HTMLAttributes: { class: 'text-primary underline underline-offset-4' },
            }),
            TextAlign.configure({
                types: ['heading', 'paragraph', 'div'], // Add div to text align
            }),
            Youtube.configure({
                width: 480,
                height: 320,
                HTMLAttributes: { class: 'rounded-lg shadow-md max-w-full mx-auto my-4 aspect-video' },
            }),
            Table.configure({
                resizable: true,
                HTMLAttributes: { class: 'border-collapse table-auto w-full border border-zinc-200 my-4' },
            }),
            TableRow,
            TableHeader,
            TableCell,
            Placeholder.configure({
                placeholder: placeholder || 'Write something amazing...',
            }),
        ],
        content: content,
        onUpdate: ({ editor }) => {
            if (!showSource) {
                const html = editor.getHTML();
                onChange(html);
                setSourceContent(html);
            }
        },
        editorProps: {
            attributes: {
                class: 'prose prose-sm md:prose-base dark:prose-invert max-w-none focus:outline-none min-h-[300px] p-4',
            },
        },
    });

    // Sync from Source to Editor when toggling off
    useEffect(() => {
        if (!showSource && editor) {
            editor.commands.setContent(sourceContent);
        }
    }, [showSource, editor, sourceContent]);

    // Update source content when editor content changes externally (initial load)
    useEffect(() => {
        if (content && content !== sourceContent && !showSource) {
            setSourceContent(content);
            editor?.commands.setContent(content);
        }
    }, [content, editor, sourceContent, showSource]);

    const insertChart = (config: any) => {
        if (!editor) return;

        const chartTemplate = JSON.stringify(config, null, 2);

        editor.chain().focus().setCodeBlock({ language: 'chart' }).insertContent(chartTemplate).run();
        toast({ title: "Chart Added", description: "Chart has been inserted with your data." });
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !editor) return;

        setUploading(true);
        try {
            const url = await uploadImage(file, 'blog-content');
            editor.chain().focus().setImage({ src: url }).run();
            toast({ title: "Success", description: "Image uploaded" });
        } catch (error) {
            toast({ title: "Error", description: "Failed to upload image", variant: "destructive" });
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <div className={`border rounded-lg bg-card shadow-sm ${className}`}>
            <MenuBar
                editor={editor}
                onImageUpload={() => fileInputRef.current?.click()}
                uploadState={uploading}
                onInsertChart={insertChart}
                showSource={showSource}
                setShowSource={setShowSource}
                onPreview={() => setPreviewOpen(true)} // <--- Pass handler
            />
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleImageUpload}
            />

            {showSource ? (
                <textarea
                    value={sourceContent}
                    onChange={(e) => {
                        setSourceContent(e.target.value);
                        onChange(e.target.value); // Update parent immediately
                    }}
                    className="w-full h-[300px] p-4 font-mono text-sm bg-muted/50 focus:outline-none resize-y"
                    placeholder="<!-- Paste your HTML code here -->"
                    spellCheck={false}
                />
            ) : (
                <EditorContent editor={editor} />
            )}

            <BlogPreviewDialog
                open={previewOpen}
                onOpenChange={setPreviewOpen}
                content={showSource ? sourceContent : editor?.getHTML() || ''} // Use live content
            />
        </div>
    );
};

