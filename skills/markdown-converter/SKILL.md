---
name: markdown-converter
description: "Convert documents and files to Markdown using markitdown. Use when: user wants to convert PDF, Word (.docx), PowerPoint (.pptx), Excel (.xlsx, .xls), HTML, CSV, JSON, XML, images (with EXIF/OCR), audio (with transcription), ZIP archives, YouTube URLs, or EPubs to Markdown format for LLM processing or text analysis. NOT for: simple text files that are already in Markdown format."
emoji: 📄
requires:
  bins:
    - uv
    - python3
---

# Markdown Converter Skill

Convert various document formats to Markdown using the `markitdown` tool.

## When to Use

✅ **USE this skill when:**

- User wants to convert PDF to Markdown
- User wants to convert Word (.docx) to Markdown
- User wants to convert PowerPoint (.pptx) to Markdown
- User wants to convert Excel (.xlsx, .xls) to Markdown
- User wants to convert HTML to Markdown
- User wants to convert CSV, JSON, XML to Markdown
- User wants to extract text from images using OCR
- User wants to transcribe audio to text
- User wants to convert YouTube URLs to Markdown
- User wants to convert EPub to Markdown
- User wants to extract content from ZIP archives

❌ **DON'T use this skill when:**

- File is already in Markdown format
- User wants to convert Markdown to other formats (use different tools)
- Simple text extraction from plain text files

## Installation

No installation required - uses `uvx` to run markitdown directly.

First run will cache dependencies; subsequent runs are faster.

## Commands

### Basic Usage

```bash
# Convert a PDF to Markdown
uvx markitdown input.pdf -o output.md

# Convert a Word document to Markdown
uvx markitdown document.docx -o document.md

# Convert to Markdown and print to stdout
uvx markitdown document.pdf
```

### Convert Various Formats

```bash
# Word documents
uvx markitdown document.docx

# PowerPoint presentations
uvx markitdown presentation.pptx

# Excel spreadsheets
uvx markitdown data.xlsx
uvx markitdown data.xls

# HTML files
uvx markitdown page.html

# CSV files
uvx markitdown data.csv

# JSON files
uvx markitdown data.json

# XML files
uvx markitdown data.xml
```

### Media Conversion

```bash
# Images (with EXIF and OCR)
uvx markitdown image.jpg
uvx markitdown image.png

# Audio files (with transcription)
uvx markitdown audio.mp3
uvx markitdown audio.wav

# YouTube URLs
uvx markitdown "https://youtube.com/watch?v=example"

# EPub e-books
uvx markitdown book.epub
```

### Archives

```bash
# ZIP archives (extracts all readable content)
uvx markitdown archive.zip
```

### Advanced Options

```bash
# Use Azure Document Intelligence for complex PDFs
uvx markitdown complex.pdf -d

# Provide file type hint for stdin input
cat document.docx | uvx markitdown --file-type docx

# Preserve links
uvx markitdown document.html --preserve-links
```

## Supported Formats Summary

| Category | Formats |
|----------|---------|
| Documents | PDF, .docx, .pptx, .xlsx, .xls |
| Web/Data | HTML, CSV, JSON, XML |
| Media | Images (.jpg, .png, .gif), Audio (.mp3, .wav) |
| Other | ZIP, YouTube URLs, EPub |

## Output Features

The converter preserves:

- Headings and document structure
- Tables (including merged cells)
- Lists (ordered and unordered)
- Links and images
- Code blocks
- Bold, italic, and other formatting

## Use Cases

### LLM Processing

Convert documents to Markdown for easier processing by LLMs:

```bash
uvx markitdown report.pdf -o report.md
```

Then feed the Markdown content to your AI agent.

### Text Analysis

Extract text from various formats for analysis:

```bash
uvx markitdown data.xlsx -o data.md
```

### Batch Processing

Process multiple files:

```bash
for file in *.pdf; do
  uvx markitdown "$file" -o "${file%.pdf}.md"
done
```

### Image OCR

Extract text from images:

```bash
uvx markitdown screenshot.png -o text.md
```

### Audio Transcription

Transcribe audio to text:

```bash
uvx markitdown interview.mp3 -o transcript.md
```

## Tips

- First run is slower due to dependency caching
- Use `-o` flag to specify output file
- For stdin input, use `--file-type` to specify format
- Complex PDFs may benefit from Azure Document Intelligence mode (`-d`)
