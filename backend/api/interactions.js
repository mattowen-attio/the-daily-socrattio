/**
 * /api/interactions - the single Request URL for Slack interactivity.
 * Handles:
 *   • block_actions  → "Submit your answer" button → opens the private modal (views.open)
 *   • view_submission → stores the answer (latest wins) + bumps the live count (chat.update)
 *
 * Everything here is fast (≤ a couple of Slack/Redis calls) so we comfortably
 * acknowledge within Slack's 3-second window. The slow work (Claude judging, DMs)
 * happens later in /api/cron-reveal, never here.
 */
import { slack, verifySlack } from '../lib/slack.js';
import { riddleById } from '../lib/riddles.js';
import { getCurrent, saveAnswer, getAnswer, answerCount } from '../lib/store.js';
import { answerModal, riddleMessage } from '../lib/blocks.js';

export const config = { api: { bodyParser: false } };

const readRaw = async (req) => {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  return Buffer.concat(chunks).toString('utf8');
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const raw = await readRaw(req);
  if (!verifySlack(raw, req.headers)) return res.status(401).send('bad signature');

  const payload = JSON.parse(new URLSearchParams(raw).get('payload'));

  try {
    // 1) Button click → open the private answer modal
    if (payload.type === 'block_actions' && payload.actions?.[0]?.action_id === 'open_answer') {
      const current = await getCurrent();
      if (!current) {
        // riddle already closed - open a tiny "closed" modal instead
        await slack('views.open', {
          trigger_id: payload.trigger_id,
          view: { type: 'modal', title: { type: 'plain_text', text: 'Answers closed' },
            blocks: [{ type: 'section', text: { type: 'mrkdwn', text: "Today's riddle is closed - check the leaderboard! 🏆" } }] },
        });
        return res.status(200).end();
      }
      const riddle = await riddleById(current.riddleId);
      const existing = (await getAnswer(current.riddleId, payload.user.id)) || '';
      await slack('views.open', {
        trigger_id: payload.trigger_id,
        view: answerModal({ riddle, channel: current.channel, ts: current.ts, existing }),
      });
      return res.status(200).end();
    }

    // 2) Modal submit → store the answer + refresh the count
    if (payload.type === 'view_submission' && payload.view?.callback_id === 'submit_answer') {
      const meta = JSON.parse(payload.view.private_metadata);
      const answer = payload.view.state.values.answer.value.value?.trim();
      if (!answer) {
        return res.status(200).json({ response_action: 'errors', errors: { answer: 'Please type an answer.' } });
      }
      await saveAnswer(meta.riddleId, payload.user.id, answer);     // latest wins → editable, no dupes
      // close the modal immediately (empty 200), then update the public count
      res.status(200).end();
      const [riddle, count] = await Promise.all([riddleById(meta.riddleId), answerCount(meta.riddleId)]);
      await slack('chat.update', { channel: meta.channel, ts: meta.ts, ...riddleMessage({ riddle, count }) });
      return;
    }

    return res.status(200).end(); // ignore anything else
  } catch (e) {
    console.error('interactions error', e);
    // we've usually already acked; make sure we don't hang
    if (!res.writableEnded) res.status(200).end();
  }
}
