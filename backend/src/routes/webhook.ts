import { Router } from "express"
import fetch from "node-fetch"

const router = Router()

type Subscriber = {
  url: string
  token?: string
}

const subscribers: Subscriber[] = []

router.post("/upload_complete", (req, res) => {
  const { url, token } = req.body ?? {}
  if (!url) {
    return res.status(400).json({ success: false, error: "url_required" })
  }
  subscribers.push({ url, token })
  return res.json({ success: true, subscribers: subscribers.length })
})

export async function notifySubscribers(payload: any) {
  await Promise.all(
    subscribers.map(async (subscriber) => {
      try {
        await fetch(subscriber.url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(subscriber.token ? { Authorization: `Bearer ${subscriber.token}` } : {}),
          },
          body: JSON.stringify(payload),
        })
      } catch (err) {
        console.error("Failed to notify subscriber", subscriber.url, err)
      }
    }),
  )
}

export default router

