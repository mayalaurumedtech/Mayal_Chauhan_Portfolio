import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, BarChart3 } from "lucide-react";

interface ChartBuilderDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onInsert: (config: any) => void;
}

export const ChartBuilderDialog = ({ open, onOpenChange, onInsert }: ChartBuilderDialogProps) => {
    const [title, setTitle] = useState("My Awesome Chart");
    const [description, setDescription] = useState("");
    const [type, setType] = useState<"area" | "bar" | "line" | "pie">("bar");

    // Simple data model: Array of objects. 
    // We'll fix the structure to: name (label) | value (primary) | uv (optional secondary for simplicity or just value)
    // For simplicity, let's Stick to Label + Value.
    const [dataPoints, setDataPoints] = useState([
        { name: "Jan", value: 400 },
        { name: "Feb", value: 300 },
        { name: "Mar", value: 550 },
    ]);

    const addRow = () => setDataPoints([...dataPoints, { name: "New", value: 0 }]);
    const removeRow = (index: number) => setDataPoints(dataPoints.filter((_, i) => i !== index));

    const updateRow = (index: number, field: "name" | "value", newVal: string | number) => {
        const newData = [...dataPoints];
        // @ts-ignore
        newData[index][field] = newVal;
        setDataPoints(newData);
    };

    const handleInsert = () => {
        const config = {
            type,
            title,
            description,
            data: dataPoints.map(d => ({ ...d, value: Number(d.value) })), // Ensure numbers
            dataKeys: [
                { key: "value", color: "#8884d8", name: "Value" } // Default single series for now
            ],
            xAxisKey: "name"
        };

        // Custom colors for Pie
        if (type === 'pie') {
            config.dataKeys = [
                { key: "value", color: "#8884d8" },
                { key: "value", color: "#82ca9d" },
                { key: "value", color: "#ffc658" },
                { key: "value", color: "#ff8042" },
                { key: "value", color: "#0088fe" }
            ].slice(0, dataPoints.length);
        }

        onInsert(config);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Chart Builder</DialogTitle>
                    <DialogDescription>Create a chart by filling out the table below.</DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Chart Type</Label>
                            <Select value={type} onValueChange={(v: any) => setType(v)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="bar">Bar Chart</SelectItem>
                                    <SelectItem value="area">Area Chart</SelectItem>
                                    <SelectItem value="line">Line Chart</SelectItem>
                                    <SelectItem value="pie">Pie Chart</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Chart Title</Label>
                            <Input value={title} onChange={e => setTitle(e.target.value)} />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Short Description</Label>
                        <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="e.g. Monthly sales data" />
                    </div>

                    <div className="space-y-2 mt-2">
                        <div className="flex justify-between items-center">
                            <Label>Data Points</Label>
                            <Button type="button" variant="outline" size="sm" onClick={addRow}>
                                <Plus className="w-4 h-4 mr-2" /> Add Row
                            </Button>
                        </div>

                        <div className="border rounded-md overflow-hidden">
                            <div className="grid grid-cols-6 gap-2 bg-muted p-2 font-medium text-sm">
                                <div className="col-span-3">Label (X-Axis)</div>
                                <div className="col-span-2">Value (Y-Axis)</div>
                                <div className="col-span-1">Action</div>
                            </div>
                            <div className="max-h-[300px] overflow-y-auto">
                                {dataPoints.map((point, i) => (
                                    <div key={i} className="grid grid-cols-6 gap-2 p-2 border-t items-center animate-in fade-in">
                                        <div className="col-span-3">
                                            <Input
                                                value={point.name}
                                                onChange={e => updateRow(i, 'name', e.target.value)}
                                                className="h-8"
                                            />
                                        </div>
                                        <div className="col-span-2">
                                            <Input
                                                type="number"
                                                value={point.value}
                                                onChange={e => updateRow(i, 'value', e.target.value)}
                                                className="h-8"
                                            />
                                        </div>
                                        <div className="col-span-1 text-center">
                                            <Button type="button" variant="ghost" size="sm" onClick={() => removeRow(i)} className="h-8 w-8 text-destructive hover:bg-destructive/10">
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button type="button" onClick={handleInsert}>
                        <BarChart3 className="w-4 h-4 mr-2" />
                        Insert Chart
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
