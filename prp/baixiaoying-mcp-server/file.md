# 接口说明

File上传可以与知识库检索retrieval等功能一起使用的文档。支持的文档格式：pdf、doc、docx、txt、xlsx、xls、csv、pptx。<br/>

| **限制内容** | **限制数量** |
| ------------ | ------------ |
| 文件总容量   | 5GB          |
| 单个文件大小 | 50MB         |
| 上传频率     | 60rpm        |

<a name="O172A"></a>

## 1.File文件对象

| 字段名称     | 类型    | 描述                                                                                                                                                                                                                                                                                             |
| ------------ | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `id`         | string  | 文件唯一标识，用于文件接口                                                                                                                                                                                                                                                                       |
| `bytes`      | integer | 文件字节数大小                                                                                                                                                                                                                                                                                   |
| `created_at` | integer | 创建时间，Unix时间戳（秒）                                                                                                                                                                                                                                                                       |
| `filename`   | string  | 文件名称                                                                                                                                                                                                                                                                                         |
| `object`     | string  | 类型，文件对象类型为'file'                                                                                                                                                                                                                                                                       |
| `purpose`    | string  | 文件的使用意图。具体如下：<br/>知识库：`knowledge-base` <br/>助手对话：`assistants`<br/>文档解析：`file-parsing`<br/>Baichuan-M2-Plus对话：`medical` <br/>当意图为`medical`时，支持的文档格式：pdf、doc、docx、txt、html、htm、md、markdown、rft、xml、csv、png、jpg、jpeg、gif、bmp、webp、json |

---

<a name="dVN4p"></a>

## 2.文件列表查询

**【GET】https://api.baichuan-ai.com/v1/files**
<a name="LuAWo"></a>

### 2.1请求参数

**HTTP Header 参数**

| 参数名称        | 类型   | 是否必填 | 说明                                       |
| --------------- | ------ | -------- | ------------------------------------------ |
| `Authorization` | string | Y        | 请求鉴权的 APIKey，由百川提供。Bearer 开头 |

<a name="UHvYL"></a>

### 2.2返回值

| 字段名   | 一级子参数   | 类型          | 描述                               |
| -------- | ------------ | ------------- | ---------------------------------- |
| `data`   | -            | array[object] | 返回文件对象的list                 |
|          | `id`         | string        | 文件唯一标识，用于文件接口         |
|          | `bytes`      | integer       | 文件字节数大小                     |
|          | `created_at` | integer       | 创建时间，Unix时间戳（秒）         |
|          | `filename`   | string        | 文件名称                           |
|          | `object`     | string        | 类型，文件对象类型为'file'         |
|          | `purpose`    | string        | 文件的使用意图。如'knowledge-base' |
| `object` | -            | string        | 对象类型"list"                     |

<a name="YnpzR"></a>

### 2.3接口示例

<a name="kAEmb"></a>

#### 2.3.1请求

```bash
curl https://api.baichuan-ai.com/v1/files \
  -H "Authorization: Bearer $API_KEY"

```

<a name="Sgifs"></a>

#### 2.3.2返回值

```json
{
  "data": [
    {
      "id": "file-123",
      "bytes": 1562,
      "created_at": 1701832828,
      "filename": "xxx.pdf",
      "object": "file",
      "purpose": "knowledge-base"
    },
    {
      "id": "file-124123",
      "bytes": 183237,
      "created_at": 1702201134,
      "filename": "xxx.doc",
      "object": "file",
      "purpose": "knowledge-base"
    }
  ],
  "object": "list"
}
```

---

<a name="IRkvi"></a>

## 3.文件上传接口

【POST】**https://api.baichuan-ai.com/v1/files**<br />限制：单个文档限制50MB。<br />知识库目前支持pdf、doc、docx、xlsx、xls、csv、pptx类型文件，其中xlsx、xls、csv只能按固定模板上传QA对数据，具体模板见体验中心文档上传页面。<br />如果您收到速率限制的报错，则表示您在短时间内发出了太多请求，API 会拒绝新请求，直到经过指定的时间。
<a name="KOehU"></a>

### 3.1请求参数

**HTTP Header 参数**

| 参数名称        | 类型   | 是否必填 | 说明                                       |
| --------------- | ------ | -------- | ------------------------------------------ |
| `Authorization` | string | Y        | 请求鉴权的 APIKey，由百川提供。Bearer 开头 |

**HTTP Request Body 参数**

| 参数名称  | 类型   | 是否必填 | 说明           |
| --------- | ------ | -------- | -------------- |
| `file`    | file   | Y        | 上传的文件内容 |
| `purpose` | string | Y        | 文件意图       |

<a name="ROfUW"></a>

### 3.2返回值

文件对象
<a name="S8bHH"></a>

### 3.3接口示例

<a name="tm4nZ"></a>

#### 3.3.1请求

```bash
curl https://api.baichuan-ai.com/v1/files \
  -H "Authorization: Bearer $API_KEY" \
  -F purpose="knowledge-base" \
  -F file="@mydata.pdf"
```

<a name="VZEOz"></a>

#### 3.3.2返回值

```json
{
  "id": "file-abc123",
  "object": "file",
  "bytes": 120000,
  "created_at": 1677610602,
  "filename": "mydata.pdf",
  "purpose": "knowledge-base"
}
```

---

<a name="ckr9g"></a>

## 4.文件删除接口

【DELETE】https://api.baichuan-ai.com/v1/files/{file_id}<br />用于删除一个文件，被知识库使用的文件需要先解除关联后才能删除。
<a name="P7Apd"></a>

### 4.1请求参数

**HTTP Header 参数**

| 参数名称        | 类型   | 是否必填 | 说明                                       |
| --------------- | ------ | -------- | ------------------------------------------ |
| `Authorization` | string | Y        | 请求鉴权的 APIKey，由百川提供。Bearer 开头 |

**HTTP Url 参数**

| 参数名称  | 类型   | 是否必填 | 说明   |
| --------- | ------ | -------- | ------ |
| `file_id` | string | Y        | 文件id |

<a name="Aph4o"></a>

### 4.3接口示例

<a name="RlvwG"></a>

#### 4.3.1请求

```bash
curl https://api.baichuan-ai.com/v1/files/file-abc123 \
  -X DELETE \
  -H "Authorization: Bearer $API_KEY"
```

<a name="Rezug"></a>

#### 4.3.2返回值

```json
{
  "id": "file-abc123",
  "object": "file",
  "deleted": true
}
```

---

<a name="cN8D3"></a>

## 5.文件检索接口

【POST】https://api.baichuan-ai.com/v1/files/{file_id}<br />返回一个文件的相关信息。
<a name="tJZch"></a>

### 5.1请求参数

**HTTP Header 参数**

| 参数名称        | 类型   | 是否必填 | 说明                                       |
| --------------- | ------ | -------- | ------------------------------------------ |
| `Authorization` | string | Y        | 请求鉴权的 APIKey，由百川提供。Bearer 开头 |

**HTTP Url 参数**

| 参数名称  | 类型   | 是否必填 | 说明   |
| --------- | ------ | -------- | ------ |
| `file_id` | string | Y        | 文件id |

<a name="EfwA3"></a>

### 5.2返回值

返回指定文件id的文件对象信息
<a name="oEjhl"></a>

### 5.3接口示例

<a name="Xl5mJ"></a>

#### 5.3.1请求

```bash
curl https://api.baichuan-ai.com/v1/files/file-abc123 \
  -H "Authorization: Bearer $API_KEY"
```

<a name="PRYrL"></a>

#### 5.3.2返回值

```json
{
  "id": "file-abc123",
  "object": "file",
  "bytes": 120000,
  "created_at": 1677610602,
  "filename": "mydata.pdf",
  "purpose": "knowledge-base"
}
```

<a name="V1bj0"></a>

## 6.文件解析内容获取接口

只处理意图为`file-parsing`或`medical`的文件，调用文件上传接口时请将`purpose`设置为`file-parsing`或`medical`。

【GET】https://api.baichuan-ai.com/v1/files/{file_id}/parsed-content<br />返回文档解析结果。
<a name="oS8CH"></a>

### 6.1请求参数

**HTTP Header 参数**

| 参数名称        | 类型   | 是否必填 | 说明                                       |
| --------------- | ------ | -------- | ------------------------------------------ |
| `Authorization` | string | Y        | 请求鉴权的 APIKey，由百川提供。Bearer 开头 |

**HTTP Url 参数**

| 参数名称  | 类型   | 是否必填 | 说明   |
| --------- | ------ | -------- | ------ |
| `file_id` | string | Y        | 文件id |

<a name="M13yf"></a>

### 6.2返回值

| 参数名称  | 类型   | 说明                                                                                 |
| --------- | ------ | ------------------------------------------------------------------------------------ |
| `status`  | string | init:待解析；parsing:解析中；online:解析成功；fail:解析失败；unsafe:未通过安全检查。 |
| `content` | string | 文档解析内容                                                                         |

<a name="OALRz"></a>

### 6.3接口示例

<a name="kgYaK"></a>

#### 6.3.1请求

```bash
curl https://api.baichuan-ai.com/v1/files/file-abc123/parsed-content \
  -H "Authorization: Bearer $API_KEY"
```

<a name="jRDuz"></a>

#### 6.3.2返回值

```json
{
  "status": "online",
  "content": "xxx"
}
```
