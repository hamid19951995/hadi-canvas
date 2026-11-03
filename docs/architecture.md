# Architecture Overview

## High-level Components

1. **Canvas Engine** (React Flow / XYFlow)
   - Node rendering
   - Edge connections
   - Viewport, zoom, pan

2. **Node Types**
   - Text Node (LLM)
   - Image Node
   - Video Node
   - Merge / Aggregate Node
   - Conditional Node
   - Loop Node
   - Memory / Context Node
   - File Input/Output Node

3. **Execution Engine**
   - DAG scheduler
   - Parallel execution of independent nodes
   - Status tracking (idle, running, success, error)
   - Streaming outputs

4. **Model Providers**
   - GapGPT API
   - Other providers (OpenAI, Anthropic, Google, xAI, etc.)

5. **Project System**
   - Save / Load graphs
   - Versioning
   - Sharing

6. **UI Shell**
   - Top bar
   - Left sidebar (projects, models, tools)
   - Right properties panel
   - Bottom status / logs
