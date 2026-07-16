import axios from "axios";

export async function fetchAvatar(req, res) {
  const response = await axios.get(req.query.avatarUrl);
  res.send(response.data);
}
