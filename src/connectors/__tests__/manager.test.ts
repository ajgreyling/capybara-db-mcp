import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ConnectorManager } from '../manager.js';
import { ConnectorRegistry } from '../interface.js';
import type { SourceConfig } from '../../types/config.js';

describe('ConnectorManager', () => {
  describe('query timeout default', () => {
    let getConnectorForDSNSpy: ReturnType<typeof vi.spyOn>;
    let connectSpy: ReturnType<typeof vi.fn>;
    let manager: ConnectorManager;

    beforeEach(() => {
      connectSpy = vi.fn().mockResolvedValue(undefined);
      const mockConnectorInstance = {
        id: 'postgres',
        connect: connectSpy,
        disconnect: vi.fn().mockResolvedValue(undefined),
      };
      (mockConnectorInstance as any).clone = vi
        .fn()
        .mockReturnValue(mockConnectorInstance);

      getConnectorForDSNSpy = vi
        .spyOn(ConnectorRegistry, 'getConnectorForDSN')
        .mockReturnValue(mockConnectorInstance as any);

      manager = new ConnectorManager();
    });

    afterEach(async () => {
      getConnectorForDSNSpy.mockRestore();
      await manager.disconnect();
    });

    it('should apply 60 second default query timeout when query_timeout is not configured', async () => {
      const source: SourceConfig = {
        id: 'test',
        dsn: 'postgres://user:pass@localhost:5432/testdb',
      };

      await manager.connectWithSources([source]);

      expect(connectSpy).toHaveBeenCalledTimes(1);
      const config = connectSpy.mock.calls[0][2];
      expect(config).toBeDefined();
      expect(config.queryTimeoutSeconds).toBe(60);
    });

    it('should use configured query_timeout when provided', async () => {
      const source: SourceConfig = {
        id: 'test',
        dsn: 'postgres://user:pass@localhost:5432/testdb',
        query_timeout: 120,
      };

      await manager.connectWithSources([source]);

      expect(connectSpy).toHaveBeenCalledTimes(1);
      const config = connectSpy.mock.calls[0][2];
      expect(config).toBeDefined();
      expect(config.queryTimeoutSeconds).toBe(120);
    });
  });
});
