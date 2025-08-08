import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { trace, SpanStatusCode } from '@opentelemetry/api';
import { Resource } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';
import { Config } from './config';
import packageJson from '../package.json';

// Initialize OpenTelemetry
export function initializeTracing() {
  // Prefer OTEL standard env vars; default to local collector (OTLP HTTP)
  const otlpTracesEndpoint =
    process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT ||
    (process.env.OTEL_EXPORTER_OTLP_ENDPOINT
      ? `${process.env.OTEL_EXPORTER_OTLP_ENDPOINT.replace(/\/?$/, '')}/v1/traces`
      : 'http://localhost:4318/v1/traces');

  const otlpExporter = new OTLPTraceExporter({ url: otlpTracesEndpoint });

  const sdk = new NodeSDK({
    resource: new Resource({
      [ATTR_SERVICE_NAME]: packageJson.name,
      [ATTR_SERVICE_VERSION]: packageJson.version,
    }),
    traceExporter: otlpExporter,
    instrumentations: [
      getNodeAutoInstrumentations({
        // Disable file system instrumentation to reduce noise
        '@opentelemetry/instrumentation-fs': {
          enabled: false,
        },
        // Enable HTTP instrumentation for Express and AWS SDK
        '@opentelemetry/instrumentation-http': {
          enabled: true,
        },
        '@opentelemetry/instrumentation-express': {
          enabled: true,
        },
      }),
    ],
  });

  // Only initialize tracing if not in test environment
  if (Config.nodeEnv !== 'test') {
    sdk.start();
    console.log('OpenTelemetry tracing initialized successfully');
  }

  return sdk;
}

// Custom tracing utilities
export const tracingUtils = {
  // Create a custom span for business operations
  createSpan: (name: string, attributes?: Record<string, any>) => {
    const tracer = trace.getTracer(packageJson.name, packageJson.version);
    const span = tracer.startSpan(name, {
      attributes: attributes || {},
    });
    return span;
  },

  // Execute operation with automatic span management
  traceOperation: async <T>(
    operationName: string,
    operation: () => Promise<T>,
    attributes?: Record<string, any>
  ): Promise<T> => {
    const tracer = trace.getTracer(packageJson.name, packageJson.version);
    
    return tracer.startActiveSpan(operationName, { attributes }, async (span) => {
      try {
        const result = await operation();
        span.setStatus({ code: SpanStatusCode.OK });
        return result;
      } catch (error) {
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: error instanceof Error ? error.message : 'Unknown error',
        });
        
        if (error instanceof Error) {
          span.setAttributes({
            'error.name': error.name,
            'error.message': error.message,
            'error.stack': error.stack || '',
          });
        }
        
        throw error;
      } finally {
        span.end();
      }
    });
  },
};