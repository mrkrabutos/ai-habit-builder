import formidable from "formidable";
import fs from "fs";
import { OpenAI } from "openai";

export const config = {
  api: {
    bodyParser: false,
  },
};

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  try {
    const form = formidable({ multiples: false });

    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error("Form parse error:", err);
        return res.status(500).json({ error: "Failed to parse form" });
      }

      if (!files.photo) {
        return res.status(400).json({ error: "No photo uploaded" });
      }

      const file = files.photo;
      const fileBuffer = fs.readFileSync(file.filepath);

      const response = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are an assistant that checks if a user uploaded a gym workout photo.",
          },
          {
            role: "user",
            content: [
              {
                type: "input_image",
                image_url: `data:image/jpeg;base64,${fileBuffer.toString("base64")}`,
              },
            ],
          },
        ],
      });

      let verdict = response.choices[0].message.content || "Unknown";
      let approved = verdict.toLowerCase().includes("yes");

      return res.status(200).json({
        success: true,
        approved,
        verdict,
      });
    });
  } catch (err) {
    console.error("Backend error:", err);
    return res.status(500).json({ error: "Server error", details: err.message });
  }
}
