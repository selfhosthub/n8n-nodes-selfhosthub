import { IExecuteFunctions } from 'n8n-workflow';
import { CreateLeonardoImage } from '../../../nodes/CreateLeonardoImage/CreateLeonardoImage.node';
import {
  createLeonardoMockFunction,
  createMockNodeType,
  expectSuccessfulExecution,
} from '../../shared/leonardo-helpers';

describe('CreateLeonardoImage - Basic Tests', () => {
  let createLeonardoImage: CreateLeonardoImage;
  let mockExecuteFunction: IExecuteFunctions;

  beforeEach(() => {
    createLeonardoImage = new CreateLeonardoImage();
    createMockNodeType(createLeonardoImage);
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('branding', () => {
    it('should have the correct Self-Host Hub branding', () => {
      expect(createLeonardoImage.description.displayName).toBe('Self-Host Hub (Leonardo)');
      expect(createLeonardoImage.description.group).toEqual(['selfhosthub']);
      expect(createLeonardoImage.description.defaults.name).toBe('Self-Host Hub (Leonardo)');
    });
  });

  describe('basic execution', () => {
    it('should successfully call the Leonardo API to create an image', async () => {
      const parameters = {
        operation: 'createLeonardoImage',
        prompt: 'A beautiful landscape with mountains',
        modelId: 'b820ea11-02bf-4652-97ae-9ac0cc00593d',
        width: 512,
        height: 512,
        numImages: 1,
      };

      mockExecuteFunction = createLeonardoMockFunction(parameters);

      mockExecuteFunction.helpers = {
        request: jest.fn()
          .mockResolvedValueOnce(JSON.stringify({
            sdGenerationJob: { generationId: 'mock-generation-id' }
          }))
          .mockResolvedValueOnce(JSON.stringify({
            generations_by_pk: {
              id: 'mock-generation-id',
              status: 'COMPLETE',
              prompt: 'A beautiful landscape with mountains',
              modelId: 'b820ea11-02bf-4652-97ae-9ac0cc00593d',
              width: 512,
              height: 512,
              generated_images: [{
                id: 'mock-image-1',
                url: 'https://example.com/image1.jpg',
                nsfw: false,
              }],
            },
          })),
      } as any;

      jest.spyOn(mockExecuteFunction, 'getCredentials').mockResolvedValue({
        apiKey: 'mock-api-key',
      });

      const executePromise = createLeonardoImage.execute!.call(mockExecuteFunction);
      await jest.advanceTimersByTimeAsync(4000);
      const result = await executePromise;

      expect(result.length).toBe(1);
      expect(result[0].length).toBe(1);

      const json = result[0][0].json as any;
      expect(json).toHaveProperty('success', true);
      expect(json).toHaveProperty('status', 'COMPLETE');
      expect(json).toHaveProperty('images');
      expect(Array.isArray(json.images)).toBe(true);
      expect(json).toHaveProperty('rawResponse');
      expect(json.rawResponse).toHaveProperty('generations_by_pk');
    });

    it('should return the generation ID immediately in async mode without polling', async () => {
      const parameters = {
        operation: 'createLeonardoImage',
        responseMode: 'async',
        prompt: 'Async webhook test',
        modelId: 'b820ea11-02bf-4652-97ae-9ac0cc00593d',
        width: 512,
        height: 512,
        numImages: 1,
      };

      mockExecuteFunction = createLeonardoMockFunction(parameters);

      const mockRequest = jest.fn().mockResolvedValueOnce(JSON.stringify({
        sdGenerationJob: { generationId: 'mock-generation-id', apiCreditCost: 8 },
      }));
      mockExecuteFunction.helpers = { request: mockRequest } as any;

      jest.spyOn(mockExecuteFunction, 'getCredentials').mockResolvedValue({
        apiKey: 'mock-api-key',
      });

      const result = await createLeonardoImage.execute!.call(mockExecuteFunction);

      // Only the POST should have been made — no status polling
      expect(mockRequest).toHaveBeenCalledTimes(1);
      expect(mockRequest.mock.calls[0][0].method).toBe('POST');

      const json = result[0][0].json as any;
      expect(json).toHaveProperty('success', true);
      expect(json).toHaveProperty('generationId', 'mock-generation-id');
      expect(json).toHaveProperty('status', 'PENDING');
      expect(json).toHaveProperty('apiCreditCost', 8);
      expect(json).toHaveProperty('request');
      expect(json.request).toHaveProperty('prompt', 'Async webhook test');
      expect(json).not.toHaveProperty('images');
    });

    it('should handle errors from the Leonardo API', async () => {
      const parameters = {
        operation: 'createLeonardoImage',
        prompt: 'Test error handling',
        modelId: 'b820ea11-02bf-4652-97ae-9ac0cc00593d',
        width: 512,
        height: 512,
        numImages: 1,
      };

      mockExecuteFunction = createLeonardoMockFunction(parameters);

      mockExecuteFunction.helpers = {
        request: jest.fn().mockRejectedValueOnce(new Error('API request failed')),
      } as any;

      jest.spyOn(mockExecuteFunction, 'getCredentials').mockResolvedValue({
        apiKey: 'mock-api-key',
      });

      const result = await createLeonardoImage.execute!.call(mockExecuteFunction);

      expect(result.length).toBe(1);
      expect(result[0].length).toBe(1);

      const json = result[0][0].json as any;
      expect(json).toHaveProperty('success', false);
      expect(json).toHaveProperty('error', 'API request failed');
    });

    it('should handle a generation that does not complete in time', async () => {
      const parameters = {
        operation: 'createLeonardoImage',
        prompt: 'Test timeout handling',
        modelId: 'b820ea11-02bf-4652-97ae-9ac0cc00593d',
        width: 512,
        height: 512,
        numImages: 1,
      };

      mockExecuteFunction = createLeonardoMockFunction(parameters);

      const mockRequest = jest.fn();
      mockRequest.mockResolvedValueOnce(JSON.stringify({
        sdGenerationJob: { generationId: 'mock-generation-id' }
      }));

      for (let i = 0; i < 20; i++) {
        mockRequest.mockResolvedValueOnce(JSON.stringify({
          generations_by_pk: {
            id: 'mock-generation-id',
            status: 'PENDING',
            prompt: 'Test timeout handling',
            modelId: 'b820ea11-02bf-4652-97ae-9ac0cc00593d',
            width: 512,
            height: 512,
          },
        }));
      }

      mockExecuteFunction.helpers = { request: mockRequest } as any;

      jest.spyOn(mockExecuteFunction, 'getCredentials').mockResolvedValue({
        apiKey: 'mock-api-key',
      });

      const executePromise = createLeonardoImage.execute!.call(mockExecuteFunction);
      await jest.advanceTimersByTimeAsync(32000);
      const result = await executePromise;

      expect(result.length).toBe(1);
      expect(result[0].length).toBe(1);

      const json = result[0][0].json as any;
      expect(json).toHaveProperty('success', false);
      expect(json.error).toContain('did not complete within the expected time');
    });

    it('should successfully use custom model ID when selected', async () => {
      const parameters = {
        operation: 'createLeonardoImage',
        prompt: 'Custom model ID test',
        modelSelectionMethod: 'custom',
        customModelId: 'custom-model-uuid-123456',
        width: 512,
        height: 512,
        numImages: 1,
      };

      mockExecuteFunction = createLeonardoMockFunction(parameters);

      mockExecuteFunction.helpers = {
        request: jest.fn()
          .mockResolvedValueOnce(JSON.stringify({
            sdGenerationJob: { generationId: 'mock-generation-id' }
          }))
          .mockResolvedValueOnce(JSON.stringify({
            generations_by_pk: {
              id: 'mock-generation-id',
              status: 'COMPLETE',
              prompt: 'Custom model ID test',
              modelId: 'custom-model-uuid-123456',
              width: 512,
              height: 512,
              generated_images: [{
                id: 'mock-image-custom',
                url: 'https://example.com/custom-model-image.jpg',
                nsfw: false,
              }],
            },
          })),
      } as any;

      jest.spyOn(mockExecuteFunction, 'getCredentials').mockResolvedValue({
        apiKey: 'mock-api-key',
      });

      const executePromise = createLeonardoImage.execute!.call(mockExecuteFunction);
      await jest.advanceTimersByTimeAsync(4000);
      const result = await executePromise;

      expect(result.length).toBe(1);
      expect(result[0].length).toBe(1);

      const json = result[0][0].json as any;
      expect(json).toHaveProperty('success', true);
      expect(json).toHaveProperty('modelId', 'custom-model-uuid-123456');
      expect(json.images[0]).toHaveProperty('url', 'https://example.com/custom-model-image.jpg');
    });

    it('should handle error when API response is missing generation ID', async () => {
      const parameters = {
        operation: 'createLeonardoImage',
        prompt: 'Test invalid response',
        modelId: 'b820ea11-02bf-4652-97ae-9ac0cc00593d',
        width: 512,
        height: 512,
        numImages: 1,
      };

      mockExecuteFunction = createLeonardoMockFunction(parameters);

      mockExecuteFunction.helpers = {
        request: jest.fn().mockResolvedValueOnce(JSON.stringify({
          someOtherField: 'value',
        })),
      } as any;

      jest.spyOn(mockExecuteFunction, 'getCredentials').mockResolvedValue({
        apiKey: 'mock-api-key',
      });

      const result = await createLeonardoImage.execute!.call(mockExecuteFunction);

      expect(result.length).toBe(1);
      expect(result[0].length).toBe(1);
      
      const json = result[0][0].json as any;
      expect(json).toHaveProperty('success', false);
      expect(json.error).toContain("Response does not contain the expected 'generationId' field");
    });

    it('should handle error when status API response is missing status field', async () => {
      const parameters = {
        operation: 'createLeonardoImage',
        prompt: 'Test invalid status response',
        modelId: 'b820ea11-02bf-4652-97ae-9ac0cc00593d',
        width: 512,
        height: 512,
        numImages: 1,
      };

      mockExecuteFunction = createLeonardoMockFunction(parameters);

      mockExecuteFunction.helpers = {
        request: jest.fn()
          .mockResolvedValueOnce(JSON.stringify({
            sdGenerationJob: { generationId: 'mock-generation-id' }
          }))
          .mockResolvedValueOnce(JSON.stringify({
            generations_by_pk: {
              id: 'mock-generation-id',
              prompt: 'Test invalid status response',
            },
          })),
      } as any;

      jest.spyOn(mockExecuteFunction, 'getCredentials').mockResolvedValue({
        apiKey: 'mock-api-key',
      });

      const executePromise = createLeonardoImage.execute!.call(mockExecuteFunction);
      await jest.advanceTimersByTimeAsync(4000);
      const result = await executePromise;

      expect(result.length).toBe(1);
      expect(result[0].length).toBe(1);
      
      const json = result[0][0].json as any;
      expect(json).toHaveProperty('success', false);
      expect(json.error).toContain("Status response does not contain the expected 'status' field");
    });
  });
});