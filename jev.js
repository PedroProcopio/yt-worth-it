// Shared Jev request builder. Loaded by background.js (importScripts) and selfcheck.mjs (import).
globalThis.JEV_URL = "https://api.typesafe.ai/v1/systemone";
globalThis.WORTH_THRESHOLD = 0.7;
globalThis.CATEGORY_LABELS = { ai: "AI", robotics: "Robotics", hobbies: "Hobbies", other: "Other" };

globalThis.buildJevRequest = function (video) {
  return {
    state: { video: { title: video.title, channel: video.channel, duration: video.duration } },
    model: "jev-latest",
    questions: {
      worth_watching: {
        type: "noul",
        instructions:
          "Is this YouTube video worth the viewer's time given their stated interests and dislikes? The viewer wants content about artificial intelligence, robotics, technology, and their hobbies (music, history and strategy games). The viewer does NOT want addictive competitive games such as League of Legends, Counter-Strike, Valorant, Fortnite, or similar esports/gaming content.",
        criteria: {
          true: "The video is about AI, robotics, technology, science, music, history/strategy games, or otherwise educational or genuinely interesting to this viewer.",
          false: "The video is about League of Legends, Counter-Strike, Valorant, Fortnite or other addictive competitive games, or is clickbait/low-value content unrelated to the viewer's interests."
        }
      },
      category: {
        type: "choice",
        instructions: "Which category best describes this YouTube video, based on its title and channel?",
        criteria: {
          ai: "Artificial intelligence, machine learning, LLMs, AI tools, AI news",
          robotics: "Robots, drones, hardware automation, robotics research",
          hobbies: "Music, history, strategy or narrative games, sports, cooking, and other leisure interests. Excludes addictive competitive games.",
          other: "None of the above (including addictive competitive games, news, vlogs, unrelated content)"
        }
      }
    }
  };
};
