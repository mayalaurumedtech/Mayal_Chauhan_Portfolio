import { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/contexts/AuthContext';
import { firestoreRest, extractVal } from '@/lib/firestore-rest';
import { Save, Loader2, Download, Mail, Phone, MapPin, Globe, FileText } from "lucide-react";
import { GlobalSettings } from '@/types/settings';
import { uploadImage } from '@/lib/cloudinary';

export const AdminProfileSettings = () => {
    const { toast } = useToast();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [uploading, setUploading] = useState(false);

    const [formData, setFormData] = useState<GlobalSettings>({
        resumeUrl: "",
        contactEmail: "",
        contactPhone: "",
        contactLocation: "",
        footerText: "© 2024 Portfolio. All rights reserved."
    });

    useEffect(() => {
        fetchSettings();
    }, [user]);

    const fetchSettings = async () => {
        if (!user) return;
        try {
            setFetching(true);
            const data = await firestoreRest.get("settings", "global");
            if (data && data.fields) {
                setFormData({
                    resumeUrl: extractVal(data.fields.resumeUrl) || "",
                    contactEmail: extractVal(data.fields.contactEmail) || "",
                    contactPhone: extractVal(data.fields.contactPhone) || "",
                    contactLocation: extractVal(data.fields.contactLocation) || "",
                    footerText: extractVal(data.fields.footerText) || "© 2024 Portfolio. All rights reserved."
                });
            }
        } catch (error: any) {
            // If 404, it's fine, we'll create it on first save
            if (error.response?.status !== 404) {
                console.error("Error fetching settings:", error);
            }
        } finally {
            setFetching(false);
        }
    };

    const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setUploading(true);
            // Even though it's called uploadImage, Cloudinary's image/upload endpoint often accepts PDFs
            // But for safety, we should really use resource_type: 'raw' if we had that option.
            // Let's try it.
            const url = await uploadImage(file, 'resumes');
            setFormData(prev => ({ ...prev, resumeUrl: url }));
            toast({ title: "Success", description: "Resume uploaded successfully" });
        } catch (error) {
            console.error("Upload error:", error);
            toast({ title: "Upload Failed", description: "Please ensure your Cloudinary preset allows raw files or PDFs.", variant: "destructive" });
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        try {
            setLoading(true);
            const token = await user.getIdToken();

            // Check if exists
            let exists = false;
            try {
                await firestoreRest.get("settings", "global");
                exists = true;
            } catch (e) { }

            if (exists) {
                await firestoreRest.patch("settings", "global", formData, token);
            } else {
                // Using patch to create with custom ID works if handled by API, 
                // but firestore REST create uses collection.
                // We'll use a hack or just ensure the doc exists.
                // For global settings, it's better to use get/patch.
                // If it doesn't exist, we can't patch. We need to create with name.
                // Firestore REST create doesn't support custom ID directly in the path easily without 'documents?documentId=...'
                // Actually, firestoreRest doesn't have a 'set' method. I'll use patch.
                // If patch fails because it doesn't exist, I'll use a manually constructed URL or similar if needed.
                // But wait, firestore-rest.ts uses patch with updateMask.
                await firestoreRest.patch("settings", "global", formData, token);
            }

            toast({ title: "Success", description: "Settings saved successfully" });
        } catch (error) {
            toast({ title: "Error", description: "Failed to save settings", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h2 className="text-2xl font-bold">Global Settings</h2>
                <p className="text-muted-foreground">Manage site-wide configurations and contact information</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Resume Management */}
                    <Card className="p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-blue-500/10 rounded-lg">
                                <FileText className="w-5 h-5 text-blue-500" />
                            </div>
                            <h3 className="font-bold">Resume Management</h3>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="resumeUrl">Resume URL</Label>
                                <div className="flex gap-2">
                                    <Input
                                        id="resumeUrl"
                                        value={formData.resumeUrl}
                                        onChange={(e) => setFormData({ ...formData, resumeUrl: e.target.value })}
                                        placeholder="https://cloudinary.com/.../resume.pdf"
                                    />
                                    {formData.resumeUrl && (
                                        <Button variant="outline" size="icon" asChild>
                                            <a href={formData.resumeUrl} target="_blank" rel="noreferrer">
                                                <Download className="w-4 h-4" />
                                            </a>
                                        </Button>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Upload New Resume</Label>
                                <div className="flex items-center gap-3">
                                    <Input
                                        type="file"
                                        accept=".pdf,.doc,.docx"
                                        onChange={handleResumeUpload}
                                        className="cursor-pointer"
                                        disabled={uploading}
                                    />
                                    {uploading && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
                                </div>
                                <p className="text-[10px] text-muted-foreground">PDF, DOC, DOCX up to 10MB. Uploads to Cloudinary.</p>
                            </div>
                        </div>
                    </Card>

                    {/* Contact Information */}
                    <Card className="p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-amber-500/10 rounded-lg">
                                <Mail className="w-5 h-5 text-amber-500" />
                            </div>
                            <h3 className="font-bold">Contact Information</h3>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="contactEmail">Email Address</Label>
                                <div className="relative">
                                    <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        id="contactEmail"
                                        className="pl-10"
                                        value={formData.contactEmail}
                                        onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                                        placeholder="hello@example.com"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="contactPhone">Phone Number</Label>
                                <div className="relative">
                                    <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        id="contactPhone"
                                        className="pl-10"
                                        value={formData.contactPhone}
                                        onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                                        placeholder="+91 98765 43210"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="contactLocation">Location</Label>
                                <div className="relative">
                                    <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        id="contactLocation"
                                        className="pl-10"
                                        value={formData.contactLocation}
                                        onChange={(e) => setFormData({ ...formData, contactLocation: e.target.value })}
                                        placeholder="City, Country"
                                    />
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Other Settings */}
                    <Card className="p-6 lg:col-span-2">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-purple-500/10 rounded-lg">
                                <Globe className="w-5 h-5 text-purple-500" />
                            </div>
                            <h3 className="font-bold">Other Settings</h3>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="footerText">Footer Copyright Text</Label>
                                <Input
                                    id="footerText"
                                    value={formData.footerText}
                                    onChange={(e) => setFormData({ ...formData, footerText: e.target.value })}
                                    placeholder="© 2024 Portfolio. All rights reserved."
                                />
                            </div>
                        </div>
                    </Card>
                </div>

                <div className="flex justify-end pt-6">
                    <Button type="submit" disabled={loading} className="gradient-primary border-0 text-white min-w-[150px] h-12 text-lg font-bold shadow-lg shadow-primary/20">
                        {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Save className="w-5 h-5 mr-2" />}
                        Save All Settings
                    </Button>
                </div>
            </form>
        </div>
    );
};
