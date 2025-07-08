const express = require("express");
const axios = require("axios");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/:username/latest-song", async (req, res) => {
  const { username } = req.params;
  const apiKey = process.env.API_KEY;

  try {
    const response = await axios.get(
      `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${username}&api_key=${apiKey}&format=json&limit=1`
    );

    const track = response.data.recenttracks.track[0];

    res.json({
      schemaVersion: 1,
      label: "Last Played",
      message: `${track.artist["#text"]} – ${track.name}`,
      color: "blueviolet"
    });
  } catch (error) {
    res.status(500).json({
      schemaVersion: 1,
      label: "Last Played",
      message: "Error fetching data",
      color: "red"
    });
  }
});

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});