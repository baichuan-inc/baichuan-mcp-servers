# 可用工具

## baixiaoying_chat

使用百小应大模型进行医学问答对话。

**参数：**

| 参数             | 类型     | 必填 | 默认值             | 说明                       |
| ---------------- | -------- | ---- | ------------------ | -------------------------- |
| `message`        | string   | 是   | -                  | 用户输入的问题             |
| `model`          | string   | 否   | "Baichuan-M3-Plus" | 模型选择                   |
| `file_ids`       | string[] | 否   | -                  | 文件 ID 列表，用于文档问答 |
| `temperature`    | number   | 否   | 0.3                | 采样温度 (0-1)             |
| `evidence_scope` | string   | 否   | "grounded"         | 证据范围                   |

**示例：**

```
使用百小应问一下"小儿感冒咳嗽，痰咳不出来怎么办？"
```

## baixiaoying_upload_file

上传医学文档用于后续的文档问答。

**支持的文件格式：** pdf, doc, docx, txt, html, md, csv, png, jpg 等

**参数：**

| 参数        | 类型   | 必填 | 说明         |
| ----------- | ------ | ---- | ------------ |
| `file_path` | string | 是   | 本地文件路径 |
| `file_name` | string | 否   | 自定义文件名 |

## baixiaoying_list_files

获取已上传的文件列表。

## baixiaoying_get_file_status

查询文件的解析状态。

**状态说明：**

- `init` - 待解析
- `parsing` - 解析中
- `online` - 解析成功，可以使用
- `fail` - 解析失败
- `unsafe` - 未通过安全检查

## baixiaoying_delete_file

删除指定的已上传文件。
