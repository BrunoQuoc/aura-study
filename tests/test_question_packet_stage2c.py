"""Synthetic 78-question + 18-image Stage 2C packet build verification."""
import importlib.util
import json
import tempfile
import unittest
import zipfile
from pathlib import Path

REPO=Path(__file__).resolve().parents[1]
SPEC=importlib.util.spec_from_file_location('aura_packet',REPO/'scripts/build-question-review-packet.py')
PKT=importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(PKT)


class Stage2CPacketTests(unittest.TestCase):
 def setUp(self):
  self.temp=tempfile.TemporaryDirectory()
  self.path=Path(self.temp.name)/'capture.zip'
  sources=[]
  with zipfile.ZipFile(self.path,'w') as z:
   for ex in range(1,6):
    name=f'L6_TOAN_GK1_DE_{ex:02d}_20261027.docx'
    folder=f'capture/{name[:-5]}-0123456789'
    sources.append({'source':name,'originalFileSha256':format(ex,'064x')})
    blocks=[];num_images=2 if ex==1 else 4
    k=0
    for q in range(1,11):
     blocks.append({'kind':'paragraph','text':f'Câu {q}. Câu hỏi synthetic {ex} {q}.'})
     blocks.append({'kind':'table','rows':[
       [[{'kind':'paragraph','text':'A. First'}],[{'kind':'paragraph','text':'B. Second'}]],
       [[{'kind':'paragraph','text':'C. Third'}],[{'kind':'paragraph','text':'D. Fourth'}]]
     ]})
     if k<num_images:
      img=f'word/media/image{k+1}.png'
      blocks.append({'kind':'paragraph','text':'','fragments':[{'kind':'image','asset':img}]})
      z.writestr(folder+f'/media/image{k+1}.png',b'\x89PNG\r\n\x1a\nSYNTHETIC'+bytes([ex,k]))
      k+=1
    for q in range(1,(6 if ex<=2 else 7)):
     blocks.append({'kind':'paragraph','text':f'Bài {q}. Bài tự luận synthetic {ex} {q}.'})
    z.writestr(folder+'/ordered_blocks.json',json.dumps({'sections':{'word/document.xml':blocks}}))
   z.writestr('AURA_STUDY_Source_Audit.json',json.dumps({'sources':sources}))
 def tearDown(self):self.temp.cleanup()

 def test_build_preserves_exact_78_items_18_media_and_original_source_hashes(self):
  p=PKT.build_packet(self.path)
  self.assertEqual(p['audit']['questions'],78)
  self.assertEqual(p['audit']['images'],18)
  self.assertEqual(len(p['audit']['byExam']),5)
  self.assertEqual(p['audit']['byExam']['01']['images'],2)
  self.assertEqual(p['audit']['byExam']['05']['images'],4)
  self.assertEqual(len({x['itemId'] for x in p['items']}),78)
  self.assertTrue(all(x['sourceAnswerProvided'] is False and
                      x['sourceRubricProvided'] is False and
                      x['publishEnabled'] is False and
                      x['reviewedForBank'] is False for x in p['items']))
  self.assertTrue(all(x['sourceSha256']==format(int(x['itemId'][9:11]),'064x') for x in p['items']))
  for x in p['audit']['imageLinks']:
   self.assertEqual(len(x['sha256']),64)
   self.assertTrue(x['questionId'] in {a['itemId'] for a in p['items']})
 def test_broken_source_sha_fails_closed(self):
  with zipfile.ZipFile(self.path,'r') as z:
   copied={k:z.read(k) for k in z.namelist()}
  src=json.loads(copied['AURA_STUDY_Source_Audit.json'])
  src['sources'][0]['originalFileSha256']='NOT_SHA'
  copied['AURA_STUDY_Source_Audit.json']=json.dumps(src).encode()
  with zipfile.ZipFile(self.path,'w') as z:
   for name,data in copied.items():z.writestr(name,data)
  with self.assertRaisesRegex(ValueError,'SHA-256'):
   PKT.build_packet(self.path)

if __name__=='__main__':unittest.main()
