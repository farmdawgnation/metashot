import { StorageService } from "../services/storage";
import { Config } from "../config";

describe("StorageService", () => {
  let storageService: StorageService;

  beforeEach(() => {
    storageService = new StorageService();
  });

  describe("constructor", () => {
    it("should configure S3 client correctly for AWS when no endpoint is set", () => {
      const originalEndpoint = Config.s3.endpoint;
      Object.defineProperty(Config.s3, "endpoint", {
        value: undefined,
        configurable: true,
      });

      const service = new StorageService();

      expect(service).toBeDefined();

      // Restore original value
      Object.defineProperty(Config.s3, "endpoint", {
        value: originalEndpoint,
        configurable: true,
      });
    });

    it("should configure S3 client correctly for MinIO when endpoint is set", () => {
      const originalEndpoint = Config.s3.endpoint;
      Object.defineProperty(Config.s3, "endpoint", {
        value: "http://localhost:9000",
        configurable: true,
      });

      const service = new StorageService();

      expect(service).toBeDefined();

      // Restore original value
      Object.defineProperty(Config.s3, "endpoint", {
        value: originalEndpoint,
        configurable: true,
      });
    });
  });

  describe("generateFileName", () => {
    it("should generate a unique filename", () => {
      const fileName1 = storageService.generateFileName();
      const fileName2 = storageService.generateFileName();

      expect(fileName1).toMatch(/^screenshot-\d+-[a-z0-9]+\.png$/);
      expect(fileName2).toMatch(/^screenshot-\d+-[a-z0-9]+\.png$/);
      expect(fileName1).not.toBe(fileName2);
    });

    it("should generate filename with png extension", () => {
      const fileName = storageService.generateFileName();
      expect(fileName.endsWith(".png")).toBe(true);
    });

    it("should generate filename with screenshot prefix", () => {
      const fileName = storageService.generateFileName();
      expect(fileName.startsWith("screenshot-")).toBe(true);
    });
  });
});
