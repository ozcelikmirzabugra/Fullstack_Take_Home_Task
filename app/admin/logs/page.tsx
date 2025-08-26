"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertCircle,
  Info,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Trash2,
  Search,
  Filter,
} from "lucide-react";
import type { LogEntry, LogLevel } from "@/lib/logger";

interface LogStats {
  total: number;
  byLevel: Record<LogLevel, number>;
  filtered: number;
}

interface LogsResponse {
  success: boolean;
  data: {
    logs: LogEntry[];
    stats: LogStats;
  };
}

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [stats, setStats] = useState<LogStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [levelFilter, setLevelFilter] = useState<string>("");
  const [userIdFilter, setUserIdFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [limit, setLimit] = useState("100");

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (levelFilter) params.append("level", levelFilter);
      if (userIdFilter) params.append("userId", userIdFilter);
      if (limit) params.append("limit", limit);

      const response = await fetch(`/api/admin/logs?${params}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: LogsResponse = await response.json();

      if (data.success) {
        let filteredLogs = data.data.logs;

        // Apply search filter on client side
        if (searchTerm) {
          filteredLogs = filteredLogs.filter(
            (log) =>
              log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
              JSON.stringify(log.context)
                .toLowerCase()
                .includes(searchTerm.toLowerCase())
          );
        }

        setLogs(filteredLogs);
        setStats(data.data.stats);
      } else {
        setError("Failed to fetch logs");
      }
    } catch (err) {
      setError(
        `Failed to load logs: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    } finally {
      setLoading(false);
    }
  }, [levelFilter, userIdFilter, limit, searchTerm]);

  const clearAllLogs = async () => {
    if (
      !confirm(
        "Are you sure you want to clear all logs? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      const response = await fetch("/api/admin/logs", { method: "DELETE" });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      await fetchLogs(); // Refresh logs after clearing
    } catch (err) {
      setError(
        `Failed to clear logs: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Separate effect for search debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      // Force refetch when search term changes
      setLevelFilter((prev) => prev); // Trigger dependency
    }, 300); // Debounce search

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const getLevelIcon = (level: LogLevel) => {
    switch (level) {
      case "DEBUG":
        return <Info className="h-4 w-4" />;
      case "INFO":
        return <Info className="h-4 w-4" />;
      case "WARN":
        return <AlertTriangle className="h-4 w-4" />;
      case "ERROR":
        return <XCircle className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getLevelColor = (level: LogLevel) => {
    switch (level) {
      case "DEBUG":
        return "bg-gray-500/10 text-gray-500 border-gray-500/20";
      case "INFO":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "WARN":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "ERROR":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      default:
        return "bg-gray-500/10 text-gray-500 border-gray-500/20";
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">System Logs</h1>
          <p className="text-muted-foreground">
            Monitor and analyze application logs
          </p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Info className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-2xl font-bold">{stats.total}</p>
                    <p className="text-sm text-muted-foreground">Total Logs</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {Object.entries(stats.byLevel).map(([level, count]) => (
              <Card key={level}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    {getLevelIcon(level as LogLevel)}
                    <div>
                      <p className="text-2xl font-bold">{count}</p>
                      <p className="text-sm text-muted-foreground">{level}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search logs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <Select value={levelFilter} onValueChange={setLevelFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="All Levels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Levels</SelectItem>
                  <SelectItem value="DEBUG">Debug</SelectItem>
                  <SelectItem value="INFO">Info</SelectItem>
                  <SelectItem value="WARN">Warning</SelectItem>
                  <SelectItem value="ERROR">Error</SelectItem>
                </SelectContent>
              </Select>

              <Input
                placeholder="User ID"
                value={userIdFilter}
                onChange={(e) => setUserIdFilter(e.target.value)}
                className="w-[200px]"
              />

              <Select value={limit} onValueChange={setLimit}>
                <SelectTrigger className="w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                  <SelectItem value="500">500</SelectItem>
                  <SelectItem value="1000">1000</SelectItem>
                </SelectContent>
              </Select>

              <Button onClick={fetchLogs} variant="outline" disabled={loading}>
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>

              <Button onClick={clearAllLogs} variant="destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Clear All
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Error Display */}
        {error && (
          <Card className="mb-6 border-red-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-red-600">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Logs Display */}
        <Card>
          <CardHeader>
            <CardTitle>Logs ({logs.length})</CardTitle>
            <CardDescription>
              {loading ? "Loading logs..." : `Showing ${logs.length} logs`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p>Loading logs...</p>
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <AlertCircle className="h-12 w-12 mx-auto mb-4" />
                <p>No logs found matching the current filters.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {logs.map((log, index) => (
                  <div
                    key={index}
                    className="border border-border rounded-lg p-4 bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge
                            variant="outline"
                            className={getLevelColor(log.level)}
                          >
                            {getLevelIcon(log.level)}
                            <span className="ml-1">{log.level}</span>
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {formatTimestamp(log.timestamp)}
                          </span>
                          {log.userId && (
                            <Badge variant="secondary" className="text-xs">
                              User: {log.userId.slice(0, 8)}...
                            </Badge>
                          )}
                          {log.ip && (
                            <Badge variant="outline" className="text-xs">
                              {log.ip}
                            </Badge>
                          )}
                        </div>

                        <p className="font-medium mb-1">{log.message}</p>

                        {log.context && Object.keys(log.context).length > 0 && (
                          <details className="mt-2">
                            <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                              Show Context
                            </summary>
                            <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto">
                              {JSON.stringify(log.context, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
