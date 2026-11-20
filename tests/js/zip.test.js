import { test } from 'node:test';
import assert from 'node:assert/strict';
import { crc32, createZip } from '../../public/assets/js/editor/zip.js';

test('crc32: valore di controllo standard', () => {
  assert.equal(crc32(new TextEncoder().encode('123456789')), 0xcbf43926);
});

test('createZip: archivio leggibile con tutti i file', () => {
  const files = [
    { name: 'pagina-01.png', data: new Uint8Array([1, 2, 3]) },
    { name: 'pagina-02.png', data: new Uint8Array([4, 5, 6, 7]) },
  ];
  const zip = createZip(files, new Date(2026, 10, 20, 12, 0, 0));
  const view = new DataView(zip.buffer);
  assert.equal(view.getUint32(0, true), 0x04034b50, 'intestazione locale');
  const end = zip.length - 22;
  assert.equal(view.getUint32(end, true), 0x06054b50, 'fine della directory centrale');
  assert.equal(view.getUint16(end + 10, true), 2, 'numero di file');
  const centralOffset = view.getUint32(end + 16, true);
  assert.equal(view.getUint32(centralOffset, true), 0x02014b50, 'directory centrale');
  const firstName = new TextDecoder().decode(zip.slice(30, 30 + 'pagina-01.png'.length));
  assert.equal(firstName, 'pagina-01.png');
  assert.deepEqual([...zip.slice(30 + 13, 30 + 16)], [1, 2, 3]);
});
