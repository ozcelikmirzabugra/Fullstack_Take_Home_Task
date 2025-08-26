import { NextRequest, NextResponse } from "next/server";
import { logger, LogLevel } from "@/lib/logger";
import { withRequestLogger } from "@/lib/request-logger";

async function GET(request: NextRequest) {
  try {
    // In production, you should add proper admin authentication here
    // const user = await getCurrentUser(request);
    // if (!user || !user.isAdmin) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    // }

    const { searchParams } = new URL(request.url);
    const level = searchParams.get("level") as LogLevel;
    const userId = searchParams.get("userId");
    const startTime = searchParams.get("startTime");
    const endTime = searchParams.get("endTime");
    const limit = parseInt(searchParams.get("limit") || "100");

    let logs = logger.getAllLogs();

    // Apply filters
    if (level) {
      logs = logs.filter((log) => log.level === level);
    }

    if (userId) {
      logs = logs.filter((log) => log.userId === userId);
    }

    if (startTime && endTime) {
      const start = new Date(startTime);
      const end = new Date(endTime);
      logs = logger.getLogsByTimeRange(start, end);
    }

    // Apply limit and sort by timestamp (newest first)
    logs = logs
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )
      .slice(0, limit);

    // Get log statistics
    const stats = {
      total: logger.getAllLogs().length,
      byLevel: {
        DEBUG: logger.getLogsByLevel("DEBUG").length,
        INFO: logger.getLogsByLevel("INFO").length,
        WARN: logger.getLogsByLevel("WARN").length,
        ERROR: logger.getLogsByLevel("ERROR").length,
      },
      filtered: logs.length,
    };

    return NextResponse.json({
      success: true,
      data: {
        logs,
        stats,
      },
    });
  } catch (error) {
    logger.error("Failed to fetch logs", {
      error: String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function DELETE(_request: NextRequest) {
  try {
    // In production, add proper admin authentication
    logger.clearLogs();
    logger.info("All logs cleared by admin");

    return NextResponse.json({
      success: true,
      message: "All logs cleared successfully",
    });
  } catch (error) {
    logger.error("Failed to clear logs", {
      error: String(error),
    });

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

const wrappedGET = withRequestLogger(GET);
const wrappedDELETE = withRequestLogger(DELETE);

export { wrappedGET as GET, wrappedDELETE as DELETE };
