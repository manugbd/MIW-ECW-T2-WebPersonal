const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const {strings} = require('../src/_data/i18n');
const source = fs.readFileSync(require('node:path').join(__dirname, '../src/js/main.js'), 'utf8');
function start(lang, reject = false, secure = true) {
  const events = {};
  const summary = {focus() {this.focused = true;}};
  const picker = {open:true, contains(node) {return node === summary;}, querySelector() {return summary;}, addEventListener(type, handler) {this[type] = handler;}};
  const status = {dataset:{copying:strings[lang].copying,copied:strings[lang].copied,copyError:strings[lang].copyError}, textContent:''};
  const button = {dataset:{copyEmail:'person@example.test'}, hidden:true, addEventListener(type, handler) {this[type] = handler;}};
  const document = {
    addEventListener(type, handler) {(events[type] ||= []).push(handler);},
    querySelector(selector) {return selector === 'details[data-language]' ? picker : selector === '[data-copy-status]' ? status : null;},
    querySelectorAll(selector) {return selector === 'button[data-copy-email]' ? [button] : [];},
    getElementById() {return null;}
  };
  let written;
  vm.runInNewContext(source, {document,window:{isSecureContext:secure},navigator:{clipboard:{async writeText(value) {if(reject) throw Error('denied'); written = value;}}},setTimeout,clearTimeout});
  events.DOMContentLoaded[0]();
  return {picker,summary,status,button,get written() {return written;}, emit(type,event) {for(const handler of events[type] || [])handler(event);}};
}
(async () => {
  for(const lang of ['es','en','fr']) {
    const app = start(lang);
    assert.equal(app.button.hidden,false);
    const pending = app.button.click();
    assert.equal(app.status.textContent, strings[lang].copying + ' person@example.test.');
    await pending;
    assert.equal(app.written,'person@example.test');
    assert.equal(app.status.textContent, strings[lang].copied + ' person@example.test');
    assert.equal(app.button.disabled,false);
    app.emit('keydown',{key:'Escape'});
    assert.equal(app.picker.open,false);
    assert.equal(app.summary.focused,true);
    app.picker.open=true;
    app.emit('click',{target:app.summary});
    assert.equal(app.picker.open,true);
    app.emit('click',{target:{}});
    assert.equal(app.picker.open,false);
    app.picker.open=true;
    app.picker.focusout({relatedTarget:null});
    assert.equal(app.picker.open,false);
    const denied = start(lang,true);
    await denied.button.click();
    assert.equal(denied.status.textContent, strings[lang].copyError);
    assert.equal(start(lang,false,false).button.hidden,true);
  }
  console.log('Selector: Escape, foco, clic exterior y salida de foco correctos. Copia: éxito, error y contexto inseguro en ES/EN/FR correctos.');
})().catch(error => {console.error(error);process.exitCode=1;});
