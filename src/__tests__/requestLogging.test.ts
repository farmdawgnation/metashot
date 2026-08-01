import express from "express";
import request from "supertest";
import { createRequestLoggingMiddleware } from "../middleware/requestLogging";

describe("request logging middleware", () => {
  it("logs method, url, status code, and response time when the response finishes", async () => {
    let markLogged: () => void = () => undefined;
    const logged = new Promise<void>((resolve) => {
      markLogged = resolve;
    });
    const logRequest = jest.fn<void, [string, string, number, number]>(() =>
      markLogged(),
    );
    const app = express();
    app.use(createRequestLoggingMiddleware({ logRequest }));
    app.get("/test", (_req, res) => {
      res.json({ ok: true });
    });

    await request(app).get("/test?foo=bar").expect(200);
    await logged;

    expect(logRequest).toHaveBeenCalledTimes(1);
    const [method, url, statusCode, responseTime] = logRequest.mock.calls[0];
    expect(method).toBe("GET");
    expect(url).toBe("/test?foo=bar");
    expect(statusCode).toBe(200);
    expect(typeof responseTime).toBe("number");
  });

  it("logs responses that do not go through res.send", async () => {
    let markLogged: () => void = () => undefined;
    const logged = new Promise<void>((resolve) => {
      markLogged = resolve;
    });
    const logRequest = jest.fn<void, [string, string, number, number]>(() =>
      markLogged(),
    );
    const app = express();
    app.use(createRequestLoggingMiddleware({ logRequest }));
    app.get("/stream", (_req, res) => {
      res.status(200);
      res.write("chunk1");
      res.write("chunk2");
      res.end();
    });

    await request(app).get("/stream").expect(200);
    await logged;

    expect(logRequest).toHaveBeenCalledTimes(1);
    expect(logRequest.mock.calls[0][1]).toBe("/stream");
  });

  it("does not modify res.send", async () => {
    const app = express();
    app.use(createRequestLoggingMiddleware({ logRequest: jest.fn() }));
    let sendUnmodified = false;
    app.get("/check", (_req, res) => {
      sendUnmodified = res.send === express.response.send;
      res.json({ ok: true });
    });

    await request(app).get("/check").expect(200);

    expect(sendUnmodified).toBe(true);
  });
});
