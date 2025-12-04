const RULE_ID = 1;

// CSP modification rule for app.tana.inc only
// tana.pub doesn't need CSP modification
const rules = [
  {
    id: RULE_ID,
    priority: 1,
    action: {
      type: "modifyHeaders",
      responseHeaders: [
        {
          header: "content-security-policy",
          operation: "set",
          value: "default-src 'self' https: blob: data:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https: blob:; connect-src 'self' https: wss: blob: https://kinescope.io https://*.kinescope.io; frame-src 'self' https: blob: https://kinescope.io https://*.kinescope.io; child-src 'self' blob: https://kinescope.io https://*.kinescope.io; img-src 'self' https: data: blob:; style-src 'self' 'unsafe-inline' https:; font-src 'self' https: data:;"
        }
      ]
    },
    condition: {
      urlFilter: "https://app.tana.inc/*",
      resourceTypes: ["main_frame", "sub_frame"]
    }
  }
];

chrome.runtime.onInstalled.addListener(() => {
  chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: [RULE_ID],
    addRules: rules
  });
});
