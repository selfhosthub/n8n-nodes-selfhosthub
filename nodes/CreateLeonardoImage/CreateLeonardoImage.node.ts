// CreateLeonardoImage.node.ts

import {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  NodeConnectionType,
} from 'n8n-workflow';

import { models } from './models';
import { buildRequestBody } from './parameterUtils';

// Note: For local development with isolatedModules=true,
// we need a different approach to handle NodeConnectionType

export class CreateLeonardoImage implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Self-Host Hub (Leonardo)',
    name: 'createLeonardoImage',
    icon: 'file:createLeonardoImage.png',
    group: ['selfhosthub'],
    version: 1,
    subtitle: '={{$parameter["operation"]}}',
    description:
      "Generate high-quality AI images using Leonardo's powerful models with advanced options and complete customization",
    defaults: {
      name: 'Self-Host Hub (Leonardo)',
    },
    documentationUrl: 'https://docs.leonardo.ai/docs/getting-started',
    // We use NodeConnectionType.Main directly because isolatedModules is disabled in tsconfig.json
    // If isolatedModules is enabled, these would need to be replaced with string literals and type assertions
    // For more details, see docs/DEVELOPMENT_GUIDELINES.md#typescript-configuration
    inputs: [
      {
        type: NodeConnectionType.Main,
        displayName: 'Input',
      },
    ],
    outputs: [
      {
        type: NodeConnectionType.Main,
        displayName: 'Output',
      },
    ],
    credentials: [
      {
        name: 'createLeonardoImageCredentials',
        required: true,
      },
    ],
    properties: [
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        options: [
          {
            name: 'Generate Image',
            value: 'createLeonardoImage',
            description: 'Generate an image from a prompt',
          },
        ],
        default: 'createLeonardoImage',
        noDataExpression: true,
      },
      {
        displayName: 'Prompts',
        name: 'prompt',
        type: 'string',
        required: true,
        default: '',
        description: 'The prompt to generate the image from',
        displayOptions: {
          show: {
            operation: ['createLeonardoImage'],
          },
        },
      },
      {
        displayName: 'Width',
        name: 'width',
        type: 'number',
        typeOptions: {
          minValue: 32,
          maxValue: 4096,
        },
        default: 1024,
        required: true,
        description: 'The width of the generated image (min 32px, max 4096px)',
        displayOptions: {
          show: {
            operation: ['createLeonardoImage'],
          },
        },
      },
      {
        displayName: 'Height',
        name: 'height',
        type: 'number',
        typeOptions: {
          minValue: 32,
          maxValue: 4096,
        },
        default: 576,
        required: true,
        description: 'The height of the generated image (min 32px, max 4096px)',
        displayOptions: {
          show: {
            operation: ['createLeonardoImage'],
          },
        },
      },
      {
        displayName: 'Number of Images',
        name: 'numImages',
        type: 'number',
        typeOptions: {
          minValue: 1,
          maxValue: 10,
        },
        default: 1,
        required: true,
        description: 'The number of images to generate',
        displayOptions: {
          show: {
            operation: ['createLeonardoImage'],
          },
        },
      },
      {
        displayName: 'Model Selection Method',
        name: 'modelSelectionMethod',
        type: 'options',
        options: [
          {
            name: 'Select from List',
            value: 'list',
          },
          {
            name: 'Custom Model ID',
            value: 'custom',
          },
        ],
        default: 'list',
        description: 'Choose between selecting a model from the list or entering a custom model ID',
        displayOptions: {
          show: {
            operation: ['createLeonardoImage'],
          },
        },
      },
      {
        displayName: 'Model',
        name: 'modelId',
        type: 'options',
        options: models,
        default: '1e60896f-3c26-4296-8ecc-53e2afecc132', // Leonardo Diffusion XL as default
        required: true,
        description: 'The model to use for image generation',
        displayOptions: {
          show: {
            operation: ['createLeonardoImage'],
            modelSelectionMethod: ['list'],
          },
        },
      },
      {
        displayName: 'Custom Model ID',
        name: 'customModelId',
        type: 'string',
        default: '',
        required: true,
        placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
        description:
          'Enter the UUID of the model you want to use (found in Leonardo.ai interface or API docs)',
        displayOptions: {
          show: {
            operation: ['createLeonardoImage'],
            modelSelectionMethod: ['custom'],
          },
        },
      },
      {
        displayName: 'Response Mode',
        name: 'responseMode',
        type: 'options',
        options: [
          {
            name: 'Wait for Image (Poll)',
            value: 'wait',
            description:
              'Submit the generation and poll until the image is ready before continuing. Best for fast generations.',
          },
          {
            name: 'Submit Only (Async / Webhook)',
            value: 'async',
            description:
              "Submit the generation and immediately output the generation ID without waiting. Pair with an n8n Webhook node registered on your Leonardo Production API key to receive the finished image. Use this when generations are slow and risk timing out.",
          },
        ],
        default: 'async',
        description:
          'Whether to wait for the image (polling) or return immediately with the generation ID for webhook-based completion. Defaults to async to avoid timeouts on slow generations.',
        displayOptions: {
          show: {
            operation: ['createLeonardoImage'],
          },
        },
      },
      {
        displayName:
          'Async mode returns only the generation ID. Leonardo delivers the finished image to the webhook callback URL configured on your <b>Production API key</b> (Leonardo dashboard) — it cannot be set per request. Capture it with an n8n Webhook trigger node.',
        name: 'asyncNotice',
        type: 'notice',
        default: '',
        displayOptions: {
          show: {
            operation: ['createLeonardoImage'],
            responseMode: ['async'],
          },
        },
      },
      {
        displayName: 'Advanced Options',
        name: 'advancedOptions',
        type: 'boolean',
        default: false,
        description: 'Whether to set advanced image generation options',
        displayOptions: {
          show: {
            operation: ['createLeonardoImage'],
          },
        },
      },
      // Image Options
      {
        displayName: '🔷 Image Options',
        name: 'imageOptionsHeading',
        type: 'notice',
        default: '',
        displayOptions: {
          show: {
            operation: ['createLeonardoImage'],
            advancedOptions: [true],
          },
        },
      },
      {
        displayName: 'Make Public',
        name: 'public',
        type: 'options',
        options: [
          {
            name: 'No Selection',
            value: 'NO_SELECTION',
          },
          {
            name: 'Yes',
            value: 'true',
          },
          {
            name: 'No',
            value: 'false',
          },
        ],
        default: 'NO_SELECTION',
        description: 'Whether the generated images should show in the community feed',
        displayOptions: {
          show: {
            operation: ['createLeonardoImage'],
            advancedOptions: [true],
          },
        },
      },
      {
        displayName: 'Tiling',
        name: 'tiling',
        type: 'options',
        options: [
          {
            name: 'No Selection',
            value: 'NO_SELECTION',
          },
          {
            name: 'Enable',
            value: 'true',
          },
          {
            name: 'Disable',
            value: 'false',
          },
        ],
        default: 'NO_SELECTION',
        description: 'Whether the generated images should tile on all axes',
        displayOptions: {
          show: {
            operation: ['createLeonardoImage'],
            advancedOptions: [true],
          },
        },
      },
      {
        displayName: 'Transparency',
        name: 'transparency',
        type: 'options',
        options: [
          {
            name: 'No Selection',
            value: 'NO_SELECTION',
          },
          {
            name: 'Disabled',
            value: 'disabled',
          },
          {
            name: 'Foreground Only',
            value: 'foreground_only',
          },
        ],
        default: 'NO_SELECTION',
        description:
          "Generate images with transparent background. API only accepts 'disabled' or 'foreground_only'.",
        displayOptions: {
          show: {
            operation: ['createLeonardoImage'],
            advancedOptions: [true],
          },
        },
      },
      {
        displayName: 'Enable Unzoom',
        name: 'unzoom',
        type: 'options',
        options: [
          {
            name: 'No Selection',
            value: 'NO_SELECTION',
          },
          {
            name: 'Enable',
            value: 'true',
          },
          {
            name: 'Disable',
            value: 'false',
          },
        ],
        default: 'NO_SELECTION',
        description: 'Whether the generated images should be unzoomed (requires unzoomAmount)',
        displayOptions: {
          show: {
            operation: ['createLeonardoImage'],
            advancedOptions: [true],
          },
        },
      },
      {
        displayName: 'Unzoom Amount',
        name: 'unzoomAmount',
        type: 'number',
        default: 0.2,
        typeOptions: {
          minValue: 0.1,
          maxValue: 1.0,
          numberPrecision: 2,
        },
        description: 'Amount of unzoom to apply (required when unzoom is enabled)',
        displayOptions: {
          show: {
            operation: ['createLeonardoImage'],
            advancedOptions: [true],
            unzoom: ['true'],
          },
        },
      },
      {
        displayName: 'Alchemy',
        name: 'alchemy',
        type: 'options',
        options: [
          {
            name: 'No Selection',
            value: 'NO_SELECTION',
          },
          {
            name: 'Enable',
            value: 'true',
          },
          {
            name: 'Disable',
            value: 'false',
          },
        ],
        default: 'NO_SELECTION',
        description:
          'BETA feature for paid users. Brings incredibly high-fidelity image generation and coherence',
        displayOptions: {
          show: {
            operation: ['createLeonardoImage'],
            advancedOptions: [true],
          },
        },
      },
      {
        displayName: 'NSFW Filter (⚠️ Read-only)',
        name: 'nsfwFilter',
        type: 'options',
        options: [
          {
            name: 'No Selection',
            value: 'NO_SELECTION',
          },
          {
            name: 'Enable',
            value: 'true',
          },
          {
            name: 'Disable',
            value: 'false',
          },
        ],
        default: 'NO_SELECTION',
        description:
          'NOT CURRENTLY SUPPORTED BY API. The NSFW filter is controlled by the API directly. Changing this setting has no effect due to API limitations.',
        displayOptions: {
          show: {
            operation: ['createLeonardoImage'],
            advancedOptions: [true],
          },
        },
      },
      {
        displayName: 'Weighting',
        name: 'weighting',
        type: 'number',
        default: 0.5,
        typeOptions: {
          minValue: 0.0,
          maxValue: 1.0,
          numberPrecision: 2,
        },
        description: 'How much weighting to use for generation',
        displayOptions: {
          show: {
            operation: ['createLeonardoImage'],
            advancedOptions: [true],
          },
        },
      },
      {
        displayName: 'Canvas Request',
        name: 'canvasRequest',
        type: 'options',
        options: [
          {
            name: 'No Selection',
            value: '',
          },
          {
            name: 'Enable',
            value: 'true',
          },
          {
            name: 'Disable',
            value: 'false',
          },
        ],
        default: '',
        description: 'Whether the generation is for the Canvas Editor feature',
        displayOptions: {
          show: {
            operation: ['createLeonardoImage'],
            advancedOptions: [true],
          },
        },
      },
      {
        displayName: 'Canvas Request Type',
        name: 'canvasRequestType',
        type: 'options',
        options: [
          {
            name: 'No Selection',
            value: '',
          },
          {
            name: 'INPAINT',
            value: 'INPAINT',
          },
          {
            name: 'OUTPAINT',
            value: 'OUTPAINT',
          },
          {
            name: 'SKETCH2IMG',
            value: 'SKETCH2IMG',
          },
          {
            name: 'IMG2IMG',
            value: 'IMG2IMG',
          },
        ],
        default: '',
        description: 'The type of request for the Canvas Editor',
        displayOptions: {
          show: {
            operation: ['createLeonardoImage'],
            advancedOptions: [true],
            canvasRequest: ['true'],
          },
        },
      },
      {
        displayName: 'High Contrast',
        name: 'highContrast',
        type: 'options',
        options: [
          {
            name: 'No Selection',
            value: 'NO_SELECTION',
          },
          {
            name: 'Enable',
            value: 'true',
          },
          {
            name: 'Disable (RAW Mode)',
            value: 'false',
          },
        ],
        default: 'NO_SELECTION',
        description:
          'Enable High Contrast feature of Prompt Magic. Setting to false enables RAW mode.',
        displayOptions: {
          show: {
            operation: ['createLeonardoImage'],
            advancedOptions: [true],
          },
        },
      },
      {
        displayName: 'High Resolution',
        name: 'highResolution',
        type: 'options',
        options: [
          {
            name: 'No Selection',
            value: 'NO_SELECTION',
          },
          {
            name: 'Enable',
            value: 'true',
          },
          {
            name: 'Disable',
            value: 'false',
          },
        ],
        default: 'NO_SELECTION',
        description: 'Enable the High Resolution feature of Prompt Magic',
        displayOptions: {
          show: {
            operation: ['createLeonardoImage'],
            advancedOptions: [true],
          },
        },
      },

      // Prompt Engineering
      {
        displayName: '🔹 Prompt Engineering',
        name: 'promptEngineeringHeading',
        type: 'notice',
        default: '',
        displayOptions: {
          show: {
            operation: ['createLeonardoImage'],
            advancedOptions: [true],
          },
        },
      },
      {
        displayName: 'Negative Prompt',
        name: 'negativePrompt',
        type: 'string',
        default: '',
        description: 'Things to exclude from the generated image',
        displayOptions: {
          show: {
            operation: ['createLeonardoImage'],
            advancedOptions: [true],
          },
        },
      },
      {
        displayName: 'Enable Prompt Magic',
        name: 'promptMagic',
        type: 'options',
        options: [
          {
            name: 'No Selection',
            value: 'NO_SELECTION',
          },
          {
            name: 'Enable',
            value: 'true',
          },
          {
            name: 'Disable',
            value: 'false',
          },
        ],
        default: 'NO_SELECTION',
        description:
          'Custom render pipeline for better prompt adherence and higher fidelity (increases token cost)',
        displayOptions: {
          show: {
            operation: ['createLeonardoImage'],
            advancedOptions: [true],
          },
        },
      },
      {
        displayName: 'Prompt Magic Strength',
        name: 'promptMagicStrength',
        type: 'number',
        default: 0.5,
        typeOptions: {
          minValue: 0.1,
          maxValue: 1.0,
          numberPrecision: 2,
        },
        description: 'Controls how strongly Prompt Magic influences the result',
        displayOptions: {
          show: {
            operation: ['createLeonardoImage'],
            advancedOptions: [true],
            promptMagic: ['true'],
          },
        },
      },
      {
        displayName: 'Enhance Prompt',
        name: 'enhancePrompt',
        type: 'options',
        options: [
          {
            name: 'No Selection',
            value: '',
          },
          {
            name: 'Enable',
            value: 'true',
          },
          {
            name: 'Disable',
            value: 'false',
          },
        ],
        default: '',
        description: 'When enabled, your prompt is expanded to include more detail',
        displayOptions: {
          show: {
            operation: ['createLeonardoImage'],
            advancedOptions: [true],
          },
        },
      },
      {
        displayName: 'Enhance Prompt Instruction',
        name: 'enhancePromptInstruction',
        type: 'string',
        default: '',
        description:
          'When enhancePrompt is enabled, the prompt is enhanced based on the given instructions',
        displayOptions: {
          show: {
            operation: ['createLeonardoImage'],
            advancedOptions: [true],
            enhancePrompt: ['true'],
          },
        },
      },
      // Generation Parameters
      {
        displayName: '🔵 Generation Parameters',
        name: 'generationParametersHeading',
        type: 'notice',
        default: '',
        displayOptions: {
          show: {
            operation: ['createLeonardoImage'],
            advancedOptions: [true],
          },
        },
      },
      {
        displayName: 'Guidance Scale',
        name: 'guidanceScale',
        type: 'number',
        default: 5,
        typeOptions: {
          minValue: 1,
          maxValue: 20,
        },
        description:
          'How closely the image follows the prompt (1-20, higher values increase prompt accuracy but cost more)',
        displayOptions: {
          show: {
            operation: ['createLeonardoImage'],
            advancedOptions: [true],
          },
        },
      },
      {
        displayName: 'Scheduler',
        name: 'scheduler',
        type: 'options',
        options: [
          {
            name: 'DDIM',
            value: 'DDIM',
            description: 'Recommended: Most reliable scheduler option',
          },
          {
            name: 'DPM Solver',
            value: 'DPM_SOLVER',
          },
          {
            name: 'PNDM',
            value: 'PNDM',
          },
          {
            name: 'Euler Discrete',
            value: 'EULER_DISCRETE',
          },
          {
            name: 'Euler Ancestral Discrete',
            value: 'EULER_ANCESTRAL_DISCRETE',
          },
          {
            name: 'KLMS',
            value: 'KLMS',
          },
          {
            name: 'Leonardo',
            value: 'LEONARDO',
            description:
              'When using this scheduler without Alchemy, guidance scale cannot exceed 7',
          },
        ],
        default: 'EULER_DISCRETE',
        description: 'The sampling scheduler to use',
        displayOptions: {
          show: {
            operation: ['createLeonardoImage'],
            advancedOptions: [true],
          },
        },
      },
      {
        displayName: 'Seed',
        name: 'seed',
        type: 'string',
        default: '',
        description: 'Seed for reproducible generations (leave empty for random)',
        displayOptions: {
          show: {
            operation: ['createLeonardoImage'],
            advancedOptions: [true],
          },
        },
      },
      {
        displayName: 'Inference Steps',
        name: 'inferenceSteps',
        type: 'number',
        default: 20,
        typeOptions: {
          minValue: 20,
          maxValue: 60,
        },
        description:
          'Number of denoising steps (20-60, higher values increase quality but cost more)',
        displayOptions: {
          show: {
            operation: ['createLeonardoImage'],
            advancedOptions: [true],
          },
        },
      },
      // Image-to-Image
      {
        displayName: '🔷 Image-to-Image',
        name: 'imageToImageHeading',
        type: 'notice',
        default: '',
        displayOptions: {
          show: {
            operation: ['createLeonardoImage'],
            advancedOptions: [true],
          },
        },
      },
      {
        displayName: 'Enable Image-to-Image',
        name: 'imageToImage',
        type: 'options',
        options: [
          {
            name: 'No Selection',
            value: 'NO_SELECTION',
          },
          {
            name: 'Enable',
            value: 'true',
          },
          {
            name: 'Disable',
            value: 'false',
          },
        ],
        default: 'NO_SELECTION',
        description: 'Generate an image based on a reference image',
        displayOptions: {
          show: {
            operation: ['createLeonardoImage'],
            advancedOptions: [true],
          },
        },
      },
      {
        displayName: 'Init Image URL',
        name: 'initImageUrl',
        type: 'string',
        default: '',
        description: 'URL of the image to use as reference',
        displayOptions: {
          show: {
            operation: ['createLeonardoImage'],
            advancedOptions: [true],
            imageToImage: ['true'],
          },
        },
      },
      {
        displayName: 'Init Strength',
        name: 'initStrength',
        type: 'number',
        default: 0.5,
        typeOptions: {
          minValue: 0.0,
          maxValue: 1.0,
          numberPrecision: 2,
        },
        description: 'How much to preserve from the initial image (lower = more creative)',
        displayOptions: {
          show: {
            operation: ['createLeonardoImage'],
            advancedOptions: [true],
            imageToImage: ['true'],
          },
        },
      },
      {
        displayName: '🔷 Additional Settings',
        name: 'additionalSettingsHeading',
        type: 'notice',
        default: '',
        displayOptions: {
          show: {
            operation: ['createLeonardoImage'],
            advancedOptions: [true],
          },
        },
      },
      {
        displayName: 'SD Version',
        name: 'sdVersion',
        type: 'options',
        options: [
          {
            name: 'Default (Auto)',
            value: '',
          },
          {
            name: 'SD 1.5',
            value: 'v1_5',
          },
          {
            name: 'SD 2.1',
            value: 'v2',
          },
          {
            name: 'SD v3',
            value: 'v3',
          },
          {
            name: 'SDXL 0.8',
            value: 'SDXL_0_8',
          },
          {
            name: 'SDXL 0.9',
            value: 'SDXL_0_9',
          },
          {
            name: 'SDXL 1.0',
            value: 'SDXL_1_0',
          },
          {
            name: 'SDXL Lightning',
            value: 'SDXL_LIGHTNING',
          },
          {
            name: 'Phoenix',
            value: 'PHOENIX',
          },
          {
            name: 'Flux',
            value: 'FLUX',
          },
          {
            name: 'Flux Dev',
            value: 'FLUX_DEV',
          },
        ],
        default: '',
        description: 'The base version of stable diffusion to use if not using a custom model',
        displayOptions: {
          show: {
            operation: ['createLeonardoImage'],
            advancedOptions: [true],
          },
        },
      },
      {
        displayName: 'PhotoReal Version',
        name: 'photoRealVersion',
        type: 'options',
        options: [
          {
            name: 'None',
            value: '',
          },
          {
            name: 'V1',
            value: 'v1',
          },
          {
            name: 'V2',
            value: 'v2',
          },
        ],
        default: '',
        description: 'The version of photoReal to use. Must be v1 or v2.',
        displayOptions: {
          show: {
            operation: ['createLeonardoImage'],
            advancedOptions: [true],
          },
        },
      },
      {
        displayName: 'PhotoReal Strength',
        name: 'photoRealStrength',
        type: 'options',
        options: [
          {
            name: 'Low',
            value: '0.55',
          },
          {
            name: 'Medium',
            value: '0.5',
          },
          {
            name: 'High',
            value: '0.45',
          },
        ],
        default: '0.55',
        description: 'Depth of field for photoReal. 0.55 for low, 0.5 for medium, 0.45 for high.',
        displayOptions: {
          show: {
            operation: ['createLeonardoImage'],
            advancedOptions: [true],
            photoRealVersion: ['v1', 'v2'],
          },
        },
      },
      {
        displayName: 'PhotoReal',
        name: 'photoReal',
        type: 'options',
        options: [
          {
            name: 'No Selection',
            value: 'NO_SELECTION',
          },
          {
            name: 'Enable',
            value: 'true',
          },
          {
            name: 'Disable',
            value: 'false',
          },
        ],
        default: 'NO_SELECTION',
        description: 'Enable the photoReal feature (requires alchemy to be enabled)',
        displayOptions: {
          show: {
            operation: ['createLeonardoImage'],
            advancedOptions: [true],
          },
        },
      },
      {
        displayName: 'Expanded Domain',
        name: 'expandedDomain',
        type: 'options',
        options: [
          {
            name: 'No Selection',
            value: 'NO_SELECTION',
          },
          {
            name: 'Enable',
            value: 'true',
          },
          {
            name: 'Disable',
            value: 'false',
          },
        ],
        default: 'NO_SELECTION',
        description: 'Enable the Expanded Domain feature of Alchemy',
        displayOptions: {
          show: {
            operation: ['createLeonardoImage'],
            advancedOptions: [true],
          },
        },
      },
      {
        displayName: 'Fantasy Avatar',
        name: 'fantasyAvatar',
        type: 'options',
        options: [
          {
            name: 'No Selection',
            value: 'NO_SELECTION',
          },
          {
            name: 'Enable',
            value: 'true',
          },
          {
            name: 'Disable',
            value: 'false',
          },
        ],
        default: 'NO_SELECTION',
        description: 'Enable the Fantasy Avatar feature',
        displayOptions: {
          show: {
            operation: ['createLeonardoImage'],
            advancedOptions: [true],
          },
        },
      },
      {
        displayName: 'Ultra',
        name: 'ultra',
        type: 'options',
        options: [
          {
            name: 'No Selection',
            value: 'NO_SELECTION',
          },
          {
            name: 'Enable',
            value: 'true',
          },
          {
            name: 'Disable',
            value: 'false',
          },
        ],
        default: 'NO_SELECTION',
        description: 'Enable Ultra mode. ⚠️ Cannot be used with Alchemy.',
        displayOptions: {
          show: {
            operation: ['createLeonardoImage'],
            advancedOptions: [true],
          },
        },
      },
      {
        displayName: 'Preset Style (SDXL Models Only)',
        name: 'presetStyle',
        type: 'options',
        default: '',
        options: [
          {
            name: 'None',
            value: '',
          },
          {
            name: 'Bokeh',
            value: 'BOKEH',
          },
          {
            name: 'Cinematic',
            value: 'CINEMATIC',
          },
          {
            name: 'Cinematic (Closeup)',
            value: 'CINEMATIC_CLOSEUP',
          },
          {
            name: 'Creative',
            value: 'CREATIVE',
          },
          {
            name: 'Fashion',
            value: 'FASHION',
          },
          {
            name: 'Film',
            value: 'FILM',
          },
          {
            name: 'Food',
            value: 'FOOD',
          },
          {
            name: 'HDR',
            value: 'HDR',
          },
          {
            name: 'Long Exposure',
            value: 'LONG_EXPOSURE',
          },
          {
            name: 'Macro',
            value: 'MACRO',
          },
        ],
        description: 'Style preset for SDXL models only. Not compatible with Flux, Lucid Realism, or Phoenix models.',
        displayOptions: {
          show: {
            operation: ['createLeonardoImage'],
            advancedOptions: [true],
            modelSelectionMethod: ['list'],
            // Show only for SDXL models
            modelId: [
              '16e7060a-803e-4df3-97ee-edcfa5dc9cc8', // SDXL 1.0
              '1e60896f-3c26-4296-8ecc-53e2afecc132', // Leonardo Diffusion XL
              '2067ae52-33fd-4a82-bb92-c2c55e7d2786', // AlbedoBase XL
              'b63f7119-31dc-4540-969b-2a9df997e173', // SDXL 0.9
              'aa77f04e-3eec-4034-9c07-d0f619684628', // Leonardo Kino XL
              '5c232a9e-9061-4777-980a-ddc8e65647c6', // Leonardo Vision XL
              'e71a1c2f-4f80-4800-934f-2c68979d8cc8', // Leonardo Anime XL
              'b24e16ff-06e3-43eb-8d33-4416c2d75876', // Leonardo Lightning XL
            ],
          },
        },
      },
      {
        displayName: 'Style UUID (Flux/Lucid Realism/Phoenix Only)',
        name: 'styleUUID',
        type: 'options',
        default: '',
        options: [
          {
            name: 'None',
            value: '',
          },
          {
            name: '3D Render',
            value: 'debdf72a-91a4-467b-bf61-cc02bdeb69c6',
          },
          {
            name: 'Bokeh',
            value: '9fdc5e8c-4d13-49b4-9ce6-5a74cbb19177',
          },
          {
            name: 'Cinematic',
            value: 'a5632c7c-ddbb-4e2f-ba34-8456ab3ac436',
          },
          {
            name: 'Cinematic Concept',
            value: '33abbb99-03b9-4dd7-9761-ee98650b2c88',
          },
          {
            name: 'Creative',
            value: '6fedbf1f-4a17-45ec-84fb-92fe524a29ef',
          },
          {
            name: 'Dynamic',
            value: '111dc692-d470-4eec-b791-3475abac4c46',
          },
          {
            name: 'Fashion',
            value: '594c4a08-a522-4e0e-b7ff-e4dac4b6b622',
          },
          {
            name: 'Graphic Design Pop Art',
            value: '2e74ec31-f3a4-4825-b08b-2894f6d13941',
          },
          {
            name: 'Graphic Design Vector',
            value: '1fbb6a68-9319-44d2-8d56-2957ca0ece6a',
          },
          {
            name: 'HDR',
            value: '97c20e5c-1af6-4d42-b227-54d03d8f0727',
          },
          {
            name: 'Illustration',
            value: '645e4195-f63d-4715-a3f2-3fb1e6eb8c70',
          },
          {
            name: 'Macro',
            value: '30c1d34f-e3a9-479a-b56f-c018bbc9c02a',
          },
          {
            name: 'Minimalist',
            value: 'cadc8cd6-7838-4c99-b645-df76be8ba8d8',
          },
          {
            name: 'Moody',
            value: '621e1c9a-6319-4bee-a12d-ae40659162fa',
          },
          {
            name: 'None',
            value: '556c1ee5-ec38-42e8-955a-1e82dad0ffa1',
          },
          {
            name: 'Portrait',
            value: '8e2bc543-6ee2-45f9-bcd9-594b6ce84dcd',
          },
          {
            name: 'Pro B&W Photography',
            value: '22a9a7d2-2166-4d86-80ff-22e2643adbcf',
          },
          {
            name: 'Pro Color Photography',
            value: '7c3f932b-a572-47cb-9b9b-f20211e63b5b',
          },
          {
            name: 'Pro Film Photography',
            value: '581ba6d6-5aac-4492-bebe-54c424a0d46e',
          },
          {
            name: 'Portrait Fashion',
            value: '0d34f8e1-46d4-428f-8ddd-4b11811fa7c9',
          },
          {
            name: 'Ray Traced',
            value: 'b504f83c-3326-4947-82e1-7fe9e839ec0f',
          },
          {
            name: 'Sketch (B&W)',
            value: 'be8c6b58-739c-4d44-b9c1-b032ed308b61',
          },
          {
            name: 'Sketch (Color)',
            value: '093accc3-7633-4ffd-82da-d34000dfc0d6',
          },
          {
            name: 'Stock Photo',
            value: '5bdc3f2a-1be6-4d1c-8e77-992a30824a2c',
          },
          {
            name: 'Vibrant',
            value: 'dee282d3-891f-4f73-ba02-7f8131e5541b',
          },
        ],
        description: 'Style UUID for Flux, Lucid Realism, and Phoenix models only. Not compatible with SDXL models.',
        displayOptions: {
          show: {
            operation: ['createLeonardoImage'],
            advancedOptions: [true],
            modelSelectionMethod: ['list'],
            // Show only for Flux, Lucid Realism, and Phoenix models
            modelId: [
              'b2614463-296c-462a-9586-aafdb8f00e36', // Flux Dev
              '1dd50843-d653-4516-a8e3-f0238ee453ff', // Flux Schnell
              '05ce0082-2d80-4a2d-8653-4d1c85e2418e', // Lucid Realism
              'de7d3faf-762f-48e0-b3b7-9d0ac3a3fcf3', // Leonardo Phoenix 1.0
              '6b645e3a-d64f-4341-a6d8-7a3690fbf042', // Leonardo Phoenix 0.9
            ],
          },
        },
      },
      {
        displayName: 'Contrast',
        name: 'contrast',
        type: 'options',
        options: [
          {
            name: '1.0',
            value: '1.0',
          },
          {
            name: '1.3',
            value: '1.3',
          },
          {
            name: '1.8',
            value: '1.8',
          },
          {
            name: '2.5',
            value: '2.5',
          },
          {
            name: '3.0',
            value: '3.0',
          },
          {
            name: '3.5',
            value: '3.5',
          },
          {
            name: '4.0',
            value: '4.0',
          },
          {
            name: '4.5',
            value: '4.5',
          },
        ],
        default: '1.0',
        description:
          'Adjusts contrast level of generated image. For Phoenix, if alchemy is true, must be 2.5 or higher.',
        displayOptions: {
          show: {
            operation: ['createLeonardoImage'],
            advancedOptions: [true],
          },
        },
      },
      {
        displayName: 'ControlNets',
        name: 'controlnets',
        type: 'fixedCollection',
        typeOptions: {
          multipleValues: true,
          sortable: true,
        },
        placeholder: 'Add ControlNet',
        default: {},
        options: [
          {
            name: 'controlNetValues',
            displayName: 'ControlNet',
            values: [
              {
                displayName: 'Init Image ID',
                name: 'initImageId',
                type: 'string',
                default: '',
                description: 'ID of the image to use for ControlNet',
                required: true,
              },
              {
                displayName: 'Init Image Type',
                name: 'initImageType',
                type: 'options',
                options: [
                  {
                    name: 'Generated',
                    value: 'GENERATED',
                  },
                  {
                    name: 'Uploaded',
                    value: 'UPLOADED',
                  },
                ],
                default: 'UPLOADED',
                description: 'Type of the image',
                required: true,
              },
              {
                displayName: 'Preprocessor ID',
                name: 'preprocessorId',
                type: 'options',
                options: [
                  {
                    name: 'Style Reference (67)',
                    value: '67',
                  },
                  {
                    name: 'Character Reference (133)',
                    value: '133',
                  },
                  {
                    name: 'Content Reference (182)',
                    value: '182',
                  },
                ],
                default: '67',
                description:
                  'Type of ControlNet to use. 67: Style Reference, 133: Character Reference, 182: Content Reference',
                required: true,
              },
              {
                displayName: 'Weight',
                name: 'weight',
                type: 'number',
                default: 0.6,
                typeOptions: {
                  minValue: 0.1,
                  maxValue: 2.0,
                  numberPrecision: 2,
                },
                description:
                  'How strongly the ControlNet should influence the result (must be <= 2.0)',
              },
              {
                displayName: 'Strength Type',
                name: 'strengthType',
                type: 'options',
                options: [
                  {
                    name: 'Low',
                    value: 'Low',
                  },
                  {
                    name: 'Mid',
                    value: 'Mid',
                  },
                  {
                    name: 'High',
                    value: 'High',
                  },
                  {
                    name: 'Ultra',
                    value: 'Ultra',
                  },
                  {
                    name: 'Max',
                    value: 'Max',
                  },
                ],
                default: 'Mid',
                description:
                  'Strength of the ControlNet effect. For Content Reference and Character Reference, only Low, Mid, and High are supported.',
              },
            ],
          },
        ],
        description: 'Add one or more ControlNets for image guidance',
        displayOptions: {
          show: {
            operation: ['createLeonardoImage'],
            advancedOptions: [true],
          },
        },
      },
      {
        displayName: 'Image Prompts',
        name: 'imagePrompts',
        type: 'fixedCollection',
        typeOptions: {
          multipleValues: true,
          sortable: true,
        },
        placeholder: 'Add Image Prompt',
        default: {},
        options: [
          {
            name: 'imagePromptValues',
            displayName: 'Image Prompt',
            values: [
              {
                displayName: 'Image ID',
                name: 'imageId',
                type: 'string',
                default: '',
                description: 'ID of the image to use as an image prompt',
                required: true,
              },
            ],
          },
        ],
        description: 'Array of image IDs to use as prompts',
        displayOptions: {
          show: {
            operation: ['createLeonardoImage'],
            advancedOptions: [true],
          },
        },
      },
      {
        displayName: 'Upscale Ratio (Enterprise Only ⚠️)',
        name: 'upscaleRatio',
        type: 'number',
        default: null,
        typeOptions: {
          minValue: 1,
          maxValue: 4,
          numberPrecision: 1,
        },
        placeholder: 'Leave empty for non-enterprise accounts',
        description:
          'ENTERPRISE ACCOUNTS ONLY - How much the image should be upscaled. Will cause errors if used with standard accounts.',
        displayOptions: {
          show: {
            operation: ['createLeonardoImage'],
            advancedOptions: [true],
          },
        },
      },
      {
        displayName: 'Generation Timeout (seconds)',
        name: 'generationTimeout',
        type: 'number',
        default: 30,
        typeOptions: {
          minValue: 15,
          maxValue: 120,
        },
        description: 'Maximum time to wait for image generation to complete (15-120, default 30)',
        displayOptions: {
          show: {
            operation: ['createLeonardoImage'],
            advancedOptions: [true],
          },
        },
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    const credentials = await this.getCredentials('createLeonardoImageCredentials');
    const apiKey = credentials.apiKey as string;
    const apiUrl = 'https://cloud.leonardo.ai/api/rest/v1';

    for (let i = 0; i < items.length; i++) {
      try {
        const operation = this.getNodeParameter('operation', i) as string;

        if (operation !== 'createLeonardoImage') {
          throw new Error(`Unsupported operation: ${operation}`);
        }

        const body = buildRequestBody.call(this, i);
        const response = await this.helpers.request({
          method: 'POST',
          url: `${apiUrl}/generations`,
          body: JSON.stringify(body),
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
        });

        const parsedResponse = typeof response === 'string' ? JSON.parse(response) : response;

        if (!parsedResponse.sdGenerationJob || !parsedResponse.sdGenerationJob.generationId) {
          throw new Error("Response does not contain the expected 'generationId' field.");
        }

        const generationId = parsedResponse.sdGenerationJob.generationId;

        // Async / webhook mode: return the generation ID immediately without polling.
        // Leonardo delivers the finished image to the webhook callback URL configured
        // on the Production API key (account-level, not per request), so downstream
        // completion is handled by an n8n Webhook trigger node.
        const responseMode = this.getNodeParameter('responseMode', i, 'async') as string;
        if (responseMode === 'async') {
          returnData.push({
            json: {
              success: true,
              generationId,
              status: 'PENDING',
              apiCreditCost: parsedResponse.sdGenerationJob.apiCreditCost,
              request: body,
              rawResponse: JSON.parse(JSON.stringify(parsedResponse)),
            },
          });
          continue;
        }

        // Polling for image generation completion
        let generationStatus;
        let attempts = 0;
        const timeoutSeconds = this.getNodeParameter('generationTimeout', i, 30) as number;
        const maxAttempts = Math.ceil(timeoutSeconds / 2);
        const pollWaitTime = 2000;

        let finalResponse;
        await new Promise(resolve =>
          setTimeout(resolve, pollWaitTime)
        );

        do {
          await new Promise(resolve =>
            setTimeout(resolve, pollWaitTime)
          );

          const statusResponse = await this.helpers.request({
            method: 'GET',
            url: `${apiUrl}/generations/${generationId}`,
            headers: {
              Authorization: `Bearer ${apiKey}`,
            },
          });
          finalResponse =
            typeof statusResponse === 'string' ? JSON.parse(statusResponse) : statusResponse;

          if (!finalResponse.generations_by_pk || !finalResponse.generations_by_pk.status) {
            throw new Error("Status response does not contain the expected 'status' field.");
          }

          generationStatus = finalResponse.generations_by_pk.status;

          attempts++;

          if (generationStatus === 'COMPLETE') {
            const generationData = finalResponse.generations_by_pk;
            const generatedImages = generationData.generated_images || [];

            const formattedOutput = {
              success: true,  // Ensure this is explicitly set to true for test compatibility
              generationId: generationData.id,
              status: generationData.status,
              prompt: generationData.prompt,
              modelId: generationData.modelId,
              imageCount: generatedImages.length,
              images: generatedImages.map((img: any) => ({
                id: img.id,
                url: img.url,
                nsfw: img.nsfw || false,
                width: generationData.imageWidth || generationData.width || 1024,
                height: generationData.imageHeight || generationData.height || 576,
              })),

              imageUrl: generatedImages.length > 0 ? generatedImages[0].url : null,
              rawResponse: JSON.parse(JSON.stringify(finalResponse)),
            };

            returnData.push({
              json: formattedOutput,
            });

            break;
          }
        } while (generationStatus !== 'COMPLETE' && attempts < maxAttempts);

        if (generationStatus !== 'COMPLETE') {
          throw new Error('Image generation did not complete within the expected time.');
        }
      } catch (error) {
        console.error('Error:', (error as Error).message);
        returnData.push({
          json: {
            success: false,
            error: (error as Error).message,
          },
        });
      }
    }

    return [returnData];
  }
}
