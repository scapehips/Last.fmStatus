const express = require("express");
const axios = require("axios");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.API_KEY;

app.use(cors());
app.get("/", (req, res) => {
  res.send("✅ Last.fm status API is running");
});

app.get("/:username/latest-song", async (req, res) => {
  const { username } = req.params;

  if (!/^[a-zA-Z0-9_]{2,30}$/.test(username)) {
    return res.status(400).json({ error: "Invalid username format" });
  }

  console.log(`Incoming request for user: ${username}`);

  try {
    const response = await axios.get(
      `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${username}&api_key=${API_KEY}&format=json&limit=1`
    );

    const track = response.data.recenttracks.track[0];

    const image = {
      small: getImageUrl(track.image, "small"),
      medium: getImageUrl(track.image, "medium"),
      large: getImageUrl(track.image, "large"),
      extralarge: getImageUrl(track.image, "extralarge"),
      fullsize: getImageUrl(track.image, "extralarge", true),
      fallbackSource: null,
    };

    const allImagesMissing = !image.large && !image.fullsize;

    if (allImagesMissing && track.mbid) {
      try {
        const mbResponse = await axios.get(
          `https://coverartarchive.org/release-group/${track.mbid}/front`,
          { responseType: "arraybuffer" }
          );
        const base64Image = Buffer.from(mbResponse.data, "binary").toString("base64");
        image.large = `data:image/jpeg;base64,${base64Image}`;
        image.fullsize = image.large;
        image.fallbackSource = "musicbrainz";
        console.log("✅ Used MusicBrainz cover art");
      } catch (err) {
        console.warn("⚠️ MusicBrainz fallback failed or not found:", err.message);
                              }
      }

    const result = {
      track: {
        name: track.name || null,
        mbid: track.mbid || null,
        url: track.url || null,
        streamable: track.streamable || null,

        artist: {
          name: track.artist["#text"] || null,
          mbid: track.artist.mbid || null,
        },
        
        album: {
          name: track.album["#text"] || null,
          mbid: null,
        },
        
        date: track.date
          ? {
              text: track.date["#text"],
              uts: track.date.uts,
          }
          : null,

        image,
        },
      },
    };

    res.json(result);
  } catch (error) {
    console.error("❌ Error in /:username/latest-song route:", error.message);
    res.status(500).json({
      error: "Failed to fetch data from Last.fm",
    });
  }
});

// Helper to extract image URL by size
function getImageUrl(images, size, full = false) {
  const image = images.find((img) => img.size === size);
  if (!image || !image["#text"]) return null;

  const url = image["#text"];
  if (full) {
    // Convert to full-size by stripping size part
    return url.replace(/\/\d+(s|x\d+)?\//, "/");
  }

  return url;
}

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

