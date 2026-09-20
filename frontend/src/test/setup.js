import '@testing-library/jest-dom';

// Polyfill HTMLMediaElement methods for audio tests
window.HTMLMediaElement.prototype.load = () => {};
window.HTMLMediaElement.prototype.play = () => Promise.resolve();
window.HTMLMediaElement.prototype.pause = () => {};
Object.defineProperty(window.HTMLMediaElement.prototype, 'currentTime', {
  get() { return 0; },
  set() {}
});

// Polyfill Web Speech API classes for tests
if (typeof window.SpeechSynthesisUtterance === 'undefined') {
  window.SpeechSynthesisUtterance = class SpeechSynthesisUtterance {
    constructor(text = '') {
      this.text = text;
      this.lang = 'en-US';
      this.rate = 1.0;
      this.pitch = 1.0;
      this.volume = 1.0;
      this.voice = null;
    }
  };
}

