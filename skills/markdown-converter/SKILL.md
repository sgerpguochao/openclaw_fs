---
name: markdown-converter
description: "Convert documents and files to Markdown using markitdown. Use when: user wants to convert PDF, Word (.docx), PowerPoint (.pptx), Excel (.xlsx, .xls), HTML, CSV, JSON, XML, images (with EXIF/OCR), audio (with transcription), ZIP archives, YouTube URLs, or EPubs to Markdown format for LLM processing or text analysis. NOT for: simple text files that are already in Markdown format."
emoji: 📄
requires:
  bins:
    - uv
---

# Markdown Converter

Convert various file formats to Markdown using `uvx markitdown` — no installation required.

## When to Use

✅ **USE this skill when:**

- User wants to convert PDF to Markdown
- User wants to convert Word (.docx) to Markdown
- User wants to convert Excel (.xlsx) to Markdown
- User wants to convert PowerPoint (.pptx) to Markdown
- User wants to convert HTML to Markdown
- User wants to convert JSON/XML to Markdown
- User wants to extract text from images (OCR)
- User wants to transcribe audio to text
- User wants to convert YouTube videos to text
- User wants to extract content from ZIP archives
- User wants to convert EPub books

❌ **DON'T use this skill when:**

- File is already in Markdown format
- User wants to convert Markdown to other formats (reverse operation)
- File is too large to process

## Installation

No installation required — uses `uvx markitdown` which auto-installs on first run.

## Basic Usage

### Convert to stdout

```bash
uvx markitdown input.pdf
```

### Save to file

```bash
uvx markitdown input.pdf -o output.md
uvx markitdown input.docx > output.md
```

### From stdin

```bash
cat input.pdf | uvx markitdown
```

## Supported Formats

### Documents

- **PDF**: `uvx markitdown document.pdf`
- **Word**: `uvx markitdown document.docx`
- **PowerPoint**: `uvx markitdown presentation.pptx`
- **Excel**: `uvx markitdown spreadsheet.xlsx`

### Web/Data

- **HTML**: `uvx markitdown page.html`
- **CSV**: `uvx markitdown data.csv`
- **JSON**: `uvx markitdown data.json`
- **XML**: `uvx markitdown data.xml`

### Media

- **Images**: `uvx markitdown image.png` (uses OCR to extract text)
- **Audio**: `uvx markitdown audio.mp3` (transcribes audio)
- **YouTube**: `uvx markitdown "https://youtube.com/watch?v=..."`

### Other

- **ZIP**: `uvx markitdown archive.zip` (iterates contents)
- **EPub**: `uvx markitdown book.epub`

## Command Options

| Option | Description |
|--------|-------------|
| `-o OUTPUT` | Output file path |
| `-x EXTENSION` | Hint file extension (for stdin) |
| `-m MIME_TYPE` | Hint MIME type |
| `-c CHARSET` | Hint charset (e.g., UTF-8) |
| `-d` | Use Azure Document Intelligence |
| `-e ENDPOINT` | Document Intelligence endpoint |
| `--use-plugins` | Enable 3rd-party plugins |
| `--list-plugins` | Show installed plugins |

## Examples

### Convert Word document

```bash
uvx markitdown report.docx -o report.md
```

### Convert Excel spreadsheet

```bash
uvx markitdown data.xlsx > data.md
```

### Convert PowerPoint presentation

```bash
uvx markitdown slides.pptx -o slides.md
```

### Convert with file type hint (for stdin)

```bash
cat document | uvx markitdown -x .pdf > output.md
```

### Convert image with OCR

```bash
uvx markitdown screenshot.png -o text.md
```

### Convert YouTube video

```bash
uvx markitdown "https://youtube.com/watch?v=xxx" -o transcript.md
```

### Use Azure Document Intelligence for complex PDFs

```bash
uvx markitdown scan.pdf -d -e "https://your-resource.cognitiveservices.azure.com/"
```

## Azure Document Intelligence

For complex PDFs with poor extraction, use Azure Document Intelligence:

1. Get Azure credentials:
   - Endpoint URL
   - API Key

2. Use the `-d` flag with endpoint:

```bash
uvx markitdown complex-scan.pdf -d -e "https://your-resource.cognitiveservices.azure.com/"
```

## Notes

- First run caches dependencies; subsequent runs are faster
- Output preserves document structure: headings, tables, lists, links
- Large files may take longer to process
- Some formats require internet to download dependencies
