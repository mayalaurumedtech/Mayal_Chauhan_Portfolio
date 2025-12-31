import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import parse, { Element } from 'html-react-parser';
import { BlogChart } from "@/components/blog/BlogChart";
import { CodeBlock } from "@/components/blog/CodeBlock";
import { Eye } from "lucide-react";

interface BlogPreviewDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    content: string;
}

export const BlogPreviewDialog = ({ open, onOpenChange, content }: BlogPreviewDialogProps) => {

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto w-full">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Eye className="w-5 h-5 text-primary" />
                        Blog Post Preview
                    </DialogTitle>
                    <DialogDescription>
                        This is how your content will appear to readers.
                    </DialogDescription>
                </DialogHeader>

                <div className="mt-4 border p-6 rounded-lg bg-background/50 backdrop-blur-sm shadow-sm min-h-[400px]">
                    <div id="blog-preview-content" className={`prose prose-lg dark:prose-invert max-w-none
                        prose-headings:text-foreground prose-headings:scroll-mt-24
                        prose-p:text-foreground/90 prose-p:leading-relaxed
                        prose-strong:text-foreground prose-strong:font-black
                        prose-em:text-foreground/80 prose-em:italic
                        prose-a:text-primary prose-a:font-bold hover:prose-a:underline
                        prose-img:rounded-2xl prose-img:shadow-lg
                        prose-table:border prose-table:border-border/50
                        prose-th:bg-muted/50 prose-th:px-4 prose-th:py-3 prose-th:text-foreground
                        prose-td:border-t prose-td:border-border/30 prose-td:px-4 prose-td:py-3 prose-td:text-muted-foreground`}>

                        {parse(content, {
                            replace: (domNode) => {
                                if (domNode instanceof Element && domNode.name === 'pre') {
                                    // Find the code element among children (ignoring text nodes/whitespace)
                                    const codeElement = domNode.children.find(
                                        child => child instanceof Element && child.name === 'code'
                                    ) as Element;

                                    if (codeElement) {
                                        const className = codeElement.attribs.class || '';
                                        const language = className.replace('language-', '');

                                        // Robustly extract text content even if it's split across multiple text nodes
                                        const codeContent = codeElement.children
                                            .map((child: any) => child.data || '')
                                            .join('');

                                        if (language === 'chart') {
                                            try {
                                                const config = JSON.parse(codeContent);
                                                return <div className="my-8 not-prose"><BlogChart config={config} /></div>;
                                            } catch (e) {
                                                console.error("Chart parse error:", e);
                                                return <CodeBlock code={codeContent} language="json (invalid chart)" />;
                                            }
                                        }
                                        return <CodeBlock code={codeContent} language={language} />;
                                    }
                                }
                            }
                        })}
                    </div>
                </div>

                <div className="flex justify-end mt-4">
                    <Button onClick={() => onOpenChange(false)}>Close Preview</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};
