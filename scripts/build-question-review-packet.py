#!/usr/bin/env python3
"""AURA STUDY Stage 2C: build a PRIVATE local review JSON from 2B ZIP.

Never infer an answer or rubric; never publish to Question Bank or Drive.
Only outputs under repository .aura_private/. Standard library only.
"""
import argparse
import base64
import hashlib
import json
import re
import zipfile
from datetime import datetime, timezone
from pathlib import Path

QUESTION = re.compile(r"^(Câu|Bài)\s+(\d+)\.", re.I)
OPTION = re.compile(r"^\s*([ABCD])\.\s*(.+)$")
EXPECTED_ISSUES = {
    ("02", "Câu 3"): ["DUPLICATE_INCORRECT_OPTIONS_C_AND_D"],
    ("02", "Bài 4"): ["FENCE_PRICE_SQUARE_METRE_WITHOUT_HEIGHT"],
    ("04", "Câu 4"): ["CLOCK_FACE_CIRCLE_VERSUS_HEXAGON_AMBIGUOUS"],
    ("04", "Bài 6"): ["CONTRADICTORY_SQUARE_SIDE_AND_DIAGONAL"],
    ("05", "Bài 6"): ["RHOMBUS_DIAGONAL_REQUIRES_GRADE8_PYTHAGORAS"]
}


def text_lines(block):
    if block.get("kind") == "paragraph":
        return [str(block.get("text", ""))]
    lines = []
    if block.get("kind") == "table":
        for row in block.get("rows", []):
            lines.append(" | ".join(
                " ".join(line for para in cell for line in text_lines(para) if line)
                for cell in row
            ))
    return lines


def image_parts(block):
    if block.get("kind") == "paragraph":
        return [f.get("asset") for f in block.get("fragments", [])
                if f.get("kind") == "image" and f.get("asset")]
    if block.get("kind") == "table":
        return [p for row in block.get("rows", []) for cell in row
                for child in cell for p in image_parts(child)]
    return []


def build_packet(capture_zip):
    with zipfile.ZipFile(capture_zip) as archive:
        audit = json.loads(archive.read("AURA_STUDY_Source_Audit.json"))
        sources = {s["source"]: s for s in audit["sources"]}
        names = sorted(n for n in archive.namelist() if
                       re.search(r"L6_TOAN_GK1_DE_\d\d.*ordered_blocks\.json$", n))
        if not names:
            raise ValueError("No original Math6 exam captures in package")
        packet = {
            "schemaVersion": 1,
            "kind": "aura_question_review_packet_v1",
            "createdAt": datetime.now(timezone.utc).isoformat(),
            "safety": {
                "questionBankPublishEnabled": False,
                "sourceAnswerVerified": False,
                "sourceScoreVerified": False,
                "containsPrivateQuestionContent": True
            },
            "items": [],
            "audit": {"byExam": {}, "imageLinks": []}
        }
        for path in names:
            stem = path.split("/")[1]
            source_name = next((s for s in sources if Path(s).stem in stem), None)
            if not source_name:
                raise ValueError("Cannot connect capture with verified source hash")
            source = sources[source_name]
            exam = re.search(r"_DE_(\d\d)", source_name).group(1)
            if not re.fullmatch(r"[a-f0-9]{64}", source["originalFileSha256"]):
                raise ValueError("Invalid source SHA-256 in original audit")
            blocks = json.loads(archive.read(path))["sections"]["word/document.xml"]
            folder = path.rsplit("/", 1)[0]
            active = None
            for block_number, block in enumerate(blocks):
                line = block.get("text", "").strip() if block.get("kind") == "paragraph" else ""
                match = QUESTION.match(line)
                if match:
                    item_type = "MCQ" if match.group(1).lower() == "câu" else "ESSAY"
                    label = match.group(1).capitalize() + " " + match.group(2)
                    item_id = "M6-GK1-DE" + exam + "-" + item_type + f"{int(match.group(2)):02d}"
                    active = {
                        "itemId": item_id, "sourceName": source_name,
                        "sourceSha256": source["originalFileSha256"],
                        "sourceLabel": label, "type": item_type,
                        "grade": 6, "subject": "TOAN", "period": "GK1",
                        "textBlocks": [line], "options": [], "images": [],
                        "issueFlags": list(EXPECTED_ISSUES.get((exam, label), [])) +
                                      (["ORIGINAL_HAS_NO_SCORING_RUBRIC"] if item_type == "ESSAY" else []),
                        "sourceAnswerProvided": False, "sourceRubricProvided": False,
                        "answerStatus": "NOT_SOURCE_VERIFIED",
                        "rubricStatus": "NOT_SOURCE_VERIFIED",
                        "reviewedForBank": False, "publishEnabled": False
                    }
                    packet["items"].append(active)
                    continue
                if active is None:
                    continue
                if active["type"] == "MCQ" and block.get("kind") == "table":
                    for row in block.get("rows", []):
                        for cell in row:
                            for para in cell:
                                for value in text_lines(para):
                                    found = OPTION.match(value.strip())
                                    if found:
                                        active["options"].append({
                                            "key": found.group(1), "text": found.group(2)
                                        })
                                    elif value.strip():
                                        active["textBlocks"].append(value)
                else:
                    active["textBlocks"].extend(x for x in text_lines(block) if x.strip())
                for part in image_parts(block):
                    member = folder + "/media/" + Path(part).name
                    if member not in archive.namelist():
                        active["issueFlags"].append("IMAGE_MISSING_FROM_PRIVATE_CAPTURE")
                        continue
                    data = archive.read(member)
                    sha = hashlib.sha256(data).hexdigest()
                    img = {"assetName": Path(part).name, "sha256": sha, "sourcePart": part,
                           "sourceBlockIndex": block_number,
                           "dataUrl": "data:image/png;base64," + base64.b64encode(data).decode()}
                    active["images"].append(img)
                    packet["audit"]["imageLinks"].append({
                        "questionId": active["itemId"], "asset": img["assetName"],
                        "sha256": sha, "blockIndex": block_number
                    })
            exam_items = [x for x in packet["items"] if x["itemId"].startswith("M6-GK1-DE" + exam)]
            packet["audit"]["byExam"][exam] = {
                "questions": len(exam_items),
                "images": sum(len(x["images"]) for x in exam_items),
                "sourceSha256": source["originalFileSha256"]
            }
        packet["audit"]["questions"] = len(packet["items"])
        packet["audit"]["images"] = len(packet["audit"]["imageLinks"])
        if packet["audit"]["questions"] != 78 or packet["audit"]["images"] != 18:
            raise ValueError("Unexpected candidate count; please review original source manually")
        return packet


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("capture_zip", help="Private Stage 2B original capture ZIP")
    parser.add_argument("--output", required=True, help="JSON inside repo/.aura_private/")
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[1] / ".aura_private"
    output = Path(args.output).expanduser().resolve()
    if root.resolve() not in output.parents:
        parser.error("Refusing to write question content outside repository .aura_private/")
    result = build_packet(args.capture_zip)
    output.parent.mkdir(parents=True, exist_ok=True, mode=0o700)
    output.write_text(json.dumps(result, ensure_ascii=False, indent=2)+"\n", encoding="utf-8")
    output.chmod(0o600)
    print("PRIVATE QA ONLY: %s questions, %s images. NO QUESTION BANK PUBLISH." %
          (result["audit"]["questions"], result["audit"]["images"]))


if __name__ == "__main__":
    main()
