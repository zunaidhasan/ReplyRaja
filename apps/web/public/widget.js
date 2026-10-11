(function() {
  const SCRIPT_URL = document.currentScript ? document.currentScript.src : 'http://localhost:4000/widget/widget.js';
  const API_BASE = 'http://localhost:4000/api';

  // Embed chat bubble
  const btn = document.createElement('div');
  btn.style.cssText = 'position:fixed;bottom:24px;right:24px;width:60px;height:60px;background:#2563eb;color:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 10px 20px rgba(37,99,235,0.3);z-index:999999;font-size:26px;';
  btn.innerHTML = '💬';

  const modal = document.createElement('div');
  modal.style.cssText = 'position:fixed;bottom:96px;right:24px;width:380px;height:520px;background:#fff;border-radius:16px;box-shadow:0 20px 40px rgba(0,0,0,0.15);display:none;flex-direction:column;z-index:999999;overflow:hidden;border:1px solid #e2e8f0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;';
  modal.innerHTML = `
    <div style="background:#1e293b;color:#fff;padding:14px 16px;display:flex;justify-content:space-between;align-items:center;">
      <div style="display:flex;align-items:center;gap:10px;">
        <img src="/logo.png" style="width:34px;height:34px;object-fit:contain;border-radius:8px;background:#fff;padding:2px;" alt="Logo" />
        <div>
          <div style="font-weight:700;font-size:14px;">ReplyRaja Live Support</div>
          <div style="font-size:11px;color:#94a3b8;">সরাসরি মেসেজ দিন ও অর্ডার করুন</div>
        </div>
      </div>
      <button id="rr-wgt-close" style="background:none;border:none;color:#94a3b8;font-size:18px;cursor:pointer;">✕</button>
    </div>
    <div id="rr-wgt-messages" style="flex:1;padding:16px;overflow-y:auto;background:#f8fafc;display:flex;flex-direction:column;gap:10px;">
      <div style="background:#fff;padding:10px 14px;border-radius:12px;font-size:13px;color:#334155;border:1px solid #e2e8f0;max-width:85%;">
        আসসালামু আলাইকুম! কোনো পণ্য বা ডেলিভারি সম্পর্কে জানতে মেসেজ দিন। আমাদের AI ও সাপোর্ট টিম প্রস্তুত আছে।
      </div>
    </div>
    <div style="padding:12px;background:#fff;border-top:1px solid #e2e8f0;display:flex;gap:8px;">
      <input id="rr-wgt-input" type="text" placeholder="মেসেজ লিখুন..." style="flex:1;border:1px solid #cbd5e1;padding:10px 12px;border-radius:8px;font-size:13px;outline:none;" />
      <button id="rr-wgt-send" style="background:#2563eb;color:#fff;border:none;padding:0 16px;border-radius:8px;cursor:pointer;font-weight:600;">পাঠান</button>
    </div>
  `;

  document.body.appendChild(btn);
  document.body.appendChild(modal);

  btn.onclick = () => {
    modal.style.display = modal.style.display === 'none' ? 'flex' : 'none';
  };
  document.getElementById('rr-wgt-close').onclick = () => {
    modal.style.display = 'none';
  };

  const input = document.getElementById('rr-wgt-input');
  const msgs = document.getElementById('rr-wgt-messages');

  async function sendMessage() {
    const text = input.value.trim();
    if (!text) return;
    input.value = '';

    // Append user message
    const userDiv = document.createElement('div');
    userDiv.style.cssText = 'background:#2563eb;color:#fff;padding:10px 14px;border-radius:12px;font-size:13px;align-self:flex-end;max-width:85%;';
    userDiv.innerText = text;
    msgs.appendChild(userDiv);
    msgs.scrollTop = msgs.scrollHeight;

    // Send to sandbox or conversation API
    try {
      const res = await fetch(`${API_BASE}/knowledge/test-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text })
      });
      const data = await res.json();
      const replyDiv = document.createElement('div');
      replyDiv.style.cssText = 'background:#fff;padding:10px 14px;border-radius:12px;font-size:13px;color:#1e293b;border:1px solid #e2e8f0;max-width:85%;white-space:pre-wrap;';
      replyDiv.innerText = data.draft || 'ধন্যবাদ, আপনার মেসেজটি পেয়েছি। সাপোর্ট টিম দ্রুত যোগাযোগ করবে।';
      msgs.appendChild(replyDiv);
      msgs.scrollTop = msgs.scrollHeight;
    } catch (e) {
      console.error(e);
    }
  }

  document.getElementById('rr-wgt-send').onclick = sendMessage;
  input.onkeypress = (e) => { if (e.key === 'Enter') sendMessage(); };
})();
