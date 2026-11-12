"""Offline synthetic tests for AURA's private DOCX source-capture gate."""
import importlib.util
import json
import tempfile
import unittest
import zipfile
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
SRC = REPO / "scripts" / "extract-docx-for-review.py"
SPEC = importlib.util.spec_from_file_location("aura_docx_extract", SRC)
EXTRACTOR = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(EXTRACTOR)
W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
A = "http://schemas.openxmlformats.org/drawingml/2006/main"
R = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
REL = "http://schemas.openxmlformats.org/package/2006/relationships"
IMAGE = b"\x89PNG\r\n\x1a\nTEST_PAYLOAD"
DOC = (
    f'<w:document xmlns:w="{W}" xmlns:a="{A}" xmlns:r="{R}">'
    '<w:body>'
    '<w:p><w:r><w:t>Question 1: diagram</w:t></w:r><w:r>'
    '<w:drawing><a:blip r:embed="rId7"/></w:drawing></w:r></w:p>'
    '<w:tbl><w:tr><w:tc><w:p><w:r><w:t>Cell A</w:t></w:r></w:p></w:tc>'
    '<w:tc><w:p><w:r><w:t>Cell B</w:t></w:r></w:p></w:tc></w:tr></w:tbl>'
    '<w:p><w:r><w:t>END OF DOCUMENT</w:t></w:r></w:p>'
    '</w:body></w:document>'
)
RELATIONSHIPS = (
    f'<Relationships xmlns="{REL}">'
    f'<Relationship Id="rId7" Target="media/figure.png" '
    f'Type="{R}/image"/></Relationships>'
)
HEADER = f'<w:hdr xmlns:w="{W}"><w:p><w:r><w:t>Page header</w:t></w:r></w:p></w:hdr>'


class SourceCaptureTests(unittest.TestCase):
    def setUp(self):
        (REPO / ".aura_private").mkdir(exist_ok=True)
        self.tmp = tempfile.TemporaryDirectory()
        self.private = tempfile.TemporaryDirectory(dir=REPO / ".aura_private")
        self.path = Path(self.tmp.name) / "exam.docx"

    def tearDown(self):
        self.tmp.cleanup()
        self.private.cleanup()

    def package(self, *, name="exam.docx", document=DOC, media=True, macro=False,
                traversal=False, include_rels=True, missing_image=False, extra_media=False):
        dest = Path(self.tmp.name) / name
        with zipfile.ZipFile(dest, "w", zipfile.ZIP_DEFLATED) as z:
            z.writestr("[Content_Types].xml", '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"/>')
            z.writestr("word/document.xml", document)
            z.writestr("word/header1.xml", HEADER)
            if include_rels:
                z.writestr("word/_rels/document.xml.rels", RELATIONSHIPS)
            if media and not missing_image:
                z.writestr("word/media/figure.png", IMAGE)
            if extra_media:
                z.writestr("word/media/unused.png", IMAGE)
            if macro:
                z.writestr("word/vbaProject.bin", b"macro")
            if traversal:
                z.writestr("../unsafe.txt", b"unsafe")
        return dest

    def test_complete_package_preserves_order_media_table_header_and_hash(self):
        source = self.package()
        original = source.read_bytes()
        m = EXTRACTOR.extract_source(source, Path(self.private.name))
        self.assertEqual(m["capture"]["status"], EXTRACTOR.STATUS_CAPTURED)
        self.assertEqual(m["capture"]["imageReferences"], 1)
        self.assertEqual(m["capture"]["embeddedMediaCount"], 1)
        self.assertEqual(m["capture"]["mainTables"], 1)
        self.assertEqual(m["capture"]["unresolvedImages"], [])
        self.assertEqual(m["review"]["eligibleForQuestionBank"], False)
        self.assertEqual(m["review"]["answerKeyValidated"], False)
        self.assertIn("word/header1.xml", m["capture"]["extraParts"])
        subdir = next(Path(self.private.name).iterdir())
        blocks = json.loads((subdir / "blocks.json").read_text("utf-8"))
        body = blocks["sections"]["word/document.xml"]
        self.assertEqual([x["type"] for x in body], ["paragraph", "table", "paragraph"])
        self.assertEqual(body[0]["text"], "Question 1: diagram")
        self.assertEqual(body[1]["rows"][0][1][0]["text"], "Cell B")
        self.assertEqual(body[-1]["text"], "END OF DOCUMENT")
        asset = subdir / m["assets"][0]["relativePath"]
        self.assertEqual(asset.read_bytes(), IMAGE)
        self.assertTrue(str(asset.resolve()).startswith(str((REPO / ".aura_private").resolve())))
        self.assertEqual(source.read_bytes(), original, "source must never be modified")
        same = EXTRACTOR.extract_source(source, Path(self.private.name))
        self.assertEqual(m["sha256"], same["sha256"])
        self.assertEqual(len(list(Path(self.private.name).iterdir())), 1)

    def test_missing_embedded_image_is_blocked_not_hallucinated(self):
        src = self.package(missing_image=True)
        result = EXTRACTOR.extract_source(src, Path(self.private.name))
        self.assertEqual(result["capture"]["status"], EXTRACTOR.STATUS_BLOCKED)
        self.assertEqual(result["capture"]["imageReferences"], 1)
        self.assertEqual(result["capture"]["embeddedMediaCount"], 0)
        self.assertEqual(len(result["capture"]["unresolvedImages"]), 1)
        self.assertFalse(result["review"]["eligibleForQuestionBank"])

    def test_missing_relationship_and_unreferenced_media_are_blocked(self):
        src = self.package(include_rels=False)
        result = EXTRACTOR.extract_source(src, Path(self.private.name))
        self.assertEqual(result["capture"]["status"], EXTRACTOR.STATUS_BLOCKED)
        src2 = self.package(name="extra.docx", extra_media=True)
        result2 = EXTRACTOR.extract_source(src2, Path(self.private.name))
        self.assertEqual(result2["capture"]["status"], EXTRACTOR.STATUS_BLOCKED)
        self.assertEqual(result2["capture"]["embeddedMediaCount"], 2)
        self.assertTrue(any("Unreferenced media" in x for x in result2["capture"]["warnings"]))

    def test_explicit_no_answers_never_enters_bank_even_when_capture_complete(self):
        src = self.package(name="L6_TIENGANH_KHONG_DAP_AN.docx")
        result = EXTRACTOR.extract_source(src, Path(self.private.name))
        self.assertEqual(result["capture"]["status"], EXTRACTOR.STATUS_NO_ANSWER)
        self.assertFalse(result["review"]["answerKeyValidated"])
        self.assertFalse(result["review"]["autoGradingEnabled"])

    def test_untrusted_docx_package_rejected_without_zip_traversal(self):
        for flag in ("macro", "traversal"):
            with self.subTest(flag=flag):
                src = self.package(name=flag + ".docx", **{flag: True})
                with self.assertRaises(EXTRACTOR.ExtractionError):
                    EXTRACTOR.extract_source(src, Path(self.private.name))
        self.assertFalse((Path(self.tmp.name) / "unsafe.txt").exists())

    def test_outputs_cannot_escape_private_gitignored_directory(self):
        src = self.package()
        with self.assertRaisesRegex(EXTRACTOR.ExtractionError, "inside repository"):
            EXTRACTOR.extract_source(src, Path(self.tmp.name))
        self.assertFalse((Path(self.tmp.name) / "blocks.json").exists())

    def test_xml_dtd_rejected(self):
        doc = b'<!DOCTYPE test [<!ENTITY leak SYSTEM "file:///etc/passwd">]><w:document/>'
        src = self.package(name="injection.docx", document=doc)
        with self.assertRaises(EXTRACTOR.ExtractionError):
            EXTRACTOR.extract_source(src, Path(self.private.name))


if __name__ == "__main__":
    unittest.main()
