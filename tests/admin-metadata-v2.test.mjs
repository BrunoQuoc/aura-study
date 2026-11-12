import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const metaJs=readFileSync('exam_metadata.js','utf8');
const adminJs=readFileSync('admin_metadata_manager.js','utf8');
const html=readFileSync('admin-direct.html','utf8');
const css=readFileSync('admin_metadata_manager.css','utf8');

function harness(preloaded={}) {
  const store=new Map(Object.entries(preloaded));
  const events={};
  const notices=[];
  const app={innerHTML:'',handlers:{},addEventListener(type,fn){this.handlers[type]=fn;},contains(){return true}};
  const window={
    AURA_REVIEWS:{TOAN:[{id:'toan_gk1_thucte',title:'Bài toán thực tế'}]},
    alert:message=>notices.push(String(message)),
    confirm:()=>true,
    addEventListener(type,fn){(events[type] ||= []).push(fn)},
    dispatchEvent(event){for(const fn of events[event.type]||[])fn(event)}
  };
  const document={
    body:{classList:{contains:type=>type==='admin-shell'},dataset:{}},
    getElementById:id=>id==='app'?app:null
  };
  const ctx={document,window,console,
    localStorage:{getItem:key=>store.get(key)||null,setItem:(key,val)=>store.set(key,val)},
    CustomEvent:class {constructor(type,init){this.type=type;this.detail=init?.detail}},
    Date};
  vm.runInNewContext(metaJs,ctx,{timeout:3000});
  vm.runInNewContext(adminJs,ctx,{timeout:3000});
  window.auraMetadataManager();

  function filter(type,value){
    app.handlers.change({target:{
      closest:selector=>selector==='[data-filter]'?{dataset:{filter:type},value}:null
    }});
  }
  function action(name,group,key,options={}){
    const card={
      dataset:{group,key},
      querySelectorAll:()=> (options.periods||[]).map(p=>({dataset:{period:p}})),
      querySelector:selector=>{
        if(selector==='[data-mode]')return {value:options.mode||'replace'};
        if(selector==='[data-reason]')return {value:options.reason||''};
        if(selector==='[data-ack]')return {checked:!!options.ack};
        return null;
      }
    };
    const button={dataset:{action:name},closest:selector=>{
      if(selector==='[data-action]')return button;
      if(selector==='.period-v2-item')return card;
      return null;
    }};
    app.handlers.click({target:button});
  }
  return {store,notices,app,window,document,filter,action};
}

test('Runtime V2 scripts are wired with cache version and guided touch layout',()=>{
  assert.match(html,/admin_metadata_manager\.js\?v=metadata-complete-20261112/);
  assert.match(html,/admin_metadata_manager\.css\?v=metadata-complete-20261112/);
  assert.match(css,/\.period-v2-filter-grid/);
  assert.match(css,/min-height:48px/);
  assert.match(css,/@media\(max-width:600px\)/);
});

test('Guided view separates source declaration, AURA defaults and active use',()=>{
  const h=harness();
  const content=h.app.innerHTML;
  assert.match(content,/Phân kỳ ôn tập & đề thi/);
  assert.match(content,/1. TÀI LIỆU GỐC/);
  assert.match(content,/2. AURA MẶC ĐỊNH/);
  assert.match(content,/3. ĐANG SỬ DỤNG/);
  assert.match(content,/Nguồn chỉ ghi HK1 — không xác nhận riêng GK\/CK/);
  assert.match(content,/Chưa đủ căn cứ từ tài liệu/);
  assert.match(content,/Lý do thay đổi \(bắt buộc\)/);
  assert.match(content,/Đã chỉnh thủ công/);
  assert.match(content,/Cần tách ngân hàng nguồn trước khi phân kỳ/);
  assert.equal(h.document.body.dataset.auraPage,'metadata');
});

test('Subject, period, manual and unassigned filters change only the view',()=>{
  const h=harness();
  h.filter('subject','NGUVAN');
  assert.match(h.app.innerHTML,/Nội dung chưa đầy đủ/);
  assert.match(h.app.innerHTML,/Ngân hàng: Tiếng Việt HKI/);
  assert.doesNotMatch(h.app.innerHTML,/Ngân hàng: Số tự nhiên/);
  h.filter('view','unassigned');
  assert.match(h.app.innerHTML,/Đọc hiểu – 5 chủ đề/);
  h.filter('subject','KHTN');
  assert.match(h.app.innerHTML,/Môn này chưa có tài liệu\/ngân hàng/);
  assert.equal(h.store.size,0,'filter must not write localStorage');
});

test('Save requires a reason and explicit source check',()=>{
  const h=harness(),key='review:TOAN:toan_gk1_thucte';
  h.action('save','resources',key,{periods:['GK2'],reason:'',ack:true});
  h.action('save','resources',key,{periods:['GK2'],reason:'Dùng ôn nền tảng',ack:false});
  assert.equal(h.notices.length,2);
  assert.equal(h.store.size,0);
});

test('Per-item add mode persists separately; source metadata stays unchanged',()=>{
  const h=harness(),key='review:TOAN:toan_gk1_thucte';
  h.action('save','resources',key,{periods:['GK2'],mode:'add',reason:'Ôn nền tảng HK2',ack:true});
  const ov=JSON.parse(h.store.get('aura_metadata_overrides_v1'));
  assert.equal(ov.resources[key].mode,'add');
  assert.equal(ov.resources[key].periods[0],'GK2');
  assert.equal(h.window.AURA_EXAM_METADATA.resources[key].sourcePeriods[0],'GK1');
  const effective=h.window.auraExamMetaFor('review','TOAN','toan_gk1_thucte');
  assert.deepEqual([...effective.effectivePeriods],['GK1','GK2']);
  assert.match(h.app.innerHTML,/Ôn nền tảng HK2/);
});

test('Reset removes only the selected browser override',()=>{
  const h=harness(),key='review:TOAN:toan_gk1_thucte';
  h.action('save','resources',key,{periods:['GK2'],mode:'replace',reason:'Thử nghiệm',ack:true});
  h.action('reset','resources',key);
  const ov=JSON.parse(h.store.get('aura_metadata_overrides_v1'));
  assert.equal(ov.resources[key],undefined);
  assert.deepEqual([...h.window.auraExamMetaFor('review','TOAN','toan_gk1_thucte').effectivePeriods],['GK1']);
});

test('Mixed/unverified bank is not enabled through manual period edits',()=>{
  const h=harness();
  h.action('save','banks','NGUVAN:reviews',{periods:['CK1'],mode:'replace',reason:'Thử',ack:true});
  assert.equal(h.store.size,0);
  assert.match(h.notices.join(''),/Ngân hàng chưa được tách nguồn/);
  assert.equal(h.window.auraExamGeneratorReady('NGUVAN','CK1'),false);
});

test('Existing local override loads unchanged from browser storage',()=>{
  const old=JSON.stringify({resources:{'review:TIENGANH:en_u1_3':{
    periods:['CK1'],mode:'add',reason:'Quyết định cũ',
    assignmentBasis:'manual_admin_override',updatedAt:'2026-11-01T00:00:00Z'
  }},banks:{}});
  const h=harness({aura_metadata_overrides_v1:old});
  assert.match(h.app.innerHTML,/Quyết định cũ/);
  assert.equal(h.store.get('aura_metadata_overrides_v1'),old);
  assert.equal(h.window.auraMetadataOverrides().resources['review:TIENGANH:en_u1_3'].mode,'add');
});


test('Hoàn thành requires a saved/confirmed assignment and hides only the card',()=>{
  const h=harness(),key='review:TOAN:toan_gk1_thucte';
  h.action('complete','resources',key);
  assert.match(h.notices.join(''),/cần lưu một quyết định phân kỳ/);
  assert.equal(h.store.has('aura_metadata_completed_v1'),false);
  h.action('save','resources',key,{periods:['GK2'],mode:'add',reason:'Dùng ôn nền tảng',ack:true});
  assert.match(h.app.innerHTML,/data-action="complete"/);
  h.action('complete','resources',key);
  const record=JSON.parse(h.store.get('aura_metadata_completed_v1'));
  assert.ok(record['resources:'+key].signature);
  assert.equal(h.app.innerHTML.includes('data-key="'+key+'"'),false,'completed item should not remain in default queue');
  assert.match(h.app.innerHTML,/Đã hoàn thành:/);
  const assignment=JSON.parse(h.store.get('aura_metadata_overrides_v1'));
  assert.equal(assignment.resources[key].reason,'Dùng ôn nền tảng','completion cannot delete the approved override');
  assert.deepEqual([...h.window.AURA_EXAM_METADATA.resources[key].sourcePeriods],['GK1'],'source must be untouched');
});

test('Completed filter exposes item and reopen puts it back without deleting assignment',()=>{
  const h=harness(),key='review:TOAN:toan_gk1_thucte';
  h.action('save','resources',key,{periods:['GK2'],reason:'Ôn chương cũ',ack:true});
  h.action('complete','resources',key);
  h.filter('view','completed');
  assert.match(h.app.innerHTML,/data-key="review:TOAN:toan_gk1_thucte"/);
  assert.match(h.app.innerHTML,/data-action="reopen"/);
  h.action('reopen','resources',key);
  assert.equal(h.app.innerHTML.includes('data-key="'+key+'"'),false,'item leaves completed list when reopened');
  h.filter('view','pending');
  assert.match(h.app.innerHTML,/data-key="review:TOAN:toan_gk1_thucte"/);
  const record=JSON.parse(h.store.get('aura_metadata_completed_v1'));
  assert.equal(record['resources:'+key],undefined);
  assert.equal(JSON.parse(h.store.get('aura_metadata_overrides_v1')).resources[key].reason,'Ôn chương cũ');
});

test('Changing an assignment invalidates a previous complete marker',()=>{
  const h=harness(),key='review:TOAN:toan_gk1_thucte';
  h.action('save','resources',key,{periods:['GK2'],reason:'Một',ack:true});
  h.action('complete','resources',key);
  h.window.auraSetMetadataOverride('resources',key,{periods:['CK2'],mode:'replace',reason:'Hai'});
  assert.match(h.app.innerHTML,/data-key="review:TOAN:toan_gk1_thucte"/,'changed item must return to pending');
  h.filter('view','completed');
  assert.equal(h.app.innerHTML.includes('data-key="'+key+'"'),false);
});

test('Blocked question banks cannot be completed to conceal missing sources',()=>{
  const h=harness();
  h.action('complete','banks','NGUVAN:reviews');
  assert.match(h.notices.join(''),/cần lưu một quyết định phân kỳ/);
  assert.equal(h.store.has('aura_metadata_completed_v1'),false);
});

test('Legacy browser overrides are shown as incomplete until explicitly marked done',()=>{
  const id='review:TIENGANH:en_u1_3';
  const old=JSON.stringify({resources:{[id]:{
    periods:['CK1'],mode:'add',reason:'Lịch sử',
    assignmentBasis:'manual_admin_override',updatedAt:'2026-11-01T00:00:00Z'
  }},banks:{}});
  const h=harness({aura_metadata_overrides_v1:old});
  assert.match(h.app.innerHTML,/Lịch sử/);
  assert.equal(h.store.has('aura_metadata_completed_v1'),false);
  h.action('complete','resources',id);
  h.filter('view','completed');
  assert.match(h.app.innerHTML,/Lịch sử/);
  assert.equal(h.store.get('aura_metadata_overrides_v1'),old);
});
