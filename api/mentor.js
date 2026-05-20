export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { question } = req.body;

    const reply = `AI Mentor says: ${question}`;

    return res.status(200).json({
      reply
    });
  } catch (error) {
    return res.status(500).json({
      error: "Server error"
    });
  }
}