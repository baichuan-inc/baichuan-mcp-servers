# 接口说明

> 在使用 API 接口前，请先在百川 API 开放平台完成实名认证、充值、创建 APIkey 等流程，如下图所示

![Alt text](https://platform-cdn.baichuan-ai.com/openapi/20231218/doc-guide.webp)

## 1. 发起请求

本章将为您介绍如何发起一次 api 请求，api 有两种接口形式，分别是同步接口和流式接口，通过请求参数来区分

### 1.1 接口信息

**HTTP 方法：** `POST`  
**请求 URL：** `https://api.baichuan-ai.com/v1/chat/completions`

### 1.2 请求参数

#### 1.2.1 HTTP Header 参数

| 参数名          | 类型   | 必填 | 描述                                                             |
| --------------- | ------ | ---- | ---------------------------------------------------------------- |
| `Content-Type`  | string | Y    | 请求的数据格式，目前仅支持 JSON 格式，固定填写"application/json" |
| `Authorization` | string | Y    | 请求鉴权的 APIKey，由百川提供。Bearer 开头                       |

#### 1.2.2 HTTP Body 参数

| 参数名                  | 二级参数         | 三级参数      | 四级参数  | 类型              | 必填   | 描述                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ----------------------- | ---------------- | ------------- | --------- | ----------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `model`                 | -                | -             | -         | string            | 是     | 使用的模型 ID，列表：<br/>Baichuan-M3-Plus<br/>Baichuan-M3<br/>Baichuan-M2-Plus<br/>Baichuan-M2<br/>Baichuan4-Turbo<br/>Baichuan4-Air<br/>Baichuan4<br/>Baichuan3-Turbo<br/>Baichuan3-Turbo-128k<br/>Baichuan2-Turbo                                                                                                                                                                                                                                                             |
| `messages`              | -                | -             | -         | array[json]       | 是     | 对话消息列表 (历史对话按从老到新顺序填入)                                                                                                                                                                                                                                                                                                                                                                                                                                        |
|                         | `role`           | -             | -         | string            | 是     | 消息作者的角色，为以下其中之一 1、`user` 2、`assistant` 3、`system` 4、`tool`<br/>支持`system`的模型：<br/>Baichuan-M3<br/>Baichuan-M2<br/>Baichuan4-Turbo<br/>Baichuan4-Air<br/>Baichuan4<br/>Baichuan3-Turbo<br/>Baichuan3-Turbo-128k<br/>Baichuan2-Turbo<br/>当`role`为`system`时，此条 message 必须放在历史对话列表的第一条<br/>支持`tool`的模型：<br/>Baichuan4-Turbo<br/>Baichuan4-Air<br/>Baichuan4<br/>Baichuan3-Turbo<br/>Baichuan3-Turbo-128k<br/>Baichuan2-Turbo<br/> |
|                         | `content`        | -             | -         | object            | 是     | 消息内容，`string`或`array[json]`类型                                                                                                                                                                                                                                                                                                                                                                                                                                            |
|                         | -                | -             | -         | string            | 否     | `content`为`string`类型时，消息内容为普通文本                                                                                                                                                                                                                                                                                                                                                                                                                                    |
|                         | -                | -             | -         | array[json]       | 否     | `content`为`array[json]`类型时，消息内容为文本结构或者上传的文件意图为`medical`且解析成功的文件结构（仅Baichuan-M2-Plus/Baichuan-M3-Plus模型对话支持文件结构）。 具体见下                                                                                                                                                                                                                                                                                                        |
|                         | -                | `type`        | -         | string            | 否     | **content为array[json]类型时填写此字段**，内容类型，必须为`text`或者`file`两者中一个                                                                                                                                                                                                                                                                                                                                                                                             |
|                         | -                | `text`        | -         | string            | 否     | **content为array[json]类型时填写此字段**，当 type 为 `text` 时，填写的消息文本，参考附录4.1.2 或 4.2.2                                                                                                                                                                                                                                                                                                                                                                           |
|                         | -                | `file`        | -         | object            | 否     | **content为array[json]类型时填写此字段**，当 type 为 `file` 时，填写的文件内容，参考附录4.1.3 或 4.2.3                                                                                                                                                                                                                                                                                                                                                                           |
|                         | -                | -             | `file_id` | string            | 否     | **content为array[json]类型时填写此字段**，意图为`medical`且解析成功的文件id。文件相关接口参考：https://platform.baichuan-ai.com/docs/file                                                                                                                                                                                                                                                                                                                                        |
|                         | `tool_calls`     | -             | -         | object            | 否     | 模型产生的工具调用消息，具体内容见 function 第一轮对话时返回的消息内容。仅在`role`为`assistant`时可填写。`content`与`tool_calls`二选一。                                                                                                                                                                                                                                                                                                                                         |
|                         | `tool_call_id`   | -             | -         | string            | 否     | `tool`的调用结果记录，仅在`role`为`tool`时填写                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `stream`                | -                | -             | -         | boolean           | 否     | 是否使用流式接口，默认值为 false                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `temperature`           | -                | -             | -         | float             | 否     | 取值范围: [.0f, 1.0f]。 多样性，越高，多样性越好, 缺省 0.3                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `top_p`                 | -                | -             | -         | float             | 否     | 取值范围: [.0f, 1.0f)。值越小，越容易出头部, 缺省 0.85                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `top_k`                 | -                | -             | -         | int               | 否     | 取值范围: [0, 20]。<br/>搜索采样控制参数，越大，采样集大, 0 则不走 top_k 采样筛选策略，最大 20(超过 20 会被修正成 20)，缺省 5                                                                                                                                                                                                                                                                                                                                                    |
| `max_tokens`            | -                | -             | -         | int               | 否     | 回答产生的最大 token 数。取值范围是[1,2048]，默认值 2048，适用于所有模型。                                                                                                                                                                                                                                                                                                                                                                                                       |
| `response_format`       | -                | -             | -         | object            | 否     | 指定模型必须输出的格式的对象。目前仅支持 JSON 模式。<br/>设置为{"type":"json_object"} 启用 JSON 模式<br/>支持`response_format`模型列表：<br/>Baichuan4-Turbo<br/>Baichuan4-Air<br/>Baichuan4<br/>Baichuan3-Turbo<br/>Baichuan3-Turbo-128k<br/>**重要**：在使用 JSON 模式时，您还必须通过 system 或 user 消息指示模型生成 JSON。另外，如果 finish_reason="length"，则消息内容可能会被部分截断，这表明生成超过了 max_tokens 或对话超过了最大上下文长度。                           |
| `tools`                 | -                | -             | -         | array[json]       | 否     | 可供模型调用的工具列表                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
|                         | `type`           | -             | -         | string            | 是     | 工具类型，支持 `retrieval`、`web_search`、`function`三种。<br/>可同时支持多个`function`。<br/>函数调用`function`和 Web 搜索`web_search`或知识库检索`retrieval`，建议不要同时使用，会影响后两者的体验效果。                                                                                                                                                                                                                                                                       |
|                         | `retrieval`      | -             | -         | json              | 否     | 知识库检索<br/>当 Web 搜索字段`with_search_enhance`或`web_search` 与知识库`retrieval` 同时被设置时默认使用知识库检索。开启知识库后不支持场景设定等复杂指令，只支持输入问题。                                                                                                                                                                                                                                                                                                     |
|                         |                  | `kb_ids`      | -         | array[string]     | 是     | 知识库 id 列表                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
|                         |                  | `answer_mode` | -         | string            | 否     | `knowledge-base-only`<br/>仅知识库模式，当检索没有召回，模型不作回答<br/>缺省：<br/>没有召回结果，大模型自身输出结果。                                                                                                                                                                                                                                                                                                                                                           |
|                         | `web_search`     | -             | -         | json              | 否     | Web 搜索，Web 搜索会产生额外的费用<br/>如果 Web 搜索`web_search`与 知识库检索`retrieval` 同时被设置时，Web 搜索不生效。<br/>当`with_search_enhance`与`web_search`同时被设置时，最终以 `web_search`的参数为准。                                                                                                                                                                                                                                                                   |
|                         |                  | `enable`      | -         | boolean           | 否     | 是否开启 Web 搜索<br/>True: 开启<br/>False：不开启（缺省值）                                                                                                                                                                                                                                                                                                                                                                                                                     |
|                         |                  | `search_mode` | -         | string            | 否     | 搜索模式<br/>`performance_first`，性能优先<br/>`quality_first`，效果优先<br/>缺省为 `performance_first`<br/>（备注：如果是评测百川模型的搜索效果，请选择 Baichuan4 模型，并且模式设置为 quality_first，同时不要使用 function call 和 system prompt，具体请查看代码示例 1.8 部分 ）                                                                                                                                                                                               |
|                         | `function`       | -             | -         | json              | 否     | 工具调用<br/>支持`function`的模型列表：<br/>Baichuan4-Turbo<br/>Baichuan4-Air<br/>Baichuan4<br/>Baichuan3-Turbo<br/>Baichuan2-Turbo                                                                                                                                                                                                                                                                                                                                              |
|                         |                  | `name`        | -         | string            | 是     | 调用函数的名称<br/>示例：get_current_weather                                                                                                                                                                                                                                                                                                                                                                                                                                     |
|                         |                  | `description` | -         | string            | 否     | 调用函数的功能描述，模型使用它来选择何时以及如何调用该函数<br/>示例：获取当前位置天气                                                                                                                                                                                                                                                                                                                                                                                            |
|                         |                  | `parameters`  | -         | string            | 否     | 调用函数接受的参数，为 JSON 格式的对象。<br/>若调用函数时不需要传入参数，省略该参数即可<br/>示例：<br/> {<br/> "type": "object",<br/> "properties": {<br/> "location": {<br/> "type": "string",<br/> "description": "城市或者省，如北京"<br/> },<br/> "format": {<br/> "type": "string",<br/> "description": "要使用的温度单位。从用户位置推断。"<br/> }<br/> },<br/> "required": [<br/> "location",<br/> "format"<br/> ]<br/>}                                                  |
| `tool_choice`           | -                | -             | -         | string            | 否     | 控制模型调用哪个工具，仅当工具类型为`function`时补充。<br/>auto，模型可以在生成消息或调用一个或多个工具之间进行选择，缺省值<br/>none，模型不会调用任何工具                                                                                                                                                                                                                                                                                                                       |
| `metadata`              | -                | -             | -         | map               | 否     | 扩展参数                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
|                         | `evidence_scope` | -             | -         | string            | 否     | 证据材料获取范围（仅对Baichuan-M2-Plus/Baichuan-M3-Plus模型生效）。支持 `grounded`、`cited`两种，默认为`grounded`。 <br/>`grounded`已对齐证据， 模型`grounding`阶段中被选取并校验的全部证据材料，但不要求这些证据一定在最终回答中被明确引用。<br/>`cited`已引用证据，在最终模型输出中被明确引用（如通过 citation 编号）的证据材料，是`grounded`证据的子集。                                                                                                                      |
| ~~with_search_enhance~~ | ~~-~~            | ~~-~~         | -         | ~~boolean~~       | ~~否~~ | **废弃**，使用`tools.web_search`替换<br/>~~True: 开启 web 搜索增强，搜索增强会产生额外的费用, 缺省 False~~<br/>                                                                                                                                                                                                                                                                                                                                                                  |
| ~~knowledge_base~~      | ~~-~~            | ~~-~~         | -         | ~~json~~          | ~~否~~ | **废弃**，使用`tools.retrieval`替换                                                                                                                                                                                                                                                                                                                                                                                                                                              |
|                         | ~~ids~~          | ~~-~~         | -         | ~~array[string]~~ | ~~否~~ | ~~知识库 id 列表,当 with_search_enhance 与 knowledge_base 同时被设置时默认使用知识库检索。开启知识库后不支持场景设定等复杂指令，只支持输入问题。~~                                                                                                                                                                                                                                                                                                                               |
|                         | ~~answer_mode~~  | ~~-~~         | -         | ~~string~~        | ~~否~~ | ~~knowledge-base-only：~~<br/>~~仅知识库模式，当检索没有召回，模型不作回答~~<br/>~~缺省：~~<br/>~~没有召回结果，大模型自身输出结果。~~                                                                                                                                                                                                                                                                                                                                           |

备注:  
(1) openapi 支持的编码方式为 `UTF-8`。

### 1.3 同步接口响应参数

##### HTTP Header 响应参数

| 参数名            | 类型   | 描述              |
| ----------------- | ------ | ----------------- |
| `Content-Type`    | string | 响应的数据格式    |
| `X-BC-Request-Id` | string | 请求的唯一标识 ID |

##### HTTP Body 响应参数

| 字段名           | 一级子参数          | 二级子参数          | 三级子参数          | 四级子参数  | 类型        | 描述                                                                                                                                                                         |
| ---------------- | ------------------- | ------------------- | ------------------- | ----------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`             | -                   | -                   | -                   | -           | string      | "Chat Complete"的唯一标识符                                                                                                                                                  |
| `created`        | -                   | -                   | -                   | -           | int         | 创建聊天完成时的 Unix 时间戳（秒）                                                                                                                                           |
| `choices`        | -                   | -                   | -                   | -           | array[json] | 聊天完成选项的列表                                                                                                                                                           |
|                  | `finish_reason`     | -                   | -                   | -           | string      | 模型停止生成 token 的原因，为以下值： 1. stop ：模型达到自然停止点/用户 stop 指令 2. content_filter：被内容过滤器中过滤掉 3. tool_calls：模型命中函数 4. refuse_answer：拒答 |
|                  | `index`             | -                   | -                   | -           | int         | choices 中对应的索引                                                                                                                                                         |
|                  | `message`           | -                   | -                   | -           | json        | 模型生成的聊天完成消息                                                                                                                                                       |
|                  |                     | `role`              | -                   | -           | string      | 消息作者的角色                                                                                                                                                               |
|                  |                     | `content`           | -                   | -           | string      | 消息内容                                                                                                                                                                     |
|                  |                     | `reasoning_content` | -                   | -           | string      | 推理内容，仅调用Baichuan-M2或Baichuan-M3模型时可能会返回                                                                                                                     |
|                  |                     | `tool_calls`        | -                   | -           |             |                                                                                                                                                                              |
|                  |                     |                     | `id`                | -           | string      | 命中函数的唯一标识符                                                                                                                                                         |
|                  |                     |                     | `type`              | -           | string      | 模型使用工具的类型，目前仅有`function`                                                                                                                                       |
|                  |                     |                     | `function`          | -           |             |                                                                                                                                                                              |
|                  |                     |                     |                     | `name`      | string      | 模型命中函数的名称                                                                                                                                                           |
|                  |                     |                     |                     | `arguments` | json        | 模型生成 JSON 格式的函数调用具体参数                                                                                                                                         |
|                  | `thinking`          | -                   | -                   | -           | json        | 思考区状态信息（仅Baichuan-M2-Plus/Baichuan-M3-Plus模型会返回）                                                                                                              |
|                  |                     | `status`            | -                   | -           | string      | 思考状态，包括：`in_progress`，`completed`两种                                                                                                                               |
|                  |                     | `summary`           | -                   | -           | string      | 思考摘要                                                                                                                                                                     |
|                  |                     | `steps`             | -                   | -           | array[json] | 思考步骤                                                                                                                                                                     |
|                  |                     | -                   | `kind`              | -           | string      | 步骤类型，包括：`reasoning`，`searching`，`synthesizing`三种                                                                                                                 |
|                  |                     | -                   | `status`            | -           | string      | 步骤状态                                                                                                                                                                     |
|                  |                     | -                   | `label`             | -           | string      | 步骤标签                                                                                                                                                                     |
|                  | `grounding`         | -                   | -                   | -           | json        | 依据的信息集合（仅Baichuan-M2-Plus/Baichuan-M3-Plus模型会返回）                                                                                                              |
|                  |                     | `evidence`          | -                   | -           | array[json] | 证据信息                                                                                                                                                                     |
|                  |                     | -                   | `ref_num`           | -           | int         | 引用文献编号，从1开始严格递增                                                                                                                                                |
|                  |                     | -                   | `id`                | -           | string      | 文档id                                                                                                                                                                       |
|                  |                     | -                   | `url`               | -           | string      | url                                                                                                                                                                          |
|                  |                     | -                   | `title`             | -           | int         | 标题                                                                                                                                                                         |
|                  |                     | -                   | `title_zh`          | -           | string      | 中文翻译标题                                                                                                                                                                 |
|                  |                     | -                   | `publish_date`      | -           | string      | 发布日期                                                                                                                                                                     |
|                  |                     | -                   | `author`            | -           | int         | 作者，多个用英文逗号分隔                                                                                                                                                     |
|                  |                     | -                   | `journal_name`      | -           | string      | 期刊名                                                                                                                                                                       |
|                  |                     | -                   | `publication_info`  | -           | string      | 出版/发表信息                                                                                                                                                                |
|                  |                     | -                   | `press`             | -           | int         | 出版社                                                                                                                                                                       |
|                  |                     | -                   | `drug_approve_date` | -           | string      | 药品核准日期                                                                                                                                                                 |
|                  |                     | -                   | `evidence_class`    | -           | string      | 证据类型，比如 RCT、Guideline等                                                                                                                                              |
| `model`          | -                   | -                   | -                   | -           | string      | 用于完成聊天的模型                                                                                                                                                           |
| `object`         | -                   | -                   | -                   | -           | string      | 始终为"chat.completion"                                                                                                                                                      |
| `usage`          | -                   | -                   | -                   | -           | json        | 完成请求的使用情况统计信息                                                                                                                                                   |
|                  | `completion_tokens` | -                   | -                   | -           | int         | 生成词中的 token 数                                                                                                                                                          |
|                  | `prompt_tokens`     | -                   | -                   | -           | int         | 提示词中的 token 数                                                                                                                                                          |
|                  | `total_tokens`      | -                   | -                   | -           | int         | 会话的总 token 数                                                                                                                                                            |
|                  | `search_count`      | -                   | -                   | -           | int         | 搜索增强调用次数                                                                                                                                                             |
| `knowledge_base` | -                   | -                   | -                   | -           | json        | 知识库相关响应                                                                                                                                                               |
|                  | `cites`             | -                   | -                   | -           | array[json] | 流式返回在第一帧数据                                                                                                                                                         |
|                  |                     | `title`             | -                   | -           | string      | 文件名称                                                                                                                                                                     |
|                  |                     | `file_id`           | -                   | -           | string      | 文件 id                                                                                                                                                                      |
|                  |                     | `content`           | -                   | -           | string      | 分片内容                                                                                                                                                                     |
|                  | `cite_annotation`   |                     | -                   | -           | -           |                                                                                                                                                                              |
|                  |                     | `value`             | -                   | -           | string      | 大模型输出完整带角标内容                                                                                                                                                     |
|                  |                     | `annotations`       | -                   | -           | array[json] | 引用批注                                                                                                                                                                     |
|                  |                     |                     | `type`              | -           | string      | 批注类型                                                                                                                                                                     |
|                  |                     |                     | `text`              | -           | string      | 在回答内容中需要替换的字符串                                                                                                                                                 |
|                  |                     |                     | `start_index`       | -           | int         | 需要替换字符串的起始位置                                                                                                                                                     |
|                  |                     |                     | `end_index`         | -           | int         | 需要替换字符串的截止位置                                                                                                                                                     |
|                  |                     |                     | `file_citation`     | -           | json        | {<br/> "file_id": "file-abc",<br/> "quote": "引用文档的具体内容"<br/>}                                                                                                       |

### 1.4 流式接口响应参数

##### HTTP Header 响应参数

| 参数名            | 类型   | 描述              |
| ----------------- | ------ | ----------------- |
| `Content-Type`    | string | 响应的数据格式    |
| `X-BC-Request-Id` | string | 请求的唯一标识 ID |

##### HTTP Body 响应参数

| 字段名           | 一级子参数        | 二级子参数          | 三级子参数          | 四级子参数  | 类型        | 描述                                                                                                                                                                         |
| ---------------- | ----------------- | ------------------- | ------------------- | ----------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`             | -                 | -                   | -                   | -           | string      | "Chat Complete"的唯一标识符                                                                                                                                                  |
| `created`        | -                 | -                   | -                   | -           | int         | 创建聊天完成时的 Unix 时间戳（秒）                                                                                                                                           |
| `choices`        | -                 | -                   | -                   | -           | array[json] | 聊天完成选项的列表                                                                                                                                                           |
|                  | `finish_reason`   | -                   | -                   | -           | string      | 模型停止生成 token 的原因，为以下值： 1. stop ：模型达到自然停止点/用户 stop 指令 2. content_filter：被内容过滤器中过滤掉 3. tool_calls：模型命中函数 4. refuse_answer：拒答 |
|                  | `index`           | -                   | -                   | -           | int         | choices 中对应的索引                                                                                                                                                         |
|                  | `delta`           | -                   | -                   | -           | json        | 增量返回，由流式模型生成的聊天完成消息                                                                                                                                       |
|                  |                   | `role`              | -                   | -           | string      | 消息作者的角色                                                                                                                                                               |
|                  |                   | `content`           | -                   | -           | string      | 消息内容                                                                                                                                                                     |
|                  |                   | `reasoning_content` | -                   | -           | string      | 推理内容，仅调用Baichuan-M2或Baichuan-M3模型时可能会返回                                                                                                                     |
|                  |                   | `tool_calls`        | -                   | -           |             |                                                                                                                                                                              |
|                  |                   |                     | `id`                | -           | string      | 命中函数的唯一标识符                                                                                                                                                         |
|                  |                   |                     | `type`              | -           | string      | 模型使用工具的类型，目前仅有`function`                                                                                                                                       |
|                  |                   |                     | `function`          | -           |             |                                                                                                                                                                              |
|                  |                   |                     |                     | `name`      | string      | 模型命中函数的名称                                                                                                                                                           |
|                  |                   |                     |                     | `arguments` | json        | 模型生成 JSON 格式的函数调用具体参数                                                                                                                                         |
|                  | `thinking`        | -                   | -                   | -           | json        | 思考区状态信息（仅Baichuan-M2-Plus/Baichuan-M3-Plus模型会返回）                                                                                                              |
|                  |                   | `status`            | -                   | -           | string      | 思考状态，包括：`in_progress`，`completed`两种                                                                                                                               |
|                  |                   | `summary`           | -                   | -           | string      | 思考摘要                                                                                                                                                                     |
|                  |                   | `steps`             | -                   | -           | array[json] | 思考步骤                                                                                                                                                                     |
|                  |                   | -                   | `kind`              | -           | string      | 步骤类型，包括：`reasoning`，`searching`，`synthesizing`三种                                                                                                                 |
|                  |                   | -                   | `status`            | -           | string      | 步骤状态                                                                                                                                                                     |
|                  |                   | -                   | `label`             | -           | string      | 步骤标签                                                                                                                                                                     |
|                  | `grounding`       | -                   | -                   | -           | json        | 依据的信息集合（仅Baichuan-M2-Plus/Baichuan-M3-Plus模型会返回）                                                                                                              |
|                  |                   | `evidence`          | -                   | -           | array[json] | 证据信息                                                                                                                                                                     |
|                  |                   | -                   | `ref_num`           | -           | int         | 引用文献编号，从1开始严格递增                                                                                                                                                |
|                  |                   | -                   | `id`                | -           | string      | 文档id                                                                                                                                                                       |
|                  |                   | -                   | `url`               | -           | string      | url                                                                                                                                                                          |
|                  |                   | -                   | `title`             | -           | int         | 标题                                                                                                                                                                         |
|                  |                   | -                   | `title_zh`          | -           | string      | 中文翻译标题                                                                                                                                                                 |
|                  |                   | -                   | `publish_date`      | -           | string      | 发布日期                                                                                                                                                                     |
|                  |                   | -                   | `author`            | -           | int         | 作者，多个用英文逗号分隔                                                                                                                                                     |
|                  |                   | -                   | `journal_name`      | -           | string      | 期刊名                                                                                                                                                                       |
|                  |                   | -                   | `publication_info`  | -           | string      | 出版/发表信息                                                                                                                                                                |
|                  |                   | -                   | `press`             | -           | int         | 出版社                                                                                                                                                                       |
|                  |                   | -                   | `drug_approve_date` | -           | string      | 药品核准日期                                                                                                                                                                 |
|                  |                   | -                   | `evidence_class`    | -           | string      | 证据类型，比如 RCT、Guideline等                                                                                                                                              |
| `model`          |                   |                     | -                   | -           | string      | 用于完成聊天的模型                                                                                                                                                           |
| `object`         |                   |                     | -                   | -           | string      | 始终为"chat.completion.chunk"                                                                                                                                                |
| `knowledge_base` | -                 | -                   | -                   | -           | json        | 知识库相关响应                                                                                                                                                               |
|                  | `cites`           | -                   | -                   | -           | array[json] | 引用知识                                                                                                                                                                     |
|                  |                   | `title`             | -                   | -           | string      | 文件名称                                                                                                                                                                     |
|                  |                   | `file_id`           | -                   | -           | string      | 文件 id                                                                                                                                                                      |
|                  |                   | `content`           | -                   | -           | string      | 分片内容                                                                                                                                                                     |
|                  | `cite_annotation` |                     |                     |             |             |                                                                                                                                                                              |
|                  |                   | `value`             | -                   | -           | string      | 大模型输出完整带角标内容                                                                                                                                                     |
|                  |                   | `annotations`       | -                   | -           | array[json] | 引用批注                                                                                                                                                                     |
|                  |                   |                     | `type`              | -           | string      | 批注类型                                                                                                                                                                     |
|                  |                   |                     | `text`              | -           | string      | 在回答内容中需要替换的字符串                                                                                                                                                 |
|                  |                   |                     | `start_index`       | -           | int         | 需要替换字符串的起始位置                                                                                                                                                     |
|                  |                   |                     | `end_index`         | -           | int         | 需要替换字符串的截止位置                                                                                                                                                     |
|                  |                   |                     | `file_citation`     | -           | json        | {<br/> "file_id": "file-abc",<br/> "quote": "引用文档的具体内容"<br/>}                                                                                                       |

### 1.5 同步接口示例

#### 1.5.1 同步接口请求示例

```bash
curl -X POST https://api.baichuan-ai.com/v1/chat/completions\
     -H "Content-Type: application/json"\
     -H "Authorization: Bearer ${API_KEY}"\
     -d '{
          "model": "Baichuan-M3",
          "messages": [
            {
               "content": "小儿感冒咳嗽，痰咳不出来怎么办？",
               "role": "user"
            }
          ],
          "stream": false
        }'
```

#### 1.5.2 同步接口响应示例

```json
{
  "id": "chatcmpl-ME810031AEkgoTi",
  "object": "chat.completion",
  "created": 1768027602,
  "model": "Baichuan-M3",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "**不建议您自行处理，而应尽快咨询儿科医生进行专业评估。** 您描述的情况（小儿感冒咳嗽、痰咳不出）在儿童中很常见，多由病毒感染（如普通感冒病毒）引起，但儿童尤其是婴幼儿的呼吸道较窄，痰液堵塞可能影响呼吸。以下是分步建议和注意事项，供您参考：\n\n💡 **关键建议与步骤：**\n1.  **年龄很重要：** 请先确认孩子的年龄。1岁以下婴儿出现咳嗽尤其需要警惕。不要给1岁以下婴儿使用蜂蜜或任何止咳药。\n2.  **基础家庭护理（安全有效）：**\n    *   **保证充足水分：** 多喝温水、凉白开、稀释的果汁或适量的口服补液盐水。水分有助于稀释痰液。观察孩子是否有脱水迹象（尿少色深、口干、精神差、眼窝凹陷、皮肤干燥无弹性）。\n    *   **保持空气湿润：** 使用加湿器（注意清洁，避免滋生细菌霉菌）或将孩子带到充满蒸汽的浴室里待几分钟（注意不要烫伤）。干燥的空气会让痰变粘稠。\n    *   **适当拍背排痰：** 您可以学习正确方法：五指并拢微弯成空心掌，由下向上、由外向内轻拍孩子的背部。饭后和睡觉时不要拍。这个方法对有一定年龄的孩子有效。\n    *   **保证休息和营养：** 充足的睡眠和均衡饮食有助于免疫系统工作。\n    *   **环境管理：** 保持室内清洁，避免已知的过敏原和刺激物（如香烟、油烟、新装修气味、宠物毛、大量灰尘）。\n    *   **关于蜂蜜：** 如果您的孩子**年龄大于1岁**，可以在睡前尝试少量（约半茶匙到1茶匙）纯蜂蜜兑温水喝，有助于缓解夜间咳嗽。**1岁以下绝对禁用蜂蜜（有肉毒杆菌中毒风险）。**\n    *   **不要随意用强效止咳药：** 尤其不要给孩子吃含有可待因或福尔可定等中枢性止咳药的成人药物。咳嗽是身体的保护机制，强行止咳可能导致痰堵在肺里引发肺炎。祛痰药（如氨溴索、乙酰半胱氨酸、愈创甘油醚等）需要根据年龄和具体情况由医生判断使用。\n    *   **观察记录：** 您可以先观察并记录以下信息，这有助于医生诊断：\n        *   孩子的具体年龄。\n        *   感冒多久了？有哪些其他症状？（比如：发烧吗？最高多少度？流什么颜色的鼻涕？精神、食欲、睡眠怎么样？）\n        *   咳嗽的情况：是干咳还是湿咳？痰是什么颜色的？（黄色、绿色可能提示有细菌感染可能，但也可能是病毒感染后期）。孩子大概多大了？（这很重要）。\n        *   有无以下需要急诊的情况：呼吸困难、喘息、嘴唇发紫、精神差、高热不退、脱水迹象、咳血、颈部僵硬或剧烈头痛、怀疑异物吸入史。\n\n📌 **补充信息与建议：**\n*   **病因考虑：** 普通感冒通常1-2周自愈。但如果咳嗽超过2-3周不好转，或者出现以下任一项，需要排查其他原因（如支气管炎、肺炎、哮喘、鼻窦炎、支原体感染、异物吸入、过敏、胃食管反流等）。\n*   **何时需要及时看医生：**\n    *   任何年龄出现呼吸困难、喘息、口唇发紫、精神差。\n    *   婴儿（尤其小于3个月）出现发热或咳嗽。\n    *   发热超过3天不退，或者高热（比如超过39℃）。\n    *   咳嗽剧烈影响睡眠或进食，或者咳出带血的痰。\n    *   有脱水迹象。\n    *   您感觉孩子病情严重。\n    *   您的孩子有基础心肺疾病、免疫抑制状态。\n    *   医生可能会：进行听诊等查体，建议做血常规、C反应蛋白、胸部X光片、病原学检查（如流感、支原体）等，并根据诊断给予合适的治疗建议。如果是细菌感染，可能需要抗生素。同时可能给予安全的对症处理建议或药物。\n*   **其他可能的处理（由医生决定）：**\n    *   退热处理：如有发热不适，可用适合儿童的对乙酰酚酚或布洛芬（注意剂量和年龄限制）。\n    *   鼻腔护理：如果同时有鼻塞流涕，用生理盐水滴鼻/喷鼻剂帮助清理鼻腔，减少鼻涕倒流刺激咽喉。\n    *   识别并发症迹象：注意是否有耳朵痛（中耳炎）、持续高热寒战、咳嗽加重伴脓痰或胸痛（肺炎）、反复发作喘息（哮喘）。\n    *   预防：注意手卫生和呼吸道卫生（咳嗽打喷嚏时用手肘遮挡），流感季考虑接种流感疫苗，保证均衡营养和适度运动增强抵抗力。\n    *   重要提示：如果您所在地区是流感流行季，或者孩子有高热、全身酸痛乏力等流感样症状，请尽快就医排查流感。流感可以引起严重并发症。\n    *   您可以做的临时缓解：让孩子多喝水，家里开加湿器。不要让孩子接触二手烟。确保孩子休息好。记录症状细节。\n\n> 举个例子：如果您告诉我“孩子3岁，感冒第5天了，一直流清鼻涕，这2天开始咳嗽，感觉喉咙有痰但咳不出来，没有发烧，精神食欲还好”，我能给您更有针对性的建议。当然，涉及隐私您不必透露所有细节，但年龄和关键症状很重要。\n\n如果方便，您可以补充更多匿名信息（年龄范围、性别、地区、大概病程和其他症状）。祝您的孩子早日康复！如有其他问题，请随时问我。🙏\n（注意：线上咨询不能替代面诊。如有任何不确定，请寻求当地医生的帮助。）",
        "reasoning_content": "嗯，用户问的是小儿感冒咳嗽，痰咳不出来怎么办。首先得确认孩子的年龄，因为不同年龄段的处理方法差异很大。比如婴幼儿和大孩子的用药和护理不一样。用户没提具体年龄，可能需要提醒他们注意年龄因素。\n\n接下来要考虑可能的原因。普通感冒通常是病毒感染，但也要排除其他情况，比如细菌感染或者过敏。特别是如果孩子有高烧、精神差、呼吸困难这些症状，可能需要及时就医。得在回答里强调危险信号。\n\n然后想到痰咳不出来的原因。孩子的咳嗽反射可能还没发育完全，尤其是小宝宝。另外痰太粘稠的话，孩子确实咳不出。这时候应该建议一些安全的处理方法，比如多喝水、保持空气湿度。蜂蜜水对1岁以上的孩子有效，但1岁以下不能用，这点必须说清楚，避免蜂蜜中毒的风险。\n\n还要考虑家庭护理措施。比如拍背排痰的手法是否正确，环境湿度是否合适。加湿器或者蒸汽浴这些方法可能有用，但要注意安全，别让孩子烫伤。另外，不要随便给孩子用止咳药，尤其是中枢性止咳药，可能掩盖症状导致痰堵住。这点很重要，得重点提醒。\n\n药物方面，得建议用户咨询医生。可能需要祛痰药，但不同年龄适用的药物不同。比如氨溴索、乙酰半胱氨酸这些，但必须根据医生判断。同时要检查是否有其他症状提示并发症，比如中耳炎、肺炎。\n\n还要想到用户可能的误区。比如用成人止咳药给孩子吃，或者过度使用抗生素。需要解释清楚抗生素对病毒性感冒无效，滥用会有耐药性。\n\n另外，观察孩子的精神状态、饮食和尿量。脱水的话症状会加重，比如尿少色深、口干、眼窝凹陷。这些细节可以帮用户判断是否需要紧急处理。\n\n最后要组织语言，既要专业又要易懂。分步骤说明：先观察症状和年龄，再基础护理，再何时就医。避免用太多术语，但关键点不能漏。比如提醒不要给1岁以下用蜂蜜，不要用含可待因的止咳药。\n\n可能还需要补充一些日常注意事项，比如避免烟雾刺激，保证休息。还有记录症状细节，比如咳嗽多久了，有没有发烧，痰的颜色，这些信息对医生诊断有帮助。\n\n总之，核心是安全有效的家庭处理，同时知道什么情况下必须看医生。不能耽误病情，也不能过度处理。\n"
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 42,
    "completion_tokens": 1852,
    "total_tokens": 1894,
    "search_count": 0
  }
}
```

#### 1.5.3 同步请求知识库

```bash
curl -X POST https://api.baichuan-ai.com/v1/chat/completions\
     -H "Content-Type: application/json"\
     -H "Authorization: Bearer ${API_KEY}"\
     -d '{
            "model": "Baichuan2-Turbo",
            "messages": [
                {
                    "role": "user",
                    "content": "张三毕业院校是哪里？"
                }
            ],
            "temperature": 0.4,
            "top_p": 0.5,
            "top_k": 10,
            "stream": false,
            "tools": [{
                "type":"retrieval",
                "retrieval":{
                     "kb_ids": [
                         "kb-xxx",
                         "kb-xxx"
                     ],
               "answer_mode":"knowledge-base-only"
                }
            }]
        }'
```

#### 1.5.4 同步请求知识库响应

```json
{
  "id": "chatcmpl-Mb65700CC3MOkhJ",
  "object": "chat.completion",
  "created": 1702351344,
  "model": "Baichuan2-Turbo",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "张三的毕业院校是xxx大学。"
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 1278,
    "completion_tokens": 10,
    "total_tokens": 1288
  },
  "knowledge_base": {
    "cites": [
      {
        "title": "【高级Java工程师】张三.pdf",
        "content": "在职时间\n所属行业\n公司名称\n担任职位\n2018.05--至今\nxxxxxxx",
        "file_id": "file-HdcrTddtCp2Nbo50uci5rADP"
      }
    ],
    "cite_anotations": {
      "value": "张三的毕业院校是**xxx大学**^[1]^。",
      "annotations": [
        {
          "type": "file_citation",
          "text": "^[1]^",
          "start_index": 18,
          "end_index": 23,
          "file_citation": "在职时间\n所属行业\n公司名称\n担任职位"
        }
      ]
    }
  }
}
```

### 1.6 流式接口示例

#### 1.6.1 流式接口请求示例

```bash
curl -X POST https://api.baichuan-ai.com/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${API_KEY}" \
  -d '{
        "model": "Baichuan4-Turbo",
        "messages": [
          {
            "role": "user",
            "content": "世界第一高峰是?"
          }
        ],
        "temperature": 0.3,
        "stream": true
      }'
```

#### 1.6.2 流式接口响应示例

```json
data:{"id":"chatcmpl-M633300APBknoaF","object":"chat.completion.chunk","created":1698205608,"model":"Baichuan4-Turbo","choices":[{"index":0,"delta":{"role":"assistant","content":"世界第一高峰是珠穆"},"finish_reason":""}]}

data:{"id":"chatcmpl-M633300APBknoaF","object":"chat.completion.chunk","created":1698205608,"model":"Baichuan4-Turbo","choices":[{"index":0,"delta":{"role":"assistant","content":"朗玛峰（Mount"},"finish_reason":""}]}

data:{"id":"chatcmpl-M633300APBknoaF","object":"chat.completion.chunk","created":1698205608,"model":"Baichuan4-Turbo","choices":[{"index":0,"delta":{"role":"assistant","content":" Everest），位于尼泊尔"},"finish_reason":""}]}

data:{"id":"chatcmpl-M633300APBknoaF","object":"chat.completion.chunk","created":1698205609,"model":"Baichuan4-Turbo","choices":[{"index":0,"delta":{"role":"assistant","content":"和中国边境，海拔高度"},"finish_reason":""}]}

data:{"id":"chatcmpl-M633300APBknoaF","object":"chat.completion.chunk","created":1698205609,"model":"Baichuan4-Turbo","choices":[{"index":0,"delta":{"role":"assistant","content":"为8,84"},"finish_reason":""}]}

data:{"id":"chatcmpl-M633300APBknoaF","object":"chat.completion.chunk","created":1698205609,"model":"Baichuan4-Turbo","choices":[{"index":0,"delta":{"role":"assistant","content":"8米。"},"finish_reason":"stop"}],"usage":{"prompt_tokens":6,"completion_tokens":29,"total_tokens":35,"search_count": 0}}

data:[DONE]
```

### 1.7 function 接口示例

#### 1.7.1 同步接口请求示例（第一轮）

```bash
curl -X POST https://api.baichuan-ai.com/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${API_KEY}" \
  -d '{
        "messages": [
        { "content": "北京今天天气怎么样？使用json格式输出",
          "role": "user"
        }],
        "model": "Baichuan4",
        "stream": false,
        "tools": [
        {
          "type": "function",
          "function": {
          "name": "get_current_weather",
          "description": "获取当前位置天气",
          "parameters": {
            "type": "object",
            "properties": {
               "location": {
                 "type": "string",
                 "description": "城市或者省，如上海"
               },
            "format": {
              "type": "string",
              "description": "要使用的温度单位。从用户位置推断。"
            }
            },
           "required": [
            "location",
            "format"
          ]
        }
      }
    },
     {
      "type": "function",
      "function": {
        "name": "get_yesterday_weather",
        "description": "获取当前位置昨日的天气",
        "parameters": {
          "type": "object",
          "properties": {
            "location": {
              "type": "string",
              "description": "城市或者省，如北京"
            },
            "format": {
              "type": "string",
              "description": "要使用的温度单位。从用户位置推断。"
            }
          },
          "required": [
            "location",
            "format"
          ]
        }
      }
    }
  ],
  "tool_choice":"auto"
}'



```

#### 1.7.2 同步接口返回示例（第一轮）

```json
{
  "id": "chatcmpl-Mf89d015KICDojA",
  "object": "chat.completion",
  "created": 1716199933,
  "model": "Baichuan4",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "tool_calls": [
          {
            "id": "71f7015KICDoskJ",
            "type": "function",
            "function": {
              "name": "get_current_weather",
              "arguments": "{\"format\": \"json\", \"location\": \"北京\"}"
            }
          }
        ]
      },
      "finish_reason": "tool_calls"
    }
  ],
  "usage": {
    "prompt_tokens": 136,
    "completion_tokens": 22,
    "total_tokens": 158
  }
}
```

#### 1.7.3 同步接口请求示例（第二轮）

```json
curl -X POST https://api.baichuan-ai.com/v1/chat/completions \
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${API_KEY}" \
-d '{
  "messages": [
    {
      "role": "user",
      "content": "北京今天天气怎么样？使用json格式输出"
    },{
      "role": "assistant",
      "tool_calls": [
        {
          "id": "ABCF01AEBHpopWh",
          "type": "function",
          "function": {
            "name": "get_current_weather",
            "arguments": "{\"location\": \"北京\", \"format\": \"json\"}"
          }
        }
      ]
    },{
      "role": "tool",
      "content": "多云转晴，风力1级，温度：最高20度，最低12度",
      "tool_call_id": "ABCF01AEBHpopWh"
    }
  ],
  "model": "Baichuan4",
  "stream": false,
  "tools": [
    {
      "type": "function",
      "function": {
        "name": "get_current_weather",
        "description": "获取当前位置天气",
        "parameters": {
          "type": "object",
          "properties": {
            "location": {
              "type": "string",
              "description": "城市或者省，如上海"
            },
            "format": {
              "type": "string",
              "description": "要使用的温度单位。从用户位置推断。"
            }
          },
          "required": [
            "location",
            "format"
          ]
        }
      }
    },
    {
      "type": "function",
      "function": {
        "name": "get_yesterday_weather",
        "description": "获取当前位置昨日的天气",
        "parameters": {
          "type": "object",
          "properties": {
            "location": {
              "type": "string",
              "description": "城市或者省，如北京"
            },
            "format": {
              "type": "string",
              "description": "要使用的温度单位。从用户位置推断。"
            }
          },
          "required": [
            "location",
            "format"
          ]
        }
      }
    }
  ],
  "tool_choice":"auto"
}'



```

#### 1.7.4 同步接口返回示例（第二轮）

```json
{
  "id": "chatcmpl-M5A4C01AEBNZoLr",
  "object": "chat.completion",
  "created": 1728876215,
  "model": "Baichuan4",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "{\"天气\": \"多云转晴\", \"风力\": \"1级\", \"温度\": {\"最高\": \"20度\", \"最低\": \"12度\"}}"
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 254,
    "completion_tokens": 35,
    "total_tokens": 289
  }
}
```

### 1.8 评测搜索效果接口示例

#### 1.8.1 同步接口请求示例

```bash
curl -X POST https://api.baichuan-ai.com/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${API_KEY}" \
  -d '{
      	"model": "Baichuan4",
      	"messages": [

      		{
      			"content": "巴黎奥运会中国体育代表团共获多少金牌?",
      			"role": "user"
      		}
      	],
      	"stream": false,
      	"tools": [{
      		"type": "web_search",
      		"web_search": {
      			"enable": true,
      			"search_mode": "quality_first"
      		}
      	}]
      }'

```

#### 1.8.2 同步接口返回示例

```json
{
  "id": "chatcmpl-Ma07d018NBwUau6",
  "object": "chat.completion",
  "created": 1724385525,
  "model": "Baichuan4",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "在2024年巴黎奥运会上，中国体育代表团共获得了**40枚金牌**。这一成绩不仅刷新了中国在境外奥运会参赛的金牌数纪录，而且与美国并列金牌榜第一。\n\n巴黎奥运会，即第33届夏季奥林匹克运动会，是在2024年7月26日至8月11日举行的国际综合性运动会。中国体育代表团在这次奥运会上的表现非常出色，除了40枚金牌外，还获得了27枚银牌和24枚铜牌，总计91枚奖牌。这些成绩的取得，是中国运动员们长期刻苦训练和不懈努力的结果，也是中国体育综合实力的体现。\n\n在巴黎奥运会上，中国代表团在多个项目上实现了历史性突破，例如在男子100米自由泳、网球女单、艺术体操团体、花样游泳、女子拳击等项目上首次获得金牌。此外，中国跳水队和乒乓球队继续保持强势，分别包揽了所有项目的金牌。\n\n值得注意的是，中国体育代表团在巴黎奥运会上的成功并非偶然，而是建立在国家对体育事业的长期投入和支持之上。通过科学的训练方法、完善的保障体系和运动员们的辛勤付出，中国在国际体育舞台上展现出了强大的竞争力。\n\n总的来说，巴黎奥运会对中国体育代表团来说是一次巨大的成功，不仅在金牌数上取得了优异的成绩，而且在多个项目上实现了突破，展现了中国体育的全面进步和发展。"
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 9328,
    "completion_tokens": 384,
    "total_tokens": 9712,
    "search_count": 1
  }
}
```

## 2. 状态码

#### 应答 Headers 中支持 HTTP 标准状态码，请见[错误码说明](https://platform.baichuan-ai.com/docs/errCode)。

## 3. 请求频率限制

#### 当前已认证账号限制 120 rpm（Baichuan-M3-Plus免费期内限制30 rpm），未认证账号限制 12rpm 且每日请求不超过 300 次。如果您收到速率限制的报错，则表示您在短时间内发出了太多请求，API 会拒绝新请求，直到经过指定的时间。

## 4. 附录

### Python示例代码

### 4.1 原生调用方式

##### 4.1.1 基础对话

```python
import requests
import json

def do_request():
    url = "https://api.baichuan-ai.com/v1/chat/completions"
    api_key = "your_api_key"

    data = {
        "model": "Baichuan-M3",
        "messages": [
            {
                "role": "user",
                "content": "25岁健康女性种植牙，刚做完植入种植体，请问手术后是否需要服用抗生素"
            }
        ],
        "stream": True
    }

    json_data = json.dumps(data)

    headers = {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + api_key
    }

    response = requests.post(url, data=json_data, headers=headers, timeout=60, stream=True)

    if response.status_code == 200:
        print("请求成功！")
        print("请求成功，X-BC-Request-Id:", response.headers.get("X-BC-Request-Id"))
        for line in response.iter_lines():
            if line:
                print(line.decode('utf-8'))
    else:
        print("请求失败，状态码:", response.status_code)
        print("请求失败，body:", response.text)
        print("请求失败，X-BC-Request-Id:", response.headers.get("X-BC-Request-Id"))

if __name__ == "__main__":
    do_request()


```

##### 4.1.2 基础对话-文本方式

```python
import requests
import json

def do_request():
    url = "https://api.baichuan-ai.com/v1/chat/completions"
    api_key = "your_api_key"

    data = {
        "model": "Baichuan-M3-Plus",
        "messages": [
            {
                "role": "user",
                "content": [{
                  "type": "text",
                  "text": "25岁健康女性种植牙，刚做完植入种植体，请问手术后是否需要服用抗生素"
                }]

            }
        ],
        "stream": True,
        "metadata": {
            "evidence_scope": "grounded"
        }
    }

    json_data = json.dumps(data)

    headers = {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + api_key
    }

    response = requests.post(url, data=json_data, headers=headers, timeout=60, stream=True)

    if response.status_code == 200:
        print("请求成功！")
        print("请求成功，X-BC-Request-Id:", response.headers.get("X-BC-Request-Id"))
        for line in response.iter_lines():
            if line:
                print(line.decode('utf-8'))
    else:
        print("请求失败，状态码:", response.status_code)
        print("请求失败，body:", response.text)
        print("请求失败，X-BC-Request-Id:", response.headers.get("X-BC-Request-Id"))

if __name__ == "__main__":
    do_request()

```

##### 4.1.3 基础对话-文件方式

###### 1、上传意图为`medical`的文件，获取文件id

```python
import requests

def upload_file(api_key, file_path, purpose="medical"):
    url = "https://api.baichuan-ai.com/v1/files"

    headers = {
        "Authorization": f"Bearer {api_key}"
    }

    try:
        with open(file_path, "rb") as file:
            files = {
                "purpose": (None, purpose),
                "file": (file_path.split("/")[-1], file, "text/plain")
            }

            response = requests.post(url, headers=headers, files=files)
        response.raise_for_status()
        return response.json()

    except FileNotFoundError:
        print(f"Error：File {file_path} Not Found")
        return None
    except requests.exceptions.RequestException as e:
        print(f"Error：{e}")
        return None

if __name__ == "__main__":
    api_key = "your_api_key"
    file_path = "/Users/file.txt"

    result = upload_file(api_key, file_path)
    if result:
        print("上传成功！")
        print(result)

```

###### 2、文件解析状态为online后，进行对话

```python
import requests
import json

def do_request():
    url = "https://api.baichuan-ai.com/v1/chat/completions"
    api_key = "your_api_key"

    data = {
        "model": "Baichuan-M3-Plus",
        "messages": [
            {
                "role": "user",
                "content": [
                  {
                    "type": "file",
                    "file": {
                      "file_id": "file-123"
                    }
                  },
                  {
                    "type": "text",
                    "text": "总结下这篇文章的内容"
                  }
                ]
            }
        ],
        "stream": True,
        "metadata": {
            "evidence_scope": "grounded"
        }
    }

    json_data = json.dumps(data)

    headers = {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + api_key
    }

    response = requests.post(url, data=json_data, headers=headers, timeout=60, stream=True)

    if response.status_code == 200:
        print("请求成功！")
        print("请求成功，X-BC-Request-Id:", response.headers.get("X-BC-Request-Id"))
        for line in response.iter_lines():
            if line:
                print(line.decode('utf-8'))
    else:
        print("请求失败，状态码:", response.status_code)
        print("请求失败，body:", response.text)
        print("请求失败，X-BC-Request-Id:", response.headers.get("X-BC-Request-Id"))

if __name__ == "__main__":
    do_request()

```

### 4.2 OpenAI SDK调用方式

##### 4.2.1 基础对话

```python
from openai import OpenAI

client = OpenAI(
    api_key="your_api_key",
    base_url="https://api.baichuan-ai.com/v1/",
)

completion = client.chat.completions.create(
    model="Baichuan-M3-Plus",
    messages=[
        {"role": "user", "content": "25岁健康女性种植牙，刚做完植入种植体，请问手术后是否需要服用抗生素"}
    ],
    stream=True,
    metadata={
        "evidence_scope": "cited"
    }
)

for chunk in completion:
    print(chunk.choices[0])



```

##### 4.2.2 基础对话-文本方式

```python
from openai import OpenAI

client = OpenAI(
    api_key="your_api_key",
    base_url="https://api.baichuan-ai.com/v1/",
)

completion = client.chat.completions.create(
    model="Baichuan-M3-Plus",
    messages=[
        {
            "role": "user",
            "content": [{
                "type": "text",
                "text": "25岁健康女性种植牙，刚做完植入种植体，请问手术后是否需要服用抗生素"
            }]
        }
    ],
    stream=True,
    metadata={
        "evidence_scope": "grounded"
    }
)

for chunk in completion:
    print(chunk.choices[0])



```

##### 4.2.3 基础对话-文件方式

```python
from openai import OpenAI

client = OpenAI(
    api_key="your_api_key",
    base_url="https://api.baichuan-ai.com/v1/",
)

completion = client.chat.completions.create(
    model="Baichuan-M3-Plus",
    messages=[
        {
            "role": "user",
            "content": [{
                "type": "text",
                "text": "总结下这篇文章"
            }, {
                "type": "file",
                "file": {"file_id": "file-123"}
            }]
        }
    ],
    stream=True,
    metadata={
        "evidence_scope": "grounded"
    }
)

for chunk in completion:
    print(chunk.choices[0])



```

##### 4.2.4 知识库检索

```python
from openai import OpenAI

client = OpenAI(
    api_key="your_api_key",
    base_url="https://api.baichuan-ai.com/v1/",
)

completion = client.chat.completions.create(
    model="Baichuan2-Turbo",
    messages=[
        {"role": "user", "content": "西游记里有多少妖怪？"}
    ],
    temperature=0.3,
    stream=True,
    extra_body={
        "tools": [{
            "type": "retrieval",
            "retrieval": {
                "kb_ids": [
                    "kb-123"
                ]
            }
        }]
    }
)

for chunk in completion:
    print(chunk.choices[0].delta)



```

##### 4.2.5 Web 搜索

```python
from openai import OpenAI

client = OpenAI(
    api_key="your_api_key",
    base_url="https://api.baichuan-ai.com/v1/",
)

completion = client.chat.completions.create(
    model="Baichuan4",
    messages=[
        {"role": "user", "content": "北京今天天气怎么样"}
    ],
    temperature=0.3,
    stream=True,
    extra_body={
        "tools": [{
            "type": "web_search",
            "web_search": {
                "enable": True,
                "search_mode": "performance_first"
            }
        }]
    }

)

for chunk in completion:
    print(chunk.choices[0].delta)



```

##### 4.2.6 function 工具

```python
from openai import OpenAI

client = OpenAI(
    api_key="your_api_key",
    base_url="https://api.baichuan-ai.com/v1/",
)

completion = client.chat.completions.create(
    model="Baichuan4",
    messages=[{
            "content": "今天天气怎么样？使用json格式输出",
            "role": "user"
      }
    ],
    tools=[{
        "type": "function",
        "function": {
            "name": "get_current_weather",
            "description": "获取当前位置天气",
            "parameters": {
                "type": "object",
                "properties": {
                    "location": {
                        "type": "string",
                        "description": "城市或者省，如北京"
                    },
                    "format": {
                        "type": "string",
                        "description": "要使用的温度单位。从用户位置推断。"
                    }
                },
                "required": [
                    "location",
                    "format"
                ]
            }
        }
    }]
)
print(completion.choices[0].message)



```
