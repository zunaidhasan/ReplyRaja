// ReplyRaja Content Script for Meta Business Suite
(function () {
  console.log('[ReplyRaja] Extension loaded into Meta Business Suite');

  // Create collapsible sidebar overlay
  const panel = document.createElement('div');
  panel.id = 'replyraja-mbs-panel';
  panel.innerHTML = `
    <div class="rr-header">
      <div class="rr-title">
        <img src="http://localhost:4000/logo.png" class="rr-logo-img" style="width:28px;height:28px;object-fit:contain;border-radius:6px;background:#fff;padding:1px;" />
        <strong>ReplyRaja</strong>
        <span class="rr-badge">AI Assistant</span>
      </div>
      <button id="rr-minimize-btn">✕</button>
    </div>
    
    <div class="rr-body">
      <div class="rr-customer-card">
        <div class="rr-customer-name" id="rr-cust-name">Rahim Uddin (Dhanmondi)</div>
        <div class="rr-customer-meta">Lead: <span class="rr-tag">Price Sent</span> • Orders: 1 (৳1,920)</div>
      </div>

      <div class="rr-section-title">✨ AI Suggested Reply (Bengali)</div>
      <div class="rr-draft-box">
        <textarea id="rr-draft-input" rows="4">জ্বি ভাইয়া, আমাদের প্রিমিয়াম লিনেন পাঞ্জাবির Royal Navy কালারের XL (42) সাইজটি স্টকে এভেইলএবল আছে! দাম ১৮৫০ টাকা। উত্তরায় (ঢাকার ভেতরে) ডেলিভারি চার্জ মাত্র ৭০ টাকা। ক্যাশ অন ডেলিভারিতে অর্ডার করতে চাইলে আপনার ফোন নম্বর ও পূর্ণাঙ্গ ঠিকানাটি শেয়ার করুন প্লিজ।</textarea>
        <div class="rr-draft-actions">
          <button id="rr-copy-btn" class="rr-btn rr-btn-primary">📋 Insert to Chat</button>
          <button id="rr-regen-btn" class="rr-btn rr-btn-secondary">🔄 Regenerate</button>
        </div>
      </div>

      <div class="rr-section-title">📦 Quick Order Capture</div>
      <div class="rr-order-form">
        <input type="text" id="rr-order-phone" placeholder="Phone (e.g. 01712345678)" value="01712345678" />
        <input type="text" id="rr-order-addr" placeholder="Delivery Address" value="House 12, Road 4, Dhanmondi" />
        <select id="rr-order-product">
          <option>Premium Linen Panjabi (Royal Navy) - ৳1850</option>
          <option>Traditional Handloom Saree - ৳1450</option>
        </select>
        <button id="rr-create-order-btn" class="rr-btn rr-btn-success">Confirm Order & Send COD</button>
      </div>

      <div class="rr-footer-notice">
        🔒 Human-in-the-loop: AI never sends without your review.
      </div>
    </div>
  `;

  document.body.appendChild(panel);

  // Quick event bindings
  document.getElementById('rr-minimize-btn').addEventListener('click', () => {
    panel.style.display = 'none';
  });

  document.getElementById('rr-copy-btn').addEventListener('click', () => {
    const text = document.getElementById('rr-draft-input').value;
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard! Paste into Facebook message input.');
  });
})();
