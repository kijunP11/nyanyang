import "dotenv/config";

async function testNovelAI() {
  const apiKey = process.env.NOVELAI_API_KEY;
  if (!apiKey) {
    console.error("NOVELAI_API_KEY not found in environment variables.");
    return;
  }

  console.log("Testing NovelAI API with key:", apiKey.substring(0, 10) + "...");

  try {
    const response = await fetch("https://api.novelai.net/ai/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "kayra-v1",
        input: "Hello, world!",
        parameters: {
          temperature: 0.9,
          max_length: 20,
          min_length: 1,
          use_string: true,
        },
      }),
    });

    console.log("Response status:", response.status);
    
    const text = await response.text();
    console.log("Response body:", text);

  } catch (error) {
    console.error("Error:", error);
  }
}

testNovelAI();

