import express from 'express';
import { Setting } from '../models/Setting.js';

const router = express.Router();

/**
 * @openapi
 * /api/settings/api-docs:
 *   post:
 *     summary: Save API documentation / demo URL
 *     tags:
 *       - Settings
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               url:
 *                 type: string
 *                 format: uri
 *           examples:
 *             docsUrl:
 *               summary: API docs URL
 *               value:
 *                 url: https://your-docs.example.com
 *     responses:
 *       '200':
 *         description: Saved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 */
router.post('/api/settings/api-docs', async (req, res, next) => {
  try {
    const { url } = req.body || {};
    if (url) {
      try {
        new URL(url);
      } catch (err) {
        return res.status(400).json({ error: 'Invalid URL' });
      }
    }

    const doc = await Setting.findOneAndUpdate(
      { key: 'apiDocsUrl' },
      { value: url || null },
      { upsert: true, new: true }
    );

    res.json({ ok: true, setting: doc });
  } catch (err) {
    next(err);
  }
});

export default router;
