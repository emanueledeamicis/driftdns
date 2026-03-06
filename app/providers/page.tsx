"use client";

import { useEffect, useState } from "react";
import { ProviderCard } from "@/components/provider-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Cloud } from "lucide-react";

export default function ProvidersPage() {
    const [providers, setProviders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Form state
    const [isOpen, setIsOpen] = useState(false);
    const [type, setType] = useState("cloudflare");
    const [name, setName] = useState("");
    const [cfToken, setCfToken] = useState("");
    const [r53Access, setR53Access] = useState("");
    const [r53Secret, setR53Secret] = useState("");
    const [submitting, setSubmitting] = useState(false);

    async function fetchProviders() {
        try {
            const res = await fetch("/api/providers");
            if (res.ok) {
                setProviders(await res.json());
            }
        } catch (e) {
            toast.error("Failed to load providers");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchProviders();
    }, []);

    async function handleDelete(id: string) {
        if (!confirm("Are you sure? This will delete the provider and ALL its watched records. This action cannot be undone.")) return;

        try {
            const res = await fetch(`/api/providers/${id}`, { method: "DELETE" });
            if (res.ok) {
                toast.success("Provider deleted");
                fetchProviders();
            } else {
                toast.error("Failed to delete provider");
            }
        } catch (e) {
            toast.error("Error connecting to server");
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSubmitting(true);

        let credentials: any = {};
        if (type === "cloudflare") {
            credentials = { apiToken: cfToken };
        } else {
            credentials = { accessKeyId: r53Access, secretAccessKey: r53Secret };
        }

        try {
            const res = await fetch("/api/providers", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ type, name, credentials })
            });

            if (res.ok) {
                toast.success("Provider added successfully");
                setIsOpen(false);
                fetchProviders();
                // Reset form
                setName("");
                setCfToken("");
                setR53Access("");
                setR53Secret("");
            } else {
                const err = await res.json();
                toast.error(err.error || "Failed to add provider");
            }
        } catch (e) {
            toast.error("Error connecting to server");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">DNS Providers</h1>
                    <p className="text-muted-foreground mt-2">Manage your Cloudflare and AWS Route53 accounts.</p>
                </div>

                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2">
                            <Plus className="h-4 w-4" />
                            Add Provider
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <form onSubmit={handleSubmit}>
                            <DialogHeader>
                                <DialogTitle>Add New Provider</DialogTitle>
                                <DialogDescription>
                                    Credentials are encrypted securely using AES-256-GCM.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label>Provider Type</Label>
                                    <Select value={type} onValueChange={setType}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="cloudflare">Cloudflare</SelectItem>
                                            <SelectItem value="route53">AWS Route53</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="grid gap-2">
                                    <Label>Friendly Name</Label>
                                    <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Personal Cloudflare" required />
                                </div>

                                {type === "cloudflare" && (
                                    <div className="grid gap-2 animate-in fade-in duration-300">
                                        <Label>API Token</Label>
                                        <Input type="password" value={cfToken} onChange={(e) => setCfToken(e.target.value)} required placeholder="Required permissions: Zone:Read, DNS:Edit" />
                                    </div>
                                )}

                                {type === "route53" && (
                                    <div className="grid gap-4 animate-in fade-in duration-300">
                                        <div className="grid gap-2">
                                            <Label>Access Key ID</Label>
                                            <Input type="text" value={r53Access} onChange={(e) => setR53Access(e.target.value)} required />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label>Secret Access Key</Label>
                                            <Input type="password" value={r53Secret} onChange={(e) => setR53Secret(e.target.value)} required />
                                        </div>
                                    </div>
                                )}
                            </div>
                            <DialogFooter>
                                <Button type="submit" disabled={submitting}>
                                    {submitting ? "Saving..." : "Save Provider"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {loading ? (
                <div className="text-muted-foreground animate-pulse">Loading providers...</div>
            ) : providers.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 border rounded-lg border-dashed text-center">
                    <Cloud className="h-10 w-10 text-muted-foreground mb-4 opacity-50" />
                    <h3 className="text-lg font-medium">No providers added yet</h3>
                    <p className="text-sm text-muted-foreground mt-1 mb-4">You need to add a DNS provider to start using DriftDNS.</p>
                    <Button variant="outline" onClick={() => setIsOpen(true)}>Add your first Provider</Button>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {providers.map((p) => (
                        <ProviderCard key={p.id} {...p} onDelete={handleDelete} />
                    ))}
                </div>
            )}
        </div>
    );
}
