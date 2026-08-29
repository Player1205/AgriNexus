import '@testing-library/jest-dom';

// Polyfill HTMLMediaElement methods for audio tests
window.HTMLMediaElement.prototype.load = () => {};
window.HTMLMediaElement.prototype.play = () => Promise.resolve();
window.HTMLMediaElement.prototype.pause = () => {};
