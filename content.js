(function() {
  'use strict';

  const DISMISS_COOLDOWN_MS = 10 * 1000;

  let warningInterval = null;
  let watchdogInterval = null;
  let isWarningShowing = false;
  let lastDismissedTime = 0;

  function isOnShortsPage() {
    return window.location.href.includes('https://www.youtube.com/shorts/');
  }

  function showWarning() {
    if (isWarningShowing) return;

    if (Date.now() - lastDismissedTime < DISMISS_COOLDOWN_MS) return;

    isWarningShowing = true;

    const warningContainer = document.createElement('div');
    warningContainer.id = 'focus-guard-warning';
    warningContainer.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: linear-gradient(135deg, #FF0505, #FF0505);
      color: white;
      padding: 35px 50px;
      border-radius: 28px;
      box-shadow: 0 14px 56px rgba(0,0,0,0.35);
      z-index: 9999;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      font-size: 28px;
      max-width: 88%;
      width: auto;
      display: flex;
      align-items: center;
      gap: 28px;
      animation: slideIn 0.3s ease-out, pulse 2s infinite;
      backdrop-filter: blur(12px);
      border: 1px solid rgba(255,255,255,0.18);
    `;

    const icon = document.createElement('div');
    icon.innerHTML = '';
    icon.style.fontSize = '45px';

    const isSpanish = navigator.language && navigator.language.startsWith('es');
    const titleText = isSpanish ? '¡ATENCIÓN!' : 'WARNING!';
    const bodyText = isSpanish
      ? 'Estás en un sitio distractor (Youtube Shorts).<br><center>Vuelva a sus tareas productivas.</center>'
      : 'You are on a distracting site (Youtube Shorts).<br><center>Get back to your productive tasks.</center>';

    const message = document.createElement('div');
    message.style.flex = '1';
    message.style.fontSize = '26px';
    message.style.lineHeight = '1.65';
    message.innerHTML = `
      <strong><center>${titleText}</center></strong><br>
      ${bodyText}
    `;

    const dismissBtn = document.createElement('button');
    dismissBtn.innerHTML = '✕';
    dismissBtn.style.cssText = `
      background: none;
      border: none;
      color: white;
      font-size: 28px;
      cursor: pointer;
      padding: 0;
      width: 42px;
      height: 42px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
    `;
    dismissBtn.onmouseover = function() {
      this.style.backgroundColor = 'rgba(255,255,255,0.2)';
    };
    dismissBtn.onmouseout = function() {
      this.style.backgroundColor = 'transparent';
    };
    dismissBtn.onclick = function() {
      hideWarning();
      lastDismissedTime = Date.now();
    };

    warningContainer.appendChild(icon);
    warningContainer.appendChild(message);
    warningContainer.appendChild(dismissBtn);

    document.body.appendChild(warningContainer);
  }

  function hideWarning() {
    const warning = document.getElementById('focus-guard-warning');
    if (warning) {
      warning.style.animation = 'slideOut 0.3s ease-in';
      setTimeout(() => {
        if (warning.parentNode) {
          warning.parentNode.removeChild(warning);
        }
      }, 300);
    }
    isWarningShowing = false;
  }

  function startWarningInterval() {
    if (isOnShortsPage()) {
      showWarning();
    }

    if (watchdogInterval) {
      clearInterval(watchdogInterval);
    }
    watchdogInterval = setInterval(() => {
      if (isOnShortsPage() && !isWarningShowing) {
        showWarning();
      }
    }, 1000);
  }

  function stopWarningInterval() {
    if (warningInterval) {
      clearInterval(warningInterval);
      warningInterval = null;
    }
    if (watchdogInterval) {
      clearInterval(watchdogInterval);
      watchdogInterval = null;
    }
    hideWarning();
    lastDismissedTime = 0;
  }

  const originalPushState = history.pushState;
  history.pushState = function() {
    originalPushState.apply(this, arguments);
    handleUrlChange();
  };
  const originalReplaceState = history.replaceState;
  history.replaceState = function() {
    originalReplaceState.apply(this, arguments);
    handleUrlChange();
  };

  function handleUrlChange() {
    if (isOnShortsPage()) {
      startWarningInterval();
    } else {
      stopWarningInterval();
    }
  }
  window.addEventListener('popstate', handleUrlChange);

  function setupUrlChangeListener() {
    let lastUrl = location.href;
    new MutationObserver(() => {
      const currentUrl = location.href;
      if (currentUrl !== lastUrl) {
        lastUrl = currentUrl;
        if (isOnShortsPage()) {
          startWarningInterval();
        } else {
          stopWarningInterval();
        }
      }
    }).observe(document, {subtree: true, childList: true});
  }

  function init() {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(-50%) translateY(-20px); opacity: 0; }
        to { transform: translateX(-50%) translateY(0); opacity: 1; }
      }
      @keyframes slideOut {
        from { transform: translateX(-50%) translateY(0); opacity: 1; }
        to { transform: translateX(-50%) translateY(-20px); opacity: 0; }
      }
      @keyframes pulse {
        0% { box-shadow: 0 8px 32px rgba(0,0,0,0.2); }
        50% { box-shadow: 0 8px 40px rgba(255,107,107,0.4); }
        100% { box-shadow: 0 8px 32px rgba(0,0,0,0.2); }
      }
    `;
    document.head.appendChild(style);

    if (isOnShortsPage()) {
      startWarningInterval();
    }
    setupUrlChangeListener();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
