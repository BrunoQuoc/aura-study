#!/usr/bin/env python3
"""AURA STUDY — private, offline OOXML source capture for content QA.

Reads original DOCX bytes (including drawings, tables and the end of text).
Does NOT infer answers, write Google Drive, or publish to Question Bank.
Requires explicit local source files. All extraction outputs are kept in
repo/.aura_private/ (gitignored). Standard library only; Python 3.11+.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import posixpath
import re
import sys
import zipfile
from pathlib import Path, PurePosixPath
from xml.etree import ElementTree as ET

W = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"
A = "{http://schemas.openxmlformats.org/drawingml/2006/main}"
R = "{http://schemas.openxmlformats.org/officeDocument/2006/relationships}"
REL = "{http://schemas.openxmlformats.org/package/2006/relationships}"
V = "{urn:schemas-microsoft-com:vml}"
ALLOWED_MEDIA_EXT = {".png", ".jpg", ".jpeg", ".gif", ".bmp", ".tif", ".tiff", ".emf", ".wmf", ".webp", ".svg"}
MAX_MEMBERS = 2000
MAX_UNCOMPRESSED = 80 * 1024 * 1024
MAX_ONE_MEMBER = 32 * 1024 * 1024
MAX_RATIO = 500
MAX_DOCX_SIZE = 40 * 1024 * 1024
STATUS_CAPTURED = "CAPTURED_NEEDS_HUMAN_CONTENT_QA"
STATUS_BLOCKED = "BLOCKED_INCOMPLETE_CAPTURE"
STATUS_NO_ANSWER = "BLOCKED_NO_ANSWER"
SAFE_NAME = re.compile(r"[^a-zA-Z0-9._-]+")


class ExtractionError(ValueError):
    pass


def _xml(blob: bytes, name: str) -> ET.Element:
    if b"<!DOCTYPE" in blob.upper() or b"<!ENTITY" in blob.upper():
        raise ExtractionError(f"XML declarations are unsafe: {name}")
    try:
        return ET.fromstring(blob)
    except ET.ParseError as exc:
        raise ExtractionError(f"Invalid OOXML part: {name}") from exc


def _safe_zip_name(name: str) -> bool:
    parts = PurePosixPath(name).parts
    return bool(parts) and not name.startswith("/") and "\\" not in name and "\x00" not in name and ".." not in parts


def _safe_component(value: str, limit: int = 64) -> str:
    return SAFE_NAME.sub("_", value)[:limit].strip("._") or "source"


def _safe_part(source_part: str, target: str) -> str | None:
    # Relationship targets are relative to the part containing their source.
    if not target or target.startswith("/") or "://" in target or "\\" in target:
        return None
    path = posixpath.normpath(posixpath.join(posixpath.dirname(source_part), target))
    if not _safe_zip_name(path) or path.startswith("../"):
        return None
    return path


def _validate_package(z: zipfile.ZipFile) -> set[str]:
    names: set[str] = set()
    total = 0
    if len(z.infolist()) > MAX_MEMBERS:
        raise ExtractionError("Too many OOXML package members")
    for info in z.infolist():
        name = info.filename
        if not _safe_zip_name(name) or name in names:
            raise ExtractionError("Unsafe or duplicate OOXML member")
        names.add(name)
        if info.flag_bits & 1:
            raise ExtractionError("Encrypted OOXML entry is unsupported")
        if info.file_size > MAX_ONE_MEMBER:
            raise ExtractionError("Oversized OOXML package member")
        total += info.file_size
        if total > MAX_UNCOMPRESSED:
            raise ExtractionError("OOXML package exceeds uncompressed size limit")
        if info.file_size > 1024 * 1024 and info.file_size > max(1, info.compress_size) * MAX_RATIO:
            raise ExtractionError("Potential ZIP decompression bomb")
    if "word/document.xml" not in names or "[Content_Types].xml" not in names:
        raise ExtractionError("Not a complete DOCX/OOXML package")
    if any(name.lower().endswith("vbaproject.bin") for name in names):
        raise ExtractionError("Macro-enabled document must not enter source pipeline")
    corrupt = z.testzip()
    if corrupt is not None:
        raise ExtractionError("DOCX CRC check failed")
    return names


def _relations(z: zipfile.ZipFile, source_part: str, all_parts: set[str]) -> dict[str, dict]:
    base = posixpath.dirname(source_part)
    rel_path = posixpath.join(base, "_rels", posixpath.basename(source_part) + ".rels")
    if rel_path not in all_parts:
        return {}
    root = _xml(z.read(rel_path), rel_path)
    out: dict[str, dict] = {}
    for node in root.iter(REL + "Relationship"):
        rid = node.get("Id", "")
        target = node.get("Target", "")
        mode = node.get("TargetMode", "")
        kind = node.get("Type", "")
        if not rid:
            continue
        part = None if mode == "External" else _safe_part(source_part, target)
        out[rid] = {"target": part, "external": mode == "External", "kind": kind}
    return out


def _body_blocks(z: zipfile.ZipFile, part: str, parts: set[str], collector) -> list[dict]:
    root = _xml(z.read(part), part)
    relations = _relations(z, part, parts)

    def paragraph(p: ET.Element) -> dict:
        fragments: list[dict] = []
        for node in p.iter():
            if node.tag in (W + "t", W + "instrText"):
                if node.text:
                    fragments.append({"type": "text", "value": node.text})
            elif node.tag == W + "tab":
                fragments.append({"type": "text", "value": "\t"})
            elif node.tag in (W + "br", W + "cr"):
                fragments.append({"type": "text", "value": "\n"})
            elif node.tag in (A + "blip", V + "imagedata"):
                rid = node.get(R + "embed") or node.get(R + "id")
                if not rid:
                    collector["unresolved"].append("drawing without embedded relationship")
                    fragments.append({"type": "missing_image", "reason": "no_relationship"})
                    continue
                collector["imageReferences"] += 1
                rel = relations.get(rid)
                if not rel or not rel["target"] or rel["external"] or rel["target"] not in parts:
                    collector["unresolved"].append(f"{part}:{rid} missing or external")
                    fragments.append({"type": "missing_image", "reference": rid})
                    continue
                media_part = rel["target"]
                if not media_part.startswith("word/media/"):
                    collector["unresolved"].append(f"{part}:{rid} non-media target")
                    fragments.append({"type": "missing_image", "reference": rid})
                    continue
                asset = collector["add_asset"](media_part, z.read(media_part))
                fragments.append({"type": "image", "assetId": asset["assetId"], "path": asset["relativePath"]})
        content = "".join(f["value"] for f in fragments if f["type"] == "text")
        return {"type": "paragraph", "text": content, "fragments": fragments}

    def cell_content(cell: ET.Element) -> list[dict]:
        blocks = []
        for child in cell:
            if child.tag == W + "p":
                blocks.append(paragraph(child))
            elif child.tag == W + "tbl":
                blocks.append(table(child))
        return blocks

    def table(t: ET.Element) -> dict:
        matrix = []
        for tr in t.findall(W + "tr"):
            row = [cell_content(tc) for tc in tr.findall(W + "tc")]
            matrix.append(row)
        return {"type": "table", "rows": matrix}

    if part == "word/document.xml":
        container = root.find(W + "body")
        if container is None:
            raise ExtractionError("Missing document body")
    else:
        container = root
    out = []
    for child in container:
        if child.tag == W + "p":
            out.append(paragraph(child))
        elif child.tag == W + "tbl":
            out.append(table(child))
    return out


def _word_text(blocks: list[dict]) -> str:
    lines: list[str] = []

    def walk(items):
        for block in items:
            if block["type"] == "paragraph":
                lines.append(block["text"])
            elif block["type"] == "table":
                for row in block["rows"]:
                    for cell in row:
                        walk(cell)
    walk(blocks)
    return "\n".join(lines)


def extract_source(docx_path: Path, private_dir: Path, *, source_id: str = "") -> dict:
    """Capture ordered paragraphs/tables/media; all writes contained in private_dir."""
    docx_path = Path(docx_path).expanduser().resolve()
    private_dir = Path(private_dir).expanduser().resolve()
    if not docx_path.is_file() or docx_path.suffix.lower() != ".docx":
        raise ExtractionError("Input must be an existing .docx file")
    if docx_path.stat().st_size > MAX_DOCX_SIZE:
        raise ExtractionError("Input DOCX exceeds safety limit")
    root_dir = Path(__file__).resolve().parents[1]
    allowed_dir = (root_dir / ".aura_private").resolve()
    if private_dir != allowed_dir and allowed_dir not in private_dir.parents:
        raise ExtractionError("Output must remain inside repository .aura_private/")
    if docx_path == private_dir or private_dir in docx_path.parents:
        raise ExtractionError("Do not use private extraction output as source")
    sha = hashlib.sha256(docx_path.read_bytes()).hexdigest()
    folder = private_dir / (_safe_component(docx_path.stem, 48) + "-" + sha[:12])
    folder.mkdir(parents=True, exist_ok=True, mode=0o700)
    assets_dir = folder / "media"
    assets_dir.mkdir(exist_ok=True, mode=0o700)
    assets_by_part: dict[str, dict] = {}
    asset_warnings: list[str] = []
    unresolved: list[str] = []

    def add_asset(part: str, data: bytes) -> dict:
        if part not in assets_by_part:
            extension = PurePosixPath(part).suffix.lower()
            digest = hashlib.sha256(data).hexdigest()
            if extension not in ALLOWED_MEDIA_EXT:
                asset_warnings.append("Unsupported media extension: " + extension)
            basename = digest[:20] + (extension if extension in ALLOWED_MEDIA_EXT else ".bin")
            target = assets_dir / basename
            if target.exists():
                if hashlib.sha256(target.read_bytes()).hexdigest() != digest:
                    raise ExtractionError("Existing extracted media digest mismatch")
            else:
                target.write_bytes(data)
                target.chmod(0o600)
            assets_by_part[part] = {
                "assetId": digest, "packagePart": part,
                "relativePath": "media/" + basename,
                "bytes": len(data), "sha256": digest,
                "supportedFormat": extension in ALLOWED_MEDIA_EXT,
                "referenced": True
            }
        return assets_by_part[part]

    collector = {"unresolved": unresolved, "imageReferences": 0, "add_asset": add_asset}
    try:
        with zipfile.ZipFile(docx_path) as z:
            parts = _validate_package(z)
            ordered_parts = ["word/document.xml"] + sorted(
                part for part in parts if re.fullmatch(r"word/(header|footer)\d+\.xml", part)
                or part in ("word/footnotes.xml", "word/endnotes.xml")
            )
            sections = {}
            for part in ordered_parts:
                sections[part] = _body_blocks(z, part, parts, collector)
            all_media = sorted(p for p in parts if p.startswith("word/media/") and not p.endswith("/"))
            # Preserve even images that Word holds but no body reference resolves to.
            for part in all_media:
                if part not in assets_by_part:
                    asset = add_asset(part, z.read(part))
                    asset["referenced"] = False
                    asset_warnings.append("Unreferenced media in package: " + part)
            special_parts = sorted(p for p in parts if p.startswith(("word/embeddings/", "word/charts/", "word/diagrams/")))
            unsupported_content = any(p in parts for p in ("word/comments.xml",)) or bool(special_parts)
            document_xml = z.read("word/document.xml")
            if b"<w:altChunk" in document_xml or b"<w:ins" in document_xml or b"<w:del" in document_xml:
                unsupported_content = True
                asset_warnings.append("Tracked changes or alternate content require manual inspection")
    except (zipfile.BadZipFile, OSError, RuntimeError) as exc:
        raise ExtractionError("Cannot fully read original DOCX package") from exc

    main_text = _word_text(sections["word/document.xml"])
    total_chars = sum(len(_word_text(v)) for v in sections.values())
    ordered_blocks = len(sections["word/document.xml"])
    table_count = len([x for x in sections["word/document.xml"] if x["type"] == "table"])
    has_explicit_no_answers = bool(re.search(r"KHONG[_\s-]*DAP[_\s-]*AN|WITHOUT[_\s-]*ANSWERS",
                                              docx_path.stem, flags=re.IGNORECASE))
    if has_explicit_no_answers:
        status = STATUS_NO_ANSWER
    elif unresolved or asset_warnings or unsupported_content:
        status = STATUS_BLOCKED
    else:
        status = STATUS_CAPTURED
    manifest = {
        "schemaVersion": 1,
        "kind": "aura_docx_private_source_capture",
        "sourceFile": docx_path.name,
        "sourceId": source_id if re.fullmatch(r"[A-Za-z0-9_-]{10,200}", source_id or "") else "",
        "sha256": sha, "bytes": docx_path.stat().st_size,
        "capture": {
            "status": status,
            "mainTextChars": len(main_text), "allTextChars": total_chars,
            "mainBlocks": ordered_blocks, "mainTables": table_count,
            "extraParts": [p for p in sections if p != "word/document.xml"],
            "imageReferences": collector["imageReferences"],
            "embeddedMediaCount": len(assets_by_part),
            "unresolvedImages": unresolved,
            "warnings": asset_warnings,
            "embeddedSpecialParts": special_parts,
            "unsupportedContent": unsupported_content
        },
        "review": {
            "metadataOnlyApprovalIsNotContentApproval": True,
            "textImagesRequireHumanCheck": True,
            "answerKeyValidated": False,
            "eligibleForQuestionBank": False,
            "autoGradingEnabled": False,
            "needsIndependentQualityReview": True
        },
        "assets": sorted(assets_by_part.values(), key=lambda a: a["packagePart"]),
        "contentLocation": "blocks.json",
        "privacy": "PRIVATE_DO_NOT_COMMIT"
    }

    (folder / "blocks.json").write_text(
        json.dumps({"sections": sections}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    (folder / "manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    for private_file in (folder / "blocks.json", folder / "manifest.json"):
        private_file.chmod(0o600)
    return manifest


def cli(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Private AURA DOCX capture for review. No Drive writes or bank publish.")
    parser.add_argument("source", help="One original DOCX file or local folder of DOCX originals")
    parser.add_argument("--output", default="", help="Must be under repository .aura_private/")
    args = parser.parse_args(argv)
    repo = Path(__file__).resolve().parents[1]
    output = Path(args.output) if args.output else repo / ".aura_private" / "docx-review"
    path = Path(args.source).expanduser().resolve()
    candidates = sorted(path.glob("*.docx")) if path.is_dir() else [path]
    if not candidates:
        print("No DOCX originals found", file=sys.stderr)
        return 2
    results = []
    try:
        for doc in candidates:
            result = extract_source(doc, output)
            results.append(result)
            metrics = result["capture"]
            print(
                f"{result['sourceFile']}: {metrics['status']}; text={metrics['mainTextChars']} chars; "
                f"tables={metrics['mainTables']}; media={metrics['embeddedMediaCount']}; "
                f"imageRefs={metrics['imageReferences']}; unresolved={len(metrics['unresolvedImages'])}"
            )
    except ExtractionError as exc:
        print("AURA extraction stopped: " + str(exc), file=sys.stderr)
        return 3
    print("Captured " + str(len(results)) + " original DOCX file(s).")
    print("Question Bank publish DISABLED. QA review and answer verification REQUIRED.")
    return 0


if __name__ == "__main__":
    raise SystemExit(cli())
