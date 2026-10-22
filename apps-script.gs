// Backend da rifa: guarda os números vendidos/reservados e confere a senha.
// TROQUE a senha abaixo antes de implantar.
var SENHA = "2027";
var WHATSAPP = "67992164994"; // seu WhatsApp com DDD, só números

function estado_() {
  var raw = PropertiesService.getScriptProperties().getProperty("estado");
  var s = raw ? JSON.parse(raw) : { sold: [], reserved: [], phone: WHATSAPP };
  if (!s.phone) s.phone = WHATSAPP;
  return s;
}
function resposta_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
function doGet() {
  return resposta_(estado_());
}
function doPost(e) {
  var d = JSON.parse(e.postData.contents);
  if (d.password !== SENHA) return resposta_({ error: "senha" });
  if (d.action === "check") return resposta_({ ok: true });
  var lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    var s = estado_();
    var sold = {}, res = {};
    s.sold.forEach(function (n) { sold[n] = 1; });
    s.reserved.forEach(function (n) { res[n] = 1; });
    var ch = d.changes || {};
    Object.keys(ch).forEach(function (k) {
      var n = parseInt(k, 10);
      if (!(n >= 100 && n <= 799)) return;
      delete sold[n]; delete res[n];
      if (ch[k] === "sold") sold[n] = 1;
      if (ch[k] === "res") res[n] = 1;
    });
    s.sold = Object.keys(sold).map(Number).sort(function (a, b) { return a - b; });
    s.reserved = Object.keys(res).map(Number).sort(function (a, b) { return a - b; });
    if (typeof d.phone === "string" && d.phone.trim()) s.phone = d.phone.trim();
    PropertiesService.getScriptProperties().setProperty("estado", JSON.stringify(s));
    return resposta_({ ok: true, state: s });
  } finally {
    lock.releaseLock();
  }
}
