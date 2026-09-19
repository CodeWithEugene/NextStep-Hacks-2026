"use client";

import React from "react";
import { CriticalAsset } from "@/lib/types/incident";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Zap, School, Hospital, ShieldAlert } from "lucide-react";

interface InfrastructureTableProps {
  assets: CriticalAsset[];
  onSelectAsset?: (asset: CriticalAsset) => void;
}

export function InfrastructureTable({ assets, onSelectAsset }: InfrastructureTableProps) {
  const getIcon = (type: string) => {
    switch (type) {
      case "substation":
        return <Zap className="w-3.5 h-3.5 text-yellow-400" />;
      case "school":
        return <School className="w-3.5 h-3.5 text-sky-400" />;
      case "hospital":
        return <Hospital className="w-3.5 h-3.5 text-red-400" />;
      default:
        return <Building2 className="w-3.5 h-3.5 text-zinc-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "threatened":
        return <Badge variant="destructive" className="text-[10px] px-1.5 py-0">THREATENED</Badge>;
      case "defensible":
        return <Badge variant="warning" className="text-[10px] px-1.5 py-0">DEFENSIBLE</Badge>;
      case "evacuated":
        return <Badge variant="secondary" className="text-[10px] px-1.5 py-0">EVACUATED</Badge>;
      default:
        return <Badge variant="success" className="text-[10px] px-1.5 py-0">SECURED</Badge>;
    }
  };

  return (
    <Card className="border-zinc-800 bg-zinc-950/70">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm font-semibold text-zinc-100 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-orange-400" />
              Critical Infrastructure Exposure
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Public assets in the active spread cone prioritized for defense
            </CardDescription>
          </div>
          <Badge variant="outline" className="font-mono text-[10px]">
            {assets.length} ASSETS
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-1">
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-800/80">
              <TableHead className="text-[11px] py-1">Asset Facility</TableHead>
              <TableHead className="text-[11px] py-1">Distance</TableHead>
              <TableHead className="text-[11px] py-1">Occupancy</TableHead>
              <TableHead className="text-[11px] py-1 text-right">Triage Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {assets.map((asset) => (
              <TableRow
                key={asset.id}
                className="cursor-pointer hover:bg-zinc-900/60 border-zinc-800/50"
                onClick={() => onSelectAsset?.(asset)}
              >
                <TableCell className="py-2 font-medium text-zinc-200 text-xs">
                  <div className="flex items-center gap-1.5">
                    {getIcon(asset.type)}
                    <span className="line-clamp-1">{asset.name}</span>
                  </div>
                </TableCell>
                <TableCell className="py-2 font-mono text-xs text-zinc-400">
                  {asset.distance_miles.toFixed(1)} mi
                </TableCell>
                <TableCell className="py-2 font-mono text-xs text-zinc-400">
                  {asset.occupancy ? `${asset.occupancy} souls` : "Uninhabited"}
                </TableCell>
                <TableCell className="py-2 text-right">
                  {getStatusBadge(asset.defensibility_status)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
