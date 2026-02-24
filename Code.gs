// ============================================================
//  그림 아트 스튜디오 — Google Apps Script
//  구글 스프레드시트 저장 + 이메일 알림
// ============================================================

const OWNER_EMAIL = 'jlapril0413@gmail.com';

// ── GET 테스트용 (브라우저에서 URL 접속 시 확인) ──────────────
function doGet() {
  return ContentService.createTextOutput('그림 아트 스튜디오 Apps Script 작동 중 ✅');
}

// ── POST 수신 (폼 제출 시 호출됨) ────────────────────────────
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const ss   = SpreadsheetApp.getActiveSpreadsheet();
    const now  = Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyy-MM-dd HH:mm:ss');

    if (data.type === '상담') {
      _saveConsult(ss, now, data);
      _emailConsult(now, data);
    } else if (data.type === '예약') {
      _saveReserve(ss, now, data);
      _emailReserve(now, data);
    }

    return _ok();
  } catch (err) {
    return _err(err);
  }
}

// ── 상담 신청 → 시트 저장 ────────────────────────────────────
function _saveConsult(ss, now, d) {
  let sheet = ss.getSheetByName('상담신청');
  if (!sheet) {
    sheet = ss.insertSheet('상담신청');
    sheet.appendRow(['접수시각', '부모님 성함', '연락처', '희망 날짜', '희망 시간', '긴급 여부']);
    sheet.getRange(1, 1, 1, 6).setFontWeight('bold').setBackground('#EDE0FF');
  }
  sheet.appendRow([
    now,
    d.name,
    d.phone,
    d.date  || '-',
    d.time  || '-',
    d.urgent ? '⚡ 긴급' : '일반'
  ]);
}

// ── 수업 예약 → 시트 저장 ────────────────────────────────────
function _saveReserve(ss, now, d) {
  let sheet = ss.getSheetByName('수업예약');
  if (!sheet) {
    sheet = ss.insertSheet('수업예약');
    sheet.appendRow(['접수시각', '아이 이름', '나이', '희망 수업', '희망 날짜', '희망 시간']);
    sheet.getRange(1, 1, 1, 6).setFontWeight('bold').setBackground('#FFD4D4');
  }
  sheet.appendRow([
    now,
    d.childName,
    d.age,
    d.program || '-',
    d.date    || '-',
    d.time    || '-'
  ]);
}

// ── 상담 신청 이메일 ─────────────────────────────────────────
function _emailConsult(now, d) {
  const urgent = d.urgent ? '⚡ 긴급' : '일반';
  GmailApp.sendEmail(
    OWNER_EMAIL,
    `[그림 아트 스튜디오] 📋 새 상담 신청 — ${d.name}`,
    '',
    {
      htmlBody:
        `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;border:1px solid #EDE0FF;border-radius:16px;overflow:hidden;">` +
        `<div style="background:linear-gradient(135deg,#9B7EC8,#C8B4E8);padding:20px 24px;">` +
        `<h2 style="color:#fff;margin:0;font-size:18px;">📋 새 상담 신청이 도착했어요!</h2></div>` +
        `<div style="padding:24px;background:#fff;">` +
        `<table style="width:100%;border-collapse:collapse;font-size:14px;">` +
        _row('접수 시각', now) +
        _row('부모님 성함', d.name) +
        _row('연락처', `<a href="tel:${d.phone}">${d.phone}</a>`) +
        _row('희망 날짜', d.date  || '-') +
        _row('희망 시간', d.time  || '-') +
        _row('긴급 여부', urgent) +
        `</table></div>` +
        `<div style="padding:16px 24px;background:#F9F5FF;font-size:12px;color:#888;">` +
        `구글 스프레드시트 '상담신청' 탭에서 전체 내역을 확인하세요.</div></div>`
    }
  );
}

// ── 수업 예약 이메일 ─────────────────────────────────────────
function _emailReserve(now, d) {
  GmailApp.sendEmail(
    OWNER_EMAIL,
    `[그림 아트 스튜디오] 🖌️ 새 수업 예약 — ${d.childName}`,
    '',
    {
      htmlBody:
        `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;border:1px solid #FFD4D4;border-radius:16px;overflow:hidden;">` +
        `<div style="background:linear-gradient(135deg,#FF8B8B,#FFB4B4);padding:20px 24px;">` +
        `<h2 style="color:#fff;margin:0;font-size:18px;">🖌️ 새 수업 예약이 도착했어요!</h2></div>` +
        `<div style="padding:24px;background:#fff;">` +
        `<table style="width:100%;border-collapse:collapse;font-size:14px;">` +
        _row('접수 시각', now) +
        _row('아이 이름', d.childName) +
        _row('나이',     d.age) +
        _row('희망 수업', d.program || '-') +
        _row('희망 날짜', d.date    || '-') +
        _row('희망 시간', d.time    || '-') +
        `</table></div>` +
        `<div style="padding:16px 24px;background:#FFF5F5;font-size:12px;color:#888;">` +
        `구글 스프레드시트 '수업예약' 탭에서 전체 내역을 확인하세요.</div></div>`
    }
  );
}

// ── 이메일 테이블 행 헬퍼 ────────────────────────────────────
function _row(label, value) {
  return `<tr>` +
    `<td style="padding:8px 0;color:#888;width:100px;">${label}</td>` +
    `<td style="padding:8px 0;font-weight:bold;color:#333;">${value}</td>` +
    `</tr>`;
}

// ── 응답 헬퍼 ────────────────────────────────────────────────
function _ok() {
  return ContentService
    .createTextOutput(JSON.stringify({ result: 'success' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function _err(err) {
  return ContentService
    .createTextOutput(JSON.stringify({ result: 'error', message: err.toString() }))
    .setMimeType(ContentService.MimeType.JSON);
}
