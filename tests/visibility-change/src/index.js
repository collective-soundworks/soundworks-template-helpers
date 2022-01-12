import "core-js/stable";
import "regenerator-runtime/runtime";
import { render, html } from 'lit-html';
import { resumeAudioContext } from '@ircam/resume-audio-context';

import initQoS from '@soundworks/template-helpers/client/init-qos.js';

console.info('> self.crossOriginIsolated', self.crossOriginIsolated);

const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioContext = new AudioContext();

(async function main() {
  await resumeAudioContext(audioContext);

  initQoS({}, { socketClosed: false });

  // play some sound
  setInterval(() => {
    const now = audioContext.currentTime;
    const osc = audioContext.createOscillator();
    osc.connect(audioContext.destination);
    osc.start(now);
    osc.stop(now + 0.05);

  }, 1000);

  // add has in url
  document.querySelector('#add-hash').addEventListener('click', () => {
    window.location.hash = '#' + Math.random();
  });

  document.querySelector('#replace-location').addEventListener('click', () => {
    const url = `${window.location.origin}${window.location.pathname}#?z=${Math.random()}`;
    window.location.replace(url);
  });
}());

