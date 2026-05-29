# 🌌 Hallucinator

> Experience the brilliant, hilarious, and cosmic hallucinations of Google's ultra-small `gemma3:270m` model. A premium retro-futuristic chat interface powered by Ollama.

---

## 🚀 Deployment (LXC & Remote Servers)

The project includes built-in scripts to automate the entire deployment process to an LXC container or remote Linux server. The setup automatically configures **Node.js**, **Nginx (Reverse Proxy)**, **Ollama**, and the **`gemma3:270m`** model.

### Prerequisites

Ensure you have passwordless SSH access (e.g., via SSH keys) configured to the target container/server.

### Commands

#### 1. Full Deployment & Provisioning
This command builds the project locally, transfers the standalone bundle, installs all remote dependencies (Node.js, Nginx, Ollama), enables Ollama and Next.js as systemd services to run on startup, and pre-caches the `gemma3:270m` model.

```bash
npm run deploy -- user@ip
```

#### 2. Fast Update
For subsequent updates when you only want to push code changes without re-running the full provisioning process:

```bash
npm run deploy -- user@ip --update
```

---

## ⚙️ How It Works (Startup & Services)

Under the hood, the deployment process ensures high availability and instant readiness:

- **Systemd Integration**: Both Ollama (`ollama.service`) and the Next.js application (`temp-next-app.service`) are registered as systemd services and enabled to run automatically on system boot.
- **Ordered Startup**: The Next.js application service configuration contains `After=network.target ollama.service`, guaranteeing that the web application only begins accepting traffic once Ollama is fully online.
- **Automated Model Cache**: The setup script pre-pulls `gemma3:270m` on the remote server, eliminating any cold-start delay for the model on first launch.

---

## 💻 Local Development

To run the project locally, ensure you have [Ollama](https://ollama.com) installed and the model downloaded:

```bash
# Pull the model
ollama run gemma3:270m

# Install dependencies and start the local development server
npm install
npm run dev
```
