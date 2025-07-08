const express = require("express");
const axios = require("axios");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.API_KEY;

app.get("/:username/latest-song", async (req, res) => {
  const { username } = req.params;

  try {
    const response = await axios.get(
      `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${username}&api_key=${API_KEY}&format=json&limit=1`
    );

    const track = response.data.recenttracks.track[0];

    const result = {
      track: {
        name: track.name,
        mbid: track.mbid || null,
        url: track.url,
        streamable: track.streamable,
        artist: {
          "#text": track.artist["#text"],
          mbid: track.artist.mbid || null,
        },
        album: {
          "#text": track.album["#text"],
          mbid: null, // We'll try to get it from MusicBrainz optionally
        },
        date: track.date
          ? {
              "#text": track.date["#text"],
              uts: track.date.uts,
            }
          : null,
        image: {
          small: getImageUrl(track.image, "small"),
          medium: getImageUrl(track.image, "medium"),
          large: getImageUrl(track.image, "large"),
          extralarge: getImageUrl(track.image, "extralarge"),
          fullsize: getImageUrl(track.image, "extralarge", true),
        },
      },
    };

    // OPTIONAL: Enhance with MusicBrainz data if needed
    // You can fetch recording/album info using track.mbid or artist/track name if available

    res.json(result);
  } catch (error) {
    console.error(error.message);
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
