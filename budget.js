const defaults = {
      saved: 8450,
      goals: [
        { name: 'Emergency fund', current: 4200, target: 6000, symbol: 'âœ³' },
        { name: 'Japan trip', current: 2850, target: 4000, symbol: 'â†—' },
        { name: 'New home', current: 1400, target: 12000, symbol: 'âŒ‚' }
      ],
      rules: [
        { amount: 25, frequency: 'Every week', goal: 'Emergency fund', active: true },
        { amount: 100, frequency: 'Every payday', goal: 'Japan trip', active: true }
      ],
      transactions: [
        { name: 'Weekly auto-save', detail: 'Today Â· Emergency fund', amount: -25, symbol: 'â†—' },
        { name: 'Paycheck', detail: 'Oct 16 Â· Income', amount: 2600, symbol: 'â†“' },
        { name: 'Coffee shop', detail: 'Oct 15 Â· Food & drink', amount: -6.5, symbol: 'â—Œ' },
        { name: 'Payday savings', detail: 'Oct 15 Â· Japan trip', amount: -100, symbol: 'â†—' }
      ],
      bank: true
    };
    const money = value => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
    const preciseMoney = value => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
    let state;
    try { state = { ...defaults, ...JSON.parse(localStorage.getItem('gather-budget-state') || '{}') }; }
    catch { state = structuredClone(defaults); }
    const save = () => localStorage.setItem('gather-budget-state', JSON.stringify(state));
    const safeText = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);

    function render() {
      document.getElementById('saved-total').textContent = money(state.saved);
      document.getElementById('goal-count').textContent = `${state.goals.length} goal${state.goals.length === 1 ? '' : 's'} in progress`;
      document.getElementById('goal-list').innerHTML = state.goals.map(goal => {
        const percent = Math.min(100, Math.round((goal.current / goal.target) * 100));
        return `<article><div class="goal-top"><span class="goal-name"><span class="goal-emoji">${safeText(goal.symbol || 'â—Ž')}</span>${safeText(goal.name)}</span><span class="goal-amount">${money(goal.current)} / ${money(goal.target)}</span></div><div class="progress-track"><div class="progress-fill" style="width:${percent}%"></div></div><div class="goal-foot"><span>${percent}% saved</span><span>${money(Math.max(0, goal.target - goal.current))} to go</span></div></article>`;
      }).join('') || '<p class="subtle">No goals yet. Add one to get started.</p>';
      document.getElementById('rule-list').innerHTML = state.rules.map((rule, index) => `<div class="rule"><span class="rule-info"><span class="rule-symbol">â†—</span><span><strong>${money(rule.amount)} Â· ${safeText(rule.frequency)}</strong><small>To ${safeText(rule.goal)}</small></span></span><span><span class="rule-amount">${rule.active ? 'On' : 'Paused'}</span><br><button class="select-control rule-toggle" type="button" data-rule="${index}">${rule.active ? 'Pause' : 'Resume'}</button></span></div>`).join('') || '<p class="subtle">No rules yet. Create one to plan regular savings.</p>';
      document.getElementById('transaction-list').innerHTML = state.transactions.slice(0, 5).map(item => `<div class="transaction"><span class="transaction-icon">${safeText(item.symbol || 'Â·')}</span><span><strong>${safeText(item.name)}</strong><small>${safeText(item.detail)}</small></span><span class="transaction-amount ${item.amount > 0 ? 'positive' : ''}">${item.amount > 0 ? '+' : 'âˆ’'}${money(Math.abs(item.amount))}</span></div>`).join('');
      document.getElementById('bank-detail').textContent = state.bank ? 'Checking Â· â€¢â€¢â€¢â€¢ 4821 Â· Demo link' : 'No bank connected';
      document.getElementById('bank-name').textContent = state.bank ? 'Northstar Bank' : 'No bank linked';
      document.getElementById('bank-button').textContent = state.bank ? 'Manage' : 'Connect';
      const select = document.getElementById('rule-goal-select');
      select.innerHTML = state.goals.map(goal => `<option>${safeText(goal.name)}</option>`).join('');
      const withdrawSelect = document.getElementById('withdraw-goal-select');
      const selectedGoal = withdrawSelect.value;
      withdrawSelect.innerHTML = state.goals.map(goal => `<option value="${safeText(goal.name)}">${safeText(goal.name)} Â· ${money(goal.current)} available</option>`).join('');
      if (state.goals.some(goal => goal.name === selectedGoal)) withdrawSelect.value = selectedGoal;
      updateWithdrawalPreview();
    }
    function openModal(id) { document.getElementById(id).classList.add('open'); const first = document.querySelector(`#${id} input:not([disabled]), #${id} select`); if (first) setTimeout(() => first.focus(), 0); }
    function closeModal(modal) { modal.classList.remove('open'); }
    let toastTimer;
    function toast(message) { const el = document.getElementById('toast'); el.textContent = message; el.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('show'), 3000); }
    document.querySelectorAll('[data-open]').forEach(button => button.addEventListener('click', () => openModal(button.dataset.open)));
    document.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', () => closeModal(button.closest('.modal-backdrop'))));
    document.querySelectorAll('.modal-backdrop').forEach(backdrop => backdrop.addEventListener('click', event => { if (event.target === backdrop) closeModal(backdrop); }));
    document.addEventListener('keydown', event => { if (event.key === 'Escape') document.querySelectorAll('.modal-backdrop.open').forEach(closeModal); });
    document.getElementById('goal-form').addEventListener('submit', event => {
      event.preventDefault(); const data = new FormData(event.currentTarget);
      state.goals.push({ name: data.get('name').trim(), target: Number(data.get('target')), current: Number(data.get('current')), symbol: 'â—Ž' });
      save(); render(); event.currentTarget.reset(); closeModal(document.getElementById('goal-modal')); toast('Savings goal added.');
    });
    document.getElementById('rule-form').addEventListener('submit', event => {
      event.preventDefault(); const data = new FormData(event.currentTarget);
      state.rules.push({ amount: Number(data.get('amount')), frequency: data.get('frequency'), goal: data.get('goal'), active: true });
      save(); render(); event.currentTarget.reset(); closeModal(document.getElementById('rule-modal')); toast('Rule saved as a demo reminder.');
    });
    function updateWithdrawalPreview() {
      const goal = state.goals.find(item => item.name === document.getElementById('withdraw-goal-select').value);
      const amountInput = document.getElementById('withdraw-amount');
      const amount = Number(amountInput.value) || 0;
      const fee = Math.round(amount * 5) / 100;
      document.getElementById('withdraw-gross').textContent = preciseMoney(amount);
      document.getElementById('withdraw-fee').textContent = preciseMoney(fee);
      document.getElementById('withdraw-net').textContent = preciseMoney(amount - fee);
      document.getElementById('withdraw-available').textContent = `Available to withdraw: ${money(goal?.current || 0)}`;
      amountInput.max = goal?.current || 0;
      amountInput.disabled = !goal || goal.current <= 0;
      document.querySelector('#withdraw-form button[type="submit"]').disabled = !goal || goal.current <= 0;
    }
    document.getElementById('withdraw-goal-select').addEventListener('change', updateWithdrawalPreview);
    document.getElementById('withdraw-amount').addEventListener('input', updateWithdrawalPreview);
    document.getElementById('withdraw-form').addEventListener('submit', event => {
      event.preventDefault();
      const data = new FormData(event.currentTarget);
      const goal = state.goals.find(item => item.name === data.get('goal'));
      const amount = Math.round(Number(data.get('amount')) * 100) / 100;
      if (!goal || !Number.isFinite(amount) || amount <= 0 || amount > goal.current) {
        toast('Enter an amount within this goalâ€™s available balance.');
        return;
      }
      const fee = Math.round(amount * 5) / 100;
      const payout = Math.round((amount - fee) * 100) / 100;
      goal.current = Math.round((goal.current - amount) * 100) / 100;
      state.saved = Math.round((state.saved - amount) * 100) / 100;
      state.transactions.unshift({ name: 'Demo withdrawal', detail: `${goal.name} Â· ${preciseMoney(fee)} fee (5%) Â· ${preciseMoney(payout)} payout Â· simulated`, amount: -amount, symbol: 'â†™' });
      save(); render(); event.currentTarget.reset(); closeModal(document.getElementById('withdraw-modal'));
      toast(`${preciseMoney(payout)} demo payout recorded. No money moved.`);
    });
    document.getElementById('rule-list').addEventListener('click', event => {
      const button = event.target.closest('[data-rule]'); if (!button) return;
      state.rules[Number(button.dataset.rule)].active = !state.rules[Number(button.dataset.rule)].active; save(); render();
    });
    document.getElementById('demo-transfer').addEventListener('click', () => {
      const activeRule = state.rules.find(rule => rule.active);
      if (!activeRule) { toast('Add or resume a rule to try a demo transfer.'); return; }
      state.saved += activeRule.amount;
      const goal = state.goals.find(item => item.name === activeRule.goal);
      if (goal) goal.current += activeRule.amount;
      state.transactions.unshift({ name: 'Demo savings transfer', detail: `Just now Â· ${activeRule.goal} Â· simulated`, amount: -activeRule.amount, symbol: 'â†—' });
      save(); render(); closeModal(document.getElementById('bank-modal')); toast(`${money(activeRule.amount)} demo transfer recorded. No money moved.`);
    });
    document.getElementById('chart-range').addEventListener('change', event => {
      const labels = event.target.value === '3' ? ['Jul', 'Aug', 'Sep'] : ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'];
      document.getElementById('chart-labels').innerHTML = labels.map(month => `<span>${month}</span>`).join('');
      toast(`Showing ${labels.length} months of sample data.`);
    });
    document.getElementById('view-activity').addEventListener('click', () => toast('All available sample activity is shown.'));
    render();

