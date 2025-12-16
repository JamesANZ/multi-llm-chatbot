# Multi-LLM Chatbot

A modern, browser-based chatbot that allows you to chat with multiple Large Language Model (LLM) providers simultaneously and compare their responses side-by-side. Built with vanilla HTML, CSS, and JavaScript - no frameworks or build tools required.

![Multi-LLM Chatbot](https://via.placeholder.com/800x400/3b82f6/ffffff?text=Multi-LLM+Chatbot)

## Features

- 🔄 **Multi-Provider Support**: Chat with multiple LLM providers at the same time
- 📊 **Side-by-Side Comparison**: View responses from different providers in a single conversation
- 🎨 **Modern UI**: Clean, responsive interface with a beautiful blue-cyan gradient design
- ⚙️ **Easy Configuration**: Simple settings panel to add and manage LLM providers
- 💬 **Streaming Responses**: Real-time streaming responses for faster feedback
- 🎤 **Voice Input**: Built-in voice recognition for hands-free interaction
- 🔊 **Text-to-Speech**: Listen to responses with the built-in speech synthesis
- 📝 **Export Conversations**: Export your conversations as Markdown files
- 🖨️ **Print Support**: Print-friendly layout for saving or sharing conversations
- 📱 **Responsive Design**: Works seamlessly on desktop and mobile devices

## Supported Providers

The chatbot supports multiple LLM providers with built-in templates:

- **OpenAI**: GPT-4o, GPT-4 Turbo, GPT-3.5 Turbo, o1-preview, o1-mini
- **Anthropic Claude**: Claude 3.5 Sonnet, Claude 3 Opus, Claude 3 Sonnet, Claude 3 Haiku
- **Google Gemini**: Gemini 2.5 Flash, Gemini 1.5 Pro, Gemini 1.5 Flash
- **DeepSeek**: DeepSeek R1, DeepSeek Chat, DeepSeek Coder (requires proxy)
- **xAI Grok**: Grok-3, Grok-2, Grok-beta (requires proxy)
- **Moonshot AI (Kimi)**: moonshot-v1-128k, moonshot-v1-32k, moonshot-v1-8k (requires proxy)
- **Perplexity**: sonar-pro, sonar-medium-online (requires proxy)
- **Mistral AI**: mistral-large-latest, mistral-medium-latest (requires proxy)
- **Custom Providers**: Add any custom LLM API endpoint

## Getting Started

### Quick Start

1. Download or clone this repository
2. Open `source/index.html` in your web browser
3. Click **Settings** to add your first LLM provider
4. Enter your API key and select a model
5. Select which LLMs to use from the checkbox list
6. Start chatting!

### Adding a Provider

1. Click the **Settings** button in the header
2. Select a provider template (or choose "Custom Provider")
3. Enter:
   - Provider name
   - API endpoint URL
   - API key
   - Model name
4. Click **Add Provider**

The application will automatically populate endpoint URLs and available models when you select a built-in template.

### Usage

1. **Select LLMs**: Check the boxes for the LLM providers you want to query
2. **Enter Prompt**: Type your question or prompt in the text area
3. **Send**: Press **Send** or use `Alt+S` (or `Enter` on mobile)
4. **Compare**: View responses from all selected providers side-by-side
5. **Export**: Click **Export** to save the conversation as a Markdown file

### Keyboard Shortcuts

- `Alt+S` or `Enter`: Send message
- `Ctrl+P`: Print conversation
- Double-click on prompt: Copy dialogue to clipboard

## Browser Compatibility & CORS

### Direct Browser Support

The following providers work directly from the browser without a proxy:

- ✅ OpenAI
- ✅ Anthropic Claude
- ✅ Google Gemini

### Requires Proxy

Some providers have CORS restrictions and require a server-side proxy:

- ⚠️ DeepSeek
- ⚠️ Perplexity
- ⚠️ Mistral AI
- ⚠️ xAI Grok
- ⚠️ Moonshot AI (Kimi)

If you encounter CORS errors with these providers, you'll need to set up a proxy server or use only browser-compatible providers.

## Security & Privacy

- API keys are stored in your browser's **localStorage** only
- No data is sent to any third-party servers except the LLM providers you configure
- All communication happens directly between your browser and the LLM APIs
- Click **Logout** to clear all stored data including API keys

## Technical Details

### Architecture

- **Single File**: Everything is contained in a single HTML file (`index.html`)
- **Vanilla JavaScript**: No frameworks or dependencies
- **Local Storage**: All settings and API keys stored in browser localStorage
- **Streaming API**: Uses Fetch API with streaming for real-time responses
- **Markdown Rendering**: Built-in markdown parser for rich text responses

### File Structure

```
source/
├── index.html          # Main application (single file)
├── vanilla-chatgpt.html  # Alternative version (if exists)
└── vanilla-chatgpt.js    # Reusable library (if exists)
```

### Code Highlights

- Provider templates with pre-configured endpoints and models
- Automatic API format detection and handling
- Streaming response parser supporting multiple formats
- Responsive layout with flexbox and CSS Grid
- Markdown rendering with syntax highlighting

## Features in Detail

### Multi-Provider Chat

Select multiple LLMs and get responses from all of them simultaneously. Each response is clearly labeled with its provider name and displayed in separate containers for easy comparison.

### Settings Management

The settings modal provides an intuitive interface to:

- Add new providers with templates or custom configurations
- Edit existing provider API keys and models
- Delete providers you no longer use
- View all configured providers at a glance

### Conversation History

- All conversations are stored in memory during the session
- Export conversations as Markdown files
- Navigate through conversation history
- Copy individual dialogues to clipboard

### Voice Features

- **Voice Input**: Click the microphone button to use voice recognition
- **Text-to-Speech**: Click the speaker button to hear responses read aloud

## Customization

Since everything is in a single HTML file, you can easily customize:

- Colors and styling in the `<style>` section
- Provider templates in the `chat.providerTemplates` object
- UI layout and components
- Keyboard shortcuts and hotkeys

## License

See [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome! Feel free to:

- Add support for new LLM providers
- Improve the UI/UX
- Add new features
- Fix bugs
- Improve documentation

## Credits

Built with inspiration from various self-hosted ChatGPT solutions and vanilla JavaScript implementations.

Special thanks to the open-source community for markdown parsing and API integration patterns.
