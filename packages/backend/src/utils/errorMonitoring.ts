import { logger, logSecurity } from "./logger";
import { ApiError } from "../middleware/errorHandler";

export interface ErrorMetrics {
  errorCount: number;
  errorRate: number;
  lastError: Date;
  errorsByType: Record<string, number>;
  errorsByEndpoint: Record<string, number>;
}

export interface AlertConfig {
  errorThreshold: number;
  timeWindowMs: number;
  criticalErrorTypes: string[];
  alertWebhookUrl?: string;
  slackWebhookUrl?: string;
}

/**
 * Error monitoring and alerting service
 */
export class ErrorMonitor {
  private errorMetrics: ErrorMetrics = {
    errorCount: 0,
    errorRate: 0,
    lastError: new Date(),
    errorsByType: {},
    errorsByEndpoint: {},
  };

  private errorHistory: Array<{
    timestamp: Date;
    error: ApiError;
    endpoint?: string;
  }> = [];
  private alertConfig: AlertConfig;

  constructor(alertConfig: AlertConfig) {
    this.alertConfig = alertConfig;

    // Clean up old error history every hour
    setInterval(() => {
      this.cleanupErrorHistory();
    }, 60 * 60 * 1000);
  }

  /**
   * Record an error occurrence
   */
  recordError(error: ApiError, endpoint?: string): void {
    const now = new Date();

    // Update metrics
    this.errorMetrics.errorCount++;
    this.errorMetrics.lastError = now;

    // Track by error type
    const errorType = error.code || "UNKNOWN";
    this.errorMetrics.errorsByType[errorType] =
      (this.errorMetrics.errorsByType[errorType] || 0) + 1;

    // Track by endpoint
    if (endpoint) {
      this.errorMetrics.errorsByEndpoint[endpoint] =
        (this.errorMetrics.errorsByEndpoint[endpoint] || 0) + 1;
    }

    // Add to history
    this.errorHistory.push({ timestamp: now, error, endpoint });

    // Calculate error rate
    this.calculateErrorRate();

    // Check if alerting is needed
    this.checkAlertConditions(error, endpoint);

    // Log the error recording
    logger.debug("Error recorded", {
      context: "error-monitoring",
      errorType,
      endpoint,
      totalErrors: this.errorMetrics.errorCount,
      errorRate: this.errorMetrics.errorRate,
    });
  }

  /**
   * Get current error metrics
   */
  getMetrics(): ErrorMetrics {
    this.calculateErrorRate();
    return { ...this.errorMetrics };
  }

  /**
   * Get error history for a specific time window
   */
  getErrorHistory(
    timeWindowMs: number = 60 * 60 * 1000
  ): Array<{ timestamp: Date; error: ApiError; endpoint?: string }> {
    const cutoff = new Date(Date.now() - timeWindowMs);
    return this.errorHistory.filter((entry) => entry.timestamp >= cutoff);
  }

  /**
   * Reset error metrics (useful for testing)
   */
  resetMetrics(): void {
    this.errorMetrics = {
      errorCount: 0,
      errorRate: 0,
      lastError: new Date(),
      errorsByType: {},
      errorsByEndpoint: {},
    };
    this.errorHistory = [];
  }

  /**
   * Calculate current error rate (errors per minute)
   */
  private calculateErrorRate(): void {
    const recentErrors = this.getErrorHistory(60 * 1000); // Last minute
    this.errorMetrics.errorRate = recentErrors.length;
  }

  /**
   * Check if alert conditions are met
   */
  private checkAlertConditions(error: ApiError, endpoint?: string): void {
    const recentErrors = this.getErrorHistory(this.alertConfig.timeWindowMs);

    // Check error threshold
    if (recentErrors.length >= this.alertConfig.errorThreshold) {
      this.sendAlert("ERROR_THRESHOLD_EXCEEDED", {
        errorCount: recentErrors.length,
        timeWindow: this.alertConfig.timeWindowMs,
        endpoint,
      });
    }

    // Check for critical error types
    const errorType = error.code || "UNKNOWN";
    if (this.alertConfig.criticalErrorTypes.includes(errorType)) {
      this.sendAlert("CRITICAL_ERROR_TYPE", {
        errorType,
        errorMessage: error.message,
        endpoint,
      });
    }

    // Check for high error rate
    if (this.errorMetrics.errorRate > 10) {
      // More than 10 errors per minute
      this.sendAlert("HIGH_ERROR_RATE", {
        errorRate: this.errorMetrics.errorRate,
        endpoint,
      });
    }
  }

  /**
   * Send alert notification
   */
  private async sendAlert(alertType: string, details: any): Promise<void> {
    const alertData = {
      alertType,
      timestamp: new Date().toISOString(),
      service: "restaurant-reservation-backend",
      environment: process.env.NODE_ENV,
      details,
      metrics: this.getMetrics(),
    };

    // Log the alert
    logger.error("ALERT TRIGGERED", {
      context: "error-monitoring",
      alert: alertData,
    });

    // Log as security event if it's a critical error
    if (alertType === "CRITICAL_ERROR_TYPE") {
      logSecurity("Critical error alert", "high", alertData);
    }

    // Send to external monitoring services
    try {
      await this.sendToExternalServices(alertData);
    } catch (error) {
      logger.error("Failed to send alert to external services", {
        context: "error-monitoring",
        error: error instanceof Error ? error.message : "Unknown error",
        alertData,
      });
    }
  }

  /**
   * Send alert to external monitoring services
   */
  private async sendToExternalServices(alertData: any): Promise<void> {
    const promises: Promise<void>[] = [];

    // Send to webhook if configured
    if (this.alertConfig.alertWebhookUrl) {
      promises.push(
        this.sendWebhookAlert(this.alertConfig.alertWebhookUrl, alertData)
      );
    }

    // Send to Slack if configured
    if (this.alertConfig.slackWebhookUrl) {
      promises.push(
        this.sendSlackAlert(this.alertConfig.slackWebhookUrl, alertData)
      );
    }

    // TODO: Add integrations for other services like:
    // - Sentry
    // - DataDog
    // - New Relic
    // - PagerDuty

    await Promise.allSettled(promises);
  }

  /**
   * Send webhook alert
   */
  private async sendWebhookAlert(
    webhookUrl: string,
    alertData: any
  ): Promise<void> {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(alertData),
    });

    if (!response.ok) {
      throw new Error(
        `Webhook alert failed: ${response.status} ${response.statusText}`
      );
    }
  }

  /**
   * Send Slack alert
   */
  private async sendSlackAlert(
    slackWebhookUrl: string,
    alertData: any
  ): Promise<void> {
    const slackMessage = {
      text: `🚨 Alert: ${alertData.alertType}`,
      attachments: [
        {
          color: "danger",
          fields: [
            {
              title: "Service",
              value: alertData.service,
              short: true,
            },
            {
              title: "Environment",
              value: alertData.environment,
              short: true,
            },
            {
              title: "Timestamp",
              value: alertData.timestamp,
              short: false,
            },
            {
              title: "Details",
              value: JSON.stringify(alertData.details, null, 2),
              short: false,
            },
          ],
        },
      ],
    };

    const response = await fetch(slackWebhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(slackMessage),
    });

    if (!response.ok) {
      throw new Error(
        `Slack alert failed: ${response.status} ${response.statusText}`
      );
    }
  }

  /**
   * Clean up old error history to prevent memory leaks
   */
  private cleanupErrorHistory(): void {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000); // Keep 24 hours
    const initialLength = this.errorHistory.length;

    this.errorHistory = this.errorHistory.filter(
      (entry) => entry.timestamp >= cutoff
    );

    const removedCount = initialLength - this.errorHistory.length;
    if (removedCount > 0) {
      logger.debug("Cleaned up error history", {
        context: "error-monitoring",
        removedCount,
        remainingCount: this.errorHistory.length,
      });
    }
  }
}

/**
 * Global error monitor instance
 */
export const errorMonitor = new ErrorMonitor({
  errorThreshold: 10, // Alert if 10 errors in time window
  timeWindowMs: 5 * 60 * 1000, // 5 minutes
  criticalErrorTypes: [
    "DATABASE_ERROR",
    "EXTERNAL_SERVICE_ERROR",
    "INTERNAL_ERROR",
  ],
  alertWebhookUrl: process.env.ALERT_WEBHOOK_URL,
  slackWebhookUrl: process.env.SLACK_WEBHOOK_URL,
});

/**
 * Middleware to integrate error monitoring with Express
 */
export function errorMonitoringMiddleware() {
  return (error: ApiError, req: any, res: any, next: any) => {
    // Record the error
    errorMonitor.recordError(error, `${req.method} ${req.path}`);

    // Continue with normal error handling
    next(error);
  };
}
