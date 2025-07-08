const express = require("express");
const axios = require("axios");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.API_KEY;

app.get("/:username/latest-song", async (req, res) => {
  const { username } = req.params;

  try {
    const { data } = await axios.get(
      `https://ws.audioscrobbler.com/2.0/`,
      {
        params: {
          method: "user.getrecenttracks",
          user: username,
          api_key: API_KEY,
          format: "json",
          limit: 1
        }
      }
    );

    const track = data.recenttracks.track[0];

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
        mbid: null, // We'll try to get it from MusicBrainz optionally
      },

      played_at: track.date
        ? {
            text: track.date["#text"],
            uts: track.date.uts,
        }
        : null,

      image: {
        small: getImage(track.image, "small"),
        medium: getImage(track.image, "medium"),
        large: getImage(track.image, "large"),
        extralarge: getImage(track.image, "extralarge"),
        fullsize: getFullImage(track.image),
      },
    },
  };

  res.json(response);
  
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Failed to fetch track data" });
  }
});

// Get a specific image size
function getImage(images, size) {
  const img = images.find((i) => i.size === size);
  return img && img["#text"] ? img["#text"] : null;
}

// Derive full-size image from any available image
function getFullImage(images) {
  const largeImg = images.find((i) => i.size === "extralarge" || i.size === "large");
  if (!largeImg || !largeImg["#text"]) return null;
  return largeImg["#text"].replace(/\/(?:\d+(s|x\d+)|\d+s)\//, "/");
}

app.listen(PORT, () => {
  console.log(`Running on port ${PORT}`);
});
