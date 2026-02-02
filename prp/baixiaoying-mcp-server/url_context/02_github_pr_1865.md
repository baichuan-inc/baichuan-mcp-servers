Open
SEP-1865: MCP Apps - Interactive User Interfaces for MCP
#1865
idosal wants to merge 11 commits into modelcontextprotocol:main from idosal:main
+3 −3
Conversation 46
Commits 11
Checks 2
Files changed 1
Conversation
@idosal
Contributor
idosal
commented
on Nov 22, 2025
•
SEP-1865: MCP Apps - Interactive User Interfaces for MCP
Track: Extensions
Authors: Ido Salomon, Liad Yosef, Olivier Chafik, Jerome Swannack, Jonathan Hefner, Anton Pidkuiko, Nick Cooper, Bryan Ashley, Alexi Christakis
Status: Draft
Created: 2025-11-21

Please review the full SEP at modelcontextprotocol/ext-apps. This PR provides a summary of the proposal and wires it into the main spec.

Abstract
This SEP proposes an extension to MCP (per SEP-1724) that enables servers to deliver interactive user interfaces to hosts. MCP Apps introduces a standardized pattern for declaring UI resources via the ui:// URI scheme, associating them with tools through metadata, and facilitating bi-directional communication between the UI and the host using MCP's JSON-RPC base protocol. This extension addresses the growing community need for rich, interactive experiences in MCP-enabled applications, maintaining security, auditability, and alignment with MCP's core architecture. The initial specification focuses on HTML resources (text/html;profile=mcp-app) with a clear path for future extensions.

Motivation
MCP lacks a standardized way for servers to deliver rich, interactive user interfaces to hosts. This gap blocks many use cases that require visual presentation and interactivity that go beyond plain text or structured data. As more hosts adopt this capability, the risk of fragmentation and interoperability challenges grows.

MCP-UI has demonstrated the viability and value of MCP apps built on UI resources and serves as a community playground for the UI spec and SDK. Fueled by a dedicated community, it developed the bi-directional communication model and the HTML, external URL, and remote DOM content types. MCP-UI's adopters, including hosts and providers such as Postman, HuggingFace, Shopify, Goose, and ElevenLabs, have provided critical insights and contributions to the community.

OpenAI's Apps SDK, launched in November 2025, further validated the demand for rich UI experiences within conversational AI interfaces. The Apps SDK enables developers to build rich, interactive applications inside ChatGPT using MCP as its backbone.

The architecture of both the Apps SDK and MCP-UI has significantly informed the design of this specification.

However, without formal standardization:

Servers cannot reliably expect UI support via MCP
Each host may implement slightly different behaviors
Security and auditability patterns are inconsistent
Developers must maintain separate implementations or adapters for different hosts (e.g., MCP-UI vs. Apps SDK)
This SEP addresses the current limitations through an optional, backwards-compatible extension that unifies the approaches pioneered by MCP-UI and the Apps SDK into a single, open standard.

Specification (high level)
The full specification can be found at modelcontextprotocol/ext-apps.

At a high level, MCP Apps extends the Model Context Protocol to enable servers to deliver interactive user interfaces to hosts. This extension introduces:

UI Resources: Predeclared resources using the ui:// URI scheme
Resource Discovery: Tools reference UI resources via metadata
Bi-directional Communication: UI iframes communicate with hosts using standard MCP JSON-RPC protocol
Security Model: Mandatory iframe sandboxing with auditable communication
This specification focuses on HTML content (text/html;profile=mcp-app) as the initial content type, with extensibility for future formats.

As an extension, MCP Apps is optional and must be explicitly negotiated between clients and servers through the extension capabilities mechanism (see Capability Negotiation section).

Rationale
Key design choices:

Predeclared resources vs. inline embedding
UI is modeled as predeclared resources (ui://), referenced by tools via metadata.
This allows:
Hosts to prefetch templates before tool execution, improving performance
Separates presentation (template) from data (tool results), facilitating caching
Security review of UI resources
Alternatives considered:

Embedded resources: Current MCP-UI approach, where resources are returned in tool results. Although it's more convenient for server development, it was deferred due to the gaps in performance optimization and the challenges in the UI review process.
Resource links: Predeclare the resources but return links in tool results. Deferred due to the gaps in performance optimization.
Reusing MCP JSON-RPC instead of a custom protocol
Reuses existing MCP infrastructure (type definitions, SDKs, etc.)
JSON-RPC offers advanced capabilities (timeouts, errors, etc.)
Alternatives considered:

Custom message protocol: Current MCP-UI approach with message types like tool, intent, prompt, etc. These message types can be translated to a subset of the proposed JSON-RPC messages.
Global API object: Rejected because it requires host-specific injection and doesn't work with external iframe sources. Syntactic sugar may still be added on the server/UI side.
HTML-only MVP
HTML is universally supported and well-understood
Simplest security model (standard iframe sandbox)
Allows screenshot/preview generation (e.g., via html2canvas)
Sufficient for most observed use cases
Provides a clear baseline for future extensions
Alternatives considered:

Include external URLs in MVP: This is one of the easiest content types for servers to adopt, as it's possible to embed regular apps. However, it was deferred due to concerns around model visibility, inability to screenshot content, and review process. It may effectively be supported with the SEP's new externalIframes capability.
Backward Compatibility
The proposal is an optional extension to the core protocol. Existing implementations continue working without changes.

Reference Implementation
The MCP-UI client and server SDKs support the patterns proposed in this spec.

Olivier Chafik has developed a prototype in the ext-apps repository.

Security Implications
Hosting interactive UI content from potentially untrusted MCP servers requires careful security consideration.

Based on the threat model, MCP Apps proposes the following mitigations:

Iframe sandboxing: All UI content runs in sandboxed iframes with restricted permissions
Predeclared templates: Hosts can review HTML content before rendering
Auditable messages: All UI-to-host communication goes through loggable JSON-RPC
User consent: Hosts can require explicit approval for UI-initiated tool calls
You can review the threat model analysis and mitigations in the full spec.

Related
New Content Type for "UI" (#1146) by @kentcdodds

This is a long-awaited addition to the spec, the result of months of work by the MCP community and early adopters. We encourage you to:

Review the full proposal
Experiment with the reference implementations and SDKs (MCP-UI and ext-apps)
Share your feedback in this PR, on the #ui-cwg channel on MCP Discord, and its dedicated MCP-UI Discord.
@idosal
docs: add extensions.mdx
290629c
@idosal idosal marked this pull request as ready for review 2 months ago
@idosal idosal requested a review from a team as a code owner 2 months ago
@idosal
Document extensions for Model Context Protocol
87ccd31
@ochafik ochafik mentioned this pull request on Nov 22, 2025
React renderer for MCP Apps MCP-UI-Org/mcp-ui#147
Merged
@idosal idosal changed the title docs: add extensions.mdx SEP-1865: MCP Apps: Interactive User Interfaces for MCP on Nov 22, 2025
@idosal idosal changed the title SEP-1865: MCP Apps: Interactive User Interfaces for MCP SEP-1865: MCP Apps -Interactive User Interfaces for MCP on Nov 22, 2025
@idosal idosal changed the title SEP-1865: MCP Apps -Interactive User Interfaces for MCP SEP-1865: MCP Apps - Interactive User Interfaces for MCP on Nov 22, 2025
@localden localden added proposal SEP labels on Nov 22, 2025
@adamesque
adamesque
commented
on Nov 23, 2025
This is exciting to see! I see that as with current MCP-UI and Apps SDK specs, this covers allowing UI to request tool calls and rerender in a way that keeps the agent in the loop. But does this proposal intentionally not address mechanisms to close the loop in the other direction, to flow related tool call data from subsequent conversational turns back into an already rendered widget? Or is the ability to read (and subscribe to?) resources directly from within a widget intended for this purpose?

Suppose I have a getItemDetails tool that renders a Book widget, and then in a subsequent turn a user utterance triggers a setItemStatus tool which mutates a status field. How should the change be communicated to the widget so it can rerender?

@SvetimFM
SvetimFM
commented
on Nov 23, 2025
•
That’s not an MCP limitation is it? (roll your own MCP and chat interface and there’s no issue rendering video or html or whatever), that is a UI of chat bots limitation. You don’t NEED to give the model back text data over MCP - a tool can be triggered and vend auth’d data of any kind to the interface.

What am I missing? Why concretize a general communication/auth protocol spec within one specific usecase?

@adriannoes
adriannoes
commented
on Nov 23, 2025
Fantastic work on this PR.. really sharp update.

Introducing this resource declarations and a bi-directional UI communication model feels like a big step toward unlocking richer and more interactive MCP clients.

One question: how do you envision capability negotiation evolving for UI-enabled resources once multiple client types adopt this pattern?

I'm curiosa whether you see a standardized handshake emerging or if it stays client-specific for now.

@liady
Merge branch 'main' into main
a6a7b0e
@PederHP
Member
PederHP
commented
on Nov 23, 2025
•
That’s not an MCP limitation is it? (roll your own MCP and chat interface and there’s no issue rendering video or html or whatever), that is a UI of chat bots limitation. You don’t NEED to give the model back text data over MCP - a tool can be triggered and vend auth’d data of any kind to the interface.

What am I missing? Why concretize a general communication/auth protocol spec within one specific usecase?

In "base" MCP there is no way to distinguish between what is for the model and what is for the application. The OpenAI Apps SDK worked around this by putting the UI in structured output and the for-model result in regular unstructured / text tool output. But that's actually not standards-compliant (the structured and unstructured output is supposed to be the same as of current spec), and it prevents the use of structured output for other things.

By using metadata it becomes much more explicit what is the tool result and what is the tool app/ui/visualization component. It is important to distinguish between context for the model and for the application. You don't want to send context for the application to the model, as the model doesn't have direct access to the UI (at least not without calling another tool, and that'd be a very roundabout way to accomplish the same thing).

Also, this is an extension, so it is purely additive. It's a great way to let something that is bound to evolve and need continuous adjustments not get bogged down by only being allowed to change with spec versions.

You're right that if you're rolling your own MCP server and client host, then you can already do this using whatever scheme you want - but the beauty of a standardized extension is that we have less risk of ending up with a unique UI / Apps contract per client host.

Ideally as a server author, you'd want your MCP server to be able to render UI to all chat platforms without having to use a different communication convention for each of them. And simply returning the UI resource to the model is not a solution. The model is not an active participant in rendering the UI - that's an application-level concern.

Finally, the whole in-frame messaging part of this extension is non-trivial to design and engineer, so having a standardized way to that is highly valuable. See: https://github.com/modelcontextprotocol/ext-apps/blob/main/specification/draft/apps.mdx#transport-layer

@olaservo olaservo mentioned this pull request on Nov 23, 2025
[RFC] UI Component Integration in MCP Responses modelcontextprotocol-community/working-groups#35
Closed
@jpmcb
Contributor
jpmcb
commented
on Nov 24, 2025
•
Many questions:

1. Why bring this application implementation into the protocol itself?
   This, along with OpenAI's implementation of the Apps SDK, is not bounded by the MCP specification.

@PederHP makes a good point:

this is an extension, so it is purely additive. It's a great way to let something that is bound to evolve and need continuous adjustments not get bogged down by only being allowed to change with spec versions.

Then I would say this should be rejected as a SEP (since it's not apart of the specification) and instead, documented as a "best practice" or "official extension". The docs site already has precedence for this in the roadmap: https://modelcontextprotocol.io/development/roadmap#official-extensions

As MCP has grown, valuable patterns have emerged for specific industries and use cases. Rather than leaving everyone to reinvent the wheel, we’re officially recognizing and documenting the most popular protocol extensions.

If we do bring this through a SEP, it will be bounded by the main MCP specification. If a SEP is the right avenue for this, then I encourage the MCP maintainers to revisit the SEP Guidelines as they clearly state a SEP is for the protocol (maybe we need an "official extension support proposal" avenue?)

I missed this https://github.com/modelcontextprotocol/ext-apps 🤦🏼 - this getting a SEP in modelcontextprotocol/modelcontextprotocol is confusing: we should revisit how these get proposed and evaluated

2. Spec bloat
   One of my main worries with bringing this into the main spec is that we continue to over complicate an already bloated and bifurcated specification: I know of no other MCP servers that implement extensions and encouraging official support for this will make server implementors lives harder (vs. encouraging this as a best practice). I would point to the following discussions on how fractured the community is and the difficulty server builders / maintainers have had over the last year:

stateless vs. stateful: SEP-1442: Make MCP Stateless (by default) #1442
HTTP streamable: [RFC] Replace HTTP+SSE with new "Streamable HTTP" transport #206
Various authorization discussions, now removing DCR as a "must" in favor of client metadata URLs: SEP-991: Enable URL-based Client Registration using OAuth Client ID Metadata Documents #991 3) JSON RPC \_meta for non-llm context window content for/from tools
My main criticism of this SEP and OpenAI's Apps SDK, is that it uses the free \_meta object field in the JSON RPC requests and responses for defining critical UI/App/Implementation layer logic that is not intended for the LLM. This, to me, smells like we're trying to fit a round peg through a square hole: MCP was originally designed as a relatively simple protocol for lite-weight agentic "discovery" of tools and resources to populate the context window with the necessary tool schemas, tool results, resource data, etc.

If the metadata is intended for the tool, it should be in the tool request. If the tool is providing specific implementation details, it should be in the tool response. Therefore, why not hoist metadata into the tool specification and codify that it is specifically intended for non-LLM context from the tool call/result?

export interface CallToolRequest extends Request {
method: "tools/call";
params: {
name: string;
arguments?: { [key: string]: unknown };
metadata?: { [key: string]: unknown };
};
}

export interface CallToolResult extends Result {
content: ContentBlock[];
structuredContent?: { [key: string]: unknown };
metadata?: { [key: string]: unknown };
isError?: boolean;
}
I know this would have additional benefits outside of this extension proposal but loops me back to question 1 and 2 since it would require core spec changes.

4. Where is the room for community discourse?
   Dropping a blog post in conjunction with OpenAI the day this SEP is posted / accepted feels like it's a done deal (while some of the discourse I've read is generally negative / confused: https://news.ycombinator.com/item?id=46020502). As someone who works at a very small vendor providing MCP capabilities, I often feel very out of the loop on these sorts of big decisions: I'm not a fan of Discord since there is just sooo much going on in there and it seems these big decisions just come down from the mount without community feedback.

@PederHP
Member
PederHP
commented
on Nov 24, 2025
Regarding ui/message and

Host SHOULD add the message to the conversation thread, preserving the specified role.

To me this seems like something that SHOULD require a user approval. Giving the server the ability to inject arbitrary messages into the conversation without user approval seems like a problematic pattern. I know there is an increased reliance on trusting the server, but there may also be non-malicious cases where the user simply does not want the inject message for whatever reason.

@idosal
Contributor
Author
idosal
commented
on Nov 24, 2025
•
This is exciting to see! I see that as with current MCP-UI and Apps SDK specs, this covers allowing UI to request tool calls and rerender in a way that keeps the agent in the loop. But does this proposal intentionally not address mechanisms to close the loop in the other direction, to flow related tool call data from subsequent conversational turns back into an already rendered widget? Or is the ability to read (and subscribe to?) resources directly from within a widget intended for this purpose?

Suppose I have a getItemDetails tool that renders a Book widget, and then in a subsequent turn a user utterance triggers a setItemStatus tool which mutates a status field. How should the change be communicated to the widget so it can rerender?

@adamesque Great use case! Currently, the SEP doesn't explicitly address that flow, but it does support patterns that enable it. For example -

A Host may choose to update an existing Guest UI with new tool input/output rather than re-render it based on arbitrary conditions (e.g., matching tool + display mode). This part may need more structure (though I can see cases where hosts would want to handle it differently). The tool's inputs/outputs can mirror the updated state either by contacting the MCP server (e.g., by calling a compatible tool that now includes the updated data) or locally (e.g., by having the agent append the new data to the existing data).
Guest UIs can query their backend for external updates (e.g., via tool call, resource read, or directly given CSP config)
It's likely a common use case that requires clarification and guidance. However, I'm not sure that the MVP should enforce specific behavior at this point. We can definitely discuss it.

@idosal
Contributor
Author
idosal
commented
on Nov 24, 2025
Fantastic work on this PR.. really sharp update.

Introducing this resource declarations and a bi-directional UI communication model feels like a big step toward unlocking richer and more interactive MCP clients.

One question: how do you envision capability negotiation evolving for UI-enabled resources once multiple client types adopt this pattern?

I'm curiosa whether you see a standardized handshake emerging or if it stays client-specific for now.

@adriannoes Host<>UI capability negotiation is implemented in the SDK and mentioned in the spec as part of the ui/initialization handshake (see hostCapabilities), but I now see that the internal structure is omitted. Thanks for catching it! I'll update it tomorrow.

We'd love to hear your feedback! I'll note that we need to review the internal structure and ensure it includes the fields we need for the MVP.

@idosal
Contributor
Author
idosal
commented
on Nov 24, 2025
•
Regarding ui/message and

Host SHOULD add the message to the conversation thread, preserving the specified role.

To me this seems like something that SHOULD require a user approval. Giving the server the ability to inject arbitrary messages into the conversation without user approval seems like a problematic pattern. I know there is an increased reliance on trusting the server, but there may also be non-malicious cases where the user simply does not want the inject message for whatever reason.

@PederHP It came up, and it's definitely worth further discussion. I think it warrants a thread in #ui-cwg.

@darrelmiller
darrelmiller
commented
on Nov 25, 2025
@idosal I noticed in the proposal the use of the media type text/html+mcp. I would like to suggest an alternative, but before I do I want to explain why the proposed name is not a good choice.

Media Type suffixes (+json, etc) are intended to communicate an underlying format that the new media type is based on. e.g. image/svg+xml indicates that content can be processed as xml.
+mcp is not itself a format with any kind of syntax and semantics. It is a protocol. I also don't think the intent here is to suggest that the text/html is something other than HTML text. By definition, text/html+mcp isn't text/html, it is something else.

If in the future there was a decision to try and register this media type, it is highly unlikely that the registration would be allowed. I say this as one of IANA's media type reviewers.

However, I think I have a proposal that would address your needs and only slightly bend the rules.

This specification https://datatracker.ietf.org/doc/html/rfc6906#section-3.1 (which is just Informational so doesn't carry any IETF approval) proposes the use of the profile parameter as way of layering additional semantics/constraints onto an existing media type.

My suggestion is to use this:

text/html;profile=mcp

Media type parameters are a commonly used construct. HTML technically only allows the charset parameter, but with some creative license, adding the profile parameter is not likely to cause any problems.

From rfc6909,

In this case, a profile is the appropriate mechanism to
signal that the original semantics and processing model of the media
type still apply, but that an additional processing model can be used
to extract additional semantics.

This is ideal because it allows the content to still be treated like text/html but you have the clear indicator that the HTML is intended to be processed using MCP semantics.

@liady
Merge branch 'main' into main
62b072e
@glen-84
glen-84
commented
on Nov 25, 2025
Should the profile maybe be mcp-app and not just mcp? It's more specific.

@tschei-di
tschei-di
commented
on Nov 25, 2025
Agent-Driven UI Navigation

Question: Would it make sense to document "UI control" patterns alongside MCP Apps? Many complex applications (network visualization, CAD tools, enterprise dashboards, ...) might benefit from agent-guided navigation beyond embedded widgets. I believe the two patterns are complementary.

Background:
We have built an MCP server that controls a network visualization application via WebSocket bridge. Key difference from MCP Apps:

MCP Apps: Embed tool result widgets in chat (charts, forms, interactive outputs)
Our approach: Remote control of existing full-featured applications/UI (navigation, filtering, context preservation)
Potential synergy:

MCP Apps widget displays summary (in our case e.g. "5 critical network devices found")
User clicks device in widget
Widget uses ui/open-link with deep-link URL including preserved context
Full application opens at exact view (device highlighted on topology map, current network/snapshot maintained)
This combines MCP Apps' inline interactivity with full application depth. Widgets act as gateways to rich, stateful exploration.

@darrelmiller
darrelmiller
commented
on Nov 25, 2025
@glen-84 I don't have much visibility into what the range of values could be for the profile. I think mcp-app is fine too.

@antonpk1
antonpk1
commented
on Nov 25, 2025
Thanks for the thoughtful feedback, @darrelmiller! Really appreciate the insight, especially given your experience with IANA.

I agree that text/html+mcp isn't semantically correct - we chose it pragmatically since the MIME type serves as an identifier to trigger the MCP Apps protocol, also it's simple and easy to remember.

The profile parameter is interesting, but adds parsing complexity since we'd need to normalize all valid permutations (text/html;profile=mcp, text/html; profile=mcp, text/html;profile="mcp", text/html ; profile=mcp, etc.) for what's essentially a lookup key.

Does that tradeoff make sense given the use case, or do you think the profile approach is still worth it?

@PederHP
Member
PederHP
commented
on Nov 26, 2025
•
It would be very useful to have a way to push context to the host application without necessarily triggering a user message. Something like ui/notifications/context-update that the host accumulates and injects as system context or a specially-marked message when the user next interacts.

Consider an MCP App that tracks some activity, like a build/release dashboard. We want the app to be able to push user interactions (like when the user triggers a new build or deployment via the UI) or when state changes (a deployment changed from in-progress to done). Doing this with ui/message gets very spammy and also requires careful prompt engineering so the model doesn't get confused and thinks the state update was written by the user. And we might not want to trigger a new inference loop for performance / cost reasons. Even if the application has an approval flow, I think it might feel intrusive and annoying to users if Apps trigger conversational turns regularly - or even at all.

By adding a sort of context buffer for the server / ui to push to we leave it up to the host how to handle these concerns, which I think is a good pattern, and allows this extension to be useful in a variety of contexts from autonomous agents to conversational AI on a variety of device form factors.

I'll open a thread on Discord for this as well.

@darrelmiller
darrelmiller
commented
on Nov 26, 2025
@antonpk1 I am contractually bound to say you should not use a media type that is not registered and is structurally invalid. :-)

However, I do understand your concern over adding unnecessary complexity. There are two mitigations:

One is that there are lots of parsing libraries that do make some of that normalization go away. Especially now that Structured Fields are a thing. https://www.rfc-editor.org/rfc/rfc9651.html

The other is that you are free to mandate that people use the exact string text/html;profile=mcp. It is a few more characters but it would be functionally equivalent to text/html+mcp as a lookup value and compliant with media type syntax.

You do what you think is right for your community, but I will say that from experience, complying with existing standards does generally provide long term benefits, especially when the cost to do so is low.

@adamesque
adamesque
commented
on Nov 26, 2025
It's likely a common use case that requires clarification and guidance. However, I'm not sure that the MVP should enforce specific behavior at this point. We can definitely discuss it.

@idosal I think it's worth a discussion — in my mind, without explicitly addressing this, we're not able to "close the agentic loop" for UI, where agents that render UI can not only see the information presented but collaborate on / assist with it. We've seen the need for more formal patterns around this at Indeed.

A Host may choose to update an existing Guest UI with new tool input/output rather than re-render it based on arbitrary conditions (e.g., matching tool + display mode). This part may need more structure (though I can see cases where hosts would want to handle it differently). The tool's inputs/outputs can mirror the updated state either by contacting the MCP server (e.g., by calling a compatible tool that now includes the updated data) or locally (e.g., by having the agent append the new data to the existing data).

Agree that more structure would be helpful b/c as currently written I don't believe this spec is clear enough around subsequent host-initiated update mechanisms — if it's permissible for the host to supply tool-result updates not- requested by the UI during the interactive phase, it would be good to include it there. It's possible some sort of widget or resource key should be returned in tool result meta if tool call data is intended to be merged into an existing widget.

Guest UIs can query their backend for external updates (e.g., via tool call, resource read, or directly given CSP config)

I think unless the intent is to poll (or subscribe), the spec doesn't describe the Host -> Guest events that should trigger these updates to ensure the UI stays in sync with model data as conversation-initiated tool calls occur. Generally I would prefer other mechanisms than a "please refetch" message.

One other piece that has come up in internal discussions at Indeed is that this spec doesn't provide a mechanism similar to Apps SDK widget state. Without this, it's unclear how a guest UI can communicate:

ephemeral things like selection state in a way the model can interpret (user selects an item and then utters "tell me more about this" h/t @mihalik)
which data beyond the initial tool call result the host should supply if the underlying view/page is reloaded in order to restore the guest UI
The first could probably be achieved via a tool call and might only need a recommendation, but the second seems fairly important since the spec does provide for interactive phase UI-initiated tool calls that can result in UI updates. Currently a widget would have to wait for both initialization and at a minimum ui/tool-input to then make a request to its own backend to get a last-saved state snapshot (if one exists).

Specifying such a backend is well outside the scope of a spec like this but feels some part should discuss the reload flow. Otherwise I think it's likely unsophisticated implementors will build out-of-the-box broken experiences.

Finally, the spec includes displayMode in the HostContext interface but doesn't define a guest -> host message to request a different displayMode. Is that an intentional omission?

Thanks!

28 hidden items
Load more…
@idosal
Contributor
Author
idosal
commented
on Dec 8, 2025
•
Hi team! 👋

We're implementing MCP Apps support and noticed a few things that might be inconsistencies (though we may be misunderstanding the intent):

1. ui/tool-cancelled naming

This doesn't follow the ui/notifications/ pattern used by other Host→UI notifications (tool-input, tool-result, tool-input-partial). Should it be ui/notifications/tool-cancelled?

2. ui/notifications/size-change direction

The spec says "Guest UI SHOULD send this notification..." (UI→Host), but other ui/notifications/\* methods appear to be Host→UI. Is this intentional, or are we misreading the pattern?

Nothing blocking and thanks for all the work on this! 🙏

Thanks @paul1868! Happy to hear it supports your use case.

Great catch! I'll open a PR shortly.
This event is from the UI to the Host. The idea is that the Host may choose to adjust the container's size to accommodate the UI rather than force constant dimensions.
@idosal
Contributor
Author
idosal
commented
on Dec 10, 2025
Thanks for your impressive work! Here are my questions and suggestions:

Rethinking the 1:1 Relationship Between UI Resources and Tools in MCP Apps
In MCP Apps SEP, it's mentioned that a UI resource is associated with a specific Tool through \_meta.

Tools are associated with UI resources through the \_meta field:
interface Tool {
name: string;
description: string;
inputSchema: object;
\_meta?: {
// Required: URI of the UI resource to use for rendering
"ui/resourceUri"?: string;
};
}

This implies a one-to-one relationship between the UI resource and the result of a tool call. However, in real-world scenarios, rendering a UI resource may depend on the combination of multiple tool call results(i think this is very common). For example, an MCP server might already have tools like get_humidity and get_temperature to fetch different types of weather data via different APIs. In this situation, if a weather_dashboard UI resource requires both humidity and temperature data to render, we have three options:

Register a new get_weather_dashboard_data Tool and bind the UI resource to it
Register a new display_weather_dashboard UI Resource Tool
Build a new separate UI MCP server with display_weather_dashboard UI Resource Tool
How do you suggest developers make their choices? When faced with these choices, i think it reflects a deeper question: is a "UI Resource" merely defined as a by-product of a data-fetching tool, or is there a special kind of MCP tool, which we could call a "UI Resource Tool"?

UI Resource Tool vs Tool with UI Resource
I believe that UI Resources need their own dedicated tool: UI Resource Tool. It would still be a standard MCP Tool that conforms to existing specifications, but its role would be unique: to return a specific UI resource along with the data required to render it.

The LLM wouldn't need to be aware of the UI resource itself, but it would need to understand its purpose (from the description ) and its data dependencies (from the inputSchema, which is very important for data pre-validation). This would allow the Agent to autonomously call the tool and construct the data inputs, thereby maximizing its intelligent capabilities. If we only treat a UI Resource as a by-product of another tool, I believe the potential of the resource is severely limited.

Introducing a dedicated class of UI Resource Tools offers another advantage: it promotes the reusability of UI components. For example, the results from both search_hotel and get_booked_hotel tool calls could be visualized for the user with a single display_hotel_list UI Resource Tool.

Furthermore, this would foster the emergence of general-purpose UI MCP Servers, such as common charting libraries or log viewers. Developers could simply add them to achieve stunning interactive effects on the client-side. The UI Resource would no longer be bound in a 1:1 relationship with a specific data-fetching tool.

UI Resource Tool vs Resource Tool
If we take this a step further, a UI Resource is just one specific type of Resource . As the Agent ecosystem evolves, will clients require other types of Resources besides UI ones? I believe the answer is a definite yes.

This leads to the question: should the extension we introduce be a UI Resource Tool , or should it be a more general, standardized, and extensible Resource Tool?

Adjustments to the Tool Interface Definition
If we evolve the concept from a "Tool with a UI Resource" to a "Resource Tool," then our design should not be limited to just MCP Apps. We need to consider how to meet the potential needs of developers for "Resources" in other future scenarios.

I believe the existing Tool type definition requires some adjustments.

// Current - Tool with UI Resource
interface Tool {
name: string;
description: string;
inputSchema: object;
\_meta?: {
"ui/resourceUri"?: string; // Required: URI of the UI resource to use for rendering
};
}

// New - Resource Tool
interface Tool {
name: string;
description: string;
inputSchema: object;
\_meta?: {
resources?: {
uri: string;
mimeType: "text/html+mcp" | string;
}[]
};
}
A Tool should be able to associate wit resource via a \_meta.resources or \_meta.resource field. Resource would be identified by its uri , and a mimeType would help the host understand its purpose. In reality, the current SEP's approach of adding a URI with the ui/resourceUri key is an implicit way of assigning a mimeType , but I believe it's not an elegant solution.

Finally, it should be noted that the "Resource Tool" is an additive extension, ensuring full backward compatibility with the current "Tool with Resource" model. Developers will have the flexibility to either create a new class of dedicated Resource Tools or bind a Resource to an existing tool; the two approaches are not mutually exclusive.

Thanks @taozhongxiao!

Supporting multiple resources is indeed a future direction (see Advanced Features in the full spec). As @PederHP said, supporting it in the MVP may be an unnecessary complication for now.
Creating a Tool linked to a Resource doesn't necessarily force you to fetch all data in the same call. Apps have multiple other mechanisms to fetch data (e.g., tools/call, resources/read, toolInput, backend communication, etc.), which theoretically supports the different use cases you've laid out.
@liady
Contributor
liady
commented
on Dec 11, 2025
@paul1868

ui/notifications/size-change direction
Note that it's now ui/notifications/size-changed - to align with the other notifications past-tense style.
Generally - it's meant for mostly vertical axis size changes from inside the UI that should not trigger a scroll bar, but feel inline (for example expanding and collapsing an item card). The UI can of course send this message for any size change it wants to communicate.
The host can decide if/how to respect it - again in most of the inline displays it makes sense to respect it up to some maximal height.

@liady
Merge branch 'main' into main
a75de9b
@keesvandorp keesvandorp mentioned this pull request on Dec 11, 2025
MCP-UI Support / MCP Apps - Interactive User Interfaces for MCP vercel/ai-elements#285
Open
@dokterbob dokterbob mentioned this pull request on Dec 15, 2025
Dynamic UI support through MCP UI / MCP Apps synergyai-nl/svelte-langgraph#160
Open
@qchuchu qchuchu mentioned this pull request on Dec 18, 2025
Set 1 Resource per Mime Type alpic-ai/skybridge#111
Closed
@pdparchitect
pdparchitect
commented
on Dec 19, 2025
One of the downsides of the spec is that all the UI pages are defined in advance as resources. I fail to see how this model will fit when the resources are dynamically generated. For example, imagine an AI agent that writes its own UI based on the user input.

@PederHP
Member
PederHP
commented
on Dec 19, 2025
One of the downsides of the spec is that all the UI pages are defined in advance as resources. I fail to see how this model will fit when the resources are dynamically generated. For example, imagine an AI agent that writes its own UI based on the user input.

Resources can be dynamically generated, even if the uri is static. MCP fully supports that pattern unlike what some think or teach. Some SDKs even make it easy to do so.

@pushpak1300 pushpak1300 mentioned this pull request on Dec 20, 2025
Make it simple to build a ChatGPT app laravel/mcp#78
Closed
@idosal idosal mentioned this pull request 3 weeks ago
Built-in support for MCP Apps (nee MCP-UI) microsoft/vscode#260218
Closed
@fredericbarthelet fredericbarthelet mentioned this pull request 3 weeks ago
Protocol discrepancies between MCP Apps and Apps SDK modelcontextprotocol/ext-apps#201
Open
@kentcdodds
Contributor
kentcdodds
commented
3 weeks ago
@PederHP for ChatGPT (at least) caches the resource so it may as well be static. Unless something has changed.

@github-actions
github-actions bot
commented
2 weeks ago
Maintainer Activity Check
Hi @dsp-ant!

You're assigned to this SEP but there hasn't been any activity from you in 44 days.

Please provide an update on:

Current status of your review/work
Any blockers or concerns
Expected timeline for next steps
If you're no longer able to sponsor this SEP, please let us know so we can find another maintainer.

This is an automated message from the SEP lifecycle bot.

@ferrants
ferrants
commented
last week
ChatGPT's spec also simply uses the window object, window.openai so it's easy to use with vanilla js without any libraries. It would be nice for the spec to outline a no-library method of how to use it instead of needing to install libraries to use it. Less heavy, simpler.

@liady
Contributor
liady
commented
last week
•
@ferrants note that the spec itself is implementation agnostic - it only specifies the messages that are being sent/receieved using the native window.postMessage. It doesn't rely on any SDK.
This is actually more abstract than using something likewindow.openai - since it doesn't assume any SDK is being injected to the runtime code. It's low level and easy to check/implement clients for.
It's very similar to MCP itself - where the spec is implementation agnostic and you also have "official" convenience SDKs for different environments.

@localden localden added this to SEP Review Pipeline last week
@localden localden moved this to Draft in SEP Review Pipeline last week
@localden localden moved this from Draft to In Review in SEP Review Pipeline 4 days ago
@localden localden added the extension label 4 days ago
@localden
Contributor
localden
commented
4 days ago
@idosal @liady - thoughts on closing this, given the recent progress? @pja-ant is tracking a more generic extension definition in #2133.

@idosal
Contributor
Author
idosal
commented
4 days ago
•
@idosal @liady - thoughts on closing this, given the recent progress? @pja-ant is tracking a more generic extension definition in #2133.

I think it'd be valuable to merge this to maintain the context gathered here. It's also the PR everyone links to, so marking it as "Closed" might cause confusion.

Regarding the change itself, the idea was to add MCP Apps to the website as described in SEP-1724, but I can easily change it to whatever makes sense now.

@nablex
nablex
commented
2 days ago
MCP servers provide gated access to a potentially encapsulated dataset. The encapsulation here means that the user might not have any obvious other ways to interact with it.

When a human is using an AI assistant, it can be useful to provide a way to visualize or interact with that data. This UI is not linked to any single tool call but is associated with the MCP server as a whole and the dataset it represents.

As an example, I have a file server that exposes all the usual file-handling tools to an MCP agent. These tools work as normal, and the LLM can interact with them as expected.

I want to provide the user with an interactive file browser that reuses a combination of the existing MCP tools into a more human-friendly experience.

I suggest we consider categorizing a UI resource as a standalone entry point, an application on its own, which is not tied to a particular tool. For example:

{
"uri": "ui://application/file-browser",
"type": "application",
"mime": "text/html+mcp"
}
Because it is entirely optional and only aides a human user, it can be safely ignored by tools that do not support these UIs or are fully automated anyway.

idosal added 3 commits yesterday
@idosal
Merge branch 'main' into main
1b174fc
@idosal
update link to spec in extensions page
9dc7d39
@idosal
prettier
5e8f042
localden
localden approved these changes yesterday
@localden localden added final and removed draft labels yesterday
@idosal
Merge branch 'main' into main
314098e
Merge info
Changes approved
1 approving review by reviewers with write access.

All checks have passed
2 successful checks

No conflicts with base branch
Changes can be cleanly merged.

@shanggqm

Add a comment
Comment

Add your comment here...
Remember, contributions to this repository should follow its contributing guidelines, security policy, and code of conduct.
ProTip! Add .patch or .diff to the end of URLs for Git’s plaintext views.
Reviewers
Copilot code review
Copilot
@localden
localden
Still in progress?
Assignees
@dsp-ant
dsp-ant
Labels
extension
final
SEP
Projects
SEP Review Pipeline
Status: In Review
Milestone
No milestone
Development
Successfully merging this pull request may close these issues.

None yet

Notifications
Customize
You’re not receiving notifications from this thread.
20 participants
