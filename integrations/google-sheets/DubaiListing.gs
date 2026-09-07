/** Bound to Dubai Listing only. No owner/contact/notes/media fields leave Google. */
var DUBAI_SOURCE_ID = '13juJ4IeafSrSy5zqBplMq2Ht26pobB0Aaz-PiksMwHI';
var DUBAI_SYNC_URL = 'https://cahqudrtshwtswnfkzdf.supabase.co/functions/v1/dubai-listing-sync';
var DUBAI_TABS = ['Super Luxury', 'Palm Jumeirah', 'Dubai', 'The Vally'];

function onOpen() {
  SpreadsheetApp.getUi().createMenu('سایت علی تقوی')
    .addItem('فعال‌سازی اتصال خودکار', 'setupDubaiListingSync')
    .addItem('به‌روزرسانی سایت الآن', 'syncDubaiListing')
    .addItem('توقف اتصال خودکار', 'stopDubaiListingSync').addToUi();
}

function setupDubaiListingSync() {
  var props = PropertiesService.getScriptProperties();
  if (!props.getProperty('LISTING_SYNC_TOKEN')) {
    var ui = SpreadsheetApp.getUi();
    var prompt = ui.prompt('اتصال سایت', 'کلید اختصاصی اتصال شیت را وارد کنید (کلید Supabase نیست).', ui.ButtonSet.OK_CANCEL);
    if (prompt.getSelectedButton() !== ui.Button.OK) return;
    var token = prompt.getResponseText().trim();
    if (!/^[a-f0-9]{64}$/.test(token)) throw new Error('کلید اتصال معتبر نیست.');
    props.setProperty('LISTING_SYNC_TOKEN', token);
  }
  syncDubaiListing(); // Do not install a trigger until the first sync succeeds.
  var names = ScriptApp.getProjectTriggers().map(function(t) { return t.getHandlerFunction(); });
  if (names.indexOf('syncDubaiListing') === -1) ScriptApp.newTrigger('syncDubaiListing').timeBased().everyMinutes(5).create();
  if (names.indexOf('onDubaiListingEdit') === -1) ScriptApp.newTrigger('onDubaiListingEdit').forSpreadsheet(DUBAI_SOURCE_ID).onEdit().create();
  SpreadsheetApp.getActive().toast('اتصال فعال شد؛ تغییرات شیت به سایت منتقل می‌شوند.', 'سایت علی تقوی');
}

function stopDubaiListingSync() {
  ScriptApp.getProjectTriggers().forEach(function(t) {
    if (['syncDubaiListing','onDubaiListingEdit'].indexOf(t.getHandlerFunction()) !== -1) ScriptApp.deleteTrigger(t);
  });
  SpreadsheetApp.getActive().toast('اتصال خودکار متوقف شد. ملک‌ها حذف نشدند.', 'سایت علی تقوی');
}

function onDubaiListingEdit(e) {
  if (e && e.range && DUBAI_TABS.indexOf(e.range.getSheet().getName()) !== -1) syncDubaiListing();
}

function listingText(value) {
  var text = String(value == null ? '' : value).trim();
  return /^[—–-]$/.test(text) ? '' : text;
}

function mapDubaiListingRow(row, header, tab) {
  function value(name) { var i=header.indexOf(name); return i < 0 ? '' : listingText(row[i]); }
  var stage = value('STATUS').toLowerCase().replace(/[\s_-]+/g,' ');
  var availability = value('HANDOVER').toLowerCase().replace(/[\s_-]+/g,' ');
  var hidden = /\b(not available|unavailable|withdrawn|deleted|hidden)\b|ناموجود/.test(stage+' '+availability);
  var sold = /\bsold\b|فروخته/.test(stage+' '+availability);
  var category = /off\s*plan|close to hando|under construction/.test(stage) ? 'resale-off-plan' : 'ready';
  var publishValue = row[header.indexOf('نمایش در سایت')];
  return {
    source_id: value('Website ID'), source_tab: tab,
    publish: publishValue === true || String(publishValue).toUpperCase() === 'TRUE',
    area: value('AREA'), building: value('BUILDING'), property_type: value('TYPE').toLowerCase(),
    bedrooms: value('BEDROOMS'), size: value('BUA (SQFT)'), price: value('PRICE (AED)'),
    view: value('VIEW'), category: category, status: sold ? 'sold' : hidden ? 'hidden' : 'Available',
    handover: /^(available|not available|unavailable|sold)$/i.test(value('HANDOVER')) ? '' : value('HANDOVER')
  };
}

function syncDubaiListing() {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(1000)) return;
  try {
    var token = PropertiesService.getScriptProperties().getProperty('LISTING_SYNC_TOKEN');
    if (!token) throw new Error('ابتدا اتصال سایت را فعال کنید.');
    var book = SpreadsheetApp.openById(DUBAI_SOURCE_ID);
    var rows = [], seen = {};
    DUBAI_TABS.forEach(function(name) {
      var sheet = book.getSheetByName(name);
      if (!sheet) throw new Error('تب پیدا نشد: ' + name);
      var range = sheet.getDataRange(), raw = range.getValues(), displayed = range.getDisplayValues();
      var header = displayed[0].map(function(v) { return String(v).trim(); });
      var required = ['AREA','BUILDING','TYPE','BEDROOMS','BUA (SQFT)','VIEW','STATUS','HANDOVER','PRICE (AED)','Website ID','نمایش در سایت','وضعیت همگام‌سازی'];
      required.forEach(function(key) {
        if (header.indexOf(key) < 0 || header.indexOf(key) !== header.lastIndexOf(key)) throw new Error('ستون نامعتبر در '+name+': '+key);
      });
      var idCol = header.indexOf('Website ID'), publishCol=header.indexOf('نمایش در سایت'), statusCol=header.indexOf('وضعیت همگام‌سازی');
      for (var i=1;i<displayed.length;i++) {
        if (!listingText(displayed[i][header.indexOf('BUILDING')])) continue;
        var row = displayed[i].slice();
        row[publishCol] = raw[i][publishCol];
        if (!listingText(row[idCol])) {
          row[idCol] = Utilities.getUuid();
          sheet.getRange(i+1,idCol+1).setValue(row[idCol]);
        }
        var record = mapDubaiListingRow(row,header,name);
        if (seen[record.source_id]) throw new Error('Website ID تکراری است؛ ردیف کپی‌شده را بررسی کنید: '+name+' '+(i+1));
        seen[record.source_id] = true;
        if (record.publish && (!record.area || !record.price)) throw new Error('منطقه یا قیمت خالی است: '+name+' '+(i+1));
        rows.push(record);
      }
    });
    if (rows.length > 2000) throw new Error('تعداد ردیف‌ها از ظرفیت اتصال بیشتر است.');
    SpreadsheetApp.flush();
    var response = UrlFetchApp.fetch(DUBAI_SYNC_URL, {
      method:'post',contentType:'application/json',headers:{'x-listing-sync-token':token},
      payload:JSON.stringify({spreadsheet_id:DUBAI_SOURCE_ID,sent_at:new Date().toISOString(),rows:rows}),
      muteHttpExceptions:true
    });
    if (response.getResponseCode() !== 200) throw new Error('همگام‌سازی انجام نشد؛ کد '+response.getResponseCode()+'. اجرای بعدی دوباره تلاش می‌کند.');
    var result = JSON.parse(response.getContentText());
    if (!result.ok || result.stale) throw new Error('ارسال تأیید نشد؛ دوباره به‌روزرسانی کنید.');
    var stamp=Utilities.formatDate(new Date(),'Asia/Dubai','yyyy-MM-dd HH:mm');
    // Re-find every ID before writing feedback: a user may have sorted rows during the request.
    DUBAI_TABS.forEach(function(name) {
      var sheet=book.getSheetByName(name), grid=sheet.getDataRange().getDisplayValues(), h=grid[0];
      var idCol=h.indexOf('Website ID'), statusCol=h.indexOf('وضعیت همگام‌سازی');
      var sent={}; rows.filter(function(r){return r.source_tab===name;}).forEach(function(r){sent[r.source_id]=r;});
      for(var i=1;i<grid.length;i++) {
        var r=sent[grid[i][idCol]]; if(!r) continue;
        sheet.getRange(i+1,statusCol+1).setValue((r.publish && r.status==='Available' ? 'ارسال شد' : 'نمایش خاموش')+' · '+stamp);
      }
    });
    PropertiesService.getScriptProperties().setProperty('LAST_SYNC_AT',stamp);
    PropertiesService.getScriptProperties().deleteProperty('LAST_SYNC_ERROR');
  } catch (error) {
    PropertiesService.getScriptProperties().setProperty('LAST_SYNC_ERROR',String(error.message));
    throw error;
  } finally { lock.releaseLock(); }
}
