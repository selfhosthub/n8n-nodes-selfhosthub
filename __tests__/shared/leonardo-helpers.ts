import { IExecuteFunctions, INodeParameters } from 'n8n-workflow';
import { 
  createMockExecuteFunction,
  createMockNodeType,
  expectSuccessfulExecution,
  expectErrorExecution
} from '../shared/helpers';

// Re-export generic helpers for convenience
export { 
  createMockNodeType,
  expectSuccessfulExecution,
  expectErrorExecution
} from '../shared/helpers';

/**
 * Creates a mock execute function with Leonardo-specific API mocking
 */
export function createLeonardoMockFunction(
  nodeParameters: INodeParameters,
  workflow: any = {}
): IExecuteFunctions {
  const baseMock = createMockExecuteFunction(nodeParameters, workflow);

  // Override with Leonardo-specific helpers.request mocking
  baseMock.helpers.request = jest.fn().mockImplementation(async (options: any) => {
    const { method, url } = options;

    // Mock generation endpoint
    if (url.includes('/generations') && method === 'POST') {
      return {
        sdGenerationJob: {
          generationId: 'mock-generation-id',
          status: 'PENDING',
        },
      };
    }

    // Mock generation status endpoint
    if (url.includes('/generations/mock-generation-id') && method === 'GET') {
      return {
        generations_by_pk: {
          id: 'mock-generation-id',
          status: 'COMPLETE',
          modelId: 'some-model-id',
          prompt: 'test prompt',
          width: 512,
          height: 512,
          generated_images: [
            {
              id: 'image-1',
              url: 'https://example.com/image1.jpg',
              nsfw: false,
              likeCount: 0,
            },
            {
              id: 'image-2',
              url: 'https://example.com/image2.jpg',
              nsfw: false,
              likeCount: 0,
            },
          ],
        },
      };
    }

    // If no matching mock found, return a generic error
    return { error: 'Unexpected Leonardo API request in test mock' };
  });

  // Override with Leonardo-specific credentials mocking
  baseMock.getCredentials = jest.fn().mockImplementation(async (type: string) => {
    if (type === 'leonardoAiApi' || type === 'createLeonardoImageCredentials') {
      return {
        apiKey: 'mock-api-key',
      };
    }
    throw new Error(`Credentials for "${type}" not found`);
  });

  return baseMock;
}

/**
 * Mock successful Leonardo image generation with customizable options
 */
export function mockLeonardoImageGeneration(options: {
  generationId?: string;
  imageUrl?: string;
  imageId?: string;
  status?: string;
  nsfw?: boolean;
  prompt?: string;
  width?: number;
  height?: number;
} = {}) {
  const {
    generationId = 'mock-generation-id',
    imageUrl = 'https://example.com/test-image.jpg',
    imageId = 'test-image-id',
    status = 'COMPLETE',
    nsfw = false,
    prompt = 'test prompt',
    width = 512,
    height = 512
  } = options;

  return {
    initial: {
      sdGenerationJob: {
        generationId,
        status: 'PENDING',
      },
    },
    status: {
      generations_by_pk: {
        id: generationId,
        status,
        prompt,
        width,
        height,
        generated_images: [
          {
            id: imageId,
            url: imageUrl,
            nsfw,
            likeCount: 0,
          },
        ],
      },
    },
  };
}

/**
 * Mock Leonardo API timeout scenario
 */
export function mockLeonardoTimeout(generationId: string = 'mock-generation-id') {
  return {
    initial: {
      sdGenerationJob: {
        generationId,
        status: 'PENDING',
      },
    },
    status: {
      generations_by_pk: {
        id: generationId,
        status: 'PENDING', // Always pending to simulate timeout
        prompt: 'timeout test',
        width: 512,
        height: 512,
      },
    },
  };
}

/**
 * Mock Leonardo API error response
 */
export function mockLeonardoError(errorMessage: string = 'API Error') {
  return {
    error: errorMessage,
    success: false,
  };
}

/**
 * Creates a mock execute function with custom API responses
 */
export function createLeonardoMockWithCustomResponses(
  nodeParameters: INodeParameters,
  initialResponse: any,
  statusResponse: any,
  workflow: any = {}
): IExecuteFunctions {
  const baseMock = createMockExecuteFunction(nodeParameters, workflow);

  baseMock.helpers.request = jest.fn()
    .mockResolvedValueOnce(JSON.stringify(initialResponse))
    .mockResolvedValueOnce(JSON.stringify(statusResponse));

  baseMock.getCredentials = jest.fn().mockImplementation(async (type: string) => {
    if (type === 'leonardoAiApi' || type === 'createLeonardoImageCredentials') {
      return {
        apiKey: 'mock-api-key',
      };
    }
    throw new Error(`Credentials for "${type}" not found`);
  });

  return baseMock;
}

/**
 * Helper to create mock responses for multiple pending status checks (for timeout tests)
 */
export function createTimeoutMockFunction(
  nodeParameters: INodeParameters,
  pendingCount: number = 20,
  generationId: string = 'mock-generation-id'
): IExecuteFunctions {
  const baseMock = createMockExecuteFunction(nodeParameters);

  const mockRequest = jest.fn();
  
  // Initial generation request
  mockRequest.mockResolvedValueOnce(JSON.stringify({
    sdGenerationJob: { generationId }
  }));

  // Multiple pending status responses
  for (let i = 0; i < pendingCount; i++) {
    mockRequest.mockResolvedValueOnce(JSON.stringify({
      generations_by_pk: {
        id: generationId,
        status: 'PENDING',
        prompt: 'timeout test',
        width: 512,
        height: 512,
      },
    }));
  }

  baseMock.helpers = { request: mockRequest } as any;

  baseMock.getCredentials = jest.fn().mockImplementation(async (type: string) => {
    if (type === 'leonardoAiApi' || type === 'createLeonardoImageCredentials') {
      return {
        apiKey: 'mock-api-key',
      };
    }
    throw new Error(`Credentials for "${type}" not found`);
  });

  return baseMock;
}