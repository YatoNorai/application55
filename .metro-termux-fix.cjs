'use strict';
const fs = require('fs');
const { EventEmitter } = require('events');

function _fakeWatcher() {
  const w = new EventEmitter();
  w.close = () => {};
  return w;
}

const _origWatch = fs.watch;
fs.watch = function (filename, options, listener) {
  if (
    typeof filename === 'string' &&
    (filename.includes('/node_modules/') || filename.endsWith('/node_modules'))
  ) {
    return _fakeWatcher(); // skip node_modules — no inotify consumed
  }
  try {
    return _origWatch.call(this, filename, options, listener);
  } catch (e) {
    if (e.code === 'ENOSPC') {
      // Limit hit for a source dir — degrade gracefully (no hot-reload for
      // this dir, but Metro keeps running instead of crashing).
      return _fakeWatcher();
    }
    throw e;
  }
};
