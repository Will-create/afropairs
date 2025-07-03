# Afropairs

**Afropairs** is an open-source data engine designed to extract, generate, and validate high-quality **translation pairs** for African languages at scale.

The goal: **produce a clean, extensible dataset of translation pairs** – from any source, for any African language, with modular LLM workflows.

---

## Mission

African languages are massively underrepresented in NLP.  
Afropairs is built to **solve that gap**, one translation pair at a time.

- ✅ Ingest dictionaries, documents, websites, corpora, etc.
- ✅ Normalize, clean, align and validate
- ✅ Output ready-to-use `.json`, `.csv`, or `.parquet` translation pairs
- ✅ Extend with LLM agents, MCPs, RAG, or other workflows per language

---

## Features (Core)

- **Modular source ingestion**: text files, dictionaries, HTML links, CSVs, PDFs, etc.
- **Pair alignment engine**: sentence-level or phrase-level
- **LLM-based augmentation** (optional): translation, paraphrasing, alignment, quality checks
- **Multi-language support**: all African languages can be registered via config
- **Output standards**: universal schema for training-ready datasets

---

## Example Output

```json
{
  "lang_from": "fr",
  "lang_to": "dyu",
  "source": "Ministère de l'éducation du Burkina Faso",
  "pairs": [
    {
      "text_fr": "Bonjour, comment allez-vous ?",
      "text_dyu": "I ni sogoma, i ka kɛnɛ wa?"
    },
    ...
  ]
}
````

---

## Modular Architecture

```bash
afropairs/
├── sources/           # loaders & scrapers for various data inputs
├── pipelines/         # processing + cleaning + alignment
├── agents/            # optional LLM agents / workflows
├── languages/         # per-language settings, stopwords, configs
├── outputs/           # export formats (json, csv, parquet)
├── config/            # modular settings per use case
└── main.ts            # or main.rs / main.py – entrypoint
```

---

## Use Cases

* Build NMT datasets for low-resource African languages
* Feed into multilingual LLM training (finetuning, alignment)
* Bootstrap RAG pipelines with local language corpora
* Support government, education, fintech, and open knowledge initiatives

---

## Roadmap

* [ ] CLI for ingestion + output
* [ ] Language registration system
* [ ] Source scrapers and parsers
* [ ] Alignment scoring and confidence filters
* [ ] LLM augmentation plugins (OpenAI, Mistral, local models)
* [ ] Exporters (JSONL, CSV, HuggingFace format)

---

## License

MIT – Because Africa needs open data power.

---

## Author

Built by [Louis Bertson](https://github.com/will-create) —
*Software developper from Burkina Faso*

