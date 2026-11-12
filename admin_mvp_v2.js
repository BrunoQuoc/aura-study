/* AURA STUDY — Admin MVP cockpit v2 (presentation only).
   Existing INBOX, metadata, generator, backup and Drive authorization stay unchanged.
   Do not represent local queue or committed source registry as live Drive sync. */
(function () {
  'use strict';
  if (!document.body.classList.contains('admin-shell')) return;
  const app = document.getElementById('app');
  if (!app) return;

  const statusText = {
    ready: 'Có nội dung',
    partial: 'Chưa đầy đủ',
    awaiting_source: 'Chờ tài liệu'
  };
  const subjectIcons = {
    TOAN: '∑', NGUVAN: '文', TIENGANH: 'EN', KHTN: '⚗',
    LSDL: '◎', GDCD: '◇', TINHOC: '⌘', CONGNGHE: '⚙'
  };
  const escapeHtml = value => String(value == null ? '' : value).replace(/[&<>"']/g, ch =>
    ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  function read(key, fallback) {
    try { const value = JSON.parse(localStorage.getItem(key) || 'null'); return value == null ? fallback : value; }
    catch (_) { return fallback; }
  }
  function registry() {
    return window.AURA_EXAM_METADATA && window.AURA_EXAM_METADATA.subjects || {};
  }
  function pendingCount() {
    const queue = read('aura_inbox_queue_v1', []);
    return Array.isArray(queue) ? queue.filter(x => x && x.status === 'WAITING_REVIEW').length : 0;
  }
  function periodText(id) {
    if (typeof window.auraExamGeneratorReady !== 'function') return 'Chưa xác nhận kỳ tạo đề';
    const periods = ['GK1','CK1','GK2','CK2'].filter(p => window.auraExamGeneratorReady(id,p));
    return periods.length ? 'Tạo đề theo: ' + periods.join(', ') : 'Chưa bật tạo đề theo kỳ';
  }
  function subjectCard(id, meta) {
    const status = ['ready','partial','awaiting_source'].includes(meta.status) ? meta.status : 'awaiting_source';
    return '<article class="adm2-subject">' +
      '<div><strong><span aria-hidden="true">' + escapeHtml(subjectIcons[id] || '•') + ' </span>' +
      escapeHtml(meta.label || id) + '</strong>' +
      '<small>' + escapeHtml(meta.note || periodText(id)) + '</small>' +
      '<small>' + escapeHtml(periodText(id)) + '</small></div>' +
      '<span class="adm2-status ' + status + '">' + statusText[status] + '</span>' +
      '<button type="button" data-admin-action="metadata" aria-label="Xem dữ liệu và phân kỳ môn ' +
      escapeHtml(meta.label || id) + '">Kiểm tra dữ liệu →</button>' +
      '</article>';
  }
  let sourceSnapshot = null;
  let sourceFetchStarted = false;
  function renderSourceSnapshot() {
    const element = document.querySelector('#adm2-source-snapshot');
    if (!element || !sourceSnapshot) return;
    const sources = Array.isArray(sourceSnapshot.sources) ? sourceSnapshot.sources : [];
    const processed = sources.filter(x => x && x.representation && !String(x.status || '').startsWith('blocked')).length;
    const blocked = sources.filter(x => x && String(x.status || '').startsWith('blocked')).length;
    element.textContent = 'Registry AURA DATA đã lưu: ' + processed + ' mục có bản chuẩn hóa, ' +
      blocked + ' mục đang bị chặn do thiếu dữ kiện/không trích xuất đủ. Đây là snapshot trong mã nguồn, không phải toàn bộ file hiện có trên Drive.';
  }
  function loadSourceSnapshot() {
    if (sourceFetchStarted) { renderSourceSnapshot(); return; }
    sourceFetchStarted = true;
    fetch('aura_data/processed_sources.json', {cache:'no-store'})
      .then(res => {
        if (!res.ok) throw new Error('Không đọc được registry');
        return res.json();
      })
      .then(data => { sourceSnapshot = data; renderSourceSnapshot(); })
      .catch(() => {
        const node = document.querySelector('#adm2-source-snapshot');
        if (node) node.textContent = 'Chưa đọc được registry AURA DATA (có thể đang ngoại tuyến).';
      });
  }
  function render() {
    try { if (typeof window.setActive === 'function') window.setActive('home'); } catch (_) {}
    document.body.dataset.auraPage = 'home';
    const entries = Object.entries(registry());
    const count = status => entries.filter(pair => pair[1].status === status).length;
    const ready = count('ready');
    const partial = count('partial');
    const awaiting = count('awaiting_source');
    const waiting = pendingCount();
    const folder = read('aura_drive_inbox_folder_v1', null);
    const folderConfigured = !!(folder && folder.id && folder.name === '00_INBOX');
    const cards = entries.map(pair => subjectCard(pair[0], pair[1])).join('');
    const stamp = new Date().toLocaleDateString('vi-VN', {day:'2-digit',month:'long',year:'numeric'});

    app.innerHTML =
      '<div class="adm2">' +
        '<div class="adm2-header"><span class="adm2-kicker">AURA STUDY / QUẢN TRỊ NỘI DUNG / LỚP 6</span>' +
          '<span class="adm2-date">Cập nhật giao diện · ' + escapeHtml(stamp) + '</span></div>' +
        '<section class="adm2-hero" aria-labelledby="adm2-title">' +
          '<div><span class="adm2-kicker" style="color:#bcdbff">TRUNG TÂM ĐIỀU HÀNH HỌC TẬP</span>' +
          '<h1 id="adm2-title">Tài liệu, đề thi và học sinh — trong một nơi.</h1>' +
          '<p>Thêm tài liệu mới, kiểm tra độ đầy đủ của từng môn và theo dõi những mục chưa thể đưa vào đề thi. Không tự tạo đáp án khi nguồn chưa đủ.</p>' +
          '<div class="adm2-actions">' +
            '<button type="button" class="adm2-btn primary" data-admin-action="inbox">＋ Tải tài liệu từ máy</button>' +
            '<button type="button" class="adm2-btn outline" data-admin-action="driveSources">Quét nguồn Google Drive</button>' +
            '<button type="button" class="adm2-btn outline" data-admin-action="students">Quản lý học sinh</button>' +
          '</div></div>' +
          '<div class="adm2-hero-side"><span>Môn đã có nội dung</span><strong>' +
          ready + '<span style="font-size:23px;color:#cee4ff"> / ' + entries.length + '</span></strong>' +
          '<small>' + partial + ' môn đang bổ sung; ' + awaiting +
          ' môn chờ tài liệu. “Có nội dung” không có nghĩa là đủ toàn bộ chương trình.</small></div>' +
        '</section>' +

        '<section class="adm2-metrics" aria-label="Tổng quan dữ liệu">' +
          '<div class="adm2-metric"><span>Môn đã có nội dung</span><strong>' + ready +
          '</strong><small>Theo metadata hiện có</small></div>' +
          '<div class="adm2-metric"><span>Môn chưa đầy đủ</span><strong>' + partial +
          '</strong><small>Chỉ kiểm thử phần đã có</small></div>' +
          '<div class="adm2-metric"><span>Môn đang chờ nguồn</span><strong>' + awaiting +
          '</strong><small>Không ép sinh đề khi thiếu dữ liệu</small></div>' +
          '<div class="adm2-metric"><span>INBOX chờ duyệt trên máy này</span><strong>' + waiting +
          '</strong><small>Không phải số file trực tiếp trên Drive</small></div>' +
        '</section>' +

        '<div class="adm2-grid2">' +
          '<section class="adm2-panel" aria-labelledby="adm2-drive-title">' +
            '<h3 id="adm2-drive-title">01 / Đưa bài tập và đề thi vào AURA</h3>' +
            '<p>Google Drive là nơi lưu bản gốc. Tài liệu cần đi qua kiểm tra chất lượng và chuẩn hóa trước khi học sinh nhìn thấy trong đề.</p>' +
            '<div class="adm2-step"><span class="adm2-step-num">1</span><div>' +
              '<b>Đưa tài liệu vào 00_INBOX</b><small>PDF, Word, ảnh chụp và đáp án; giữ file gốc để đối chiếu.</small></div></div>' +
            '<div class="adm2-step"><span class="adm2-step-num">2</span><div>' +
              '<b>Kết nối Drive và đồng bộ hàng chờ</b><small>' +
              (folderConfigured ? 'Đã nhớ thư mục 00_INBOX trên trình duyệt này. Vẫn cần quyền Drive hợp lệ để đọc file.' :
              'Chưa chọn thư mục 00_INBOX trên trình duyệt này. Mở INBOX để kết nối và chọn thư mục.') +
              '</small></div></div>' +
            '<div class="adm2-step"><span class="adm2-step-num">3</span><div>' +
              '<b>Kiểm tra hình, đáp án và môn học</b><small>File chưa đọc đủ hoặc thiếu đáp án phải ở trạng thái cần rà soát.</small></div></div>' +
            '<div class="adm2-step"><span class="adm2-step-num">4</span><div>' +
              '<b>Duyệt và chuẩn hóa vào ngân hàng</b><small>Duyệt trên Drive không đồng nghĩa với tự động xuất hiện trên web; cần bước nhập AURA DATA.</small></div></div>' +
            '<div class="adm2-panel-foot">' +
              '<button class="adm2-btn primary" type="button" data-admin-action="inbox">Mở INBOX & kết nối Drive</button>' +
              '<button class="adm2-btn" type="button" data-admin-action="library">Xem Thư viện</button>' +
            '</div>' +
            '<div class="adm2-source-status" id="adm2-source-snapshot" aria-live="polite">' +
            'Đang đọc snapshot AURA DATA từ phiên bản web…</div>' +
            '<div class="adm2-alert">Đã có trang “Nguồn Drive” để kết nối quyền đọc và tự quét file vào hàng chờ kiểm tra metadata. Đồng bộ chạy nền và xuất bản đề vẫn chưa bật. ' +
            'Quyền Drive, danh sách file và chất lượng nguồn cần được kiểm chứng trước khi bật.</div>' +
          '</section>' +

          '<section class="adm2-panel" aria-labelledby="adm2-quick-title">' +
            '<h3 id="adm2-quick-title">02 / Thao tác nhanh</h3>' +
            '<p>Những việc Admin thường thực hiện, không cần tìm trong nhiều menu.</p>' +
            '<div class="adm2-step"><span class="adm2-step-num">◎</span><div>' +
              '<b>Học sinh và tiến độ</b><small>Tạo hồ sơ thử nghiệm hoặc xem kết quả học tập cục bộ.</small>' +
              '<div class="adm2-panel-foot"><button type="button" class="adm2-btn" data-admin-action="students">Học sinh</button>' +
              '<button type="button" class="adm2-btn" data-admin-action="results">Kết quả</button></div></div></div>' +
            '<div class="adm2-step"><span class="adm2-step-num">∑</span><div>' +
              '<b>Đề thi và phân kỳ</b><small>Chỉ chọn kỳ và môn đã có ngân hàng câu hỏi phù hợp.</small>' +
              '<div class="adm2-panel-foot"><button type="button" class="adm2-btn" data-admin-action="generator">Tạo đề</button>' +
              '<button type="button" class="adm2-btn" data-admin-action="metadata">Phân kỳ</button></div></div></div>' +
            '<div class="adm2-step"><span class="adm2-step-num">↧</span><div>' +
              '<b>Sao lưu học tập</b><small>Backup là dữ liệu cục bộ, không phải đồng bộ đa thiết bị.</small>' +
              '<div class="adm2-panel-foot"><button type="button" class="adm2-btn" data-admin-action="backup">Xuất backup</button>' +
              '<button type="button" class="adm2-btn" data-admin-action="restore">Khôi phục</button></div></div></div>' +
            '<div class="adm2-alert">Admin hiện chưa được bảo vệ bằng đăng nhập máy chủ. Không sử dụng như cổng quản trị công khai cho nhiều gia đình.</div>' +
          '</section>' +
        '</div>' +

        '<section class="adm2-panel" aria-labelledby="adm2-subjects-title">' +
          '<div class="adm2-section-head"><div><h2 id="adm2-subjects-title">03 / Mức sẵn sàng theo môn</h2>' +
          '<p>Phân biệt “đã có nội dung” với “đủ dữ liệu để tạo đề theo kỳ”.</p></div>' +
          '<button class="adm2-btn" type="button" data-admin-action="metadata">Xem toàn bộ metadata</button></div>' +
          '<div class="adm2-subjects" style="margin-top:15px">' + cards + '</div>' +
        '</section>' +

        '<div class="adm2-footnote">Dữ liệu trạng thái môn được lấy từ exam_metadata.js trong phiên bản đang mở; ' +
        'INBOX chờ duyệt là số trên trình duyệt này. Chúng không thay thế kiểm kê trực tiếp trong Google Drive. ' +
        'Thiếu học liệu được ghi BLOCKED BY CONTENT, không đánh dấu PASS giả cho môn chưa thể kiểm thử.</div>' +
      '</div>';
    loadSourceSnapshot();
  }

  const operations = {
    inbox: 'auraAdminInbox',
    driveSources: 'auraDriveSourceInbox',
    students: 'auraStudentUsers',
    library: 'library',
    results: 'history',
    generator: 'generator',
    metadata: 'auraMetadataManager',
    backup: 'backup',
    restore: 'restoreBackup'
  };
  app.addEventListener('click', function(event) {
    const button = event.target.closest('[data-admin-action]');
    if (!button || !app.contains(button)) return;
    const action = button.getAttribute('data-admin-action');
    const method = operations[action];
    if (method && typeof window[method] === 'function') window[method]();
    else window.alert('Chức năng chưa sẵn sàng trên thiết bị này: ' + (action || ''));
  });
  window.auraAdminHome = render;
  window.home = render;
  window.addEventListener('aura:metadata-overrides-changed', function() {
    if (document.body.dataset.auraPage === 'home') render();
  });
  window.addEventListener('storage', function(e) {
    if (document.body.dataset.auraPage === 'home' &&
      ['aura_inbox_queue_v1','aura_drive_inbox_folder_v1'].includes(e.key)) render();
  });
  render();
})();
