# Self-Hosting Tips and Tricks

**Category:** Q&A (pin to top)

---

Share your self-hosting setup, tips, and lessons learned.

## Official deployment options

| Component | Recommended   | Alternatives                               |
| --------- | ------------- | ------------------------------------------ |
| Backend   | Railway       | Fly.io, Render, any Bun/Node host          |
| Frontend  | Vercel        | Netlify, Cloudflare Pages, any static host |
| Cache     | Upstash Redis | Any Redis, or use in-memory mode           |

## Common questions

**Q: Do I need Redis?**
A: No. Set `CACHE_BACKEND=memory` for development or low-traffic use. Redis is recommended for production to persist cache across restarts.

**Q: Can I run both frontend and backend on one server?**
A: Yes. Build the frontend (`pnpm --filter frontend build`) and serve the `dist/` folder from the backend. You'll need to add a static file middleware to Hono.

**Q: How do I add only some integrations?**
A: Only add the API keys you care about in `.env`. Panels for unconfigured services are automatically hidden.

## Share your setup

Reply below with your hosting setup, what integrations you're using, and any tips for others.
