/*****************************************************************************
 * casual-markdown - a lightweight regexp-base markdown parser with TOC support
 * last updated on 2023/03/27, v0.91, some refinement for chatgpt markdown
 *
 * Copyright (c) 2022-2023, Casualwriter (MIT Licensed)
 * https://github.com/casualwriter/casual-markdown
 *****************************************************************************/
const md = {
  yaml: {},
  before: function (str) {
    return str;
  },
  after: function (str) {
    return str;
  },
};

md.formatTag = function (html) {
  return html.replace(/</g, "&lt;").replace(/\>/g, "&gt;");
};

md.formatCode = function (match, title, block) {
  block = block.replace(/</g, "&lt;").replace(/\>/g, "&gt;");
  block = block
    .replace(/\t/g, "   ")
    .replace(/\^\^\^(.+?)\^\^\^/g, "<mark>$1</mark>");

  if (title.toLowerCase(title) == "sql") {
    block = block
      .replace(/^\-\-(.*)/gm, "<rem>--$1</rem>")
      .replace(/\s\-\-(.*)/gm, " <rem>--$1</rem>");
    block = block.replace(
      /(\s?)(function|procedure|return|if|then|else|end|loop|while|or|and|case|when)(\s)/gim,
      "$1<b>$2</b>$3",
    );
    block = block.replace(
      /(\s?)(select|update|delete|insert|create|from|where|group by|having|set)(\s)/gim,
      "$1<b>$2</b>$3",
    );
  } else if ((title || "none") !== "none") {
    block = block
      .replace(/^\/\/(.*)/gm, "<rem>//$1</rem>")
      .replace(/\s\/\/(.*)/gm, " <rem>//$1</rem>");
    block = block.replace(
      /(\s?)(function|procedure|return|if|then|else|end|loop|while|or|and|case|when)(\s)/gim,
      "$1<b>$2</b>$3",
    );
    block = block.replace(
      /(\s?)(var|let|const|for|next|do|while|loop|continue|break|switch|try|catch|finally)(\s)/gim,
      "$1<b>$2</b>$3",
    );
  }
  return (
    '<pre title="' +
    title +
    '"><button onclick="md.clipboard(this)">copy</button><code>' +
    block +
    "</code></pre>"
  );
};

md.parser = function (mdstr) {
  for (var name in this.yaml)
    mdstr = mdstr.replace(
      new RegExp("\{\{\\s*" + name + "\\s*\}\}", "gm"),
      this.yaml[name],
    );

  mdstr = mdstr.replace(
    /\n(.+?)\n.*?\-\-\s?\|\s?\-\-.*?\n([\s\S]*?)\n\s*?\n/g,
    function (m, p1, p2) {
      var thead = p1
        .replace(/^\|(.+)/gm, "$1")
        .replace(/(.+)\|$/gm, "$1")
        .replace(/\|/g, "<th>");
      var tbody = p2.replace(/^\|(.+)/gm, "$1").replace(/(.+)\|$/gm, "$1");
      tbody = tbody
        .replace(/(.+)/gm, "<tr><td>$1</td></tr>")
        .replace(/\|/g, "<td>");
      return (
        "\n<table>\n<thead>\n<th>" +
        thead +
        "\n</thead>\n<tbody>" +
        tbody +
        "\n</tbody></table>\n\n"
      );
    },
  );

  mdstr = mdstr
    .replace(/^-{3,}|^\_{3,}|^\*{3,}$/gm, "<hr>")
    .replace(/\n\n<hr\>/g, "\n<br><hr>");

  mdstr = mdstr
    .replace(/^##### (.*?)\s*#*$/gm, "<h5>$1</h5>")
    .replace(/^#### (.*?)\s*#*$/gm, "<h4>$1</h4>")
    .replace(/^### (.*?)\s*#*$/gm, "<h3>$1</h3>")
    .replace(/^## (.*?)\s*#*$/gm, "<h2>$1</h2>")
    .replace(/^# (.*?)\s*#*$/gm, "<h1>$1</h1>")
    .replace(/^<h(\d)\>(.*?)\s*{(.*)}\s*<\/h\d\>$/gm, '<h$1 id="$3">$2</h$1>');

  mdstr = mdstr.replace(/``(.*?)``/gm, function (m, p) {
    return "<code>" + md.formatTag(p).replace(/`/g, "&#96;") + "</code>";
  });
  mdstr = mdstr.replace(/`(.*?)`/gm, "<code>$1</code>");

  mdstr = mdstr.replace(
    /^\>\> (.*$)/gm,
    "<blockquote><blockquote>$1</blockquote></blockquote>",
  );
  mdstr = mdstr.replace(/^\> (.*$)/gm, "<blockquote>$1</blockquote>");
  mdstr = mdstr.replace(/<\/blockquote\>\n<blockquote\>/g, "\n<br>");
  mdstr = mdstr.replace(/<\/blockquote\>\n<br\><blockquote\>/g, "\n<br>");

  mdstr = mdstr.replace(
    /!\[(.*?)\]\((.*?) "(.*?)"\)/gm,
    '<img alt="$1" src="$2" $3 />',
  );
  mdstr = mdstr.replace(
    /!\[(.*?)\]\((.*?)\)/gm,
    '<img alt="$1" src="$2" width="90%" />',
  );

  mdstr = mdstr.replace(
    /\[(.*?)\]\((.*?) "new"\)/gm,
    '<a href="$2" target=_new>$1</a>',
  );
  mdstr = mdstr.replace(
    /\[(.*?)\]\((.*?) "(.*?)"\)/gm,
    '<a href="$2" title="$3">$1</a>',
  );
  mdstr = mdstr.replace(
    /([<\s])(https?\:\/\/.*?)([\s\>])/gm,
    '$1<a href="$2">$2</a>$3',
  );
  mdstr = mdstr.replace(/\[(.*?)\]\(\)/gm, '<a href="$1">$1</a>');
  mdstr = mdstr.replace(/\[(.*?)\]\((.*?)\)/gm, '<a href="$2">$1</a>');

  mdstr = mdstr.replace(/^[\*+-][ .](.*)/gm, "<ul><li>$1</li></ul>");
  mdstr = mdstr.replace(/^\d\d?[ .](.*)/gm, "<ol><li>$1</li></ol>");
  mdstr = mdstr.replace(
    /^\s{2,6}[\*+-][ .](.*)/gm,
    "<ul><ul><li>$1</li></ul></ul>",
  );
  mdstr = mdstr.replace(
    /^\s{2,6}\d[ .](.*)/gm,
    "<ul><ol><li>$1</li></ol></ul>",
  );
  mdstr = mdstr.replace(/<\/[ou]l\>\n\n?<[ou]l\>/g, "\n");
  mdstr = mdstr.replace(/<\/[ou]l\>\n<[ou]l\>/g, "\n");

  mdstr = mdstr.replace(/\*\*\*(\w.*?[^\\])\*\*\*/gm, "<b><em>$1</em></b>");
  mdstr = mdstr.replace(/\*\*(\w.*?[^\\])\*\*/gm, "<b>$1</b>");
  mdstr = mdstr.replace(/\*(\w.*?[^\\])\*/gm, "<em>$1</em>");
  mdstr = mdstr.replace(/___(\w.*?[^\\])___/gm, "<b><em>$1</em></b>");
  mdstr = mdstr.replace(/__(\w.*?[^\\])__/gm, "<u>$1</u>");
  mdstr = mdstr.replace(/\^\^\^(.+?)\^\^\^/gm, "<mark>$1</mark>");
  mdstr = mdstr.replace(/\^\^(\w.*?)\^\^/gm, "<ins>$1</ins>");
  mdstr = mdstr.replace(/~~(\w.*?)~~/gm, "<del>$1</del>");

  mdstr = mdstr.replace(/  \n/g, "\n<br/>").replace(/\n\s*\n/g, "\n<p>\n");

  mdstr = mdstr.replace(/^ {4,10}(.*)/gm, function (m, p) {
    return "<pre><code>" + md.formatTag(p) + "</code></pre>";
  });
  mdstr = mdstr.replace(/^\t(.*)/gm, function (m, p) {
    return "<pre><code>" + md.formatTag(p) + "</code></pre>";
  });
  mdstr = mdstr.replace(/<\/code\><\/pre\>\n<pre\><code\>/g, "\n");

  return mdstr.replace(/\\([`_~\*\+\-\.\^\\\<\>\(\)\[\]])/gm, "$1");
};

md.html = function (mdText) {
  mdText = mdText
    .replace(/\r\n/g, "\n")
    .replace(/^---+\s*\n([\s\S]*?)\n---+\s*\n/, md.formatYAML);
  mdText = mdText
    .replace(/\n~~~/g, "\n```")
    .replace(/\n``` *(.*?)\n([\s\S]*?)\n``` *\n/g, md.formatCode);

  var pos1 = 0,
    pos2 = 0,
    mdHTML = "";
  while ((pos1 = mdText.indexOf("<code>")) >= 0) {
    pos2 = mdText.indexOf("</code>", pos1);
    mdHTML += md.after(md.parser(md.before(mdText.substr(0, pos1))));
    mdHTML += mdText.substr(pos1, pos2 > 0 ? pos2 - pos1 + 7 : mdtext.length);
    mdText = mdText.substr(pos2 + 7);
  }

  return (
    '<div class="markdown">' +
    mdHTML +
    md.after(md.parser(md.before(mdText))) +
    "</div>"
  );
};

md.clipboard = (e) => {
  navigator.clipboard.writeText(e.parentNode.innerText.replace("copy\n", ""));
  e.innerText = "copied";
};

/*****************************************************************************
 * Multi-LLM Chat System
 *****************************************************************************/

const chat = (id) => window.document.getElementById(id);

// Helper functions to reduce DRY code
chat.getSendIconSVG = () => {
  return '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M.5 1.163A1 1 0 0 1 1.97.28l12.868 6.837a1 1 0 0 1 0 1.766L1.969 15.72A1 1 0 0 1 .5 14.836V10.33a1 1 0 0 1 .816-.983L8.5 8 1.316 6.653A1 1 0 0 1 .5 5.67V1.163Z" fill="currentColor"/></svg>';
};

chat.getStopIconSVG = () => {
  return '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="2" width="12" height="12" rx="1" fill="currentColor"/></svg>';
};

chat.formatTokenInfo = (tokens, cost, isEstimated = false) => {
  if (!tokens || cost === undefined) return "";
  const prefix = isEstimated ? "~" : "";
  return `<span class="token-info">📊 ${prefix}${tokens.total} tokens ($${cost.toFixed(4)})</span>`;
};

// Default provider templates (from cross-llm-mcp)
chat.providerTemplates = {
  openai: {
    name: "OpenAI",
    endpoint: "https://api.openai.com/v1/chat/completions",
    models: [
      "gpt-4o",
      "gpt-4o-mini",
      "gpt-4-turbo",
      "gpt-4",
      "gpt-3.5-turbo",
      "o1-preview",
      "o1-mini",
    ],
    authType: "bearer",
    bodyTemplate: {
      model: "",
      messages: [],
      temperature: 0.8,
      stream: true,
    },
  },
  anthropic: {
    name: "Anthropic Claude",
    endpoint: "https://api.anthropic.com/v1/messages",
    models: [
      "claude-3.5-sonnet-20241022",
      "claude-3-opus-20240229",
      "claude-3-sonnet-20240229",
      "claude-3-haiku-20240307",
    ],
    authType: "x-api-key",
    bodyTemplate: { model: "", messages: [], max_tokens: 4096 },
  },
  gemini: {
    name: "Google Gemini",
    endpoint:
      "https://generativelanguage.googleapis.com/v1beta/models/{model}:streamGenerateContent",
    models: [
      "gemini-2.5-flash",
      "gemini-2.0-flash-exp",
      "gemini-1.5-pro",
      "gemini-1.5-flash",
      "gemini-pro",
    ],
    authType: "query",
    bodyTemplate: { contents: [{ parts: [{ text: "" }] }] },
  },
  deepseek: {
    name: "DeepSeek",
    endpoint: "https://api.deepseek.com/v1/chat/completions",
    models: [
      "deepseek-r1",
      "deepseek-r1-distill-qwen-32b",
      "deepseek-r1-distill-qwen-14b",
      "deepseek-r1-distill-llama-70b",
      "deepseek-r1-distill-qwen-7b",
      "deepseek-r1-distill-llama-8b",
      "deepseek-r1-distill-qwen-1.5b",
      "deepseek-chat",
      "deepseek-coder",
    ],
    authType: "bearer",
    bodyTemplate: {
      model: "",
      messages: [],
      temperature: 0.8,
      stream: true,
    },
  },
  grok: {
    name: "xAI Grok",
    endpoint: "https://api.x.ai/v1/chat/completions",
    models: ["grok-3", "grok-2", "grok-beta"],
    authType: "bearer",
    bodyTemplate: {
      model: "",
      messages: [],
      temperature: 0.8,
      stream: true,
    },
  },
  kimi: {
    name: "Moonshot AI (Kimi)",
    endpoint: "https://api.moonshot.ai/v1/chat/completions",
    models: ["moonshot-v1-128k", "moonshot-v1-32k", "moonshot-v1-8k"],
    authType: "bearer",
    bodyTemplate: {
      model: "",
      messages: [],
      temperature: 0.8,
      stream: true,
    },
  },
  perplexity: {
    name: "Perplexity",
    endpoint: "https://api.perplexity.ai/chat/completions",
    models: ["sonar-pro", "sonar-medium-online", "sonar-small-online"],
    authType: "bearer",
    bodyTemplate: {
      model: "",
      messages: [],
      temperature: 0.8,
      stream: true,
    },
  },
  mistral: {
    name: "Mistral AI",
    endpoint: "https://api.mistral.ai/v1/chat/completions",
    models: [
      "mistral-large-latest",
      "mistral-medium-latest",
      "mistral-small-latest",
      "pixtral-large-latest",
    ],
    authType: "bearer",
    bodyTemplate: {
      model: "",
      messages: [],
      temperature: 0.8,
      stream: true,
    },
  },
};

chat.history = [];
chat.activeLLMs = [];
chat.providers = [];
chat.mcpServers = [];
chat.analytics = {
  totalTokens: 0,
  totalCost: 0,
  providerStats: {},
};
chat.systemPromptsCatalog = null;
chat.systemPromptLoadingRequests = {}; // Track ongoing requests

// Load providers from localStorage
chat.loadProviders = () => {
  const stored = localStorage.getItem("llm_providers");
  chat.providers = stored ? JSON.parse(stored) : [];
  const active = localStorage.getItem("active_llms");
  chat.activeLLMs = active ? JSON.parse(active) : [];
  const mcpStored = localStorage.getItem("mcp_servers");
  chat.mcpServers = mcpStored ? JSON.parse(mcpStored) : [];
  const analyticsStored = localStorage.getItem("analytics");
  if (analyticsStored) {
    chat.analytics = JSON.parse(analyticsStored);
  }
  chat.updateLLMSelector();
  chat.updateProvidersList();
  chat.updateMcpServersList();
  chat.updateMcpToolsPanel();
  chat.updateAnalytics();
};

// Save providers to localStorage
chat.saveProviders = () => {
  localStorage.setItem("llm_providers", JSON.stringify(chat.providers));
  localStorage.setItem("active_llms", JSON.stringify(chat.activeLLMs));
  localStorage.setItem("mcp_servers", JSON.stringify(chat.mcpServers));
  localStorage.setItem("analytics", JSON.stringify(chat.analytics));
};

// Estimate token count (rough approximation: ~4 characters per token)
chat.estimateTokens = (text) => {
  if (!text) return 0;
  // More accurate: count words and add punctuation/whitespace
  const words = text.trim().split(/\s+/).length;
  const chars = text.length;
  // Average: ~0.75 tokens per word, or ~4 chars per token
  return Math.ceil(Math.max(words * 0.75, chars / 4));
};

// Provider pricing data (per 1M tokens, as of 2024)
chat.pricingData = {
  openai: {
    "gpt-4o": { input: 2.5, output: 10 },
    "gpt-4o-mini": { input: 0.15, output: 0.6 },
    "gpt-4-turbo": { input: 10, output: 30 },
    "gpt-4": { input: 30, output: 60 },
    "gpt-3.5-turbo": { input: 0.5, output: 1.5 },
    "o1-preview": { input: 15, output: 60 },
    "o1-mini": { input: 3, output: 12 },
    default: { input: 2.5, output: 10 },
  },
  anthropic: {
    "claude-3.5-sonnet-20241022": { input: 3, output: 15 },
    "claude-3-opus-20240229": { input: 15, output: 75 },
    "claude-3-sonnet-20240229": { input: 3, output: 15 },
    "claude-3-haiku-20240307": { input: 0.25, output: 1.25 },
    default: { input: 3, output: 15 },
  },
  gemini: {
    "gemini-2.5-flash": { input: 0.075, output: 0.3 },
    "gemini-2.0-flash-exp": { input: 0.075, output: 0.3 },
    "gemini-1.5-pro": { input: 1.25, output: 5 },
    "gemini-1.5-flash": { input: 0.075, output: 0.3 },
    "gemini-pro": { input: 0.5, output: 1.5 },
    default: { input: 0.5, output: 1.5 },
  },
  deepseek: {
    "deepseek-r1": { input: 0.55, output: 2.19 },
    "deepseek-chat": { input: 0.14, output: 0.28 },
    "deepseek-coder": { input: 0.14, output: 0.28 },
    default: { input: 0.55, output: 2.19 },
  },
  grok: {
    "grok-3": { input: 1, output: 3 },
    "grok-2": { input: 0.5, output: 1.5 },
    "grok-beta": { input: 0.5, output: 1.5 },
    default: { input: 1, output: 3 },
  },
  kimi: {
    "moonshot-v1-128k": { input: 0.12, output: 0.12 },
    "moonshot-v1-32k": { input: 0.06, output: 0.06 },
    "moonshot-v1-8k": { input: 0.03, output: 0.03 },
    default: { input: 0.12, output: 0.12 },
  },
  perplexity: {
    "sonar-pro": { input: 0.001, output: 0.001 },
    "sonar-medium-online": { input: 0.0005, output: 0.0005 },
    "sonar-small-online": { input: 0.0002, output: 0.0002 },
    default: { input: 0.001, output: 0.001 },
  },
  mistral: {
    "mistral-large-latest": { input: 2.7, output: 8.1 },
    "mistral-medium-latest": { input: 2.7, output: 8.1 },
    "mistral-small-latest": { input: 0.2, output: 0.6 },
    "pixtral-large-latest": { input: 2.7, output: 8.1 },
    default: { input: 2.7, output: 8.1 },
  },
};

// Calculate cost for a provider/model
chat.calculateCost = (providerTemplate, model, inputTokens, outputTokens) => {
  const pricing = chat.pricingData[providerTemplate];
  if (!pricing) return 0;

  const modelPricing = pricing[model] || pricing.default;
  const inputCost = (inputTokens / 1000000) * modelPricing.input;
  const outputCost = (outputTokens / 1000000) * modelPricing.output;
  return inputCost + outputCost;
};

// Get provider API key
chat.getProviderAPIKey = (providerId) => {
  return localStorage.getItem(`api_key_${providerId}`) || "";
};

// Save provider API key
chat.saveProviderAPIKey = (providerId, apiKey) => {
  localStorage.setItem(`api_key_${providerId}`, apiKey);
};

// Get provider model
chat.getProviderModel = (providerId) => {
  return localStorage.getItem(`model_${providerId}`) || "";
};

// Save provider model
chat.saveProviderModel = (providerId, model) => {
  localStorage.setItem(`model_${providerId}`, model);
};

// Add provider
chat.addProvider = () => {
  const template = chat("providerTemplate").value;
  const name = chat("providerName").value.trim();
  const endpoint = chat("providerEndpoint").value.trim();
  const apiKey = chat("providerApiKey").value.trim();
  const model = chat("providerModel").value;

  if (!name || !endpoint || !apiKey || !model) {
    alert("Please fill in all fields");
    return;
  }

  const providerId = name.toLowerCase().replace(/\s+/g, "_");

  // Check if provider already exists
  if (chat.providers.find((p) => p.id === providerId)) {
    alert("Provider with this name already exists");
    return;
  }

  const provider = {
    id: providerId,
    name: name,
    endpoint: endpoint,
    template: template,
  };

  chat.providers.push(provider);
  chat.saveProviderAPIKey(providerId, apiKey);
  chat.saveProviderModel(providerId, model);
  chat.saveProviders();

  // Clear form
  const nameEl = chat("providerName");
  const endpointEl = chat("providerEndpoint");
  const apiKeyEl = chat("providerApiKey");
  const modelEl = chat("providerModel");
  const templateEl = chat("providerTemplate");
  if (nameEl) nameEl.value = "";
  if (endpointEl) endpointEl.value = "";
  if (apiKeyEl) apiKeyEl.value = "";
  if (modelEl) modelEl.value = "";
  if (templateEl) templateEl.value = "custom";

  chat.updateProvidersList();
  chat.updateLLMSelector();
  alert("Provider added successfully!");
};

// Delete provider
chat.deleteProvider = (providerId) => {
  if (confirm("Delete this provider?")) {
    chat.providers = chat.providers.filter((p) => p.id !== providerId);
    chat.activeLLMs = chat.activeLLMs.filter((id) => id !== providerId);
    localStorage.removeItem(`api_key_${providerId}`);
    localStorage.removeItem(`model_${providerId}`);
    chat.saveProviders();
    chat.updateProvidersList();
    chat.updateLLMSelector();
  }
};

// Edit provider
chat.editProvider = (providerId) => {
  const provider = chat.providers.find((p) => p.id === providerId);
  if (!provider) return;

  const newApiKey = prompt(
    "Enter new API key:",
    chat.getProviderAPIKey(providerId),
  );
  if (newApiKey !== null) {
    chat.saveProviderAPIKey(providerId, newApiKey);
  }

  const template =
    chat.providerTemplates[provider.template] || chat.providerTemplates.openai;
  const currentModel = chat.getProviderModel(providerId);
  const modelOptions = template.models
    .map(
      (m) =>
        `<option value="${m}" ${m === currentModel ? "selected" : ""}>${m}</option>`,
    )
    .join("");
  const newModel = prompt(
    `Select model:\n${template.models.map((m, i) => `${i + 1}. ${m}`).join("\n")}\n\nEnter number:`,
    template.models.indexOf(currentModel) + 1,
  );

  if (newModel !== null && !isNaN(newModel)) {
    const modelIndex = parseInt(newModel) - 1;
    if (modelIndex >= 0 && modelIndex < template.models.length) {
      chat.saveProviderModel(providerId, template.models[modelIndex]);
      chat.updateProvidersList();
      chat.updateLLMSelector();
    }
  }
};

// Update providers list in settings
chat.updateProvidersList = () => {
  const list = chat("providersList");
  if (chat.providers.length === 0) {
    list.innerHTML =
      '<p style="color:#666; font-style:italic;">No providers added yet. Add one above.</p>';
    return;
  }

  list.innerHTML = chat.providers
    .map((provider) => {
      const model = chat.getProviderModel(provider.id);
      const systemPromptPath = chat.getSystemPromptPathForProvider(provider.id);
      const systemPromptName = systemPromptPath
        ? systemPromptPath
            .split("/")
            .pop()
            .replace(/\.txt$/, "")
        : "None";
      return `
      <div class="provider-item">
        <div class="provider-item-info">
          <div class="provider-item-name">${provider.name}</div>
          <div class="provider-item-model">Model: ${model || "Not set"}</div>
          <div class="provider-item-system-prompt" style="font-size: 12px; color: #888; margin-top: 4px;">
            System Prompt: ${systemPromptName}
          </div>
        </div>
        <div class="provider-item-actions">
          <button class="btn-edit" onclick="chat.editProvider('${provider.id}')">Edit</button>
          <button class="btn-edit" onclick="chat.showSystemPromptSelector('${provider.id}')" style="background: #06b6d4;">System Prompt</button>
          ${systemPromptPath ? `<button class="btn-edit" onclick="chat.removeSystemPromptForProvider('${provider.id}', false)" style="background: #f59e0b;">Remove Prompt</button>` : ""}
          <button class="btn-delete" onclick="chat.deleteProvider('${provider.id}')">Delete</button>
        </div>
      </div>
    `;
    })
    .join("");
};

// Update LLM selector
chat.updateLLMSelector = () => {
  const selector = chat("llmSelector");
  if (chat.providers.length === 0) {
    selector.innerHTML =
      '<p style="color:#999; font-size:12px; margin:0;">No LLM providers configured. <a href="#" onclick="chat.showSettings(); return false;" style="color:#3b82f6;">Add one in Settings</a></p>';
    return;
  }

  selector.innerHTML =
    '<div style="margin-bottom:8px; font-weight:bold; color:#333;">Select LLM(s):</div>' +
    chat.providers
      .map((provider) => {
        const checked = chat.activeLLMs.includes(provider.id) ? "checked" : "";
        return `
        <label style="display:inline-block; margin:4px 8px 4px 0; padding:6px 12px; background:${checked ? "#dbeafe" : "#f8f9fa"}; border:1px solid ${checked ? "#3b82f6" : "#e0e0e0"}; border-radius:6px; cursor:pointer;">
          <input type="checkbox" value="${provider.id}" ${checked} onchange="chat.toggleLLM('${provider.id}')" style="margin-right:6px;">
          <span>${provider.name} (${chat.getProviderModel(provider.id) || "no model"})</span>
        </label>
      `;
      })
      .join("");
};

// Toggle LLM selection
chat.toggleLLM = (providerId) => {
  const index = chat.activeLLMs.indexOf(providerId);
  if (index > -1) {
    chat.activeLLMs.splice(index, 1);
  } else {
    chat.activeLLMs.push(providerId);
  }
  chat.saveProviders();
  chat.updateLLMSelector();
  chat.updateTempSystemPromptDisplay();
};

// Template change handler
chat.onTemplateChange = () => {
  const template = chat("providerTemplate").value;
  const modelSelect = chat("providerModel");

  if (template === "custom") {
    chat("providerName").value = "";
    chat("providerEndpoint").value = "";
    chat("providerModel").value = "";
    chat("providerModel").placeholder = "Enter model name manually";
    const modelList = chat("modelList");
    if (modelList) modelList.innerHTML = "";
    return;
  }

  const config = chat.providerTemplates[template];
  if (config) {
    chat("providerName").value = config.name;
    chat("providerEndpoint").value = config.endpoint;
    chat("providerModel").placeholder = "Select or type model name";
    const modelList = chat("modelList");
    if (modelList) {
      modelList.innerHTML = config.models
        .map((m) => `<option value="${m}">${m}</option>`)
        .join("");
    }
  }
};

// MCP Server Management
chat.addMcpServer = () => {
  const url = chat("mcpServerUrl").value.trim();
  const token = chat("mcpBearerToken").value.trim();
  const name = chat("mcpServerName").value.trim() || new URL(url).hostname;
  const authMethod = chat("mcpAuthMethod").value || "header";

  if (!url || !token) {
    alert("Please provide both MCP Server URL and Bearer Token");
    return;
  }

  // Validate URL
  try {
    new URL(url);
  } catch (e) {
    alert("Invalid URL format");
    return;
  }

  const serverId = `mcp_${Date.now()}`;
  const server = {
    id: serverId,
    name: name,
    url: url,
  };

  chat.mcpServers.push(server);
  chat.saveMcpServerToken(serverId, token);
  chat.saveMcpAuthMethod(serverId, authMethod);
  chat.saveProviders();

  // Clear form
  chat("mcpServerUrl").value = "";
  chat("mcpBearerToken").value = "";
  chat("mcpServerName").value = "";
  chat("mcpAuthMethod").value = "header";

  chat.updateMcpServersList();
  alert("MCP Server added successfully!");
};

chat.deleteMcpServer = (serverId) => {
  if (confirm("Delete this MCP server?")) {
    chat.mcpServers = chat.mcpServers.filter((s) => s.id !== serverId);
    localStorage.removeItem(`mcp_token_${serverId}`);
    localStorage.removeItem(`mcp_auth_method_${serverId}`);
    localStorage.removeItem(`mcp_tools_${serverId}`);
    chat.saveProviders();
    chat.updateMcpServersList();
  }
};

chat.getMcpServerToken = (serverId) => {
  return localStorage.getItem(`mcp_token_${serverId}`) || "";
};

chat.saveMcpServerToken = (serverId, token) => {
  localStorage.setItem(`mcp_token_${serverId}`, token);
};

chat.getMcpAuthMethod = (serverId) => {
  return localStorage.getItem(`mcp_auth_method_${serverId}`) || "header";
};

chat.saveMcpAuthMethod = (serverId, method) => {
  localStorage.setItem(`mcp_auth_method_${serverId}`, method);
};

chat.editMcpServer = (serverId) => {
  const server = chat.mcpServers.find((s) => s.id === serverId);
  if (!server) return;

  const newToken = prompt(
    "Enter new bearer token:",
    chat.getMcpServerToken(serverId),
  );
  if (newToken !== null && newToken !== "") {
    chat.saveMcpServerToken(serverId, newToken);
  }

  const authMethod = chat.getMcpAuthMethod(serverId);
  const newAuthMethod = confirm(
    `Current auth method: ${authMethod === "query" ? "Query Parameter" : "Authorization Header"}\n\nClick OK to use Query Parameter, Cancel to use Authorization Header`,
  )
    ? "query"
    : "header";
  chat.saveMcpAuthMethod(serverId, newAuthMethod);
  chat.updateMcpServersList();
};

chat.updateMcpServersList = () => {
  const list = chat("mcpServersList");
  if (!list) return;

  if (chat.mcpServers.length === 0) {
    list.innerHTML =
      '<p style="color:#666; font-style:italic;">No MCP servers added yet.</p>';
    return;
  }

  list.innerHTML = chat.mcpServers
    .map((server) => {
      const authMethod = chat.getMcpAuthMethod(server.id);
      return `
      <div class="provider-item">
        <div class="provider-item-info">
          <div class="provider-item-name">${server.name}</div>
          <div class="provider-item-model">${server.url}</div>
          <div style="font-size: 12px; color: #999; margin-top: 4px;">Auth: ${authMethod === "query" ? "Query Parameter" : "Authorization Header"}</div>
        </div>
        <div class="provider-item-actions">
          <button class="btn-edit" onclick="chat.editMcpServer('${server.id}')">Edit</button>
          <button class="btn-edit" onclick="chat.loadMcpTools('${server.id}')">Load Tools</button>
          <button class="btn-delete" onclick="chat.deleteMcpServer('${server.id}')">Delete</button>
        </div>
      </div>
    `;
    })
    .join("");

  // Update MCP tools panel
  chat.updateMcpToolsPanel();
};

chat.updateMcpToolsPanel = () => {
  const panel = chat("mcpToolsPanel");
  const toolsList = chat("mcpToolsList");
  if (!panel || !toolsList) return;

  let hasTools = false;
  let html = "";

  for (const server of chat.mcpServers) {
    const stored = localStorage.getItem(`mcp_tools_${server.id}`);
    if (stored) {
      const { tools, resources } = JSON.parse(stored);
      if (tools.length > 0 || resources.length > 0) {
        hasTools = true;
        html += `<div style="margin-bottom: 12px;"><strong style="font-size: 13px; color: #666;">${server.name}:</strong></div>`;

        if (tools.length > 0) {
          tools.forEach((tool) => {
            html += `
            <div style="background: #fff; padding: 8px; margin: 4px 0; border-radius: 4px; border-left: 3px solid #3b82f6; font-size: 12px;">
              <div style="font-weight: 600; margin-bottom: 2px;">${tool.name}</div>
              <div style="color: #666; font-size: 11px; margin-bottom: 4px;">${(tool.description || "").substring(0, 50)}${(tool.description || "").length > 50 ? "..." : ""}</div>
              <button onclick="chat.callMcpTool('${server.id}', '${tool.name}')" style="background: #3b82f6; color: #fff; border: none; padding: 4px 8px; border-radius: 3px; cursor: pointer; font-size: 11px;">Use</button>
            </div>
          `;
          });
        }
      }
    }
  }

  if (hasTools) {
    panel.style.display = "block";
    toolsList.innerHTML = html;
  } else {
    panel.style.display = "none";
  }
};

// MCP Client Functions
chat.mcpRequest = async (serverId, method, params = {}) => {
  const server = chat.mcpServers.find((s) => s.id === serverId);
  if (!server) {
    throw new Error("MCP server not found");
  }

  const token = chat.getMcpServerToken(serverId);
  if (!token) {
    throw new Error("Bearer token not found for MCP server");
  }

  const authMethod = chat.getMcpAuthMethod(serverId);

  // Build endpoint URL - add token as query param if needed
  let endpoint = server.url;
  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json", // Some MCP servers may prefer text/event-stream, but JSON works for most
  };

  if (authMethod === "query") {
    // Add token as query parameter
    const urlObj = new URL(endpoint);
    urlObj.searchParams.set("token", token);
    endpoint = urlObj.toString();
  } else {
    // Use Authorization header (default/recommended)
    headers["Authorization"] = `Bearer ${token}`;
  }

  const requestBody = {
    jsonrpc: "2.0",
    id: Date.now(),
    method: method,
    params: params,
  };

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(requestBody),
      mode: "cors",
    });

    // Parse JSON response regardless of status code to get error details
    let data;
    try {
      data = await response.json();
    } catch (e) {
      // If response isn't JSON, handle as text response
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      throw new Error("Invalid JSON response from server");
    }

    // Check for JSON-RPC error response
    if (data.error) {
      // Handle specific error codes
      const errorCode = data.error.code;
      const errorMsg =
        data.error.message || `Error code ${errorCode || "unknown"}`;

      // Handle session-related errors
      if (
        errorMsg.includes("sessionId") ||
        errorMsg.includes("session") ||
        errorMsg.includes("No sessionId") ||
        (errorCode === "upstream_error" && errorMsg.includes("sessionId"))
      ) {
        throw new Error(
          "Session Required: " +
            errorMsg +
            "\n\n" +
            "This MCP server requires a session to be established before making requests. " +
            "You may need to:\n" +
            "1. Check the MCP server documentation for session initialization\n" +
            "2. Contact the server provider for session setup instructions\n" +
            "3. Some MCP servers may require additional headers or initialization requests",
        );
      }

      // Handle upstream errors
      if (errorCode === "upstream_error") {
        throw new Error("Server Error: " + errorMsg);
      }

      throw new Error(errorMsg);
    }

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("Unauthorized - Invalid bearer token");
      }
      if (response.status === 404) {
        throw new Error(
          `Endpoint not found (404). Make sure the MCP server URL is correct: ${endpoint}`,
        );
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return data.result;
  } catch (error) {
    // Don't mask the actual error if it's already a meaningful message
    if (
      error.message &&
      !error.message.includes("CORS") &&
      !error.message.includes("fetch")
    ) {
      throw error;
    }

    // Check for CORS-related errors
    if (
      error.message &&
      (error.message.includes("CORS") ||
        error.message.includes("fetch") ||
        error.message.includes("Access-Control") ||
        error.message.includes("Failed to fetch") ||
        error.name === "TypeError")
    ) {
      throw new Error(
        "CORS Error: The MCP server at " +
          endpoint +
          " does not allow browser requests. " +
          "The server needs to send CORS headers (Access-Control-Allow-Origin, etc.). " +
          "This is a browser security restriction that cannot be bypassed from client-side code. " +
          "Please configure the MCP server to enable CORS, or use a proxy server.",
      );
    }

    throw error;
  }
};

chat.loadMcpTools = async (serverId) => {
  try {
    const tools = await chat.mcpRequest(serverId, "tools/list");
    const resources = await chat
      .mcpRequest(serverId, "resources/list")
      .catch(() => []);

    // Store tools for this server
    localStorage.setItem(
      `mcp_tools_${serverId}`,
      JSON.stringify({
        tools: tools.tools || [],
        resources: resources.resources || [],
      }),
    );

    // Update UI
    chat.updateMcpToolsPanel();
    alert(
      `Loaded ${(tools.tools || []).length} tools and ${(resources.resources || []).length} resources`,
    );
  } catch (error) {
    alert(`Error loading MCP tools: ${error.message}`);
  }
};

chat.showMcpTools = (serverId) => {
  const stored = localStorage.getItem(`mcp_tools_${serverId}`);
  if (!stored) {
    alert("No tools loaded for this server. Click 'Load Tools' first.");
    return;
  }

  const { tools, resources } = JSON.parse(stored);
  const server = chat.mcpServers.find((s) => s.id === serverId);

  let html = `<h4 style="margin-top: 20px; color: #333;">MCP Tools: ${server.name}</h4>`;

  if (tools.length > 0) {
    html += '<div style="margin: 10px 0;"><strong>Tools:</strong></div>';
    tools.forEach((tool) => {
      html += `
        <div style="background: #f8f9fa; padding: 10px; margin: 8px 0; border-radius: 6px; border-left: 4px solid #3b82f6;">
          <div style="font-weight: bold; margin-bottom: 4px;">${tool.name}</div>
          <div style="font-size: 13px; color: #666; margin-bottom: 8px;">${tool.description || "No description"}</div>
          <button onclick="chat.callMcpTool('${serverId}', '${tool.name}')" style="background: #3b82f6; color: #fff; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 13px;">Use Tool</button>
        </div>
      `;
    });
  }

  if (resources.length > 0) {
    html += '<div style="margin: 10px 0;"><strong>Resources:</strong></div>';
    resources.forEach((resource) => {
      html += `
        <div style="background: #f8f9fa; padding: 10px; margin: 8px 0; border-radius: 6px; border-left: 4px solid #06b6d4;">
          <div style="font-weight: bold; margin-bottom: 4px;">${resource.name}</div>
          <div style="font-size: 13px; color: #666; margin-bottom: 8px;">${resource.description || "No description"}</div>
          <button onclick="chat.getMcpResource('${serverId}', '${resource.uri}')" style="background: #06b6d4; color: #fff; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 13px;">Get Resource</button>
        </div>
      `;
    });
  }

  // Add to main chat area
  chat("main").innerHTML += html;
  chat("left").scrollTop = chat("left").scrollHeight;
};

chat.callMcpTool = async (serverId, toolName) => {
  const stored = localStorage.getItem(`mcp_tools_${serverId}`);
  if (!stored) return;

  const { tools } = JSON.parse(stored);
  const tool = tools.find((t) => t.name === toolName);
  if (!tool) return;

  // Get arguments from user
  const args = {};
  if (tool.inputSchema && tool.inputSchema.properties) {
    for (const [key, prop] of Object.entries(tool.inputSchema.properties)) {
      const value = prompt(
        `${prop.description || key} (${prop.type || "string"}):`,
        "",
      );
      if (value === null) return; // User cancelled
      if (value !== "") {
        // Convert to appropriate type
        if (prop.type === "number" || prop.type === "integer") {
          args[key] = parseFloat(value);
        } else if (prop.type === "boolean") {
          args[key] = value.toLowerCase() === "true";
        } else {
          args[key] = value;
        }
      }
    }
  }

  try {
    chat("main").innerHTML +=
      `<div class="response-container"><span class="response-badge">MCP Tool: ${toolName}</span><div>Calling tool...</div></div>`;
    chat("left").scrollTop = chat("left").scrollHeight;

    const result = await chat.mcpRequest(serverId, "tools/call", {
      name: toolName,
      arguments: args,
    });

    const resultHtml = `<div class="response-container"><span class="response-badge">MCP Tool: ${toolName}</span>${md.html(JSON.stringify(result, null, 2))}</div>`;
    chat("main").innerHTML = chat("main").innerHTML.replace(
      `<div class="response-container"><span class="response-badge">MCP Tool: ${toolName}</span><div>Calling tool...</div></div>`,
      resultHtml,
    );
    chat("left").scrollTop = chat("left").scrollHeight;
  } catch (error) {
    chat("main").innerHTML = chat("main").innerHTML.replace(
      `<div class="response-container"><span class="response-badge">MCP Tool: ${toolName}</span><div>Calling tool...</div></div>`,
      `<div class="response-container"><span class="response-badge" style="background:#dc3545;">MCP Tool: ${toolName}</span><div style="color:#dc3545;">Error: ${error.message}</div></div>`,
    );
  }
};

chat.getMcpResource = async (serverId, uri) => {
  try {
    chat("main").innerHTML +=
      `<div class="response-container"><span class="response-badge">MCP Resource</span><div>Loading resource...</div></div>`;
    chat("left").scrollTop = chat("left").scrollHeight;

    const result = await chat.mcpRequest(serverId, "resources/read", {
      uri: uri,
    });

    const resultHtml = `<div class="response-container"><span class="response-badge">MCP Resource</span>${md.html(JSON.stringify(result, null, 2))}</div>`;
    chat("main").innerHTML = chat("main").innerHTML.replace(
      `<div class="response-container"><span class="response-badge">MCP Resource</span><div>Loading resource...</div></div>`,
      resultHtml,
    );
    chat("left").scrollTop = chat("left").scrollHeight;
  } catch (error) {
    chat("main").innerHTML = chat("main").innerHTML.replace(
      `<div class="response-container"><span class="response-badge">MCP Resource</span><div>Loading resource...</div></div>`,
      `<div class="response-container"><span class="response-badge" style="background:#dc3545;">MCP Resource</span><div style="color:#dc3545;">Error: ${error.message}</div></div>`,
    );
  }
};

// Show analytics
chat.showAnalytics = () => {
  chat("analyticsModal").style.display = "block";
  chat.updateAnalytics();
  // Prevent body scroll on mobile when modal is open
  if (window.innerWidth <= 880) {
    document.body.classList.add("modal-open");
  }
};

// Hide analytics
chat.hideAnalytics = () => {
  chat("analyticsModal").style.display = "none";
  // Re-enable body scroll
  document.body.classList.remove("modal-open");
};

// Update analytics display
chat.updateAnalytics = () => {
  const statsDiv = chat("analyticsStats");
  const summaryDiv = chat("analyticsSummary");

  const totalTokens = chat.analytics.totalTokens || 0;
  const totalCost = chat.analytics.totalCost || 0;
  const providerStats = chat.analytics.providerStats || {};

  // Update header summary
  if (summaryDiv) {
    if (totalTokens > 0 || totalCost > 0) {
      summaryDiv.innerHTML = `📊 ${totalTokens.toLocaleString()} tokens • 💰 $${totalCost.toFixed(4)}`;
    } else {
      summaryDiv.innerHTML = "";
    }
  }

  if (!statsDiv) return;

  let html = `
          <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="margin-top: 0; color: #333;">Overall Statistics</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-top: 15px;">
              <div style="background: #fff; padding: 15px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <div style="font-size: 12px; color: #666; margin-bottom: 5px;">Total Tokens</div>
                <div style="font-size: 24px; font-weight: bold; color: #3b82f6;">${totalTokens.toLocaleString()}</div>
              </div>
              <div style="background: #fff; padding: 15px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <div style="font-size: 12px; color: #666; margin-bottom: 5px;">Total Cost</div>
                <div style="font-size: 24px; font-weight: bold; color: #10b981;">$${totalCost.toFixed(4)}</div>
              </div>
              <div style="background: #fff; padding: 15px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <div style="font-size: 12px; color: #666; margin-bottom: 5px;">Conversations</div>
                <div style="font-size: 24px; font-weight: bold; color: #8b5cf6;">${chat.history.length}</div>
              </div>
            </div>
          </div>
        `;

  if (Object.keys(providerStats).length > 0) {
    html += `
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
              <h3 style="margin-top: 0; color: #333;">Provider Breakdown</h3>
              <div style="margin-top: 15px;">
          `;

    Object.keys(providerStats).forEach((providerId) => {
      const provider = chat.providers.find((p) => p.id === providerId);
      const stats = providerStats[providerId];
      const providerName = provider ? provider.name : providerId;
      const avgCost = stats.requests > 0 ? stats.cost / stats.requests : 0;
      const avgTokens = stats.requests > 0 ? stats.tokens / stats.requests : 0;

      html += `
              <div style="background: #fff; padding: 15px; margin-bottom: 12px; border-radius: 8px; border-left: 4px solid #3b82f6; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <div style="font-weight: bold; font-size: 16px; color: #333; margin-bottom: 10px;">${providerName}</div>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 10px; font-size: 14px;">
                  <div>
                    <div style="color: #666; font-size: 12px;">Total Tokens</div>
                    <div style="font-weight: 600; color: #3b82f6;">${stats.tokens.toLocaleString()}</div>
                  </div>
                  <div>
                    <div style="color: #666; font-size: 12px;">Total Cost</div>
                    <div style="font-weight: 600; color: #10b981;">$${stats.cost.toFixed(4)}</div>
                  </div>
                  <div>
                    <div style="color: #666; font-size: 12px;">Requests</div>
                    <div style="font-weight: 600; color: #8b5cf6;">${stats.requests}</div>
                  </div>
                  <div>
                    <div style="color: #666; font-size: 12px;">Avg Cost/Request</div>
                    <div style="font-weight: 600; color: #f59e0b;">$${avgCost.toFixed(4)}</div>
                  </div>
                  <div>
                    <div style="color: #666; font-size: 12px;">Avg Tokens/Request</div>
                    <div style="font-weight: 600; color: #06b6d4;">${Math.round(avgTokens)}</div>
                  </div>
                </div>
              </div>
            `;
    });

    html += `
              </div>
            </div>
          `;
  } else {
    html += `
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; color: #666;">
              <p>No analytics data yet. Start chatting to see statistics!</p>
            </div>
          `;
  }

  // Add conversation breakdown
  if (chat.history.length > 0) {
    html += `
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-top: 20px;">
              <h3 style="margin-top: 0; color: #333;">Recent Conversations</h3>
              <div style="margin-top: 15px; max-height: 300px; overflow-y: auto;">
          `;

    // Show last 10 conversations
    const recentHistory = chat.history.slice(-10).reverse();
    recentHistory.forEach((entry, idx) => {
      const convCost = entry.totalCost || 0;
      const convTokens = entry.totalTokens || 0;
      const promptPreview =
        entry.prompt.length > 50
          ? entry.prompt.substring(0, 50) + "..."
          : entry.prompt;

      html += `
              <div style="background: #fff; padding: 12px; margin-bottom: 8px; border-radius: 6px; border-left: 3px solid #06b6d4; font-size: 13px;">
                <div style="font-weight: 600; color: #333; margin-bottom: 5px;">${promptPreview}</div>
                <div style="display: flex; gap: 15px; color: #666; font-size: 12px;">
                  <span>📊 ${convTokens.toLocaleString()} tokens</span>
                  <span>💰 $${convCost.toFixed(4)}</span>
                  <span>🤖 ${entry.providers ? entry.providers.length : 0} providers</span>
                </div>
              </div>
            `;
    });

    html += `
              </div>
            </div>
          `;
  }

  statsDiv.innerHTML = html;
};

// Show settings
chat.showSettings = () => {
  chat("settingsModal").style.display = "block";
  chat.updateProvidersList();
  // Prevent body scroll on mobile when modal is open
  if (window.innerWidth <= 880) {
    document.body.classList.add("modal-open");
  }
};

// Hide settings
chat.hideSettings = () => {
  chat("settingsModal").style.display = "none";
  // Re-enable body scroll
  document.body.classList.remove("modal-open");
};

// Close modal on outside click
window.onclick = (event) => {
  if (event.target.id === "settingsModal") {
    chat.hideSettings();
  }
  if (event.target.id === "analyticsModal") {
    chat.hideAnalytics();
  }
  if (event.target.id === "systemPromptModal") {
    chat.hideSystemPromptSelector();
  }
};

// Handle window resize to update modal state
window.addEventListener("resize", () => {
  if (window.innerWidth > 880) {
    document.body.classList.remove("modal-open");
  } else if (
    chat("settingsModal").style.display === "block" ||
    chat("analyticsModal").style.display === "block"
  ) {
    document.body.classList.add("modal-open");
  }
});

// System Prompts Management
// GitHub repository base URL for system prompts
chat.SYSTEM_PROMPTS_REPO =
  "https://raw.githubusercontent.com/JamesANZ/system-prompts-mcp-server/main/prompts";
chat.CATALOG_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
chat.PROMPT_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// Build prompt catalog structure (comprehensive list of available prompts)
chat.buildPromptCatalog = () => {
  return [
    {
      service: "Cursor Prompts",
      prompts: [
        {
          name: "Agent Prompt 2.0",
          path: "Cursor Prompts/Agent Prompt 2.0.txt",
        },
        {
          name: "Agent Prompt v1.2",
          path: "Cursor Prompts/Agent Prompt v1.2.txt",
        },
        {
          name: "Agent Prompt v1.0",
          path: "Cursor Prompts/Agent Prompt v1.0.txt",
        },
        {
          name: "Agent Prompt 2025-09-03",
          path: "Cursor Prompts/Agent Prompt 2025-09-03.txt",
        },
        {
          name: "Agent CLI Prompt 2025-08-07",
          path: "Cursor Prompts/Agent CLI Prompt 2025-08-07.txt",
        },
        { name: "Chat Prompt", path: "Cursor Prompts/Chat Prompt.txt" },
      ],
    },
    {
      service: "Devin AI",
      prompts: [
        { name: "Prompt", path: "Devin AI/Prompt.txt" },
        { name: "DeepWiki Prompt", path: "Devin AI/DeepWiki Prompt.txt" },
      ],
    },
    {
      service: "Claude Code",
      prompts: [
        {
          name: "System Prompt",
          path: "Claude Code/claude-code-system-prompt.txt",
        },
      ],
    },
    {
      service: "Anthropic",
      prompts: [
        { name: "Claude Code 2.0", path: "Anthropic/Claude Code 2.0.txt" },
        { name: "Sonnet 4.5 Prompt", path: "Anthropic/Sonnet 4.5 Prompt.txt" },
      ],
    },
    {
      service: "VSCode Agent",
      prompts: [
        { name: "Prompt", path: "VSCode Agent/Prompt.txt" },
        { name: "GPT-5", path: "VSCode Agent/gpt-5.txt" },
        { name: "GPT-5 Mini", path: "VSCode Agent/gpt-5-mini.txt" },
        { name: "GPT-4o", path: "VSCode Agent/gpt-4o.txt" },
        { name: "GPT-4.1", path: "VSCode Agent/gpt-4.1.txt" },
        { name: "Claude Sonnet 4", path: "VSCode Agent/claude-sonnet-4.txt" },
        { name: "Gemini 2.5 Pro", path: "VSCode Agent/gemini-2.5-pro.txt" },
        { name: "Chat Titles", path: "VSCode Agent/chat-titles.txt" },
        {
          name: "NES Tab Completion",
          path: "VSCode Agent/nes-tab-completion.txt",
        },
      ],
    },
    {
      service: "Windsurf",
      prompts: [
        { name: "Prompt Wave 11", path: "Windsurf/Prompt Wave 11.txt" },
      ],
    },
    {
      service: "Warp.dev",
      prompts: [{ name: "Prompt", path: "Warp.dev/Prompt.txt" }],
    },
    {
      service: "Xcode",
      prompts: [
        { name: "System", path: "Xcode/System.txt" },
        { name: "Document Action", path: "Xcode/DocumentAction.txt" },
        { name: "Explain Action", path: "Xcode/ExplainAction.txt" },
        { name: "Message Action", path: "Xcode/MessageAction.txt" },
        { name: "Playground Action", path: "Xcode/PlaygroundAction.txt" },
        { name: "Preview Action", path: "Xcode/PreviewAction.txt" },
      ],
    },
    {
      service: "Replit",
      prompts: [{ name: "Prompt", path: "Replit/Prompt.txt" }],
    },
    {
      service: "Perplexity",
      prompts: [{ name: "Prompt", path: "Perplexity/Prompt.txt" }],
    },
    {
      service: "Lovable",
      prompts: [{ name: "Agent Prompt", path: "Lovable/Agent Prompt.txt" }],
    },
    {
      service: "Same.dev",
      prompts: [{ name: "Prompt", path: "Same.dev/Prompt.txt" }],
    },
    {
      service: "Trae",
      prompts: [
        { name: "Builder Prompt", path: "Trae/Builder Prompt.txt" },
        { name: "Chat Prompt", path: "Trae/Chat Prompt.txt" },
      ],
    },
    {
      service: "Traycer AI",
      prompts: [
        {
          name: "Phase Mode Prompts",
          path: "Traycer AI/phase_mode_prompts.txt",
        },
      ],
    },
    {
      service: "v0 Prompts",
      prompts: [{ name: "Prompt", path: "v0 Prompts and Tools/Prompt.txt" }],
    },
    {
      service: "Augment Code",
      prompts: [
        {
          name: "Claude 4 Sonnet Agent Prompts",
          path: "Augment Code/claude-4-sonnet-agent-prompts.txt",
        },
        {
          name: "GPT-5 Agent Prompts",
          path: "Augment Code/gpt-5-agent-prompts.txt",
        },
      ],
    },
    {
      service: "CodeBuddy Prompts",
      prompts: [
        { name: "Chat Prompt", path: "CodeBuddy Prompts/Chat Prompt.txt" },
        { name: "Craft Prompt", path: "CodeBuddy Prompts/Craft Prompt.txt" },
      ],
    },
    {
      service: "Cluely",
      prompts: [
        { name: "Default Prompt", path: "Cluely/Default Prompt.txt" },
        { name: "Enterprise Prompt", path: "Cluely/Enterprise Prompt.txt" },
      ],
    },
    {
      service: "Comet Assistant",
      prompts: [
        { name: "System Prompt", path: "Comet Assistant/System Prompt.txt" },
      ],
    },
    {
      service: "Emergent",
      prompts: [{ name: "Prompt", path: "Emergent/Prompt.txt" }],
    },
    {
      service: "Gemini",
      prompts: [
        {
          name: "AI Studio Vibe-Coder",
          path: "Gemini/AI Studio Vibe-Coder.txt",
        },
      ],
    },
    {
      service: "Google Gemini",
      prompts: [
        {
          name: "AI Studio vibe-coder",
          path: "Google/Gemini/AI Studio vibe-coder.txt",
        },
      ],
    },
    {
      service: "Google Antigravity",
      prompts: [
        { name: "Fast Prompt", path: "Google/Antigravity/Fast Prompt.txt" },
        { name: "Planning Mode", path: "Google/Antigravity/planning-mode.txt" },
      ],
    },
    {
      service: "Junie",
      prompts: [{ name: "Prompt", path: "Junie/Prompt.txt" }],
    },
    {
      service: "Kiro",
      prompts: [
        {
          name: "Mode Classifier Prompt",
          path: "Kiro/Mode_Clasifier_Prompt.txt",
        },
        { name: "Spec Prompt", path: "Kiro/Spec_Prompt.txt" },
        { name: "Vibe Prompt", path: "Kiro/Vibe_Prompt.txt" },
      ],
    },
    {
      service: "Leap.new",
      prompts: [{ name: "Prompts", path: "Leap.new/Prompts.txt" }],
    },
    {
      service: "Manus Agent",
      prompts: [
        { name: "Prompt", path: "Manus Agent Tools & Prompt/Prompt.txt" },
      ],
    },
    {
      service: "NotionAi",
      prompts: [{ name: "Prompt", path: "NotionAi/Prompt.txt" }],
    },
    {
      service: "Orchids.app",
      prompts: [
        { name: "System Prompt", path: "Orchids.app/System Prompt.txt" },
        {
          name: "Decision-making prompt",
          path: "Orchids.app/Decision-making prompt.txt",
        },
      ],
    },
    {
      service: "Poke",
      prompts: [
        { name: "Poke agent", path: "Poke/Poke agent.txt" },
        { name: "Poke p1", path: "Poke/Poke_p1.txt" },
        { name: "Poke p2", path: "Poke/Poke_p2.txt" },
        { name: "Poke p3", path: "Poke/Poke_p3.txt" },
        { name: "Poke p4", path: "Poke/Poke_p4.txt" },
        { name: "Poke p5", path: "Poke/Poke_p5.txt" },
        { name: "Poke p6", path: "Poke/Poke_p6.txt" },
      ],
    },
    {
      service: "Qoder",
      prompts: [
        { name: "prompt", path: "Qoder/prompt.txt" },
        { name: "Quest Action", path: "Qoder/Quest Action.txt" },
        { name: "Quest Design", path: "Qoder/Quest Design.txt" },
      ],
    },
    {
      service: "Open Source - Bolt",
      prompts: [
        { name: "Prompt", path: "Open Source prompts/Bolt/Prompt.txt" },
      ],
    },
    {
      service: "Open Source - Cline",
      prompts: [
        { name: "Prompt", path: "Open Source prompts/Cline/Prompt.txt" },
      ],
    },
    {
      service: "Open Source - Codex CLI",
      prompts: [
        { name: "Prompt", path: "Open Source prompts/Codex CLI/Prompt.txt" },
        {
          name: "System Prompt 20250820",
          path: "Open Source prompts/Codex CLI/openai-codex-cli-system-prompt-20250820.txt",
        },
      ],
    },
    {
      service: "Open Source - Gemini CLI",
      prompts: [
        {
          name: "System Prompt",
          path: "Open Source prompts/Gemini CLI/google-gemini-cli-system-prompt.txt",
        },
      ],
    },
    {
      service: "Open Source - Lumo",
      prompts: [
        { name: "Prompt", path: "Open Source prompts/Lumo/Prompt.txt" },
      ],
    },
    {
      service: "Open Source - RooCode",
      prompts: [
        { name: "Prompt", path: "Open Source prompts/RooCode/Prompt.txt" },
      ],
    },
    {
      service: "dia",
      prompts: [{ name: "Prompt", path: "dia/Prompt.txt" }],
    },
    {
      service: "Z.ai Code",
      prompts: [{ name: "prompt", path: "Z.ai Code/prompt.txt" }],
    },
  ];
};

// Fetch prompt catalog (returns cached or builds new)
chat.getPromptCatalog = () => {
  if (chat.systemPromptsCatalog) {
    return Promise.resolve(chat.systemPromptsCatalog);
  }

  // Check cache
  const cached = localStorage.getItem("system_prompts_catalog");
  if (cached) {
    try {
      const catalogData = JSON.parse(cached);
      const cacheTime = catalogData.timestamp || 0;
      const now = Date.now();
      if (now - cacheTime < chat.CATALOG_CACHE_DURATION) {
        chat.systemPromptsCatalog = catalogData.catalog;
        return Promise.resolve(catalogData.catalog);
      }
    } catch (e) {
      // Invalid cache, continue to build new
    }
  }

  // Build new catalog
  const catalog = chat.buildPromptCatalog();
  chat.systemPromptsCatalog = catalog;

  // Cache it
  localStorage.setItem(
    "system_prompts_catalog",
    JSON.stringify({
      catalog: catalog,
      timestamp: Date.now(),
    }),
  );

  return Promise.resolve(catalog);
};

// Load system prompt content from GitHub
chat.loadSystemPrompt = async (promptPath) => {
  // Check cache first
  const cacheKey = `prompt_content_cache_${promptPath.replace(/\//g, "_")}`;
  const cached = localStorage.getItem(cacheKey);
  if (cached) {
    try {
      const cacheData = JSON.parse(cached);
      const cacheTime = cacheData.timestamp || 0;
      const now = Date.now();
      if (now - cacheTime < chat.PROMPT_CACHE_DURATION) {
        return cacheData.content;
      }
    } catch (e) {
      // Invalid cache, continue to fetch
    }
  }

  // Check if request is already in progress
  if (chat.systemPromptLoadingRequests[promptPath]) {
    return chat.systemPromptLoadingRequests[promptPath];
  }

  // Fetch from GitHub
  const url = `${chat.SYSTEM_PROMPTS_REPO}/${promptPath}`;
  const requestPromise = fetch(url)
    .then((response) => {
      if (!response.ok) {
        throw new Error(
          `Failed to fetch prompt: ${response.status} ${response.statusText}`,
        );
      }
      return response.text();
    })
    .then((content) => {
      // Cache the content
      localStorage.setItem(
        cacheKey,
        JSON.stringify({
          content: content,
          timestamp: Date.now(),
        }),
      );
      delete chat.systemPromptLoadingRequests[promptPath];
      return content;
    })
    .catch((error) => {
      delete chat.systemPromptLoadingRequests[promptPath];
      throw error;
    });

  chat.systemPromptLoadingRequests[promptPath] = requestPromise;
  return requestPromise;
};

// Get system prompt for a provider (checks temporary first, then default)
chat.getSystemPromptForProvider = async (providerId) => {
  // Check for temporary prompt first
  const tempPrompt = sessionStorage.getItem(`temp_system_prompt_${providerId}`);
  if (tempPrompt) {
    return tempPrompt;
  }

  // Check for default prompt path
  const promptPath = localStorage.getItem(`system_prompt_${providerId}`);
  if (!promptPath) {
    return null;
  }

  // Load the prompt content
  try {
    return await chat.loadSystemPrompt(promptPath);
  } catch (error) {
    console.error(`Failed to load system prompt for ${providerId}:`, error);
    return null;
  }
};

// Set system prompt for a provider
chat.setSystemPromptForProvider = (
  providerId,
  promptPath,
  isTemporary = false,
) => {
  if (isTemporary) {
    // For temporary, we need to load and store the content
    chat
      .loadSystemPrompt(promptPath)
      .then((content) => {
        sessionStorage.setItem(`temp_system_prompt_${providerId}`, content);
        chat.updateTempSystemPromptDisplay();
      })
      .catch((error) => {
        alert(`Failed to load system prompt: ${error.message}`);
      });
  } else {
    localStorage.setItem(`system_prompt_${providerId}`, promptPath);
    chat.updateProvidersList();
  }
};

// Remove system prompt for a provider
chat.removeSystemPromptForProvider = (providerId, isTemporary = false) => {
  if (isTemporary) {
    sessionStorage.removeItem(`temp_system_prompt_${providerId}`);
    chat.updateTempSystemPromptDisplay();
  } else {
    localStorage.removeItem(`system_prompt_${providerId}`);
    chat.updateProvidersList();
  }
};

// Get system prompt path for a provider (for display)
chat.getSystemPromptPathForProvider = (providerId) => {
  return localStorage.getItem(`system_prompt_${providerId}`) || null;
};

// Show system prompt selector modal
chat.showSystemPromptSelector = async (providerId) => {
  chat.currentSystemPromptProvider = providerId;
  const modal = chat("systemPromptModal");
  const list = chat("systemPromptList");

  // Load catalog
  try {
    const catalog = await chat.getPromptCatalog();
    let html = "";

    catalog.forEach((serviceGroup) => {
      html += `<div class="system-prompt-service-group" style="margin-bottom: 20px;">`;
      html += `<h4 style="margin: 0 0 10px 0; color: #333; font-size: 16px; border-bottom: 2px solid #3b82f6; padding-bottom: 5px;">${serviceGroup.service}</h4>`;
      serviceGroup.prompts.forEach((prompt) => {
        const promptPath = prompt.path;
        html += `
          <div class="system-prompt-item" data-path="${promptPath}" data-name="${prompt.name}" data-service="${serviceGroup.service}" style="background: #f8f9fa; padding: 12px; margin: 8px 0; border-radius: 6px; border-left: 4px solid #3b82f6; cursor: pointer; transition: background 0.2s;">
            <div style="font-weight: 600; color: #333; margin-bottom: 4px;">${prompt.name}</div>
            <div style="font-size: 12px; color: #666; margin-bottom: 8px;">${promptPath}</div>
            <button onclick="chat.selectSystemPrompt('${promptPath}', false)" style="background: #3b82f6; color: #fff; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 13px; margin-right: 8px;">Set as Default</button>
            <button onclick="chat.selectSystemPrompt('${promptPath}', true)" style="background: #06b6d4; color: #fff; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 13px;">Use Temporarily</button>
          </div>
        `;
      });
      html += `</div>`;
    });

    list.innerHTML =
      html ||
      "<p style='color: #666; text-align: center; padding: 20px;'>No prompts available</p>";
    modal.style.display = "block";

    // Focus search
    setTimeout(() => {
      const searchInput = chat("systemPromptSearch");
      if (searchInput) searchInput.focus();
    }, 100);
  } catch (error) {
    alert(`Failed to load system prompt catalog: ${error.message}`);
  }
};

// Hide system prompt selector modal
chat.hideSystemPromptSelector = () => {
  chat("systemPromptModal").style.display = "none";
  chat.currentSystemPromptProvider = null;
  const searchInput = chat("systemPromptSearch");
  if (searchInput) searchInput.value = "";
};

// Filter system prompts by search term
chat.filterSystemPrompts = () => {
  const searchTerm = chat("systemPromptSearch").value.toLowerCase();
  const items = document.querySelectorAll(".system-prompt-item");
  items.forEach((item) => {
    const name = item.dataset.name.toLowerCase();
    const service = item.dataset.service.toLowerCase();
    const path = item.dataset.path.toLowerCase();
    if (
      name.includes(searchTerm) ||
      service.includes(searchTerm) ||
      path.includes(searchTerm)
    ) {
      item.style.display = "block";
    } else {
      item.style.display = "none";
    }
  });

  // Hide empty service groups
  const serviceGroups = document.querySelectorAll(
    ".system-prompt-service-group",
  );
  serviceGroups.forEach((group) => {
    const visibleItems = group.querySelectorAll(
      ".system-prompt-item[style*='display: block'], .system-prompt-item:not([style*='display: none'])",
    );
    if (visibleItems.length === 0 && searchTerm) {
      group.style.display = "none";
    } else {
      group.style.display = "block";
    }
  });
};

// Select a system prompt
chat.selectSystemPrompt = (promptPath, isTemporary) => {
  if (!chat.currentSystemPromptProvider) return;

  chat.setSystemPromptForProvider(
    chat.currentSystemPromptProvider,
    promptPath,
    isTemporary,
  );
  chat.hideSystemPromptSelector();

  if (isTemporary) {
    chat("message").innerText = "Temporary system prompt applied";
  } else {
    chat("message").innerText = "System prompt set as default";
  }
};

// Stream to a single LLM
chat.streamToLLM = function (prompt, providerId) {
  return new Promise(async (resolve, reject) => {
    const provider = chat.providers.find((p) => p.id === providerId);
    if (!provider) {
      reject(new Error(`Provider ${providerId} not found`));
      return;
    }

    const apiKey = chat.getProviderAPIKey(providerId);
    const model = chat.getProviderModel(providerId);

    if (!apiKey || !model) {
      reject(new Error(`API key or model not set for ${provider.name}`));
      return;
    }

    // Get system prompt and prepend to user message
    let userMessageContent = prompt;
    try {
      const systemPrompt = await chat.getSystemPromptForProvider(providerId);
      if (systemPrompt) {
        userMessageContent = systemPrompt + "\n\n" + prompt;
      }
    } catch (error) {
      console.error(`Error loading system prompt:`, error);
      // Continue without system prompt if loading fails
    }

    const template =
      chat.providerTemplates[provider.template] ||
      chat.providerTemplates.openai;
    let endpoint = provider.endpoint;
    let headers = { "Content-Type": "application/json" };
    let body = {};

    // Configure based on provider type
    if (
      provider.template === "openai" ||
      provider.template === "deepseek" ||
      provider.template === "grok" ||
      provider.template === "kimi" ||
      provider.template === "perplexity" ||
      provider.template === "mistral"
    ) {
      // OpenAI-compatible providers (OpenAI, DeepSeek, Grok, Kimi, Perplexity, Mistral)
      headers["Authorization"] = `Bearer ${apiKey}`;
      body = {
        model: model,
        messages: [{ role: "user", content: userMessageContent }],
        temperature: 0.8,
        stream: true,
      };

      // Add history for OpenAI-compatible providers
      for (
        let i = chat.history.length - 1;
        i >= 0 && i > chat.history.length - 3;
        i--
      ) {
        body.messages.unshift({
          role: "assistant",
          content: chat.history[i].results[providerId] || "",
        });
        body.messages.unshift({
          role: "user",
          content: chat.history[i].prompt,
        });
      }
    } else if (provider.template === "anthropic") {
      headers["x-api-key"] = apiKey;
      headers["anthropic-version"] = "2023-06-01";
      headers["content-type"] = "application/json";
      body = {
        model: model,
        messages: [{ role: "user", content: userMessageContent }],
        max_tokens: 4096,
        stream: true,
      };
    } else if (provider.template === "gemini") {
      endpoint = endpoint.replace("{model}", model) + `?key=${apiKey}`;
      headers = { "Content-Type": "application/json" };
      body = {
        contents: [{ parts: [{ text: userMessageContent }] }],
        generationConfig: {
          temperature: 0.8,
          maxOutputTokens: 2048,
        },
      };
    } else {
      // Custom provider - basic OpenAI-like format
      headers["Authorization"] = `Bearer ${apiKey}`;
      body = {
        model: model,
        messages: [{ role: "user", content: userMessageContent }],
        stream: true,
      };
    }

    const controller = new AbortController();
    let result = "";
    let inputTokens = 0;
    let outputTokens = 0;
    let usageCaptured = false;
    const divId = `receiving_${providerId}`;

    // Estimate input tokens from all messages (includes system prompt prepended to user message)
    let promptTokens = 0;
    if (body.messages) {
      body.messages.forEach((msg) => {
        promptTokens += chat.estimateTokens(msg.content || "");
      });
    } else if (body.contents) {
      // Gemini format
      body.contents.forEach((content) => {
        if (content.parts) {
          content.parts.forEach((part) => {
            promptTokens += chat.estimateTokens(part.text || "");
          });
        }
      });
    }
    inputTokens = promptTokens;

    const updateUI = () => {
      if (chat(divId)) {
        const estimatedOutput = chat.estimateTokens(result);
        const cost = chat.calculateCost(
          provider.template,
          model,
          inputTokens,
          estimatedOutput,
        );
        const tokenInfo = chat.formatTokenInfo(
          {
            total: usageCaptured
              ? inputTokens + outputTokens
              : inputTokens + estimatedOutput,
          },
          cost,
          !usageCaptured,
        );
        chat(divId).innerHTML =
          `<span class="response-badge">${provider.name}</span>${tokenInfo}` +
          md.html(result + "<br><br>");
      }
    };

    // All providers use streaming (except custom handling)
    fetch(endpoint, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(body),
      signal: controller.signal,
      mode: "cors",
    })
      .then((response) => {
        if (!response.ok) {
          if (response.status == 401)
            throw new Error(
              `401 Unauthorized - Invalid API Key for ${provider.name}`,
            );
          if (response.status == 0)
            throw new Error(
              `CORS Error - ${provider.name} API doesn't allow browser requests. This API may require a server-side proxy.`,
            );
          throw new Error(
            `Failed to get data from ${provider.name}, status ${response.status}`,
          );
        }
        return response.body.pipeThrough(new TextDecoderStream()).getReader();
      })
      .then((reader) => {
        function processText({ done, value }) {
          if (done) {
            // Finalize token counts if not captured
            if (!usageCaptured) {
              outputTokens = chat.estimateTokens(result);
            }
            const cost = chat.calculateCost(
              provider.template,
              model,
              inputTokens,
              outputTokens,
            );
            resolve({
              providerId,
              providerName: provider.name,
              result,
              tokens: {
                input: inputTokens,
                output: outputTokens,
                total: inputTokens + outputTokens,
              },
              cost: cost,
            });
            return;
          }

          const lines = value.split("\n");
          for (let i in lines) {
            if (lines[i].length === 0) continue;
            if (lines[i].startsWith(":")) continue;

            // Handle different completion markers
            if (
              lines[i] === "data: [DONE]" ||
              lines[i] === "event: message_stop"
            ) {
              // Finalize token counts if not captured
              if (!usageCaptured) {
                outputTokens = chat.estimateTokens(result);
              }
              const cost = chat.calculateCost(
                provider.template,
                model,
                inputTokens,
                outputTokens,
              );
              resolve({
                providerId,
                providerName: provider.name,
                result,
                tokens: {
                  input: inputTokens,
                  output: outputTokens,
                  total: inputTokens + outputTokens,
                },
                cost: cost,
              });
              return;
            }

            if (lines[i].startsWith("data: ")) {
              try {
                const json = JSON.parse(lines[i].substring(6));

                // Capture token usage from API responses
                if (json.usage) {
                  // OpenAI format
                  if (json.usage.prompt_tokens)
                    inputTokens = json.usage.prompt_tokens;
                  if (json.usage.completion_tokens)
                    outputTokens = json.usage.completion_tokens;
                  usageCaptured = true;
                } else if (json.type === "message_stop" && json.usage) {
                  // Anthropic format
                  if (json.usage.input_tokens)
                    inputTokens = json.usage.input_tokens;
                  if (json.usage.output_tokens)
                    outputTokens = json.usage.output_tokens;
                  usageCaptured = true;
                }

                // OpenAI format
                if (json.choices && json.choices[0]) {
                  const content =
                    json.choices[0].delta?.content ||
                    json.choices[0].message?.content ||
                    "";
                  if (content) {
                    result += content;
                    updateUI();
                  }
                }
                // Anthropic format
                else if (
                  json.type === "content_block_delta" &&
                  json.delta?.text
                ) {
                  result += json.delta.text;
                  updateUI();
                } else if (
                  json.type === "content_block" &&
                  json.content_block?.text
                ) {
                  result += json.content_block.text;
                  updateUI();
                }
                // Gemini format
                else if (json.candidates && json.candidates[0]) {
                  const candidate = json.candidates[0];
                  if (candidate.content && candidate.content.parts) {
                    candidate.content.parts.forEach((part) => {
                      if (part.text) {
                        result += part.text;
                        updateUI();
                      }
                    });
                  }
                  // Gemini usage metadata
                  if (json.usageMetadata) {
                    if (json.usageMetadata.promptTokenCount)
                      inputTokens = json.usageMetadata.promptTokenCount;
                    if (json.usageMetadata.candidatesTokenCount)
                      outputTokens = json.usageMetadata.candidatesTokenCount;
                    usageCaptured = true;
                  }
                }
              } catch (e) {
                // Skip invalid JSON
              }
            }
          }

          return reader.read().then(processText);
        }
        return reader.read().then(processText);
      })
      .catch((error) => {
        let errorMsg = error.message;
        if (error.name === "TypeError" && error.message.includes("fetch")) {
          errorMsg = `CORS Error - ${provider.name} API doesn't allow direct browser requests. This API requires a server-side proxy or CORS-enabled endpoint.`;
        } else if (
          error.message.includes("Failed to fetch") ||
          error.message.includes("NetworkError")
        ) {
          errorMsg = `Network/CORS Error - ${provider.name} API may not support browser requests. Consider using a proxy server.`;
        }
        reject({
          providerId,
          providerName: provider.name,
          error: errorMsg,
        });
      });
  });
};

// Stream to multiple LLMs
chat.streamMulti = function (prompt) {
  if (chat.activeLLMs.length === 0) {
    alert("Please select at least one LLM provider in Settings");
    return;
  }

  chat.prompt = prompt;
  chat("main").innerHTML += "<h4 class=prompt>" + prompt + "</h4>\n";

  const promises = chat.activeLLMs.map((providerId) =>
    chat.streamToLLM(prompt, providerId),
  );
  const receivingDivs = {};

  chat.activeLLMs.forEach((providerId) => {
    const provider = chat.providers.find((p) => p.id === providerId);
    const divId = `receiving_${providerId}`;
    receivingDivs[providerId] = divId;
    chat("main").innerHTML +=
      `<div id="${divId}" class="response-container"><span class="response-badge">${provider.name}</span><div>Receiving...</div></div>`;
  });

  chat("left").scrollTop = chat("left").scrollHeight;
  chat("btnSend").innerHTML = chat.getStopIconSVG();
  chat("btnSend").disabled = true;

  Promise.allSettled(promises).then((results) => {
    const responses = {};
    const tokenData = {};
    const costData = {};
    let totalCost = 0;
    let totalTokens = 0;

    results.forEach((result, index) => {
      const providerId = chat.activeLLMs[index];
      const divId = receivingDivs[providerId];

      if (result.status === "fulfilled") {
        const { providerName, result: text, tokens, cost } = result.value;
        responses[providerId] = text;

        if (tokens) {
          tokenData[providerId] = tokens;
          totalTokens += tokens.total;
        }
        if (cost !== undefined) {
          costData[providerId] = cost;
          totalCost += cost;
        }

        const tokenInfo = chat.formatTokenInfo(tokens, cost);
        chat(divId).innerHTML =
          `<span class="response-badge">${providerName}</span>${tokenInfo}` +
          md.html(text);
      } else {
        const { providerName, error } = result.reason;
        chat(divId).innerHTML =
          `<span class="response-badge" style="background:#dc3545;">${providerName}</span><div style="color:#dc3545;">Error: ${error}</div>`;
      }
    });

    // Update analytics
    chat.analytics.totalTokens += totalTokens;
    chat.analytics.totalCost += totalCost;

    chat.activeLLMs.forEach((providerId) => {
      if (!chat.analytics.providerStats[providerId]) {
        chat.analytics.providerStats[providerId] = {
          tokens: 0,
          cost: 0,
          requests: 0,
        };
      }
      if (tokenData[providerId]) {
        chat.analytics.providerStats[providerId].tokens +=
          tokenData[providerId].total;
      }
      if (costData[providerId] !== undefined) {
        chat.analytics.providerStats[providerId].cost += costData[providerId];
      }
      chat.analytics.providerStats[providerId].requests += 1;
    });

    chat.history.push({
      prompt: prompt,
      results: responses,
      providers: chat.activeLLMs.map(
        (id) => chat.providers.find((p) => p.id === id).name,
      ),
      tokens: tokenData,
      costs: costData,
      totalCost: totalCost,
      totalTokens: totalTokens,
    });

    chat.saveProviders();
    chat.updateHistoryDisplay();
    chat.updateAnalytics();
    chat("btnSend").innerHTML = chat.getSendIconSVG();
    chat("btnSend").disabled = false;

    if (document.body.clientWidth > 800) {
      chat("prompt").select();
      chat("prompt").focus();
    } else {
      chat("prompt").value = "";
      // Scroll to bottom on mobile to show the input area
      setTimeout(() => {
        window.scrollTo({
          top: document.body.scrollHeight,
          behavior: "smooth",
        });
      }, 100);
    }
  });
};

// Update history display
chat.updateHistoryDisplay = () => {
  let html1 = "",
    html2 = "";

  for (let i = 0; i < chat.history.length; i++) {
    const entry = chat.history[i];
    html1 +=
      "<h4 class=prompt id=prompt" +
      i +
      ' ondblclick="chat.clipboard(' +
      i +
      ')" title="doubleclick to copy">' +
      entry.prompt +
      "</h4>\n";

    if (entry.results) {
      Object.keys(entry.results).forEach((providerId) => {
        const provider = chat.providers.find((p) => p.id === providerId);
        const tokens = entry.tokens && entry.tokens[providerId];
        const cost = entry.costs && entry.costs[providerId];
        const tokenInfo = chat.formatTokenInfo(tokens, cost);
        html1 +=
          `<div class="response-container"><span class="response-badge">${provider ? provider.name : providerId}</span>${tokenInfo}` +
          md.html(entry.results[providerId]) +
          "</div>\n";
      });
    } else {
      html1 += md.html(entry.result || "") + "\n";
    }

    html2 +=
      '<li onclick="location=this.title" title="#prompt' +
      i +
      '">' +
      entry.prompt +
      "</li>";
  }

  html1 +=
    '<div><button style="float:left" onclick="chat.redo()">Redo</button>';
  html1 +=
    '<button style="float:right" onclick="chat.speak()">🔊 speak</button>';

  chat("main").innerHTML = md.html(html1) + "<br></div>";
  chat("list").innerHTML = html2;
  chat("left").scrollTop = chat("left").scrollHeight;
};

// Submit prompt
chat.submit = () => {
  if (chat("btnSend").disabled) {
    chat("btnSend").innerHTML = chat.getSendIconSVG();
    chat("btnSend").disabled = false;
    return;
  }

  const prompt = chat("prompt").value.trim();
  if (!prompt) return;

  chat.streamMulti(prompt);
};

// Export conversation
chat.export = (fname) => {
  const link = document.createElement("a");
  let content = "";

  chat.history.forEach((x, i) => {
    content += `### ${x.prompt}\n\n`;
    if (x.results) {
      Object.keys(x.results).forEach((providerId) => {
        const provider = chat.providers.find((p) => p.id === providerId);
        content += `**${provider ? provider.name : providerId}:**\n\n${x.results[providerId]}\n\n`;
      });
    } else {
      content += `${x.result}\n\n`;
    }
  });

  link.href = "data:text/plain;charset=utf-8," + encodeURIComponent(content);
  link.download =
    fname || "chat-" + new Date().toISOString().substr(0, 16) + ".md";
  link.click();
};

// Logout
chat.logout = () => {
  if (confirm("Logout and clear all data?")) {
    localStorage.clear();
    chat.providers = [];
    chat.activeLLMs = [];
    chat.mcpServers = [];
    chat.history = [];
    chat.analytics = {
      totalTokens: 0,
      totalCost: 0,
      providerStats: {},
    };
    chat.updateProvidersList();
    chat.updateLLMSelector();
    chat.updateMcpServersList();
    chat.updateMcpToolsPanel();
    chat.updateAnalytics();
    chat("main").innerHTML =
      "<h3>Welcome to Multi-LLM Chatbot.</h3><p>Please configure your LLM providers in Settings.</p>";
  }
};

// Clipboard
chat.clipboard = (i) => {
  const entry = chat.history[i];
  let text = `### ${entry.prompt}\n\n`;
  if (entry.results) {
    Object.keys(entry.results).forEach((providerId) => {
      const provider = chat.providers.find((p) => p.id === providerId);
      text += `**${provider ? provider.name : providerId}:**\n\n${entry.results[providerId]}\n\n`;
    });
  } else {
    text += entry.result;
  }
  navigator.clipboard.writeText(text);
  chat("message").innerText = "dialogue has been copied to clipboard";
};

// Redo
chat.redo = () => {
  if (chat.history.length > 0) {
    chat.history.pop();
    chat.updateHistoryDisplay();
    chat("prompt").value = chat.prompt;
    chat.submit();
  }
};

// Speak
chat.speak = (i) => {
  if (window.speechSynthesis.speaking) {
    window.speechSynthesis.cancel();
  } else {
    i = i >= 0 ? i : chat.history.length - 1;
    if (i >= 0 && chat.history[i]) {
      const entry = chat.history[i];
      let text = "";
      if (entry.results) {
        text = Object.values(entry.results).join("\n\n");
      } else {
        text = entry.result || "";
      }
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.5;
      window.speechSynthesis.speak(utterance);
    }
  }
};

// Show prompts
chat.showPrompts = () => {
  chat("list").innerHTML = chat.prompts;
  document.querySelectorAll("#list li").forEach((element) => {
    element.addEventListener("click", (event) => {
      chat("prompt").value = element.innerText;
      chat("prompt").focus();
    });
  });
};

// Voice recognition
var SpeechRecognition = SpeechRecognition || webkitSpeechRecognition;
chat.speech = new SpeechRecognition();
chat.speech.onresult = (e) =>
  (chat("prompt").value = e.results[0][0].transcript);
chat.recognition = () => {
  chat.speech.start();
  chat("prompt").value = "Listening...";
};

// Mobile menu toggle
chat.toggleMobileMenu = () => {
  const menu = document.getElementById("mobileMenu");
  const overlay = document.getElementById("mobileMenuOverlay");
  const body = document.body;

  if (menu && overlay) {
    const isActive = menu.classList.contains("active");

    if (isActive) {
      // Close menu
      menu.classList.remove("active");
      overlay.classList.remove("active");
      body.classList.remove("mobile-menu-open");
    } else {
      // Open menu
      menu.classList.add("active");
      overlay.classList.add("active");
      body.classList.add("mobile-menu-open");
    }
  }
};

// Close mobile menu on escape key
document.addEventListener("keydown", function (event) {
  if (event.key === "Escape") {
    const menu = document.getElementById("mobileMenu");
    if (menu && menu.classList.contains("active")) {
      chat.toggleMobileMenu();
    }
  }
});

// Auto-resize textarea on mobile
chat.autoResizeTextarea = () => {
  const textarea = chat("prompt");
  if (textarea) {
    textarea.style.height = "auto";
    const maxHeight = window.innerWidth <= 880 ? 120 : 200;
    const newHeight = Math.min(textarea.scrollHeight, maxHeight);
    textarea.style.height = newHeight + "px";
  }
};

// Update temporary system prompt display
chat.updateTempSystemPromptDisplay = () => {
  const panel = chat("tempSystemPromptPanel");
  const list = chat("tempSystemPromptList");
  if (!panel || !list) return;

  const activeProviders = chat.activeLLMs || [];
  const tempPrompts = [];

  activeProviders.forEach((providerId) => {
    const tempPrompt = sessionStorage.getItem(
      `temp_system_prompt_${providerId}`,
    );
    if (tempPrompt) {
      const provider = chat.providers.find((p) => p.id === providerId);
      if (provider) {
        tempPrompts.push({ providerId, providerName: provider.name });
      }
    }
  });

  if (tempPrompts.length > 0) {
    panel.style.display = "block";
    list.innerHTML = tempPrompts
      .map(
        ({ providerId, providerName }) => `
      <div style="background: #fff3cd; border: 1px solid #ffc107; padding: 8px; margin: 4px 0; border-radius: 4px; font-size: 12px; display: flex; justify-content: space-between; align-items: center;">
        <span><strong>${providerName}</strong>: Temporary system prompt active</span>
        <button onclick="chat.removeSystemPromptForProvider('${providerId}', true); chat.updateTempSystemPromptDisplay();" style="background: #dc3545; color: #fff; border: none; padding: 4px 8px; border-radius: 3px; cursor: pointer; font-size: 11px;">Clear</button>
      </div>
    `,
      )
      .join("");
  } else {
    panel.style.display = "none";
  }
};

// Initialize on load
window.onload = () => {
  chat.loadProviders();
  chat.prompts = chat("list").innerHTML;
  chat.showPrompts();
  // Initialize system prompt catalog
  chat.getPromptCatalog().catch((error) => {
    console.error("Failed to load system prompt catalog:", error);
  });
  chat.updateTempSystemPromptDisplay();

  // Setup textarea auto-resize
  const textarea = chat("prompt");
  if (textarea) {
    textarea.addEventListener("input", chat.autoResizeTextarea);
    // Initial resize
    chat.autoResizeTextarea();
  }

  // Only focus on desktop to avoid keyboard popup on mobile
  if (document.body.clientWidth > 800) {
    chat("prompt").focus();
  }

  // Migrate old API key if exists
  const oldKey = localStorage.getItem("OPENAI_API_KEY");
  if (oldKey && chat.providers.length === 0) {
    if (
      confirm(
        "Found old API key. Would you like to migrate it to a new OpenAI provider?",
      )
    ) {
      chat.providers.push({
        id: "openai",
        name: "OpenAI",
        endpoint: "https://api.openai.com/v1/chat/completions",
        template: "openai",
      });
      chat.saveProviderAPIKey("openai", oldKey);
      chat.saveProviderModel("openai", "gpt-3.5-turbo");
      chat.activeLLMs.push("openai");
      chat.saveProviders();
      chat.updateProvidersList();
      chat.updateLLMSelector();
    }
  }
};

// Hotkey support
chat.hotkey = "enter";
document.addEventListener("keydown", function (event) {
  if (event.key === "Enter" && (chat.hotkey !== "ctrl" || event.ctrlKey)) {
    if (!chat("btnSend").disabled) {
      event.preventDefault();
      chat.submit();
    }
  }
});
