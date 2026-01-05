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
 * Multi-SLM Chat Router System
 *****************************************************************************/

const slmChat = (id) => window.document.getElementById(id);

// Default SLM collection with domain labels
// Using models that are supported by Hugging Face inference providers
// See: https://huggingface.co/inference/models
slmChat.defaultModels = [
  {
    id: "meta-llama/Llama-3.1-8B-Instruct",
    name: "Llama-3.1 8B",
    domain: "general",
    description:
      "Meta Llama-3.1 8B - General purpose (available via novita, nebius, cerebras, sambanova, nscale, scaleway, ovhcloud)",
    isNiche: false,
  },
  {
    id: "Qwen/Qwen2.5-Coder-7B",
    name: "Qwen2.5 Coder 7B",
    domain: "coding",
    description:
      "Alibaba Qwen2.5 Coder - Specialized for coding tasks (available via nebius)",
    isNiche: false,
  },
  {
    id: "NousResearch/Hermes-2-Pro-Llama-3-8B",
    name: "Hermes-2-Pro Llama-3 8B",
    domain: "general",
    description:
      "NousResearch Hermes-2-Pro - General purpose conversation (available via novita)",
    isNiche: false,
  },
  {
    id: "openai/gpt-oss-20b",
    name: "GPT-OSS-20B",
    domain: "general",
    description:
      "OpenAI GPT-OSS-20B - General purpose (available via groq, novita)",
    isNiche: false,
  },
];

// State
slmChat.models = [];
slmChat.history = [];
slmChat.apiKey = "";
slmChat.classifierModel = "facebook/bart-large-mnli";

// Load data from localStorage
slmChat.loadData = () => {
  const stored = localStorage.getItem("slm_collection");
  slmChat.models = stored ? JSON.parse(stored) : [...slmChat.defaultModels];
  // #region agent log
  fetch("http://127.0.0.1:7242/ingest/e76804c4-a29e-4825-8be1-f523f118edf4", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      location: "multi-slm-chat.js:254",
      message: "loadData models loaded",
      data: {
        modelsCount: slmChat.models.length,
        models: slmChat.models.map((m) => ({
          name: m.name,
          domain: m.domain,
          id: m.id,
        })),
        storedRaw: stored?.substring(0, 200),
      },
      timestamp: Date.now(),
      sessionId: "debug-session",
      runId: "check-load",
      hypothesisId: "C",
    }),
  }).catch(() => {});
  // #endregion

  const apiKey = localStorage.getItem("hf_api_token");
  slmChat.apiKey = apiKey || "";

  const classifier = localStorage.getItem("classifier_model");
  slmChat.classifierModel = classifier || "facebook/bart-large-mnli";

  slmChat.updateModelsList();

  // Update API key field if exists
  const keyInput = slmChat("hfApiKey");
  if (keyInput) keyInput.value = slmChat.apiKey;

  // Update classifier model if exists
  const classifierSelect = slmChat("classifierModel");
  if (classifierSelect) classifierSelect.value = slmChat.classifierModel;
};

// Save data to localStorage
slmChat.saveData = () => {
  localStorage.setItem("slm_collection", JSON.stringify(slmChat.models));
  localStorage.setItem("hf_api_token", slmChat.apiKey);
  localStorage.setItem("classifier_model", slmChat.classifierModel);
};

// Save API key
slmChat.saveApiKey = () => {
  const keyInput = slmChat("hfApiKey");
  if (keyInput) {
    slmChat.apiKey = keyInput.value.trim();
    if (slmChat.apiKey) {
      slmChat.saveData();
      alert("API key saved!");
    } else {
      alert("Please enter an API key");
    }
  }
};

// Save classifier model
slmChat.saveClassifierModel = () => {
  const modelSelect = slmChat("classifierModel");
  if (modelSelect) {
    slmChat.classifierModel = modelSelect.value;
    slmChat.saveData();
    alert("Classifier model saved!");
  }
};

// Add new model
slmChat.addModel = () => {
  const modelId = slmChat("modelId")?.value.trim();
  const modelName = slmChat("modelName")?.value.trim();
  const modelDomain = slmChat("modelDomain")?.value.trim();
  const modelDescription = slmChat("modelDescription")?.value.trim();
  const customEndpoint = slmChat("customEndpoint")?.value.trim();
  const isNiche = slmChat("isNiche")?.checked || false;

  if (!modelId || !modelName || !modelDomain) {
    alert("Please fill in Model ID, Display Name, and Domain");
    return;
  }

  // Check if model already exists
  if (slmChat.models.find((m) => m.id === modelId)) {
    alert("Model with this ID already exists");
    return;
  }

  const newModel = {
    id: modelId,
    name: modelName,
    domain: modelDomain,
    description: modelDescription || "",
    isNiche: isNiche,
  };

  // Add custom endpoint if provided (for self-hosted models)
  if (customEndpoint) {
    newModel.customEndpoint = customEndpoint;
  }

  slmChat.models.push(newModel);
  slmChat.saveData();
  slmChat.updateModelsList();

  // Clear form
  if (slmChat("modelId")) slmChat("modelId").value = "";
  if (slmChat("modelName")) slmChat("modelName").value = "";
  if (slmChat("modelDomain")) slmChat("modelDomain").value = "";
  if (slmChat("modelDescription")) slmChat("modelDescription").value = "";
  if (slmChat("customEndpoint")) slmChat("customEndpoint").value = "";
  if (slmChat("isNiche")) slmChat("isNiche").checked = false;

  alert("Model added successfully!");
};

// Delete model
slmChat.deleteModel = (modelId) => {
  if (confirm("Delete this model?")) {
    slmChat.models = slmChat.models.filter((m) => m.id !== modelId);
    slmChat.saveData();
    slmChat.updateModelsList();
  }
};

// Update models list in UI
slmChat.updateModelsList = () => {
  const list = slmChat("modelsList");
  if (!list) return;

  if (slmChat.models.length === 0) {
    list.innerHTML =
      '<p style="color:#666; font-style:italic;">No models added yet. Add one above or use defaults.</p>';
    return;
  }

  list.innerHTML = slmChat.models
    .map((model) => {
      const nicheBadge = model.isNiche
        ? '<span style="background:#ffc107; color:#000; padding:2px 6px; border-radius:4px; font-size:11px; margin-left:8px;">Niche</span>'
        : "";
      const customEndpointBadge = model.customEndpoint
        ? `<div style="font-size: 11px; color: #0d6efd; margin-top: 4px;">
            <strong>Custom Endpoint:</strong> ${model.customEndpoint}
           </div>`
        : "";
      return `
      <div class="provider-item">
        <div class="provider-item-info">
          <div class="provider-item-name">${model.name} ${nicheBadge}</div>
          <div class="provider-item-model">ID: ${model.id}</div>
          <div style="font-size: 12px; color: #888; margin-top: 4px;">
            Domain: <strong>${model.domain}</strong>
          </div>
          ${model.description ? `<div style="font-size: 12px; color: #666; margin-top: 4px;">${model.description}</div>` : ""}
          ${customEndpointBadge}
        </div>
        <div class="provider-item-actions">
          <button class="btn-delete" onclick="slmChat.deleteModel('${model.id}')">Delete</button>
        </div>
      </div>
    `;
    })
    .join("");
};

// Extract unique domains from models
slmChat.extractDomains = () => {
  const domains = new Set();
  slmChat.models.forEach((model) => {
    domains.add(model.domain);
  });
  return Array.from(domains);
};

// Classify prompt using chat completion model (simpler keyword-based fallback for now)
slmChat.classifyPrompt = async (prompt) => {
  // #region agent log
  fetch("http://127.0.0.1:7242/ingest/e76804c4-a29e-4825-8be1-f523f118edf4", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      location: "multi-slm-chat.js:412",
      message: "classifyPrompt entry",
      data: { promptLength: prompt.length },
      timestamp: Date.now(),
      sessionId: "debug-session",
      runId: "initial",
      hypothesisId: "B",
    }),
  }).catch(() => {});
  // #endregion
  const domains = slmChat.extractDomains();
  // #region agent log
  fetch("http://127.0.0.1:7242/ingest/e76804c4-a29e-4825-8be1-f523f118edf4", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      location: "multi-slm-chat.js:415",
      message: "extracted domains",
      data: { domains: domains },
      timestamp: Date.now(),
      sessionId: "debug-session",
      runId: "initial",
      hypothesisId: "C",
    }),
  }).catch(() => {});
  // #endregion
  if (domains.length === 0) {
    throw new Error("No models configured. Please add models in Settings.");
  }

  // For now, use simple keyword-based classification as a fallback
  // since router API doesn't support zero-shot classification directly
  // TODO: Could use a chat completion model to classify via prompting

  const promptLower = prompt.toLowerCase();
  const scores = {};

  // Initialize scores
  domains.forEach((domain) => {
    scores[domain] = 0;
  });

  // Simple keyword matching - user can add more sophisticated classification later
  // This is a basic fallback until we find a better solution for classification

  // Keyword patterns for common domains
  const domainKeywords = {
    coding: [
      "code",
      "programming",
      "function",
      "algorithm",
      "python",
      "javascript",
      "script",
      "debug",
      "bug",
      "syntax",
    ],
    australian_legal: [
      "australian",
      "australia",
      "legal",
      "law",
      "court",
      "legislation",
      "statute",
      "regulation",
      "act",
      "auslaw",
    ],
    australian_law: [
      "australian",
      "australia",
      "legal",
      "law",
      "court",
      "legislation",
      "statute",
      "regulation",
      "act",
      "auslaw",
      "contract",
      "tort",
      "criminal",
      "civil",
      "litigation",
    ],
    general: [], // Default domain
  };

  // Count keyword matches (more sensitive: each match counts more)
  domains.forEach((domain) => {
    const keywords = domainKeywords[domain] || [];
    keywords.forEach((keyword) => {
      if (promptLower.includes(keyword.toLowerCase())) {
        scores[domain]++;
      }
    });
  });
  // #region agent log
  fetch("http://127.0.0.1:7242/ingest/e76804c4-a29e-4825-8be1-f523f118edf4", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      location: "multi-slm-chat.js:447",
      message: "keyword matching results",
      data: { scores: scores, promptLower: promptLower.substring(0, 100) },
      timestamp: Date.now(),
      sessionId: "debug-session",
      runId: "post-fix",
      hypothesisId: "B",
    }),
  }).catch(() => {});
  // #endregion

  // Return classification-like format
  const labels = domains;
  const scoreValues = domains.map((domain) => {
    // More sensitive scoring: base score lower, match multiplier higher
    const baseScore = scores[domain] > 0 ? 0.2 : 0.05; // Higher base if matched
    const matchScore = scores[domain] * 0.5; // Increased from 0.3 to 0.5
    return Math.min(baseScore + matchScore, 0.95);
  });

  // Normalize to sum to 1
  const total = scoreValues.reduce((sum, score) => sum + score, 0);
  const normalizedScores = scoreValues.map((score) => score / total);

  const result = {
    labels: labels,
    scores: normalizedScores,
  };
  // #region agent log
  fetch("http://127.0.0.1:7242/ingest/e76804c4-a29e-4825-8be1-f523f118edf4", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      location: "multi-slm-chat.js:467",
      message: "classification result",
      data: { labels: result.labels, scores: result.scores },
      timestamp: Date.now(),
      sessionId: "debug-session",
      runId: "initial",
      hypothesisId: "A",
    }),
  }).catch(() => {});
  // #endregion
  return result;
};

// Route prompt to best SLM
slmChat.routePrompt = async (prompt) => {
  // #region agent log
  fetch("http://127.0.0.1:7242/ingest/e76804c4-a29e-4825-8be1-f523f118edf4", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      location: "multi-slm-chat.js:470",
      message: "routePrompt entry",
      data: {
        modelsCount: slmChat.models.length,
        modelDomains: slmChat.models.map((m) => m.domain),
      },
      timestamp: Date.now(),
      sessionId: "debug-session",
      runId: "initial",
      hypothesisId: "C",
    }),
  }).catch(() => {});
  // #endregion
  try {
    // Classify the prompt
    slmChat.updateStatus("Classifying prompt...");
    const classification = await slmChat.classifyPrompt(prompt);

    // Find the best matching domain
    let bestDomain = "general";
    let bestScore = 0;

    if (classification.labels && classification.scores) {
      for (let i = 0; i < classification.labels.length; i++) {
        if (classification.scores[i] > bestScore) {
          bestScore = classification.scores[i];
          bestDomain = classification.labels[i];
        }
      }
    }
    // #region agent log
    fetch("http://127.0.0.1:7242/ingest/e76804c4-a29e-4825-8be1-f523f118edf4", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        location: "multi-slm-chat.js:491",
        message: "best domain selected",
        data: { bestDomain: bestDomain, bestScore: bestScore },
        timestamp: Date.now(),
        sessionId: "debug-session",
        runId: "initial",
        hypothesisId: "A",
      }),
    }).catch(() => {});
    // #endregion

    // Find models with the best domain
    const matchingModels = slmChat.models.filter(
      (m) => m.domain === bestDomain,
    );
    // #region agent log
    fetch("http://127.0.0.1:7242/ingest/e76804c4-a29e-4825-8be1-f523f118edf4", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        location: "multi-slm-chat.js:497",
        message: "matching models search",
        data: {
          bestDomain: bestDomain,
          matchingCount: matchingModels.length,
          allModels: slmChat.models.map((m) => ({
            name: m.name,
            domain: m.domain,
          })),
        },
        timestamp: Date.now(),
        sessionId: "debug-session",
        runId: "initial",
        hypothesisId: "A",
      }),
    }).catch(() => {});
    // #endregion
    if (matchingModels.length === 0) {
      // Debug: log available domains
      const availableDomains = [
        ...new Set(slmChat.models.map((m) => m.domain)),
      ];
      console.log(
        `No models found for domain "${bestDomain}". Available domains:`,
        availableDomains,
      );
      console.log(
        "Available models:",
        slmChat.models.map((m) => ({ name: m.name, domain: m.domain })),
      );
      // #region agent log
      fetch(
        "http://127.0.0.1:7242/ingest/e76804c4-a29e-4825-8be1-f523f118edf4",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            location: "multi-slm-chat.js:502",
            message: "no matching models - fallback",
            data: {
              bestDomain: bestDomain,
              availableDomains: availableDomains,
            },
            timestamp: Date.now(),
            sessionId: "debug-session",
            runId: "initial",
            hypothesisId: "A",
          }),
        },
      ).catch(() => {});
      // #endregion
      // Fallback to general
      const generalModels = slmChat.models.filter(
        (m) => m.domain === "general",
      );
      if (generalModels.length > 0) {
        slmChat.updateStatus(
          `No ${bestDomain} models found, using general model`,
        );
        return {
          model: generalModels[0],
          confidence: 0.5,
          classification: classification,
        };
      }
      throw new Error("No matching model found");
    }

    // Select first matching model (can be improved to select best one)
    // #region agent log
    fetch("http://127.0.0.1:7242/ingest/e76804c4-a29e-4825-8be1-f523f118edf4", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        location: "multi-slm-chat.js:521",
        message: "model selected",
        data: {
          selectedModel: matchingModels[0].name,
          selectedDomain: matchingModels[0].domain,
          confidence: bestScore,
        },
        timestamp: Date.now(),
        sessionId: "debug-session",
        runId: "initial",
        hypothesisId: "D",
      }),
    }).catch(() => {});
    // #endregion
    return {
      model: matchingModels[0],
      confidence: bestScore,
      classification: classification,
    };
  } catch (error) {
    // Fallback to first general model
    const generalModels = slmChat.models.filter((m) => m.domain === "general");
    if (generalModels.length > 0) {
      return {
        model: generalModels[0],
        confidence: 0.5,
        error: error.message,
      };
    }
    throw error;
  }
};

// Call Hugging Face Router API or Custom Endpoint for chat completion
slmChat.callInferenceAPI = async (model, prompt) => {
  if (!slmChat.apiKey) {
    throw new Error("API key not set");
  }

  // Support custom endpoints (self-hosted models)
  const modelId = typeof model === "string" ? model : model.id;
  const customEndpoint =
    typeof model === "object" && model.customEndpoint
      ? model.customEndpoint
      : null;

  // Custom endpoints use standard HF Inference API format (inputs parameter, no /v1/chat/completions)
  // Router API uses OpenAI-compatible format (messages parameter, /v1/chat/completions)
  if (customEndpoint) {
    const endpoint = customEndpoint.replace(/\/$/, ""); // Remove trailing slash, use as-is
    // #region agent log
    fetch("http://127.0.0.1:7242/ingest/e76804c4-a29e-4825-8be1-f523f118edf4", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        location: "multi-slm-chat.js:578",
        message: "custom endpoint call",
        data: { endpoint: endpoint, modelId: modelId },
        timestamp: Date.now(),
        sessionId: "debug-session",
        runId: "fix-endpoint",
        hypothesisId: "custom",
      }),
    }).catch(() => {});
    // #endregion
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${slmChat.apiKey}`,
        },
        body: JSON.stringify({
          inputs: prompt, // Standard HF Inference API format
          parameters: {
            max_new_tokens: 512,
            temperature: 0.7,
            return_full_text: false,
          },
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Invalid API key");
        }
        if (response.status === 503) {
          throw new Error(
            "Model is loading. Please wait a moment and try again.",
          );
        }
        const errorText = await response.text();
        throw new Error(`Inference failed: ${response.status} ${errorText}`);
      }

      const data = await response.json();

      // Handle standard HF Inference API response format (array of objects with generated_text)
      if (Array.isArray(data) && data.length > 0 && data[0].generated_text) {
        return data[0].generated_text;
      }
      // Handle single object format
      if (data.generated_text) {
        return data.generated_text;
      }

      throw new Error("Unexpected response format from custom endpoint");
    } catch (error) {
      if (error.message) {
        throw error;
      }
      throw new Error(`Failed to get response: ${error.message}`);
    }
  }

  // Router API uses OpenAI-compatible format
  const endpoint = `https://router.huggingface.co/v1/chat/completions`;

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${slmChat.apiKey}`,
      },
      body: JSON.stringify({
        model: modelId,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 512,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("Invalid API key");
      }
      if (response.status === 503) {
        throw new Error(
          "Model is loading. Please wait a moment and try again.",
        );
      }
      const errorText = await response.text();
      throw new Error(`Inference failed: ${response.status} ${errorText}`);
    }

    const data = await response.json();

    // Handle OpenAI-compatible chat completion response
    if (data.choices && data.choices.length > 0) {
      return data.choices[0].message.content;
    }

    throw new Error("Unexpected response format from API");
  } catch (error) {
    if (error.message) {
      throw error;
    }
    throw new Error(`Failed to get response: ${error.message}`);
  }
};

// Update status
slmChat.updateStatus = (message) => {
  const statusEl = slmChat("routerStatus");
  if (statusEl) {
    statusEl.textContent = message;
  }
};

// Submit prompt
slmChat.submit = async () => {
  const promptEl = slmChat("prompt");
  if (!promptEl) return;

  const prompt = promptEl.value.trim();
  if (!prompt) return;

  if (slmChat.models.length === 0) {
    alert("Please add at least one model in Settings");
    return;
  }

  // Add prompt to UI
  const mainEl = slmChat("main");
  if (mainEl) {
    mainEl.innerHTML += "<h4 class=prompt>" + prompt + "</h4>\n";
  }

  // Create response container
  const responseId = "response_" + Date.now();
  if (mainEl) {
    mainEl.innerHTML += `<div id="${responseId}" class="response-container"><span class="response-badge">Routing...</span><div>Classifying prompt and selecting best SLM...</div></div>`;
  }

  // Scroll to bottom
  const leftEl = slmChat("left");
  if (leftEl) {
    requestAnimationFrame(() => {
      leftEl.scrollTo({
        top: leftEl.scrollHeight,
        behavior: "smooth",
      });
    });
  }

  // Disable send button
  const sendBtn = slmChat("btnSend");
  if (sendBtn) {
    sendBtn.disabled = true;
  }

  try {
    // Route prompt
    slmChat.updateStatus("Routing prompt...");
    const routing = await slmChat.routePrompt(prompt);

    // Update UI with routing info
    const responseEl = slmChat(responseId);
    if (responseEl) {
      const confidencePercent = (routing.confidence * 100).toFixed(1);
      responseEl.innerHTML =
        `<span class="response-badge">${routing.model.name} (${routing.model.domain})</span>` +
        `<div style="font-size: 12px; color: #666; margin-bottom: 8px;">Confidence: ${confidencePercent}% | Generating response...</div>`;
    }

    // Get response from selected model
    slmChat.updateStatus(`Getting response from ${routing.model.name}...`);
    const response = await slmChat.callInferenceAPI(routing.model, prompt);

    // Update UI with response
    if (responseEl) {
      const confidencePercent = (routing.confidence * 100).toFixed(1);
      responseEl.innerHTML =
        `<span class="response-badge">${routing.model.name} (${routing.model.domain})</span>` +
        `<div style="font-size: 12px; color: #666; margin-bottom: 8px;">Confidence: ${confidencePercent}%</div>` +
        md.html(response);
    }

    // Save to history
    slmChat.history.push({
      prompt: prompt,
      response: response,
      model: routing.model,
      confidence: routing.confidence,
      timestamp: new Date().toISOString(),
    });

    slmChat.updateStatus("Ready to route prompts");
  } catch (error) {
    const responseEl = slmChat(responseId);
    if (responseEl) {
      responseEl.innerHTML =
        `<span class="response-badge" style="background:#dc3545;">Error</span>` +
        `<div style="color:#dc3545;">${error.message}</div>`;
    }
    slmChat.updateStatus(`Error: ${error.message}`);
  }

  // Re-enable send button
  if (sendBtn) {
    sendBtn.disabled = false;
  }

  // Clear prompt on mobile, keep on desktop
  if (document.body.clientWidth <= 880) {
    if (promptEl) promptEl.value = "";
  } else {
    if (promptEl) {
      promptEl.focus();
    }
  }
};

// Show settings
slmChat.showSettings = () => {
  const modal = slmChat("settingsModal");
  if (modal) {
    modal.style.display = "block";
    slmChat.updateModelsList();
  }
};

// Hide settings
slmChat.hideSettings = () => {
  const modal = slmChat("settingsModal");
  if (modal) {
    modal.style.display = "none";
  }
};

// Close modal on outside click
window.onclick = (event) => {
  if (event.target.id === "settingsModal") {
    slmChat.hideSettings();
  }
};

// Export conversation
slmChat.export = () => {
  const link = document.createElement("a");
  let content = "";

  slmChat.history.forEach((entry) => {
    content += `### ${entry.prompt}\n\n`;
    content += `**Model:** ${entry.model.name} (${entry.model.domain}) - Confidence: ${(entry.confidence * 100).toFixed(1)}%\n\n`;
    content += `${entry.response}\n\n`;
    content += `---\n\n`;
  });

  link.href = "data:text/plain;charset=utf-8," + encodeURIComponent(content);
  link.download = "slm-chat-" + new Date().toISOString().substr(0, 16) + ".md";
  link.click();
};

// Logout
slmChat.logout = () => {
  if (confirm("Logout and clear all data?")) {
    localStorage.clear();
    slmChat.models = [...slmChat.defaultModels];
    slmChat.history = [];
    slmChat.apiKey = "";
    slmChat.classifierModel = "facebook/bart-large-mnli";
    slmChat.saveData();
    slmChat.updateModelsList();
    const mainEl = slmChat("main");
    if (mainEl) {
      mainEl.innerHTML =
        "<h3>Welcome to Multi-SLM Chat Router.</h3><p>Please configure your models in Settings.</p>";
    }
    slmChat.updateStatus("Ready to route prompts");
  }
};

// Initialize on load
window.onload = () => {
  slmChat.loadData();
  slmChat.updateStatus("Ready to route prompts");

  // Focus prompt on desktop
  if (document.body.clientWidth > 800) {
    const promptEl = slmChat("prompt");
    if (promptEl) promptEl.focus();
  }

  // Handle Enter key
  const promptEl = slmChat("prompt");
  if (promptEl) {
    promptEl.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        const sendBtn = slmChat("btnSend");
        if (sendBtn && !sendBtn.disabled) {
          slmChat.submit();
        }
      }
    });
  }
};
