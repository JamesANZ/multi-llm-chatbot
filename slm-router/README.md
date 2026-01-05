# SLM Router

An intelligent Small Language Model (SLM) router that automatically classifies user prompts and routes them to the most appropriate specialized model.

## Features

- **Intelligent Routing**: Keyword-based classification to route prompts to domain-specific models
- **Custom Endpoints**: Support for self-hosted models via custom endpoints
- **Hugging Face Integration**: Works with Hugging Face Router API and Inference Endpoints
- **Multiple Domains**: Configure models for different domains (coding, legal, general, etc.)
- **Chat Interface**: Simple, clean chat UI for interacting with routed models

## Files

- `multi-slm-chat.html` - Main HTML interface
- `multi-slm-chat.js` - Core routing logic and chat functionality

## Setup

1. Open `multi-slm-chat.html` in your browser
2. Click Settings (gear icon)
3. Add your Hugging Face API token
4. Add models or use the default collection

## Adding Models

1. Go to Settings → Add New SLM Model
2. Fill in:
   - **Model ID**: Model identifier (e.g., `meta-llama/Llama-3.1-8B-Instruct`)
   - **Display Name**: Friendly name for the UI
   - **Domain**: Category label (e.g., `general`, `coding`, `australian_law`)
   - **Custom Endpoint** (optional): For self-hosted models
3. Click "Add Model"

## Custom Endpoints

For self-hosted Hugging Face Inference Endpoints, provide the base URL (e.g., `https://xxx.us-east-1.aws.endpoints.huggingface.cloud`). The router uses the standard HF Inference API format with `inputs` parameter.

## How It Works

1. User submits a prompt
2. Router classifies the prompt using keyword matching against configured domains
3. Best matching domain is selected
4. Prompt is routed to a model with that domain
5. Response is displayed in the chat interface

## Supported Models

- Models available via Hugging Face Router API (OpenAI-compatible format)
- Custom self-hosted models via Inference Endpoints (standard HF API format)

