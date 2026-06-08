/**
 * blocks.js — Block Kit builders for the riddle message and the private answer modal.
 */

export const countText = (n) =>
  n === 0 ? '🧠 _Be the first to answer…_'
          : `🧠 *${n}* ${n === 1 ? 'sleuth has' : 'sleuths have'} answered so far`;

/** The daily riddle message: the riddle, a discuss-vs-submit nudge, the button, and a live count. */
export function riddleMessage({ riddle, count = 0, revealTime = '20:00' }) {
  return {
    text: `Today's riddle: ${riddle.text}`, // notification fallback
    blocks: [
      { type: 'section', text: { type: 'mrkdwn', text: `*🧩 The Daily Socrattio*\n\n>${riddle.text}` } },
      { type: 'context', elements: [{ type: 'mrkdwn', text: `💬 Debate it in the thread — but submit your answer *privately* 👇  Results at *${revealTime} UTC* 🏆` }] },
      { type: 'actions', elements: [{
        type: 'button',
        style: 'primary',
        text: { type: 'plain_text', text: '🔒 Submit your answer', emoji: true },
        action_id: 'open_answer',
        value: riddle.id,
      }] },
      { type: 'context', elements: [{ type: 'mrkdwn', text: countText(count) }] },
    ],
  };
}

/** The private modal. private_metadata carries what we need to store + update on submit. */
export function answerModal({ riddle, channel, ts, existing = '' }) {
  return {
    type: 'modal',
    callback_id: 'submit_answer',
    private_metadata: JSON.stringify({ riddleId: riddle.id, channel, ts }),
    title: { type: 'plain_text', text: 'Submit your answer' },
    submit: { type: 'plain_text', text: 'Submit' },
    close: { type: 'plain_text', text: 'Cancel' },
    blocks: [
      { type: 'section', text: { type: 'mrkdwn', text: `>${riddle.text}` } },
      {
        type: 'input',
        block_id: 'answer',
        label: { type: 'plain_text', text: 'Your answer' },
        element: {
          type: 'plain_text_input',
          action_id: 'value',
          initial_value: existing,
          focus_on_load: true,
          placeholder: { type: 'plain_text', text: 'Type your answer…' },
        },
      },
      { type: 'context', elements: [{ type: 'mrkdwn', text: '🔒 Only you can see this. You can edit it until the reveal.' }] },
    ],
  };
}
