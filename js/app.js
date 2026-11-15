/**
 * app.js —— 视图层
 *
 * 职责：
 *   1. 维护界面状态（筛选、关键字、选中项、编辑草稿、待确认导入）
 *   2. 渲染左侧列表与右侧详情 / 编辑表单
 *   3. 通过事件委托处理全部交互，调用 Store 与 ExcelIO 完成业务动作
 */
(function (global) {
  'use strict';

  const Store = global.Store;
  const ExcelIO = global.ExcelIO;

  /* ------------------------------------------------------------------ */
  /* DOM 与常量                                                          */
  /* ------------------------------------------------------------------ */

  const els = {
    app: document.getElementById('app'),
    list: document.getElementById('contactList'),
    detail: document.getElementById('detail'),
    search: document.getElementById('searchInput'),
    countAll: document.getElementById('countAll'),
    countStarred: document.getElementById('countStarred'),
    statText: document.getElementById('statText'),
    importMask: document.getElementById('importMask'),
    importBody: document.getElementById('importBody'),
    btnConfirmImport: document.getElementById('btnConfirmImport'),
    confirmMask: document.getElementById('confirmMask'),
    confirmText: document.getElementById('confirmText'),
    btnConfirmOk: document.getElementById('btnConfirmOk'),
    fileInput: document.getElementById('fileInput'),
    toastWrap: document.getElementById('toastWrap')
  };

  const AVATAR_PALETTE = [
    { bg: '#e8eeff', fg: '#2a56d6' },
    { bg: '#fff1e0', fg: '#a9600a' },
    { bg: '#e6f7ee', fg: '#0f7a4a' },
    { bg: '#fdeaf0', fg: '#b02a5b' },
    { bg: '#efe9ff', fg: '#6741c9' },
    { bg: '#e4f5fb', fg: '#0d6d8f' },
    { bg: '#f3f0e2', fg: '#7d6a1f' },
    { bg: '#f0f1f5', fg: '#4b5563' }
  ];

  const PLACEHOLDER = {
    phone: '例如 138 0013 8000',
    email: '例如 name@example.com',
    wechat: '例如 zhangwei_hw',
    qq: '例如 283746501',
    address: '省 / 市 / 区 + 详细地址',
    other: '例如 GitHub 主页、传真号'
  };

  /** 界面状态 */
  const state = {
    filter: 'all',
    keyword: '',
    selectedId: null,
    draft: null,        // 非空表示处于编辑态
    isNew: false,
    pendingImport: null, // 待确认的导入结果
    confirmAction: null  // 确认框回调
  };

  /* ------------------------------------------------------------------ */
  /* 工具函数                                                            */
  /* ------------------------------------------------------------------ */

  function escapeHtml(value) {
    return String(value === null || value === undefined ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function avatarStyle(name) {
    let hash = 0;
    const text = String(name || '?');
    for (let i = 0; i < text.length; i += 1) {
      hash = (hash * 31 + text.charCodeAt(i)) % 9973;
    }
    const color = AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
    return '--av-bg:' + color.bg + ';--av-fg:' + color.fg + ';';
  }

  function avatarText(name) {
    const text = String(name || '').trim();
    if (!text) return '?';
    // 中文取首字，英文取首字母大写
    return /[a-zA-Z]/.test(text[0]) ? text[0].toUpperCase() : text[0];
  }

  function formatDate(timestamp) {
    const date = new Date(timestamp);
    const pad = function (n) { return String(n).padStart(2, '0'); };
    return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate());
  }

  function starIcon() {
    return '<svg class="icon"><use href="#i-star"></use></svg>';
  }

  function toast(message, type) {
    const node = document.createElement('div');
    node.className = 'toast' + (type ? ' is-' + type : '');
    node.textContent = message;
    els.toastWrap.appendChild(node);

    setTimeout(function () {
      node.classList.add('is-leave');
      setTimeout(function () { node.remove(); }, 260);
    }, 2400);
  }

  function showMask(element) {
    element.hidden = false;
  }

  function hideMask(element) {
    element.hidden = true;
  }

  function copyText(text) {
    const done = function () { toast('已复制：' + text, 'success'); };

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(function () { fallbackCopy(text, done); });
      return;
    }
    fallbackCopy(text, done);
  }

  function fallbackCopy(text, done) {
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', 'readonly');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    try {
      document.execCommand('copy');
      done();
    } catch (error) {
      toast('复制失败，请手动选择文本', 'error');
    }
    document.body.removeChild(area);
  }

  /* ------------------------------------------------------------------ */
  /* 渲染：列表                                                          */
  /* ------------------------------------------------------------------ */

  function visibleContacts() {
    return Store.query({ keyword: state.keyword, filter: state.filter });
  }

  function renderCounts() {
    const stats = Store.stats();
    els.countAll.textContent = String(stats.total);
    els.countStarred.textContent = String(stats.starred);
    els.statText.textContent = '共 ' + stats.total + ' 位联系人 · ' + stats.methods + ' 条联系方式';
  }

  function renderList() {
    const contacts = visibleContacts();

    if (!contacts.length) {
      const hint = state.keyword
        ? '没有匹配「' + escapeHtml(state.keyword) + '」的联系人'
        : (state.filter === 'starred' ? '还没有收藏联系人，点击右侧 ☆ 即可收藏' : '通讯录还是空的，点击右上角「新建联系人」');
      els.list.innerHTML = '<li class="empty"><div class="empty-inner">' +
        '<svg class="icon"><use href="#i-search"></use></svg>' +
        '<strong>没有找到联系人</strong><p>' + hint + '</p></div></li>';
      return;
    }

    els.list.innerHTML = contacts.map(function (contact) {
      const first = contact.methods[0];
      const sub = [first ? first.value : '暂无联系方式', contact.company]
        .filter(Boolean)
        .join(' · ');

      return '' +
        '<li class="contact-item' + (contact.id === state.selectedId ? ' is-active' : '') + '" data-id="' + contact.id + '">' +
          '<button class="ci-hit" type="button" data-act="open" data-id="' + contact.id + '">' +
            '<span class="avatar" style="' + avatarStyle(contact.name) + '">' + escapeHtml(avatarText(contact.name)) + '</span>' +
            '<span class="ci-main">' +
              '<span class="ci-title">' +
                '<span class="ci-name">' + escapeHtml(contact.name) + '</span>' +
              '</span>' +
              '<span class="ci-sub">' + escapeHtml(sub) + '</span>' +
            '</span>' +
          '</button>' +
          '<button class="star-btn' + (contact.starred ? ' is-on' : '') + '" type="button" ' +
            'data-act="star" data-id="' + contact.id + '" aria-label="' + (contact.starred ? '取消收藏' : '收藏') + '" ' +
            'title="' + (contact.starred ? '取消收藏' : '加入收藏') + '">' + starIcon() + '</button>' +
        '</li>';
    }).join('');
  }

  /* ------------------------------------------------------------------ */
  /* 渲染：详情                                                          */
  /* ------------------------------------------------------------------ */

  function renderDetail() {
    if (state.draft) {
      renderEditor();
      return;
    }

    const contact = state.selectedId ? Store.get(state.selectedId) : null;
    els.app.classList.toggle('show-detail', !!contact);

    if (!contact) {
      state.selectedId = null;
      els.detail.innerHTML = '' +
        '<div class="empty">' +
          '<div class="empty-inner">' +
            '<svg class="icon"><use href="#i-book"></use></svg>' +
            '<strong>选择一位联系人</strong>' +
            '<p>从左侧列表中点击查看详情，或使用右上角「新建联系人」添加。<br />支持按 Ctrl / ⌘ + K 快速搜索。</p>' +
          '</div>' +
        '</div>';
      return;
    }

    const methods = contact.methods.map(function (method) {
      return '' +
        '<li class="method-item">' +
          '<span class="m-badge" data-type="' + method.type + '">' + escapeHtml(Store.typeShort(method.type)) + '</span>' +
          '<span class="m-body">' +
            '<span class="m-value">' + escapeHtml(method.value) + '</span>' +
            '<span class="m-type">' + escapeHtml(Store.typeLabel(method.type)) + '</span>' +
          '</span>' +
          '<button class="btn-icon" type="button" data-act="copy" data-value="' + escapeHtml(method.value) + '" aria-label="复制" title="复制">' +
            '<svg class="icon"><use href="#i-copy"></use></svg>' +
          '</button>' +
        '</li>';
    }).join('');

    els.detail.innerHTML = '' +
      '<div class="detail-view">' +
        '<div class="dv-head">' +
          '<button class="btn-icon dv-back" type="button" data-act="back" aria-label="返回列表">' +
            '<svg class="icon"><use href="#i-chevron"></use></svg>' +
          '</button>' +
          '<span class="avatar avatar-lg" style="' + avatarStyle(contact.name) + '">' + escapeHtml(avatarText(contact.name)) + '</span>' +
          '<div class="dv-headline">' +
            '<h2>' + escapeHtml(contact.name) +
              '<button class="star-btn' + (contact.starred ? ' is-on' : '') + '" type="button" data-act="star" data-id="' + contact.id + '" ' +
                'aria-label="' + (contact.starred ? '取消收藏' : '收藏') + '">' + starIcon() + '</button>' +
            '</h2>' +
            (contact.company ? '<p class="dv-sub">' + escapeHtml(contact.company) + '</p>' : '') +
            '<div class="dv-tags">' +
              (contact.starred ? '<span class="tag tag-star">已收藏</span>' : '') +
              '<span class="tag">' + contact.methods.length + ' 个联系方式</span>' +
            '</div>' +
          '</div>' +
          '<div class="dv-actions">' +
            '<button class="btn" type="button" data-act="edit">' +
              '<svg class="icon"><use href="#i-edit"></use></svg>编辑' +
            '</button>' +
            '<button class="btn btn-danger-ghost" type="button" data-act="delete" aria-label="删除联系人">' +
              '<svg class="icon"><use href="#i-trash"></use></svg>删除' +
            '</button>' +
          '</div>' +
        '</div>' +

        '<section>' +
          '<h3 class="section-title">联系方式 <span class="count">' + contact.methods.length + '</span></h3>' +
          (contact.methods.length
            ? '<ul class="method-list">' + methods + '</ul>'
            : '<p class="hint">还没有填写联系方式，点击「编辑」补充。</p>') +
        '</section>' +

        (contact.note
          ? '<section><h3 class="section-title">备注</h3><p class="note">' + escapeHtml(contact.note) + '</p></section>'
          : '') +

        '<footer class="dv-meta">创建于 ' + formatDate(contact.createdAt) + ' · 最近更新 ' + formatDate(contact.updatedAt) + '</footer>' +
      '</div>';
  }

  /* ------------------------------------------------------------------ */
  /* 渲染：编辑器                                                        */
  /* ------------------------------------------------------------------ */

  function methodRowHtml(method) {
    const options = Store.TYPES.map(function (type) {
      return '<option value="' + type.key + '"' + (type.key === method.type ? ' selected' : '') + '>' + type.label + '</option>';
    }).join('');

    return '' +
      '<div class="method-row" data-mid="' + method.id + '">' +
        '<select class="input m-type" aria-label="联系方式类型">' + options + '</select>' +
        '<input class="input m-value" type="text" value="' + escapeHtml(method.value) + '" ' +
          'placeholder="' + escapeHtml(PLACEHOLDER[method.type] || '') + '" aria-label="联系方式内容" />' +
        '<button class="btn-icon" type="button" data-act="remove-method" aria-label="删除这一项" title="删除这一项">' +
          '<svg class="icon"><use href="#i-trash"></use></svg>' +
        '</button>' +
      '</div>';
  }

  function renderEditor() {
    const draft = state.draft;
    els.app.classList.add('show-detail');

    els.detail.innerHTML = '' +
      '<form class="editor" id="editorForm" novalidate>' +
        '<div class="editor-head">' +
          '<button class="btn-icon dv-back" type="button" data-act="back" aria-label="返回列表">' +
            '<svg class="icon"><use href="#i-chevron"></use></svg>' +
          '</button>' +
          '<h2>' + (state.isNew ? '新建联系人' : '编辑联系人') + '</h2>' +
        '</div>' +

        '<div class="field-row">' +
          '<div class="field">' +
            '<label for="fName">姓名 <span style="color:var(--danger)">*</span></label>' +
            '<input class="input" id="fName" type="text" value="' + escapeHtml(draft.name) + '" placeholder="请输入姓名" autocomplete="off" />' +
          '</div>' +
          '<div class="field">' +
            '<label for="fCompany">公司 / 单位</label>' +
            '<input class="input" id="fCompany" type="text" value="' + escapeHtml(draft.company) + '" placeholder="选填" autocomplete="off" />' +
          '</div>' +
        '</div>' +

        '<div class="field">' +
          '<div class="field-label-row">' +
            '<span class="field-label">联系方式</span>' +
            '<button class="link-btn" type="button" data-act="add-method">+ 添加一项</button>' +
          '</div>' +
          '<div class="method-rows" id="methodRows">' +
            (draft.methods.length
              ? draft.methods.map(methodRowHtml).join('')
              : methodRowHtml({ id: Store.uid('m'), type: 'phone', value: '' })) +
          '</div>' +
        '</div>' +

        '<div class="field">' +
          '<label for="fNote">备注</label>' +
          '<textarea class="input" id="fNote" rows="3" placeholder="选填，例如「实验室师兄，负责嵌入式方向」">' + escapeHtml(draft.note) + '</textarea>' +
        '</div>' +

        '<label class="check">' +
          '<input type="checkbox" id="fStarred"' + (draft.starred ? ' checked' : '') + ' /> 加入收藏，置顶显示' +
        '</label>' +

        '<div class="editor-foot">' +
          '<span class="hint" id="editorHint">姓名必填，联系方式可留空</span>' +
          '<span class="spacer"></span>' +
          '<button class="btn" type="button" data-act="cancel">取消</button>' +
          '<button class="btn btn-primary" type="submit">保存</button>' +
        '</div>' +
      '</form>';

    const nameInput = document.getElementById('fName');
    if (nameInput) nameInput.focus();
  }

  /* ------------------------------------------------------------------ */
  /* 渲染入口                                                            */
  /* ------------------------------------------------------------------ */

  function render() {
    renderCounts();
    renderList();
    renderDetail();
  }

  /* ------------------------------------------------------------------ */
  /* 业务动作                                                            */
  /* ------------------------------------------------------------------ */

  function openContact(id) {
    state.selectedId = id;
    state.draft = null;
    render();
  }

  function startCreate() {
    state.isNew = true;
    state.selectedId = null;
    state.draft = {
      id: null,
      name: '',
      company: '',
      note: '',
      starred: false,
      methods: [{ id: Store.uid('m'), type: 'phone', value: '' }]
    };
    render();
  }

  function startEdit() {
    const contact = state.selectedId ? Store.get(state.selectedId) : null;
    if (!contact) return;
    state.isNew = false;
    state.draft = JSON.parse(JSON.stringify(contact));
    render();
  }

  function cancelEdit() {
    state.draft = null;
    state.isNew = false;
    render();
  }

  function collectDraft() {
    const name = document.getElementById('fName').value.trim();
    const company = document.getElementById('fCompany').value.trim();
    const note = document.getElementById('fNote').value.trim();
    const starred = document.getElementById('fStarred').checked;

    const methods = Array.prototype.slice
      .call(document.querySelectorAll('#methodRows .method-row'))
      .map(function (row) {
        return {
          id: row.getAttribute('data-mid'),
          type: row.querySelector('.m-type').value,
          value: row.querySelector('.m-value').value.trim()
        };
      })
      .filter(function (method) { return method.value; });

    return { name: name, company: company, note: note, starred: starred, methods: methods };
  }

  function saveDraft() {
    const data = collectDraft();
    const nameInput = document.getElementById('fName');
    const hint = document.getElementById('editorHint');

    if (!data.name) {
      nameInput.classList.add('is-invalid');
      hint.textContent = '请填写姓名';
      hint.classList.add('is-warn');
      nameInput.focus();
      return;
    }

    let saved;
    if (state.isNew) {
      saved = Store.add(data);
      toast('已新建联系人「' + saved.name + '」', 'success');
    } else {
      saved = Store.update(state.selectedId, data);
      toast('已保存修改', 'success');
    }

    state.draft = null;
    state.isNew = false;
    state.selectedId = saved.id;
    render();
  }

  function removeContact() {
    const contact = state.selectedId ? Store.get(state.selectedId) : null;
    if (!contact) return;

    openConfirm('确定删除联系人「' + contact.name + '」吗？删除后无法恢复。', function () {
      const listBefore = visibleContacts();
      Store.remove(contact.id);

      const remain = Store.all();
      state.selectedId = remain.length ? remain[0].id : null;
      render();
      toast('已删除「' + contact.name + '」', 'success');
      return listBefore;
    }, '删除');
  }

  function toggleStar(id) {
    const starred = Store.toggleStar(id);
    render();
    toast(starred ? '已加入收藏' : '已取消收藏', 'success');
  }

  /* ------------------------------------------------------------------ */
  /* 确认框                                                              */
  /* ------------------------------------------------------------------ */

  function openConfirm(text, onConfirm, okText) {
    state.confirmAction = onConfirm;
    els.confirmText.textContent = text;
    els.btnConfirmOk.textContent = okText || '确认';
    showMask(els.confirmMask);
  }

  function closeConfirm() {
    state.confirmAction = null;
    hideMask(els.confirmMask);
  }

  /* ------------------------------------------------------------------ */
  /* 导入导出                                                            */
  /* ------------------------------------------------------------------ */

  function triggerImport() {
    els.fileInput.value = '';
    els.fileInput.click();
  }

  function handleFileSelected(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    ExcelIO.readFile(file)
      .then(openImportPreview)
      .catch(function (error) {
        toast(error.message || '文件解析失败', 'error');
      });
  }

  function openImportPreview(result) {
    state.pendingImport = result.contacts;

    const records = result.contacts;
    const preview = records.slice(0, 8);

    const summary = records.length
      ? '<div class="import-summary">' +
          '<span class="import-badge"><svg class="icon"><use href="#i-check"></use></svg></span>' +
          '<div>' +
            '<strong>成功解析 ' + records.length + ' 位联系人</strong>' +
            '<p>共扫描 ' + result.total + ' 行数据' +
              (result.skipped ? '，跳过 ' + result.skipped + ' 行无效数据' : '') +
              '，联系人将合并进现有通讯录。</p>' +
          '</div>' +
        '</div>'
      : '<div class="modal-fallback">没有解析到有效数据。请确认表头包含「姓名」列，或点击下方按钮下载模板。</div>';

    const table = preview.length
      ? '<div class="table-wrap"><table class="preview-table">' +
          '<thead><tr><th>姓名</th><th>收藏</th><th>联系方式</th><th>公司</th></tr></thead><tbody>' +
          preview.map(function (contact) {
            return '<tr>' +
              '<td>' + escapeHtml(contact.name) + '</td>' +
              '<td>' + (contact.starred ? '是' : '否') + '</td>' +
              '<td>' + escapeHtml(contact.methods.map(function (m) { return m.value; }).join(' / ')) + '</td>' +
              '<td>' + escapeHtml(contact.company || '') + '</td>' +
            '</tr>';
          }).join('') +
          '</tbody></table></div>' +
          (records.length > preview.length
            ? '<p class="hint" style="margin-top:10px">仅预览前 ' + preview.length + ' 条，导入后全部写入。</p>'
            : '')
      : '';

    els.importBody.innerHTML = summary + table;
    els.btnConfirmImport.disabled = !records.length;
    showMask(els.importMask);
  }

  function confirmImport() {
    const records = state.pendingImport;
    if (!records || !records.length) return;

    const report = Store.mergeImported(records);
    const first = Store.all()[0];

    state.pendingImport = null;
    hideMask(els.importMask);
    state.selectedId = first ? first.id : null;
    render();

    toast('导入完成：新增 ' + report.added + ' 条，合并 ' + report.merged + ' 条，跳过 ' + report.skipped + ' 条', 'success');
  }

  function doExport() {
    if (!Store.count()) {
      toast('通讯录为空，没有可导出的联系人', 'error');
      return;
    }
    const total = Store.count();
    ExcelIO.exportContacts(Store.all(), ExcelIO.defaultFileName('通讯录'));
    toast('已导出 ' + total + ' 位联系人', 'success');
  }

  function downloadTemplate() {
    ExcelIO.downloadTemplate();
    toast('模板已下载，按表头填写后即可导入', 'success');
  }

  /* ------------------------------------------------------------------ */
  /* 事件绑定                                                            */
  /* ------------------------------------------------------------------ */

  function bindEvents() {
    /* 顶栏 */
    document.getElementById('btnNew').addEventListener('click', startCreate);
    document.getElementById('btnImport').addEventListener('click', triggerImport);
    document.getElementById('btnExport').addEventListener('click', doExport);
    document.getElementById('btnTemplate').addEventListener('click', downloadTemplate);
    document.getElementById('btnConfirmImport').addEventListener('click', confirmImport);
    els.fileInput.addEventListener('change', handleFileSelected);

    /* 搜索 */
    els.search.addEventListener('input', function (event) {
      state.keyword = event.target.value.trim();
      renderList();
    });

    /* 筛选标签 */
    Array.prototype.forEach.call(document.querySelectorAll('.tab'), function (tab) {
      tab.addEventListener('click', function () {
        state.filter = tab.getAttribute('data-filter');
        Array.prototype.forEach.call(document.querySelectorAll('.tab'), function (item) {
          const active = item === tab;
          item.classList.toggle('is-active', active);
          item.setAttribute('aria-selected', active ? 'true' : 'false');
        });
        renderList();
      });
    });

    /* 列表（事件委托） */
    els.list.addEventListener('click', function (event) {
      const actionNode = event.target.closest('[data-act]');
      if (!actionNode) return;

      const action = actionNode.getAttribute('data-act');
      const id = actionNode.getAttribute('data-id');

      if (action === 'open') openContact(id);
      if (action === 'star') toggleStar(id);
    });

    /* 详情 / 编辑器（事件委托） */
    els.detail.addEventListener('click', function (event) {
      const actionNode = event.target.closest('[data-act]');
      if (!actionNode) return;

      const action = actionNode.getAttribute('data-act');

      if (action === 'star') toggleStar(actionNode.getAttribute('data-id'));
      if (action === 'edit') startEdit();
      if (action === 'delete') removeContact();
      if (action === 'copy') copyText(actionNode.getAttribute('data-value'));
      if (action === 'cancel') cancelEdit();
      if (action === 'back') {
        if (state.draft) {
          cancelEdit();
          return;
        }
        els.app.classList.remove('show-detail');
      }
      if (action === 'add-method') {
        const rows = document.getElementById('methodRows');
        const holder = document.createElement('div');
        holder.innerHTML = methodRowHtml({ id: Store.uid('m'), type: 'phone', value: '' });
        const row = holder.firstElementChild;
        rows.appendChild(row);
        row.querySelector('.m-value').focus();
      }
      if (action === 'remove-method') {
        const row = actionNode.closest('.method-row');
        const rows = document.getElementById('methodRows');
        if (!row) return;
        if (rows.children.length > 1) {
          row.remove();
        } else {
          row.querySelector('.m-value').value = '';
        }
      }
    });

    /* 编辑表单：类型切换更新占位提示 + 提交 */
    els.detail.addEventListener('change', function (event) {
      if (!event.target.classList.contains('m-type')) return;
      const row = event.target.closest('.method-row');
      const input = row.querySelector('.m-value');
      input.placeholder = PLACEHOLDER[event.target.value] || '';
    });

    els.detail.addEventListener('submit', function (event) {
      if (event.target.id !== 'editorForm') return;
      event.preventDefault();
      saveDraft();
    });

    /* 弹窗关闭按钮与遮罩 */
    Array.prototype.forEach.call(document.querySelectorAll('[data-close]'), function (button) {
      button.addEventListener('click', function () {
        const mask = document.getElementById(button.getAttribute('data-close'));
        if (mask === els.confirmMask) closeConfirm();
        else hideMask(mask);
      });
    });

    els.confirmMask.addEventListener('click', function (event) {
      if (event.target === els.confirmMask) closeConfirm();
    });

    els.importMask.addEventListener('click', function (event) {
      if (event.target === els.importMask) hideMask(els.importMask);
    });

    els.btnConfirmOk.addEventListener('click', function () {
      const action = state.confirmAction;
      closeConfirm();
      if (typeof action === 'function') action();
    });

    /* 侧栏底部：示例数据 / 清空 */
    document.getElementById('btnDemo').addEventListener('click', function () {
      openConfirm('将覆盖当前全部联系人并载入 6 条示例数据，确定继续吗？', function () {
        Store.resetDemo();
        state.selectedId = Store.all()[0].id;
        state.draft = null;
        render();
        toast('已载入示例数据', 'success');
      }, '载入示例');
    });

    document.getElementById('btnClear').addEventListener('click', function () {
      if (!Store.count()) {
        toast('通讯录已经是空的', 'error');
        return;
      }
      openConfirm('将删除全部 ' + Store.count() + ' 位联系人，且无法恢复。确定继续吗？', function () {
        Store.clear();
        state.selectedId = null;
        state.draft = null;
        render();
        toast('通讯录已清空', 'success');
      }, '全部删除');
    });

    /* 快捷键 */
    document.addEventListener('keydown', function (event) {
      const meta = event.ctrlKey || event.metaKey;

      if (meta && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        els.search.focus();
        els.search.select();
        return;
      }

      if (meta && event.key.toLowerCase() === 's' && state.draft) {
        event.preventDefault();
        saveDraft();
        return;
      }

      if (event.key === 'Escape') {
        if (!els.confirmMask.hidden) {
          closeConfirm();
        } else if (!els.importMask.hidden) {
          hideMask(els.importMask);
        } else if (state.draft) {
          cancelEdit();
        }
      }
    });
  }

  /* ------------------------------------------------------------------ */
  /* 启动                                                                */
  /* ------------------------------------------------------------------ */

  function boot() {
    const contacts = Store.init();

    if (!Store.isPersistent()) {
      toast('浏览器禁用了本地存储，本次修改不会保存', 'error');
    }

    if (contacts.length && window.innerWidth > 780) {
      state.selectedId = contacts[0].id;
    }

    bindEvents();
    render();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})(window);
