import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Cloud, Server, Trash2 } from "lucide-react";

interface ProviderCardProps {
    id: string;
    name: string;
    type: string;
    createdAt: number;
    onDelete: (id: string) => void;
}

export function ProviderCard({ id, name, type, createdAt, onDelete }: ProviderCardProps) {
    const isCloudflare = type === "cloudflare";
    const date = new Date(createdAt * 1000).toLocaleDateString();

    return (
        <Card className="flex flex-col justify-between">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="overflow-hidden text-ellipsis whitespace-nowrap text-lg font-bold">
                    {name}
                </CardTitle>
                {isCloudflare ? (
                    <Cloud className="h-5 w-5 text-orange-500" />
                ) : (
                    <Server className="h-5 w-5 text-blue-500" />
                )}
            </CardHeader>
            <CardContent>
                <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                    <Badge variant="outline" className="w-fit uppercase">
                        {type}
                    </Badge>
                    <span>Added: {date}</span>
                </div>
            </CardContent>
            <CardFooter>
                <Button variant="destructive" size="sm" onClick={() => onDelete(id)} className="w-full gap-2">
                    <Trash2 className="h-4 w-4" />
                    Delete
                </Button>
            </CardFooter>
        </Card>
    );
}
