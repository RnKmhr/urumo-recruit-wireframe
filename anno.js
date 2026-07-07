/* ══ Wireframe Text Annotation Overlay ══ */
(function () {
  const CSS = `
    #anno-btn {
      position:fixed;bottom:72px;right:20px;z-index:9999;
      background:#FFEB3B;color:#111;border:none;border-radius:999px;
      padding:10px 18px;font-size:13px;font-weight:700;cursor:pointer;
      box-shadow:0 4px 20px rgba(0,0,0,0.18);
      font-family:'Noto Sans JP',sans-serif;
      display:flex;align-items:center;gap:6px;
      transition:transform .2s,background .2s,color .2s;
    }
    #anno-btn:hover{transform:translateY(-2px)}
    #anno-btn.open{background:#111;color:#FFEB3B}

    #anno-panel {
      position:fixed;top:0;right:-400px;width:360px;height:100vh;
      background:#fff;border-left:1px solid #e0e0e0;z-index:9998;
      overflow-y:auto;transition:right .3s cubic-bezier(.22,1,.36,1);
      box-shadow:-12px 0 40px rgba(0,0,0,0.08);
      font-family:'Noto Sans JP',sans-serif;
    }
    #anno-panel.open{right:0}

    .ap-head {
      padding:20px 20px 16px;border-bottom:1px solid #efefef;
      position:sticky;top:0;background:#fff;z-index:1;
    }
    .ap-head h3{font-size:14px;font-weight:800;color:#111;margin-bottom:4px}
    .ap-head p{font-size:11px;color:#777;line-height:1.7}

    .ap-list{padding:8px 0 80px}

    .ap-item {
      padding:14px 20px;border-bottom:1px solid #f5f5f5;
      cursor:pointer;transition:background .15s;
    }
    .ap-item:hover{background:#fafafa}
    .ap-item.active{background:#FFFDE7}

    .ap-item-row{display:flex;align-items:center;gap:8px;margin-bottom:6px}
    .ap-num {
      display:inline-flex;align-items:center;justify-content:center;
      width:20px;height:20px;border-radius:50%;background:#FFEB3B;
      color:#111;font-size:10px;font-weight:800;flex-shrink:0;
    }
    .ap-label{font-size:13px;font-weight:700;color:#111;flex:1}
    .ap-section{font-size:10px;color:#aaa;white-space:nowrap}
    .ap-desc{font-size:12px;color:#555;line-height:1.85;padding-left:28px}
    .ap-chars {
      display:inline-block;margin-top:6px;padding:2px 8px;
      background:#f0f0f0;border-radius:4px;font-size:10px;font-weight:700;color:#555;
    }
    #anno-csv-btn {
      display:block;width:calc(100% - 40px);margin:12px 20px 0;
      background:#f5f5f5;border:1px solid #e0e0e0;border-radius:6px;
      padding:9px 14px;font-size:12px;font-weight:700;color:#333;
      cursor:pointer;text-align:left;font-family:'Noto Sans JP',sans-serif;
      transition:background .15s;
    }
    #anno-csv-btn:hover{background:#e8e8e8}

    /* highlight */
    .anno-hl {
      outline:2.5px dashed #FFEB3B !important;
      outline-offset:3px;
      background:rgba(255,235,59,0.1) !important;
      border-radius:3px;
      transition:outline-color .2s,background .2s;
    }
    .anno-hl.anno-focus {
      outline-color:#FF6D00 !important;outline-style:solid !important;
      background:rgba(255,109,0,0.07) !important;
    }
  `;

  function boot() {
    const items = window.PAGE_ANNOTATIONS;
    if (!items || !items.length) return;

    /* inject CSS */
    const st = document.createElement('style');
    st.textContent = CSS;
    document.head.appendChild(st);

    /* button */
    const btn = document.createElement('button');
    btn.id = 'anno-btn';
    btn.textContent = '📝 テキスト指示';
    document.body.appendChild(btn);

    /* panel */
    const panel = document.createElement('div');
    panel.id = 'anno-panel';
    panel.innerHTML = `
      <div class="ap-head">
        <h3>📝 テキスト記入指示</h3>
        <p>リストをクリックすると該当箇所がハイライトされます。<br>文字数を参考に文章をご検討ください。</p>
        <button id="anno-csv-btn">⬇ CSV出力（他部署依頼用）</button>
      </div>
      <div class="ap-list" id="ap-list"></div>`;
    document.body.appendChild(panel);

    const list = document.getElementById('ap-list');
    const elMap = {};

    items.forEach((anno, i) => {
      const n = i + 1;
      const el = anno.selector ? document.querySelector(anno.selector) : null;
      if (el) { el.classList.add('anno-hl'); elMap[n] = el; }

      const item = document.createElement('div');
      item.className = 'ap-item';
      item.innerHTML = `
        <div class="ap-item-row">
          <span class="ap-num">${n}</span>
          <span class="ap-label">${anno.label}</span>
          <span class="ap-section">${anno.section || ''}</span>
        </div>
        <div class="ap-desc">
          ${anno.desc}
          ${anno.chars ? `<br><span class="ap-chars">目安：${anno.chars}</span>` : ''}
        </div>`;

      item.addEventListener('click', () => {
        document.querySelectorAll('.ap-item').forEach(x => x.classList.remove('active'));
        document.querySelectorAll('.anno-hl').forEach(x => x.classList.remove('anno-focus'));
        item.classList.add('active');
        const target = elMap[n];
        if (target) {
          target.classList.add('anno-focus');
          target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      });

      list.appendChild(item);
    });

    /* CSV export */
    const pageName = document.title.replace(/\s*—.*$/, '').trim();
    document.getElementById('anno-csv-btn').addEventListener('click', () => {
      const header = ['No.', 'ページ', 'セクション', 'テキスト箇所', '説明', '文字数目安', '記入欄'];
      const rows = items.map((a, i) => [
        i + 1,
        pageName,
        a.section || '',
        a.label || '',
        a.desc || '',
        a.chars || '',
        ''
      ]);
      const esc = v => '"' + String(v).replace(/"/g, '""') + '"';
      const csv = '﻿' + [header, ...rows].map(r => r.map(esc).join(',')).join('\r\n');
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
      a.download = 'text-brief_' + pageName + '.csv';
      a.click();
    });

    /* toggle */
    let open = false;
    btn.addEventListener('click', () => {
      open = !open;
      panel.classList.toggle('open', open);
      btn.classList.toggle('open', open);
      btn.textContent = open ? '✕ 閉じる' : '📝 テキスト指示';
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
