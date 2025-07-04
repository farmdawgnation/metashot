import { StorageService } from '../services/storage';

describe('StorageService', () => {
  let storageService: StorageService;

  beforeEach(() => {
    storageService = new StorageService();
  });

  describe('generateFileName', () => {
    it('should generate a unique filename', () => {
      const fileName1 = storageService.generateFileName();
      const fileName2 = storageService.generateFileName();
      
      expect(fileName1).toMatch(/^screenshot-\d+-[a-z0-9]+\.png$/);
      expect(fileName2).toMatch(/^screenshot-\d+-[a-z0-9]+\.png$/);
      expect(fileName1).not.toBe(fileName2);
    });

    it('should generate filename with png extension', () => {
      const fileName = storageService.generateFileName();
      expect(fileName.endsWith('.png')).toBe(true);
    });

    it('should generate filename with screenshot prefix', () => {
      const fileName = storageService.generateFileName();
      expect(fileName.startsWith('screenshot-')).toBe(true);
    });
  });
});