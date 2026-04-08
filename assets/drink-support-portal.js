/* ─── EUPHREE SUPPORT PORTAL v5 — JS ────────────────────── */
(function() {

  // ── HUBSPOT CONFIG ──────────────────────────────────────
  // These values are injected from the Liquid section settings.
  // They read from window.__euPortalConfig set in the section template.
  var cfg = window.__euPortalConfig || {};
  var HS = {
    proxyUrl:   cfg.proxyUrl   || '/apps/euphree-hs-proxy',
    portalId:   cfg.portalId   || '',
    formId:     cfg.formId     || '',
    pipelineId: cfg.pipelineId || '',
    stageNew:   cfg.stageNew   || '',
    priorities: {
      'dtc-inquiry':'LOW','dtc-ship':'HIGH','dtc-bike':'MEDIUM','dtc-pq':'LOW',
      'dlr-ship':'HIGH','dlr-floor':'MEDIUM','dlr-cust':'HIGH'
    }
  };

  // ── STATE ───────────────────────────────────────────────
  var _aud = null, _dtcType = null, _dtcSub = null, _dlrType = null, _form = null;
  var _files = {};

  // ── NAVIGATION ──────────────────────────────────────────
  window.euGo = function(id) {
    document.querySelectorAll('#eu-portal .eu-screen').forEach(function(s) { s.classList.remove('eu-active'); });
    document.getElementById(id).classList.add('eu-active');
    document.getElementById('eu-portal').scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  window.euSetAud = function(t) { _aud = t; euGo(t === 'dtc' ? 'eu-dtc1' : 'eu-dlr1'); };

  window.euPickDtc = function(t) {
    _dtcType = t;
    document.querySelectorAll('[id^="eu-dtc-"]').forEach(function(b) { b.classList.remove('eu-sel'); });
    document.getElementById('eu-dtc-' + t).classList.add('eu-sel');
    document.getElementById('eu-dtc1-next').disabled = false;
  };
  window.euDtc1Next = function() { euGo(_dtcType === 'inquiry' ? 'eu-dtc2a' : 'eu-dtc2b'); };

  window.euPickSub = function(t) {
    _dtcSub = t;
    document.querySelectorAll('[id^="eu-sub-"]').forEach(function(b) { b.classList.remove('eu-sel'); });
    document.getElementById('eu-sub-' + t).classList.add('eu-sel');
    document.getElementById('eu-dtc2b-next').disabled = false;
  };
  window.euSub2Next = function() { euGo({ ship:'eu-dtc3a', bike:'eu-dtc3b', pq:'eu-dtc3c' }[_dtcSub]); };

  window.euPickDlr = function(t) {
    _dlrType = t;
    document.querySelectorAll('[id^="eu-dlr-"]').forEach(function(b) { b.classList.remove('eu-sel'); });
    document.getElementById('eu-dlr-' + t).classList.add('eu-sel');
    document.getElementById('eu-dlr2-next').disabled = false;
  };
  window.euDlr2Next = function() { euGo({ dship:'eu-dlr3a', floor:'eu-dlr3b', custbike:'eu-dlr3c' }[_dlrType]); };

  // ── FILE HANDLING ───────────────────────────────────────
  window.euFiles = function(input, key) {
    if (!_files[key]) _files[key] = [];
    _files[key] = _files[key].concat(Array.from(input.files));
    renderFiles(key);
  };
  window.euDrag = function(e) { e.preventDefault(); e.currentTarget.classList.add('eu-drag'); };
  window.euUndrag = function(e) { e.currentTarget.classList.remove('eu-drag'); };
  window.euDrop = function(e, key) {
    e.preventDefault(); e.currentTarget.classList.remove('eu-drag');
    if (!_files[key]) _files[key] = [];
    _files[key] = _files[key].concat(Array.from(e.dataTransfer.files));
    renderFiles(key);
  };
  window.euRmFile = function(key, i) { _files[key].splice(i, 1); renderFiles(key); };

  function renderFiles(key) {
    var el = document.getElementById('fl-' + key);
    if (!el) return;
    el.innerHTML = (_files[key] || []).map(function(f, i) {
      return '<div class="eu-file-row">' +
        '<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>' +
        '<span class="eu-file-name">' + f.name + '</span>' +
        '<span class="eu-file-sz">' + (f.size / 1024).toFixed(0) + ' KB</span>' +
        '<button class="eu-file-del" onclick="euRmFile(\'' + key + '\',' + i + ')" type="button">' +
          '<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" width="12" height="12"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
        '</button></div>';
    }).join('');
  }

  function fv(id) { var e = document.getElementById(id); return e ? e.value.trim() : ''; }
  function fc(k) { return (_files[k] || []).length; }

  // ── BUILD REVIEW ────────────────────────────────────────
  window.euReview = function(formKey) {
    _form = formKey;
    var backMap = {
      'dtc-inquiry':'eu-dtc2a','dtc-ship':'eu-dtc3a','dtc-bike':'eu-dtc3b','dtc-pq':'eu-dtc3c',
      'dlr-ship':'eu-dlr3a','dlr-floor':'eu-dlr3b','dlr-cust':'eu-dlr3c'
    };
    document.getElementById('eu-review-back').onclick = function() { euGo(backMap[formKey]); };
    document.getElementById('eu-err').style.display = 'none';

    var blk = function(lbl, rows) {
      return '<div class="eu-review-blk"><div class="eu-rb-head">' + lbl + '</div>' +
        rows.map(function(r) {
          return '<div class="eu-rv-row"><span class="eu-rv-k">' + r[0] +
            '</span><span class="eu-rv-v">' + (r[1] || '<em style="color:var(--eu-light)">—</em>') +
            '</span></div>';
        }).join('') + '</div>';
    };

    var typeLabel = {
      'dtc-inquiry':'Customer · General Inquiry','dtc-ship':'Customer · Shipping Issue',
      'dtc-bike':'Customer · Bike Problem','dtc-pq':'Customer · Product Question',
      'dlr-ship':'Dealer · Shipping Damage Claim','dlr-floor':'Dealer · Floor Bike Issue','dlr-cust':'Dealer · Customer Warranty'
    };

    var html = blk('Submission Type', [['Type', typeLabel[formKey]]]);

    if (formKey === 'dtc-inquiry') {
      html += blk('Contact', [['Name', fv('dtc-inq-name')], ['Email', fv('dtc-inq-email')]]);
      html += blk('Question', [['Message', fv('dtc-inq-q')]]);
    } else if (formKey === 'dtc-ship') {
      html += blk('Contact', [['Name', fv('dtc-sh-name')], ['Email', fv('dtc-sh-email')]]);
      html += blk('Issue', [['Order Number', fv('dtc-sh-order')], ['Description', fv('dtc-sh-desc')], ['Photos', fc('dtc-sh') + ' file(s) attached']]);
    } else if (formKey === 'dtc-bike') {
      html += blk('Contact', [['Name', fv('dtc-bp-name')], ['Email', fv('dtc-bp-email')]]);
      html += blk('Issue', [['Serial Number', fv('dtc-bp-serial')], ['Description', fv('dtc-bp-desc')], ['Attachments', fc('dtc-bp') ? fc('dtc-bp') + ' file(s)' : 'None']]);
    } else if (formKey === 'dtc-pq') {
      html += blk('Contact', [['Name', fv('dtc-pq-name')], ['Email', fv('dtc-pq-email')]]);
      html += blk('Details', [['Model', fv('dtc-pq-model')], ['Purchase Date', fv('dtc-pq-date')], ['Question', fv('dtc-pq-q')]]);
    } else if (formKey === 'dlr-ship') {
      html += blk('Shop', [['Shop Name', fv('dlr-shop')], ['Contact', fv('dlr-name') + (fv('dlr-role') ? ' · ' + fv('dlr-role') : '')], ['Email', fv('dlr-email')], ['Phone', fv('dlr-phone')]]);
      html += blk('Claim Details', [['Order Number', fv('dlr-sh-order')], ['Description', fv('dlr-sh-desc')], ['Photos', fc('dlr-sh') + ' file(s) attached']]);
    } else if (formKey === 'dlr-floor') {
      html += blk('Shop', [['Shop Name', fv('dlr-shop')], ['Contact', fv('dlr-name')], ['Email', fv('dlr-email')], ['Phone', fv('dlr-phone')]]);
      html += blk('Issue', [['Model', fv('dlr-fl-model')], ['Color', fv('dlr-fl-color')], ['Description', fv('dlr-fl-desc')], ['Attachments', fc('dlr-fl') ? fc('dlr-fl') + ' file(s)' : 'None']]);
    } else if (formKey === 'dlr-cust') {
      html += blk('Shop', [['Shop Name', fv('dlr-shop')], ['Contact', fv('dlr-name')], ['Email', fv('dlr-email')], ['Phone', fv('dlr-phone')]]);
      html += blk('Customer & Issue', [['Customer', fv('dlr-cb-custname')], ['Purchase Date', fv('dlr-cb-date')], ['Serial Number', fv('dlr-cb-serial')], ['Model', fv('dlr-cb-model')], ['Description', fv('dlr-cb-desc')], ['Attachments', fc('dlr-cb') ? fc('dlr-cb') + ' file(s)' : 'None']]);
    }

    document.getElementById('eu-review-content').innerHTML = html;
    euGo('eu-review-screen');
  };

  // ── HUBSPOT API ─────────────────────────────────────────
  function hsApi(endpoint, method, body) {
    return fetch(HS.proxyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint: endpoint, method: method, body: body })
    }).then(function(res) {
      if (!res.ok) throw new Error('API error ' + res.status);
      return res.json();
    });
  }

  function hsUpload(file) {
    var fd = new FormData();
    fd.append('file', file);
    fd.append('options', JSON.stringify({ access: 'PRIVATE', overwrite: false }));
    fd.append('folderPath', '/euphree-support-uploads');
    return fetch(HS.proxyUrl + '/upload', { method: 'POST', body: fd }).then(function(res) {
      if (!res.ok) throw new Error('Upload failed');
      return res.json();
    }).then(function(d) {
      return (d.objects && d.objects[0] && d.objects[0].url) || d.url || '';
    });
  }

  function hsForm(fields) {
    return hsApi('/submissions/v3/integration/submit/' + HS.portalId + '/' + HS.formId, 'POST', {
      portalId: HS.portalId, formGuid: HS.formId, fields: fields,
      context: { pageUri: window.location.href, pageName: 'Euphree Support Portal' }
    });
  }

  function hsContact(email) {
    return hsApi('/crm/v3/objects/contacts/search', 'POST', {
      filterGroups: [{ filters: [{ propertyName: 'email', operator: 'EQ', value: email }] }],
      properties: ['email'], limit: 1
    }).then(function(d) {
      return (d.results && d.results[0] && d.results[0].id) || null;
    });
  }

  function hsTicket(subject, desc, priority) {
    return hsApi('/crm/v3/objects/tickets', 'POST', {
      properties: {
        subject: subject, content: desc, hs_ticket_priority: priority,
        hs_pipeline: HS.pipelineId, hs_pipeline_stage: HS.stageNew
      }
    });
  }

  function hsAssoc(ticketId, contactId) {
    return hsApi('/crm/v3/associations/ticket/contact/batch/create', 'POST', {
      inputs: [{ from: { id: ticketId }, to: { id: contactId }, type: 'ticket_to_contact' }]
    });
  }

  function hsNote(ticketId, body) {
    return hsApi('/crm/v3/objects/notes', 'POST', {
      properties: { hs_note_body: body, hs_timestamp: Date.now().toString() }
    }).then(function(note) {
      return hsApi('/crm/v3/associations/note/ticket/batch/create', 'POST', {
        inputs: [{ from: { id: note.id }, to: { id: ticketId }, type: 'note_to_ticket' }]
      });
    });
  }

  // ── BUILD PAYLOAD ───────────────────────────────────────
  function buildPayload(fk) {
    var ns = function(n) { var p = n.trim().split(' '); return { f: p[0] || '', l: p.slice(1).join(' ') || '' }; };
    var email = '', fields = [], desc = '', fkey = null;

    if (fk === 'dtc-inquiry') {
      var n = ns(fv('dtc-inq-name')); email = fv('dtc-inq-email'); desc = fv('dtc-inq-q');
      fields = [{name:'firstname',value:n.f},{name:'lastname',value:n.l},{name:'email',value:email},
        {name:'euphree_submission_type',value:'General Inquiry'},{name:'euphree_audience',value:'Customer'},{name:'euphree_description',value:desc}];
    } else if (fk === 'dtc-ship') {
      var n = ns(fv('dtc-sh-name')); email = fv('dtc-sh-email');
      desc = 'Order: ' + fv('dtc-sh-order') + '\n\n' + fv('dtc-sh-desc'); fkey = 'dtc-sh';
      fields = [{name:'firstname',value:n.f},{name:'lastname',value:n.l},{name:'email',value:email},
        {name:'euphree_submission_type',value:'Shipping Issue'},{name:'euphree_audience',value:'Customer'},
        {name:'euphree_order_number',value:fv('dtc-sh-order')},{name:'euphree_description',value:desc}];
    } else if (fk === 'dtc-bike') {
      var n = ns(fv('dtc-bp-name')); email = fv('dtc-bp-email');
      desc = 'Serial: ' + fv('dtc-bp-serial') + '\n\n' + fv('dtc-bp-desc'); fkey = 'dtc-bp';
      fields = [{name:'firstname',value:n.f},{name:'lastname',value:n.l},{name:'email',value:email},
        {name:'euphree_submission_type',value:'Bike Problem'},{name:'euphree_audience',value:'Customer'},
        {name:'euphree_serial_number',value:fv('dtc-bp-serial')},{name:'euphree_description',value:desc}];
    } else if (fk === 'dtc-pq') {
      var n = ns(fv('dtc-pq-name')); email = fv('dtc-pq-email'); desc = fv('dtc-pq-q');
      fields = [{name:'firstname',value:n.f},{name:'lastname',value:n.l},{name:'email',value:email},
        {name:'euphree_submission_type',value:'Product Question'},{name:'euphree_audience',value:'Customer'},
        {name:'euphree_bike_model',value:fv('dtc-pq-model')},{name:'euphree_purchase_date',value:fv('dtc-pq-date')},{name:'euphree_description',value:desc}];
    } else if (fk === 'dlr-ship') {
      var n = ns(fv('dlr-name')); email = fv('dlr-email');
      desc = 'Shop: ' + fv('dlr-shop') + '\nOrder: ' + fv('dlr-sh-order') + '\n\n' + fv('dlr-sh-desc'); fkey = 'dlr-sh';
      fields = [{name:'firstname',value:n.f},{name:'lastname',value:n.l},{name:'email',value:email},{name:'phone',value:fv('dlr-phone')},
        {name:'euphree_submission_type',value:'Dealer - Shipping Damage'},{name:'euphree_audience',value:'Dealer'},
        {name:'euphree_shop_name',value:fv('dlr-shop')},{name:'euphree_shop_contact_role',value:fv('dlr-role')},
        {name:'euphree_order_number',value:fv('dlr-sh-order')},{name:'euphree_description',value:desc}];
    } else if (fk === 'dlr-floor') {
      var n = ns(fv('dlr-name')); email = fv('dlr-email');
      desc = 'Shop: ' + fv('dlr-shop') + '\nModel: ' + fv('dlr-fl-model') + ' ' + fv('dlr-fl-color') + '\n\n' + fv('dlr-fl-desc'); fkey = 'dlr-fl';
      fields = [{name:'firstname',value:n.f},{name:'lastname',value:n.l},{name:'email',value:email},{name:'phone',value:fv('dlr-phone')},
        {name:'euphree_submission_type',value:'Dealer - Floor Bike'},{name:'euphree_audience',value:'Dealer'},
        {name:'euphree_shop_name',value:fv('dlr-shop')},{name:'euphree_bike_model',value:fv('dlr-fl-model')},{name:'euphree_description',value:desc}];
    } else if (fk === 'dlr-cust') {
      var n = ns(fv('dlr-name')); email = fv('dlr-email');
      desc = 'Shop: ' + fv('dlr-shop') + '\nCustomer: ' + fv('dlr-cb-custname') + '\nSerial: ' + fv('dlr-cb-serial') + '\nPurchased: ' + fv('dlr-cb-date') + '\n\n' + fv('dlr-cb-desc'); fkey = 'dlr-cb';
      fields = [{name:'firstname',value:n.f},{name:'lastname',value:n.l},{name:'email',value:email},{name:'phone',value:fv('dlr-phone')},
        {name:'euphree_submission_type',value:'Dealer - Customer Warranty'},{name:'euphree_audience',value:'Dealer'},
        {name:'euphree_shop_name',value:fv('dlr-shop')},{name:'euphree_customer_name',value:fv('dlr-cb-custname')},
        {name:'euphree_customer_serial',value:fv('dlr-cb-serial')},{name:'euphree_customer_purchase_date',value:fv('dlr-cb-date')},
        {name:'euphree_bike_model',value:fv('dlr-cb-model')},{name:'euphree_description',value:desc}];
    }

    var labels = {
      'dtc-inquiry':'General Inquiry','dtc-ship':'Customer Shipping Issue','dtc-bike':'Customer Bike Problem','dtc-pq':'Customer Product Question',
      'dlr-ship':'Dealer Shipping Damage','dlr-floor':'Dealer Floor Bike','dlr-cust':'Dealer Customer Warranty'
    };
    var shop = fk.indexOf('dlr') === 0 ? ' · ' + fv('dlr-shop') : '';
    return { email: email, fields: fields, desc: desc, fkey: fkey, subject: labels[fk] + shop, priority: HS.priorities[fk] || 'MEDIUM' };
  }

  // ── SUBMIT ──────────────────────────────────────────────
  window.euSubmit = function() {
    var btn = document.getElementById('eu-submit-btn');
    var err = document.getElementById('eu-err');
    err.style.display = 'none';
    btn.disabled = true;
    btn.innerHTML = '<span class="eu-spin"><span class="eu-spin-ring"></span> Submitting\u2026</span>';

    var payload = buildPayload(_form);
    var email = payload.email;
    var fields = payload.fields;
    var desc = payload.desc;
    var fkey = payload.fkey;
    var subject = payload.subject;
    var priority = payload.priority;

    var urls = [];

    // 1. Upload files (if any)
    var uploadPromise;
    if (fkey && (_files[fkey] || []).length) {
      uploadPromise = Promise.all(_files[fkey].map(function(f) { return hsUpload(f); })).then(function(results) {
        urls = results.filter(Boolean);
        if (urls.length) fields.push({ name: 'euphree_attachment_urls', value: urls.join('\n') });
      });
    } else {
      uploadPromise = Promise.resolve();
    }

    uploadPromise.then(function() {
      // 2. Submit form -> upsert contact
      return hsForm(fields);
    }).then(function() {
      // 3. Find contact
      return hsContact(email).catch(function() { return null; });
    }).then(function(cid) {
      // 4. Create ticket
      var fullDesc = urls.length ? desc + '\n\n\ud83d\udcce Attachments:\n' + urls.map(function(u, i) { return (i + 1) + '. ' + u; }).join('\n') : desc;
      return hsTicket(subject, fullDesc, priority).then(function(ticket) {
        // 5. Associate ticket <-> contact
        var assocPromise = (cid && ticket.id) ? hsAssoc(ticket.id, cid).catch(function() {}) : Promise.resolve();
        // 6. File note with attachment links
        var notePromise = (urls.length && ticket.id) ? hsNote(ticket.id, '\ud83d\udcce Uploaded files:\n' + urls.map(function(u, i) { return (i + 1) + '. <a href="' + u + '">' + u + '</a>'; }).join('<br>')).catch(function() {}) : Promise.resolve();

        return Promise.all([assocPromise, notePromise]).then(function() { return ticket; });
      });
    }).then(function(ticket) {
      // Success
      var emailFieldMap = {
        'dtc-inquiry':'dtc-inq-email','dtc-ship':'dtc-sh-email','dtc-bike':'dtc-bp-email','dtc-pq':'dtc-pq-email',
        'dlr-ship':'dlr-email','dlr-floor':'dlr-email','dlr-cust':'dlr-email'
      };
      document.getElementById('eu-ticket-id').textContent = 'TICKET #' + ticket.id;
      document.getElementById('eu-confirm-email').textContent = fv(emailFieldMap[_form]) || 'your email';
      euGo('eu-success-screen');
    }).catch(function(e) {
      console.error(e);
      err.style.display = 'flex';
      btn.disabled = false;
      btn.innerHTML = '<svg fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24" width="15" height="15"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg> Submit to Euphree';
    });
  };

  // ── RESET ───────────────────────────────────────────────
  window.euReset = function() {
    _aud = _dtcType = _dtcSub = _dlrType = _form = null;
    document.querySelectorAll('#eu-portal input,#eu-portal textarea,#eu-portal select').forEach(function(e) { e.value = ''; });
    document.querySelectorAll('#eu-portal .eu-issue-btn,#eu-portal .eu-aud-btn').forEach(function(b) { b.classList.remove('eu-sel'); });
    document.querySelectorAll('#eu-portal [id^="fl-"]').forEach(function(l) { l.innerHTML = ''; });
    Object.keys(_files).forEach(function(k) { delete _files[k]; });
    ['eu-dtc1-next','eu-dtc2b-next','eu-dlr2-next'].forEach(function(id) { var e = document.getElementById(id); if (e) e.disabled = true; });
    var btn = document.getElementById('eu-submit-btn');
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<svg fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24" width="15" height="15"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg> Submit to Euphree';
    }
    euGo('eu-s0');
  };

})();
