import axios from "axios";

const ALLOWED_HOST = "https://avatars.example.com";

export async function fetchAvatar(req, res) {
  const response = await axios.get(`${ALLOWED_HOST}/default.png`);
  res.send(response.data);
}
