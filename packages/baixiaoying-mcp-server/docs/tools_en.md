# Available Tools

## baixiaoying_chat

Use BaiXiaoYing LLM for medical Q&A dialogue.

**Parameters:**

| Parameter        | Type     | Required | Default            | Description                   |
| ---------------- | -------- | -------- | ------------------ | ----------------------------- |
| `message`        | string   | Yes      | -                  | User's question               |
| `model`          | string   | No       | "Baichuan-M3-Plus" | Model selection               |
| `file_ids`       | string[] | No       | -                  | File ID list for document Q&A |
| `temperature`    | number   | No       | 0.3                | Sampling temperature (0-1)    |
| `evidence_scope` | string   | No       | "grounded"         | Evidence scope                |

**Example:**

```
Ask BaiXiaoYing: "What should I do if my child has a cold and cough and can't cough up phlegm?"
```

## baixiaoying_upload_file

Upload medical documents for subsequent document Q&A.

**Supported file formats:** pdf, doc, docx, txt, html, md, csv, png, jpg, etc.

**Parameters:**

| Parameter   | Type   | Required | Description      |
| ----------- | ------ | -------- | ---------------- |
| `file_path` | string | Yes      | Local file path  |
| `file_name` | string | No       | Custom file name |

## baixiaoying_list_files

Get the list of uploaded files.

## baixiaoying_get_file_status

Query the parsing status of a file.

**Status descriptions:**

- `init` - Pending parsing
- `parsing` - Parsing in progress
- `online` - Successfully parsed, ready to use
- `fail` - Parsing failed
- `unsafe` - Did not pass security check

## baixiaoying_delete_file

Delete a specified uploaded file.
