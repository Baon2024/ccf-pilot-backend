//testing out different text to image approaches to generate media assets
import fetch from 'node-fetch'
import dotenv from 'dotenv';

import OpenAI from 'openai';

dotenv.config()


const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY // ✅ or hardcode for testing
});

/*
let prompt = `Create a press photo for pop artist Elle L. The photo should capture her mysterious, cosmic charm, with 
a hint of her connection to nature and the universe. Elle L is a captivating figure with an intriguing persona, so the photo should showcase her exp
ressive eyes and perhaps a hint of a smile, leaving the rest to the imagination.

Her style is sleek, with a hint of glam, and an underlying message of sustainability and interconnectedness. Imagine her surrounded by a soft, ether
eal glow, with a subtle hint of a starry sky, or a dreamy, hazy forest, a nod to her environmental passions. The photo should be artistic, intriguin
g, and slightly ethereal, leaving a lasting impression on viewers, a glimpse into the world of Elle L.

Perhaps incorporate a subtle hint of a galaxy, or a misty forest backdrop, with Elle L in a pose that's both captivating and enigmatic. Her expressi
on should be a mix of confidence and intrigue, reflecting her personality.`
*/


export async function generateImage(prompt) {
  try {
    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        prompt: prompt,
        n: 1,
        size: "1024x1024",
        response_format: "url"
      })
    });

    const data = await response.json();

    // Check for OpenAI error response
    if (data.error) {
      console.error("❌ OpenAI Error:", data.error);
      throw new Error(`OpenAI API Error: ${data.error.message}`);
    }

    const imageUrl = data?.data?.[0]?.url;

    if (!imageUrl) {
      throw new Error("No image URL returned from OpenAI.");
    }

    console.log("entire response from oenai image generation is: ", data);

    console.log("✅ Image URL:", imageUrl);
    return imageUrl;

  } catch (err) {
    console.error("❌ Error in generateImage:", err.message || err);
    throw err; // allow server route to handle it
  }
}

//generateImage(prompt)


export async function generateSocialMediaIdeaPrompt(prompt)  {

      const openaiSocialMediaIdeaPrompt = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 1000,
    });

    return openaiSocialMediaIdeaPrompt.choices[0].message.content

    }