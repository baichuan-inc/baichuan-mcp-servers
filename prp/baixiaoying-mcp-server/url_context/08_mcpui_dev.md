# MCP-UI: Interactive UI Components for MCP

> Source: https://mcpui.dev/

## Overview

MCP-UI provides tools for building dynamic interfaces for AI applications using the MCP Apps standard. The platform includes client and server SDKs that implement the official specification.

## Key Features

### MCP Apps Standard Integration

"MCP Apps is the official standard for interactive UI in MCP." The packages serve both as implementations and community testing grounds.

### Security

All remote code operates in sandboxed iframes, protecting both the host environment and users while preserving interactive functionality.

### Flexibility

The system supports HTML content and maintains compatibility with both new MCP Apps hosts and legacy MCP-UI systems.

### Developer Tools

Comprehensive SDKs are available for seamless integration of interactive components.

## Implementation Approach

The client-side uses an `AppRenderer` component to display tool interfaces, while the server-side leverages `registerAppTool` and `registerAppResource` functions to create tools with associated UI resources. Tools connect to their interfaces through a `_meta.ui.resourceUri` property.

## Backward Compatibility

For teams using existing MCP-UI applications or hosts without MCP Apps support yet, documentation addresses migration paths through legacy adapter guidance.
